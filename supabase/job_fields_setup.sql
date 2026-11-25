-- ============================================================
-- CVNova Phase 2 — Dynamic JOB / Fields System
-- Idempotent: is file ko dobara chalana safe hai.
-- Supabase → SQL Editor mein ye poora file Run karein.
-- ============================================================

-- 1) job_fields table ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.job_fields (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Duplicate rok: "Accountant" aur "accountant " ek hi field maane jayen.
CREATE UNIQUE INDEX IF NOT EXISTS job_fields_name_unique
  ON public.job_fields (lower(btrim(field_name)));

-- 2) user_profiles.job_field_id -------------------------------------
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS job_field_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_profiles_job_field_id_fkey'
      AND conrelid = 'public.user_profiles'::regclass
  ) THEN
    ALTER TABLE public.user_profiles
      ADD CONSTRAINT user_profiles_job_field_id_fkey
      FOREIGN KEY (job_field_id) REFERENCES public.job_fields(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS user_profiles_job_field_id_idx
  ON public.user_profiles (job_field_id);

-- 3) app_settings toggles -------------------------------------------
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS show_job_fields_landing   boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_job_fields_dashboard boolean NOT NULL DEFAULT true;

-- 4) RPC: field upsert + current user ko link karna ------------------
-- Builder save par job title yahan se aata hai. SECURITY DEFINER hai taake
-- job_fields par insert aur apni profile update dono ek call mein ho sakein.
CREATE OR REPLACE FUNCTION public.save_user_job_field(p_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id  uuid;
  v_uid uuid := auth.uid();
  v_name text := btrim(COALESCE(p_name, ''));
BEGIN
  IF v_uid IS NULL OR v_name = '' THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.job_fields (field_name)
  VALUES (v_name)
  ON CONFLICT ((lower(btrim(field_name)))) DO NOTHING;

  SELECT id INTO v_id
  FROM public.job_fields
  WHERE lower(field_name) = lower(v_name)
  LIMIT 1;

  UPDATE public.user_profiles
  SET job_field_id = v_id
  WHERE id = v_uid;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.save_user_job_field(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.save_user_job_field(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.save_user_job_field(text) TO authenticated, service_role;

-- 5) RLS + grants ----------------------------------------------------
ALTER TABLE public.job_fields ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view job fields" ON public.job_fields;
CREATE POLICY "Anyone can view job fields"
  ON public.job_fields FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Signed-in users can add job fields" ON public.job_fields;
CREATE POLICY "Signed-in users can add job fields"
  ON public.job_fields FOR INSERT
  TO authenticated
  WITH CHECK (true);

GRANT SELECT ON public.job_fields TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.job_fields TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_fields TO service_role;

-- 6) Backfill — pehle se saved CVs ke jobTitle se fields + user links ----
INSERT INTO public.job_fields (field_name)
SELECT DISTINCT btrim(full_data->>'jobTitle')
FROM public.generated_documents
WHERE full_data->>'jobTitle' IS NOT NULL
  AND btrim(full_data->>'jobTitle') <> ''
ON CONFLICT ((lower(btrim(field_name)))) DO NOTHING;

UPDATE public.user_profiles p
SET job_field_id = jf.id
FROM (
  SELECT DISTINCT ON (user_id)
         user_id,
         btrim(full_data->>'jobTitle') AS title
  FROM public.generated_documents
  WHERE user_id IS NOT NULL
    AND full_data->>'jobTitle' IS NOT NULL
    AND btrim(full_data->>'jobTitle') <> ''
  ORDER BY user_id, created_at DESC
) d
JOIN public.job_fields jf
  ON lower(jf.field_name) = lower(d.title)
WHERE p.id = d.user_id
  AND p.job_field_id IS NULL;


-- 7) Verification (optional) ----------------------------------------
-- SELECT * FROM public.job_fields ORDER BY field_name;
-- SELECT column_name FROM information_schema.columns
--  WHERE table_name='user_profiles' AND column_name='job_field_id';
