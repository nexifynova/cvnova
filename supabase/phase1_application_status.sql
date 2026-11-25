-- ------------------------------------------------------------
-- Phase 1 — Recruiter ATS pipeline status
-- ------------------------------------------------------------
-- job_applications only tracked delivery (email_status / received_at).
-- The company dashboard now sorts candidates into an Interviewed /
-- Pending / Trash pipeline, so every application carries a status.
--
--   received   the application arrived (default, existing rows)
--   interview  company pressed "Interview"
--   pending    company parked the candidate for later
--   trash      soft delete — the row stays and can be restored
--
-- The dashboard writes through /api/company/applications (service role),
-- so no new RLS policy is needed for the column.
-- ------------------------------------------------------------
alter table public.job_applications
  add column if not exists status text not null default 'received';

-- Guard the four allowed values even if a row is written from the SQL editor.
alter table public.job_applications
  drop constraint if exists job_applications_status_check;

alter table public.job_applications
  add constraint job_applications_status_check
  check (status in ('received', 'interview', 'pending', 'trash'));

-- Rows created before this migration become 'received'.
update public.job_applications set status = 'received' where status is null;

-- The dashboard loads one company's applications and filters by status.
create index if not exists job_applications_company_status_idx
  on public.job_applications (company_id, status);

-- ------------------------------------------------------------
-- Verification
-- ------------------------------------------------------------
-- select status, count(*) from public.job_applications group by status order by status;
-- select conname, pg_get_constraintdef(oid)
--   from pg_constraint where conrelid = 'public.job_applications'::regclass;
