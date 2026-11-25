-- ============================================================
-- CVNova · Job Fields backfill (Phase 1 fix)
-- ------------------------------------------------------------
-- Purane users jinhone CV banate waqt Job Title dali thi, unka
-- job_field_id set karta hai taake woh Chatroom aur Company
-- Portal (Talent pool) mein nazar aayen.
--
-- Kaam:
--   1. Har distinct CV job title ko public.job_fields mein upsert
--      karta hai (case/space-insensitive dedupe).
--   2. user_profiles.job_field_id set karta hai:
--      a) generated_documents.user_id se (latest titled CV wins)
--      b) generated_documents.email se — legacy/guest rows jahan
--         user_id null hai (e.g. login se pehle CV banaya gaya).
--   3. Sirf NULL job_field_id wali profiles update karta hai, is
--      liye user ka manual selection overwrite nahi hota.
--
-- Idempotent: jitni baar chahein chala sakte hain.
-- Run (Supabase SQL editor):
--   select public.backfill_job_fields();
-- ============================================================

create or replace function public.backfill_job_fields()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_fields_added integer := 0;
  v_linked_by_user integer := 0;
  v_linked_by_email integer := 0;
  v_still_unlinked integer := 0;
begin
  -- 1) Har distinct CV Job Title ko job_fields mein le aao
  with titles as (
    select distinct btrim(d.full_data->>'jobTitle') as title
    from public.generated_documents d
    where d.document_type = 'CV'
      and nullif(btrim(coalesce(d.full_data->>'jobTitle', '')), '') is not null
  ), inserted as (
    insert into public.job_fields (field_name)
    select t.title
    from titles t
    where not exists (
      select 1 from public.job_fields jf
      where lower(btrim(jf.field_name)) = lower(t.title)
    )
    on conflict do nothing
    returning 1
  )
  select count(*) into v_fields_added from inserted;

  -- 2) Purani CVs jahan user_id mojood hai — user id se link
  with latest as (
    select distinct on (d.user_id)
      d.user_id,
      lower(btrim(d.full_data->>'jobTitle')) as title_key
    from public.generated_documents d
    where d.document_type = 'CV'
      and d.user_id is not null
      and nullif(btrim(coalesce(d.full_data->>'jobTitle', '')), '') is not null
    order by d.user_id, d.created_at desc
  ), updated as (
    update public.user_profiles p
       set job_field_id = jf.id
      from latest l
      join public.job_fields jf on lower(btrim(jf.field_name)) = l.title_key
     where p.id = l.user_id
       and p.job_field_id is null
    returning 1
  )
  select count(*) into v_linked_by_user from updated;

  -- 3) Legacy/guest CVs jahan user_id null hai — email se profile match karke link
  with latest as (
    select distinct on (lower(btrim(d.email)))
      lower(btrim(d.email)) as email_key,
      lower(btrim(d.full_data->>'jobTitle')) as title_key
    from public.generated_documents d
    where d.document_type = 'CV'
      and nullif(btrim(coalesce(d.email, '')), '') is not null
      and lower(btrim(d.email)) <> 'n/a'
      and nullif(btrim(coalesce(d.full_data->>'jobTitle', '')), '') is not null
    order by lower(btrim(d.email)), d.created_at desc
  ), updated as (
    update public.user_profiles p
       set job_field_id = jf.id
      from latest l
      join public.job_fields jf on lower(btrim(jf.field_name)) = l.title_key
     where lower(btrim(coalesce(p.email, ''))) = l.email_key
       and p.job_field_id is null
    returning 1
  )
  select count(*) into v_linked_by_email from updated;

  -- 4) Summary report
  select count(*) into v_still_unlinked from public.user_profiles where job_field_id is null;

  return jsonb_build_object(
    'fields_added', v_fields_added,
    'linked_by_user_id', v_linked_by_user,
    'linked_by_email', v_linked_by_email,
    'profiles_without_field', v_still_unlinked,
    'total_fields', (select count(*) from public.job_fields)
  );
end;
$$;

comment on function public.backfill_job_fields() is
  'Backfills job_fields and user_profiles.job_field_id from saved CV job titles (by user id, then email). Idempotent — safe to re-run after data imports.';

-- Sirf server-side (service_role) se chalaye jane wala maintenance function.
revoke all on function public.backfill_job_fields() from public;
revoke all on function public.backfill_job_fields() from anon;
revoke all on function public.backfill_job_fields() from authenticated;
grant execute on function public.backfill_job_fields() to service_role;

-- Ab chala kar result dekh lein:
select public.backfill_job_fields();
