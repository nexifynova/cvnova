-- =====================================================================
-- Phase 2 - Company packages, free trial, grace period and admin pricing
-- Idempotent: safe to run again from Supabase -> SQL Editor.
-- =====================================================================

begin;

-- ------------------------------------------------------------------ 1. companies
alter table public.companies
  add column if not exists package_type   text,
  add column if not exists package_expiry timestamptz,
  add column if not exists grace_expiry   timestamptz;

-- Existing companies keep working: a 45-day trial measured from today.
update public.companies
   set package_type   = coalesce(package_type, 'free_trial'),
       package_expiry = now() + interval '45 days'
 where package_expiry is null;

update public.companies
   set grace_expiry = package_expiry + interval '24 hours'
 where grace_expiry is null
   and package_expiry is not null;

create index if not exists companies_package_expiry_idx
  on public.companies (package_expiry);

-- ------------------------------------------------------------------ 2. catalogue
create table if not exists public.company_packages (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,
  name          text not null,
  price_usd     numeric(10,2) not null default 0 check (price_usd >= 0),
  duration_days integer not null check (duration_days > 0),
  is_trial      boolean not null default false,
  is_active     boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.company_settings (
  id            integer primary key check (id = 1),
  trial_days    integer not null default 45 check (trial_days > 0),
  grace_hours   integer not null default 24 check (grace_hours >= 0),
  grace_enabled boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

insert into public.company_settings (id) values (1) on conflict (id) do nothing;

-- 5 default packages: monthly prices of $4.50 (9 months) and $4.00 (2 years)
-- are stored as the total charged for the term ($40.50 / $96.00).
insert into public.company_packages (code, name, price_usd, duration_days, is_trial, sort_order)
values
  ('free_trial', 'Free Trial',  0.00,  45, true,  1),
  ('1_month',    '1 Month',     3.00,  30, false, 2),
  ('3_months',   '3 Months',    5.00,  90, false, 3),
  ('9_months',   '9 Months',   40.50, 270, false, 4),
  ('2_years',    '2 Years',    96.00, 720, false, 5)
on conflict (code) do nothing;

-- ------------------------------------------------------------------ 3. RLS
-- Policy-free on purpose: only the service role (API routes and the admin
-- panel) may read or write these tables, so a company can never edit the
-- price list, extend its own trial or switch the grace period off.
alter table public.company_packages enable row level security;
alter table public.company_settings enable row level security;

-- New tables are not covered by the project's default privileges, so the
-- service role (used by the API routes and the admin panel) needs explicit
-- grants. anon/authenticated get nothing: the catalogue and the trial/grace
-- rules must never be readable or writable from the browser.
grant select, insert, update, delete on public.company_packages to service_role;
grant select, insert, update, delete on public.company_settings to service_role;
revoke all on public.company_packages from anon, authenticated;
revoke all on public.company_settings from anon, authenticated;

-- ------------------------------------------------------------------ 4. timestamps
create or replace function public.company_catalogue_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists company_packages_touch_updated_at on public.company_packages;
create trigger company_packages_touch_updated_at
before update on public.company_packages
for each row execute function public.company_catalogue_touch_updated_at();

drop trigger if exists company_settings_touch_updated_at on public.company_settings;
create trigger company_settings_touch_updated_at
before update on public.company_settings
for each row execute function public.company_catalogue_touch_updated_at();

-- ------------------------------------------------------------------ 5. guard
-- companies already allows "update own record", so without this trigger a
-- company could extend package_expiry from the browser. Package columns are
-- therefore writable only by the service role (register/api/bootstrap).
create or replace function public.guard_company_package_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  caller        text := lower(coalesce(nullif(auth.role(), ''), nullif(current_setting('role', true), ''), ''));
  v_trial_days  integer := 45;
  v_grace_hours integer := 24;
begin
  if caller in ('service_role', 'postgres', 'supabase_admin', 'supabase_storage_admin') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- A company row created straight from the browser still starts on the
    -- free trial; visitors can never choose their own expiry.
    select trial_days, grace_hours
      into v_trial_days, v_grace_hours
      from public.company_settings
     where id = 1;
    v_trial_days  := coalesce(v_trial_days, 45);
    v_grace_hours := coalesce(v_grace_hours, 24);
    new.package_type   := 'free_trial';
    new.package_expiry := now() + make_interval(days => v_trial_days);
    new.grace_expiry   := new.package_expiry + make_interval(hours => v_grace_hours);
    return new;
  end if;

  if new.package_type is distinct from old.package_type
     or new.package_expiry is distinct from old.package_expiry
     or new.grace_expiry is distinct from old.grace_expiry then
    raise exception 'company_package_columns_are_read_only' using errcode = '42501';
  end if;

  return new;
end $$;

drop trigger if exists guard_company_package_columns on public.companies;
create trigger guard_company_package_columns
before insert or update on public.companies
for each row execute function public.guard_company_package_columns();

-- ------------------------------------------------------------------ 6. grace sync
-- Called by the admin pricing API whenever the grace period length changes so
-- already-registered companies pick up the new rule immediately.
create or replace function public.sync_company_grace_expiry()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hours integer;
  v_rows  integer;
begin
  select grace_hours into v_hours from public.company_settings where id = 1;
  v_hours := coalesce(v_hours, 24);

  update public.companies
     set grace_expiry = package_expiry + make_interval(hours => v_hours)
   where package_expiry is not null;

  get diagnostics v_rows = row_count;
  return v_rows;
end $$;

revoke all on function public.sync_company_grace_expiry() from public;
grant execute on function public.sync_company_grace_expiry() to service_role;

-- ------------------------------------------------------------------ 7. comments
comment on column public.companies.package_type is
  'Active plan code (free_trial, 1_month, 3_months, 9_months, 2_years). Service-role writable only.';
comment on column public.companies.package_expiry is
  'End of the paid plan or free trial. NULL means no plan: read-only access.';
comment on column public.companies.grace_expiry is
  'package_expiry + company_settings.grace_hours. Chat stays open until this moment.';
comment on table public.company_packages is
  'Company pricing catalogue, edited from /admin/company-pricing.';
comment on table public.company_settings is
  'Single row (id = 1): trial length, grace period length and grace on/off.';

commit;
