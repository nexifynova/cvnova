-- ============================================================
-- CVNova — Row Level Security fix
-- ------------------------------------------------------------
-- Fixes:
--   1. public.generated_documents  (CRITICAL: anon could read /
--      insert / delete EVERY document)
--   2. public.companies, company_messages, company_outreach
--      (policies without TO + missing INSERT/UPDATE policies)
--   3. Document sharing helpers (/view/[id], /track-document)
--      so sharing keeps working after the lockdown.
--
-- How to run:
--   Supabase Dashboard -> SQL Editor -> paste -> Run
--   (also applied through the Supabase MCP migration runner)
--
-- Idempotent: every statement can be re-run safely.
-- ============================================================


-- ------------------------------------------------------------
-- 1. generated_documents
-- ------------------------------------------------------------
-- Shipped policies before this fix:
--   "Allow public select"          FOR SELECT USING (true)   roles PUBLIC
--   "Allow public insert"          FOR INSERT CHECK (true)   roles PUBLIC
--   "Admins can delete documents"  FOR DELETE USING (true)   roles PUBLIC
--
-- Because they had no TO clause they applied to PUBLIC (= anon too),
-- so anyone holding the public anon key could download the entire
-- table (every CV / cover letter incl. email + phone), insert rows
-- and delete any row. "Admins ..." was never an admin check.
--
-- What we allow instead:
--   * owner (user_id = auth.uid(), or a legacy row with user_id NULL
--     whose email equals the signed-in user's email)
--   * a chat participant of a message that references the document
--     (candidate-to-candidate sharing inside /chat)
--   * INSERT for guests + signed-in users (CV must be creatable
--     before login) but never with someone else's user_id
--   * UPDATE / DELETE for the owner only
--
-- Public link viewing (/view/[id]) and /track-document are served by
-- service-role API routes / RPCs below, never by anon table access.
-- ------------------------------------------------------------
alter table public.generated_documents enable row level security;

drop policy if exists "Allow public select"         on public.generated_documents;
drop policy if exists "Allow public insert"         on public.generated_documents;
drop policy if exists "Admins can delete documents" on public.generated_documents;

-- Single place that defines "this row belongs to the caller".
-- SECURITY DEFINER so the check never depends on other policies.
create or replace function public.documents_is_owner(row_user_id uuid, row_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (
    auth.uid() is not null
    and (
      row_user_id = auth.uid()
      or (
        row_user_id is null
        and nullif(btrim(coalesce(row_email, '')), '') is not null
        and lower(btrim(row_email)) = lower(btrim(coalesce(auth.jwt() ->> 'email', '')))
      )
    )
  );
$$;

revoke all on function public.documents_is_owner(uuid, text) from public;
-- Only signed-in users evaluate this helper (all policies that use it are
-- scoped TO authenticated), so anon never needs EXECUTE.
revoke all on function public.documents_is_owner(uuid, text) from anon;
grant execute on function public.documents_is_owner(uuid, text) to authenticated;


drop policy if exists "Documents: owner can read" on public.generated_documents;
create policy "Documents: owner can read"
  on public.generated_documents
  for select
  to authenticated
  using (public.documents_is_owner(user_id, email));

drop policy if exists "Documents: chat recipient can read" on public.generated_documents;
create policy "Documents: chat recipient can read"
  on public.generated_documents
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.messages m
      where m.document_id = generated_documents.id
        and (m.sender_id = auth.uid() or m.receiver_id = auth.uid())
    )
  );

drop policy if exists "Documents: anyone can create" on public.generated_documents;
create policy "Documents: anyone can create"
  on public.generated_documents
  for insert
  to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

drop policy if exists "Documents: owner can update" on public.generated_documents;
create policy "Documents: owner can update"
  on public.generated_documents
  for update
  to authenticated
  using (public.documents_is_owner(user_id, email))
  with check (user_id is null or user_id = auth.uid());

drop policy if exists "Documents: owner can delete" on public.generated_documents;
create policy "Documents: owner can delete"
  on public.generated_documents
  for delete
  to authenticated
  using (public.documents_is_owner(user_id, email));


-- ------------------------------------------------------------
-- 1b. /track-document lookups (anon visitors)
-- ------------------------------------------------------------
-- The tracking page used to run `select * from generated_documents`
-- with the anon key, which needed the wide-open select policy.
-- These two functions keep the exact same UX (exact email match, or
-- name + 6 character share code) without exposing the table.
-- ------------------------------------------------------------
create or replace function public.track_documents_by_email(p_email text)
returns setof public.generated_documents
language sql
stable
security definer
set search_path = public
as $$
  select d.*
  from public.generated_documents d
  where nullif(btrim(coalesce(p_email, '')), '') is not null
    and lower(btrim(coalesce(d.email, ''))) = lower(btrim(p_email))
  order by d.created_at desc
  limit 100;
$$;

revoke all on function public.track_documents_by_email(text) from public;
grant execute on function public.track_documents_by_email(text) to anon, authenticated;

create or replace function public.track_documents_by_code(p_full_name text, p_code text)
returns setof public.generated_documents
language sql
stable
security definer
set search_path = public
as $$
  select d.*
  from public.generated_documents d
  where d.is_shareable is true
    and nullif(btrim(coalesce(p_full_name, '')), '') is not null
    and nullif(btrim(coalesce(p_code, '')), '') is not null
    and lower(btrim(coalesce(d.full_name, ''))) = lower(btrim(p_full_name))
    and upper(btrim(coalesce(d.share_code, ''))) = upper(btrim(p_code))
  order by d.created_at desc
  limit 100;
$$;

revoke all on function public.track_documents_by_code(text, text) from public;
grant execute on function public.track_documents_by_code(text, text) to anon, authenticated;


-- ------------------------------------------------------------
-- 2. companies / company_messages / company_outreach
-- ------------------------------------------------------------
-- Same bug pattern: the policies were written without a TO
-- clause, so they applied to PUBLIC (anon included) and Postgres
-- had to evaluate auth.uid() for anonymous requests. The intent
-- was always "signed-in users", so each policy is recreated with
-- TO authenticated. Missing INSERT/UPDATE policies are added so
-- the tables behave correctly for direct client access too
-- (the API routes use the service role and are unaffected).
-- ------------------------------------------------------------
alter table public.companies        enable row level security;
alter table public.company_messages enable row level security;
alter table public.company_outreach enable row level security;

-- companies: a company may only read / edit its own row.
drop policy if exists "Companies can view own record" on public.companies;
create policy "Companies can view own record"
  on public.companies
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Companies can update own record" on public.companies;
create policy "Companies can update own record"
  on public.companies
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Companies can insert own record" on public.companies;
create policy "Companies can insert own record"
  on public.companies
  for insert
  to authenticated
  with check (auth.uid() = id);

-- company_messages: one thread row per message; candidate and
-- company each see / write only their own side of the thread.
drop policy if exists "Candidates read own messages" on public.company_messages;
create policy "Candidates read own messages"
  on public.company_messages
  for select
  to authenticated
  using (auth.uid() = candidate_user_id);

drop policy if exists "Candidates send own messages" on public.company_messages;
create policy "Candidates send own messages"
  on public.company_messages
  for insert
  to authenticated
  with check (auth.uid() = candidate_user_id and sender = 'candidate');

drop policy if exists "Companies read own thread messages" on public.company_messages;
create policy "Companies read own thread messages"
  on public.company_messages
  for select
  to authenticated
  using (auth.uid() = company_id);

drop policy if exists "Companies send own thread messages" on public.company_messages;
create policy "Companies send own thread messages"
  on public.company_messages
  for insert
  to authenticated
  with check (auth.uid() = company_id and sender = 'company');

drop policy if exists "Companies update own thread messages" on public.company_messages;
drop policy if exists "Candidates update own thread messages" on public.company_messages;

-- company_outreach: company-owned log of CV / mail outreach.
drop policy if exists "Companies read own outreach" on public.company_outreach;
create policy "Companies read own outreach"
  on public.company_outreach
  for select
  to authenticated
  using (auth.uid() = company_id);

drop policy if exists "Companies create own outreach" on public.company_outreach;
create policy "Companies create own outreach"
  on public.company_outreach
  for insert
  to authenticated
  with check (auth.uid() = company_id);

drop policy if exists "Companies update own outreach" on public.company_outreach;


-- ------------------------------------------------------------
-- 3. Verification
-- ------------------------------------------------------------
-- Expected: generated_documents has 5 policies, all scoped to
-- anon / authenticated, and no policy with a NULL role array
-- ("PUBLIC") anymore.
--
--   select polname, polcmd,
--          coalesce((select string_agg(r.rolname, ',')
--                    from pg_roles r where r.oid = any(polroles)), 'PUBLIC') as roles
--   from pg_policy
--   where polrelid = 'public.generated_documents'::regclass
--   order by polname;
--
-- Expected: anon cannot read the table any more (0 rows, no error).
--
--   set role anon;
--   select count(*) from public.generated_documents;
--   reset role;
--
-- ------------------------------------------------------------
-- 4. Known leftovers (NOT changed here on purpose)
-- ------------------------------------------------------------
-- The admin panel (/admin/*) authenticates with the `admin_session`
-- cookie (see middleware.ts + /api/admin-login) and then reads the
-- database with the public anon key - it has no Supabase JWT. That is
-- why these permissive PUBLIC policies must stay until the admin
-- screens are moved to service-role API routes:
--
--   user_profiles    "Admins can view all profiles"      USING (true)
--   payments         "Admins can view all payments"      USING (true)
--   payments         "Admins can update all payments"    USING (true)
--   app_settings     "Allow public select/update"        USING (true)
--   contact_messages "Admins can view/update/delete ..." USING (true)
--
-- generated_documents was fixed now because /admin only needs it for
-- listing + preview, and both were moved to /api/admin/documents
-- (service role + admin cookie check) in the same change.
-- Follow-up: give payments / user_profiles / app_settings /
-- contact_messages the same treatment (API route + TO service_role).
-- ============================================================
