-- =====================================================================
-- Phase 3 - Company billing (plan purchase) & employee CV management (B2B)
-- Idempotent: safe to run again from Supabase -> SQL Editor.
-- Requires Phase 2 (company_packages / company_settings / companies.package_*).
-- =====================================================================

begin;

-- ------------------------------------------------------------------ 1. roster
-- One row per employee a company registered. The employee also gets a normal
-- CVNova account (handled by the app through the service role), so
-- employee_user_id points at auth.users and is NULL until the account exists.
create table if not exists public.company_employees (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references public.companies(id) on delete cascade,
  employee_user_id uuid references auth.users(id) on delete set null,
  emp_id           text not null,
  full_name        text not null,
  email            text not null,
  contact          text,
  applied_field    text,
  job_field_id     uuid references public.job_fields(id) on delete set null,
  joined_on        date not null default current_date,
  invite_sent_at   timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- The same person cannot be added twice by the same company (case-insensitive)
-- and employee IDs stay unique inside one company.
create unique index if not exists company_employees_company_email_key
  on public.company_employees (company_id, lower(email));
create unique index if not exists company_employees_company_emp_id_key
  on public.company_employees (company_id, emp_id);
create index if not exists company_employees_company_idx
  on public.company_employees (company_id, created_at desc);
create index if not exists company_employees_field_idx
  on public.company_employees (company_id, applied_field);

-- ------------------------------------------------------------------ 2. RLS
-- Policy-free on purpose: the roster is readable/writable only through the
-- service role (company APIs). A logged-in candidate must never be able to
-- list another company's employees.
alter table public.company_employees enable row level security;

grant select, insert, update, delete on public.company_employees to service_role;
revoke all on public.company_employees from anon, authenticated;

-- ------------------------------------------------------------------ 3. updated_at
drop trigger if exists company_employees_touch_updated_at on public.company_employees;
create trigger company_employees_touch_updated_at
before update on public.company_employees
for each row execute function public.company_catalogue_touch_updated_at();

-- ------------------------------------------------------------------ 4. EMP-0001
-- Per-company running number. Called with the service role before an insert;
-- the unique index above is the final guard against two concurrent creates.
create or replace function public.next_company_emp_id(p_company uuid)
returns text
language sql
security definer
set search_path = public
as $$
  select 'EMP-' || lpad(
    (
      coalesce(
        max(nullif(regexp_replace(emp_id, '[^0-9]', '', 'g'), '')::int),
        0
      ) + 1
    )::text,
    4,
    '0'
  )
  from public.company_employees
  where company_id = p_company
$$;

revoke all on function public.next_company_emp_id(uuid) from public;
grant execute on function public.next_company_emp_id(uuid) to service_role;

-- ------------------------------------------------------------------ 5. comments
comment on table public.company_employees is
  'B2B employee roster: every employee also owns a normal CVNova candidate account.';
comment on column public.company_employees.emp_id is
  'Company-facing employee number, EMP-0001 style, unique per company.';
comment on column public.company_employees.employee_user_id is
  'auth.users id of the employee account. NULL only if the account could not be linked.';
comment on column public.company_employees.applied_field is
  'Job field the employee was hired for; drives the /company/employees filter.';
comment on column public.company_employees.invite_sent_at is
  'When the welcome email with the temporary password was handed to the mail provider.';

commit;
