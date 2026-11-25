-- ============================================================
-- CVNova Phase 2 — Jobs, Company Chat & Admin toggles
-- Idempotent: is file ko dobara chalana safe hai.
-- Supabase → SQL Editor mein ye poora file Run karein.
-- ============================================================

-- ------------------------------------------------------------
-- 1) companies: chat_id + recruiting field
-- ------------------------------------------------------------
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS chat_id      text,
  ADD COLUMN IF NOT EXISTS job_field_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'companies_job_field_id_fkey'
      AND conrelid = 'public.companies'::regclass
  ) THEN
    ALTER TABLE public.companies
      ADD CONSTRAINT companies_job_field_id_fkey
      FOREIGN KEY (job_field_id) REFERENCES public.job_fields(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS companies_job_field_id_idx
  ON public.companies (job_field_id);

-- ------------------------------------------------------------
-- 2) Company chat ID generator (e.g. @Nexify4830221)
--    user_profiles ke cvnova_generate_chat_id jaisa hi pattern,
--    lekin alag table par unique check karta hai.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cvnova_generate_company_chat_id(display_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  source    text;
  base      text;
  candidate text;
  attempt   integer := 0;
BEGIN
  source := COALESCE(NULLIF(btrim(display_name), ''), 'CVNovaCompany');
  -- Pehla word lein: "Nexify Ltd" -> "Nexify"
  base := split_part(source, ' ', 1);
  -- Email fallback ke liye '@' se pehle ka hissa
  base := split_part(base, '@', 1);
  -- Sirf latin letters/digits rakhein
  base := regexp_replace(base, '[^A-Za-z0-9]', '', 'g');
  IF base = '' THEN
    base := 'CVNovaCompany';
  END IF;
  base := initcap(lower(substring(base FROM 1 FOR 14)));

  LOOP
    attempt := attempt + 1;
    candidate := '@' || base || lpad((floor(random() * 10000000))::bigint::text, 7, '0');

    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.companies WHERE chat_id = candidate
    );

    IF attempt >= 50 THEN
      candidate := '@' || base || extract(epoch FROM clock_timestamp())::bigint::text;
      EXIT;
    END IF;
  END LOOP;

  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.cvnova_set_company_chat_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.chat_id IS NULL OR btrim(NEW.chat_id) = '' THEN
    NEW.chat_id := public.cvnova_generate_company_chat_id(COALESCE(NEW.company_name, NEW.email));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cvnova_set_company_chat_id ON public.companies;
CREATE TRIGGER trg_cvnova_set_company_chat_id
  BEFORE INSERT ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.cvnova_set_company_chat_id();

-- Trigger hi chat_id set karta hai — direct RPC ki zaroorat nahi.
REVOKE ALL ON FUNCTION public.cvnova_generate_company_chat_id(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cvnova_generate_company_chat_id(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cvnova_generate_company_chat_id(text) TO service_role;

REVOKE ALL ON FUNCTION public.cvnova_set_company_chat_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cvnova_set_company_chat_id() FROM anon, authenticated;

-- Backfill: existing companies ko ek ek kar ke unique id dein.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT id, COALESCE(company_name, email) AS display_name
      FROM public.companies
     WHERE chat_id IS NULL OR btrim(chat_id) = ''
  LOOP
    UPDATE public.companies
       SET chat_id = public.cvnova_generate_company_chat_id(r.display_name)
     WHERE id = r.id;
  END LOOP;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS companies_chat_id_key
  ON public.companies (chat_id);

-- ------------------------------------------------------------
-- 3) jobs table
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.jobs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title       text NOT NULL CHECK (length(btrim(title)) > 0),
  description text NOT NULL DEFAULT '',
  location    text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jobs_company_created
  ON public.jobs (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_created
  ON public.jobs (created_at DESC);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Koi bhi signed-in user live jobs dekh sakta hai.
DROP POLICY IF EXISTS "Signed-in users can view jobs" ON public.jobs;
CREATE POLICY "Signed-in users can view jobs"
  ON public.jobs FOR SELECT
  TO authenticated
  USING (true);

-- Company sirf apni jobs create / update / delete kar sakti hai.
DROP POLICY IF EXISTS "Companies can create own jobs" ON public.jobs;
CREATE POLICY "Companies can create own jobs"
  ON public.jobs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = company_id);

DROP POLICY IF EXISTS "Companies can update own jobs" ON public.jobs;
CREATE POLICY "Companies can update own jobs"
  ON public.jobs FOR UPDATE
  TO authenticated
  USING (auth.uid() = company_id)
  WITH CHECK (auth.uid() = company_id);

DROP POLICY IF EXISTS "Companies can delete own jobs" ON public.jobs;
CREATE POLICY "Companies can delete own jobs"
  ON public.jobs FOR DELETE
  TO authenticated
  USING (auth.uid() = company_id);

GRANT SELECT ON public.jobs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO service_role;

-- ------------------------------------------------------------
-- 4) app_settings toggles
-- ------------------------------------------------------------
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS show_jobs_on_dashboard boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS enable_company_chat   boolean NOT NULL DEFAULT true;

-- ------------------------------------------------------------
-- 5) Verification (optional)
-- ------------------------------------------------------------
-- SELECT id, company_name, chat_id, job_field_id FROM public.companies;
-- SELECT * FROM public.jobs ORDER BY created_at DESC;
-- SELECT show_jobs_on_dashboard, enable_company_chat FROM public.app_settings WHERE id = 1;
