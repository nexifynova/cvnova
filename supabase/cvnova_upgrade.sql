-- ============================================================
-- CVNova SaaS upgrade migration
-- Run this once in Supabase Dashboard -> SQL Editor.
-- Safe to re-run (idempotent).
-- ============================================================

-- ------------------------------------------------------------
-- 1. TRIAL + REACTIVATION + CONSENT + ATS QUOTA (user_profiles)
-- ------------------------------------------------------------
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS trial_started_at       timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS trial_ends_at          timestamptz DEFAULT (now() + interval '2 months'),
  ADD COLUMN IF NOT EXISTS reactivated_until      timestamptz,
  ADD COLUMN IF NOT EXISTS consent_share_cv       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_company_contact boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_marketing      boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_updated_at     timestamptz,
  ADD COLUMN IF NOT EXISTS consent_version        text DEFAULT 'v1',
  ADD COLUMN IF NOT EXISTS blue_ats_used          integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS account_status         text NOT NULL DEFAULT 'active';

-- Backfill trial window for existing accounts (2 months from signup date)
UPDATE public.user_profiles
   SET trial_started_at = COALESCE(trial_started_at, created_at, now()),
       trial_ends_at    = COALESCE(trial_ends_at, COALESCE(created_at, now()) + interval '2 months')
 WHERE trial_ends_at IS NULL;

-- Keep trial dates consistent for every future profile row
CREATE OR REPLACE FUNCTION public.cvnova_set_trial_dates()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.trial_started_at IS NULL THEN
    NEW.trial_started_at := COALESCE(NEW.created_at, now());
  END IF;
  IF NEW.trial_ends_at IS NULL THEN
    NEW.trial_ends_at := COALESCE(NEW.created_at, now()) + interval '2 months';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cvnova_set_trial ON public.user_profiles;
CREATE TRIGGER trg_cvnova_set_trial
  BEFORE INSERT ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.cvnova_set_trial_dates();

-- ------------------------------------------------------------
-- 2. PER-CV VISIBILITY (generated_documents)
--    is_public is enforced server-side by /api/company/cvs.
-- ------------------------------------------------------------
ALTER TABLE public.generated_documents
  ADD COLUMN IF NOT EXISTS is_public     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ats_tier      text,
  ADD COLUMN IF NOT EXISTS template_tier text;

CREATE INDEX IF NOT EXISTS idx_generated_documents_public  ON public.generated_documents (is_public);
CREATE INDEX IF NOT EXISTS idx_generated_documents_user_id ON public.generated_documents (user_id);


-- ------------------------------------------------------------
-- 3. COMPANY PORTAL ACCOUNTS
--    A company is a normal Supabase auth user whose metadata
--    role = 'company' plus a row in public.companies.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.companies (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name  text NOT NULL,
  contact_name  text,
  email         text NOT NULL,
  website       text,
  industry      text,
  country       text,
  is_approved   boolean NOT NULL DEFAULT true,
  consent_policy_version text NOT NULL DEFAULT 'v1',
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Companies can view own record" ON public.companies;
CREATE POLICY "Companies can view own record" ON public.companies
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Companies can update own record" ON public.companies;
CREATE POLICY "Companies can update own record" ON public.companies
  FOR UPDATE USING (auth.uid() = id);

-- ------------------------------------------------------------
-- 4. IN-APP CHAT (candidate <-> company)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.company_messages (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  candidate_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  document_id       uuid REFERENCES public.generated_documents(id) ON DELETE SET NULL,
  sender            text NOT NULL CHECK (sender IN ('company', 'candidate', 'system')),
  body              text NOT NULL,
  is_read           boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_company_messages_company   ON public.company_messages (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_company_messages_candidate ON public.company_messages (candidate_user_id, created_at DESC);

ALTER TABLE public.company_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Candidates read own messages" ON public.company_messages;
CREATE POLICY "Candidates read own messages" ON public.company_messages
  FOR SELECT USING (auth.uid() = candidate_user_id);

DROP POLICY IF EXISTS "Candidates send own messages" ON public.company_messages;
CREATE POLICY "Candidates send own messages" ON public.company_messages
  FOR INSERT WITH CHECK (auth.uid() = candidate_user_id AND sender = 'candidate');

DROP POLICY IF EXISTS "Companies read own thread messages" ON public.company_messages;
CREATE POLICY "Companies read own thread messages" ON public.company_messages
  FOR SELECT USING (auth.uid() = company_id);


-- ------------------------------------------------------------
-- 5. OUTREACH AUDIT (emails sent from the official domain)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.company_outreach (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  candidate_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  document_id       uuid REFERENCES public.generated_documents(id) ON DELETE SET NULL,
  candidate_email   text,
  subject           text,
  message           text,
  email_status      text NOT NULL DEFAULT 'sent',
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_company_outreach_company ON public.company_outreach (company_id, created_at DESC);

ALTER TABLE public.company_outreach ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Companies read own outreach" ON public.company_outreach;
CREATE POLICY "Companies read own outreach" ON public.company_outreach
  FOR SELECT USING (auth.uid() = company_id);

-- ------------------------------------------------------------
-- 6. BUSINESS SETTINGS (Skrill / Payoneer / trial / ATS quota)
-- ------------------------------------------------------------
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS skrill_enabled     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS skrill_email       text,
  ADD COLUMN IF NOT EXISTS skrill_name        text,
  ADD COLUMN IF NOT EXISTS payoneer_enabled   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payoneer_email     text,
  ADD COLUMN IF NOT EXISTS payoneer_name      text,
  ADD COLUMN IF NOT EXISTS reactivation_price numeric NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS trial_months       integer NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS free_blue_ats_limit integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS usd_to_eur numeric NOT NULL DEFAULT 0.92,
  ADD COLUMN IF NOT EXISTS usd_to_gbp numeric NOT NULL DEFAULT 0.79,
  ADD COLUMN IF NOT EXISTS usd_to_pkr numeric NOT NULL DEFAULT 278,
  ADD COLUMN IF NOT EXISTS usd_to_inr numeric NOT NULL DEFAULT 83,
  ADD COLUMN IF NOT EXISTS usd_to_aed numeric NOT NULL DEFAULT 3.67,
  ADD COLUMN IF NOT EXISTS usd_to_sar numeric NOT NULL DEFAULT 3.75,
  ADD COLUMN IF NOT EXISTS usd_to_cad numeric NOT NULL DEFAULT 1.36,
  ADD COLUMN IF NOT EXISTS usd_to_aud numeric NOT NULL DEFAULT 1.52,
  ADD COLUMN IF NOT EXISTS usd_to_bdt numeric NOT NULL DEFAULT 118,
  ADD COLUMN IF NOT EXISTS usd_to_ngn numeric NOT NULL DEFAULT 1550,
  ADD COLUMN IF NOT EXISTS usd_to_zar numeric NOT NULL DEFAULT 18.5,
  ADD COLUMN IF NOT EXISTS usd_to_try numeric NOT NULL DEFAULT 34,
  ADD COLUMN IF NOT EXISTS usd_to_myr numeric NOT NULL DEFAULT 4.7,
  ADD COLUMN IF NOT EXISTS usd_to_idr numeric NOT NULL DEFAULT 15800;

-- Seed the new payment rails so the checkout page has content out of the box.
UPDATE public.app_settings
   SET skrill_enabled = COALESCE(skrill_enabled, false),
       payoneer_enabled = COALESCE(payoneer_enabled, false),
       reactivation_price = COALESCE(reactivation_price, 2)
 WHERE id = 1;

-- Service role needs read access to the legacy accounts table used by some reports.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_accounts') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_accounts TO service_role';
  END IF;
END;
$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies        TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_messages TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_outreach TO service_role;
