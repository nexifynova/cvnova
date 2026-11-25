-- Phase 4 — application "received" status, re-apply counter, the
-- "Listed Companies" admin toggle and document sharing inside chat.
--
-- Run this in Supabase → SQL Editor (or: supabase db push). It is safe to
-- re-run: every statement checks for the existing object first.

-- 1. Company confirms a CV reached them + counts repeat applications.
alter table public.job_applications add column if not exists received_at timestamptz;
alter table public.job_applications add column if not exists apply_count integer not null default 1;

-- 2. Admin switch for the "Listed Companies" dashboard box.
alter table public.app_settings add column if not exists show_listed_companies boolean not null default true;
update public.app_settings set show_listed_companies = true where id = 1 and show_listed_companies is null;

-- 3. Document sharing inside chat. The name is stored as a snapshot so the
--    transcript always shows the document title, never its UUID.
alter table public.messages add column if not exists document_id uuid references public.generated_documents(id) on delete set null;
alter table public.messages add column if not exists document_name text;

alter table public.company_messages add column if not exists document_name text;
