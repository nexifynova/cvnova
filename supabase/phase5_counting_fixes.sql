-- =============================================================================
-- Phase 5 fixes
--   1) Fix CV double counting (1 document = 1 count, all document types).
--   2) Track deleted documents WITHOUT reducing the used count.
--   3) Add admin toggles / customisable heading to app_settings.
-- Safe to run multiple times (idempotent).
-- =============================================================================

-- ---------------------------------------------------------------
-- 1) Deleted document tracking (used count is NOT reduced on delete)
-- ---------------------------------------------------------------
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS deleted_documents_count integer NOT NULL DEFAULT 0;

-- ---------------------------------------------------------------
-- 2) Fix double counting.
--    Previously a document was counted twice: the DB trigger incremented
--    free_cv_count (CVs only) AND the app called incrementUserCount() for
--    every document. The app-side increment has now been removed, so this
--    trigger is the single source of truth. It now counts EVERY document
--    type (CV, Cover Letter, Experience Letter) so the "X / limit" counter
--    matches the "My Documents" list exactly.
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_free_cv_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.user_profiles
  SET free_cv_count = COALESCE(free_cv_count, 0) + 1
  WHERE id = (
    SELECT id FROM auth.users
    WHERE lower(email) = lower(NEW.email)
    LIMIT 1
  );
  RETURN NEW;
END;
$function$;

-- Make sure the trigger exists and points at the (fixed) function.
DROP TRIGGER IF EXISTS on_cv_generated ON public.generated_documents;
CREATE TRIGGER on_cv_generated
  AFTER INSERT ON public.generated_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_free_cv_count();

-- ---------------------------------------------------------------
-- 3) One-time repair of already double-counted values.
--    free_cv_count is reset to the number of documents the user actually
--    owns, so the dashboard counter matches the document list again.
-- ---------------------------------------------------------------
UPDATE public.user_profiles p
SET free_cv_count = sub.cnt
FROM (
  SELECT p2.id, COALESCE(COUNT(d.id), 0) AS cnt
  FROM public.user_profiles p2
  LEFT JOIN public.generated_documents d
    ON lower(d.email) = lower(p2.email)
  GROUP BY p2.id
) sub
WHERE p.id = sub.id;

-- ---------------------------------------------------------------
-- 4) Admin toggles / customisable heading
-- ---------------------------------------------------------------
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS show_company_inbox    boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS golden_circle_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS job_fields_heading    text    NOT NULL DEFAULT 'Search Professionals by Field';

-- Verification (optional)
-- SELECT id, email, free_cv_count, deleted_documents_count FROM public.user_profiles;
-- SELECT show_company_inbox, golden_circle_enabled, job_fields_heading FROM public.app_settings WHERE id = 1;
