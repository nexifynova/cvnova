-- ============================================================
-- CVNova Phase 3 — Job applications, Talent Pool & portal toggle
-- Idempotent: safe to run more than once.
-- Supabase → SQL Editor: run the whole file.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Admin toggle: recruiter / company portal button on the site
-- ------------------------------------------------------------
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS show_company_portal boolean NOT NULL DEFAULT true;

-- ------------------------------------------------------------
-- 2) Job applications
--    One saved CV + the candidate's chat ID per job. The company
--    reads these rows in its talent pool / chat panel.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.job_applications (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id            uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  company_id        uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  candidate_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id       uuid REFERENCES public.generated_documents(id) ON DELETE SET NULL,
  candidate_chat_id text NOT NULL DEFAULT '',
  candidate_email   text NOT NULL DEFAULT '',
  job_title         text NOT NULL DEFAULT '',
  email_status      text NOT NULL DEFAULT 'pending',
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Re-applying with a different CV updates the same row instead of duplicating.
CREATE UNIQUE INDEX IF NOT EXISTS job_applications_job_candidate_key
  ON public.job_applications (job_id, candidate_user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_company
  ON public.job_applications (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_applications_candidate
  ON public.job_applications (candidate_user_id, created_at DESC);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Candidates can apply to jobs" ON public.job_applications;
CREATE POLICY "Candidates can apply to jobs"
  ON public.job_applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = candidate_user_id);

DROP POLICY IF EXISTS "Candidates can view own applications" ON public.job_applications;
CREATE POLICY "Candidates can view own applications"
  ON public.job_applications FOR SELECT
  TO authenticated
  USING (auth.uid() = candidate_user_id);

DROP POLICY IF EXISTS "Companies can view own applications" ON public.job_applications;
CREATE POLICY "Companies can view own applications"
  ON public.job_applications FOR SELECT
  TO authenticated
  USING (auth.uid() = company_id);

DROP POLICY IF EXISTS "Companies can delete own applications" ON public.job_applications;
CREATE POLICY "Companies can delete own applications"
  ON public.job_applications FOR DELETE
  TO authenticated
  USING (auth.uid() = company_id);

GRANT SELECT, INSERT ON public.job_applications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_applications TO service_role;

-- ------------------------------------------------------------
-- 3) Verification (optional)
-- ------------------------------------------------------------
-- SELECT show_company_portal, show_jobs_on_dashboard, enable_company_chat
--   FROM public.app_settings WHERE id = 1;
-- SELECT job_title, candidate_chat_id, email_status, created_at
--   FROM public.job_applications ORDER BY created_at DESC;
