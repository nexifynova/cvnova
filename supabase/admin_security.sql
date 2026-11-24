-- ============================================================
-- CVNova: admin_users security hardening
--   1) Enable RLS so only the service_role can read/write admin_users.
--   2) Hash any legacy plain-text passwords with bcrypt (pgcrypto).
-- Run once in Supabase Dashboard -> SQL Editor. Safe to re-run.
-- ============================================================

-- pgcrypto gives us crypt() + gen_salt('bf') for bcrypt hashing.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- Resolve crypt()/gen_salt() whether pgcrypto lives in public or extensions.
SET search_path = public, extensions;

-- ------------------------------------------------------------
-- 1. Lock down public.admin_users (service_role only)
-- ------------------------------------------------------------
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Make sure bcrypt hashes (60 chars) fit regardless of the old column size.
ALTER TABLE public.admin_users ALTER COLUMN password TYPE text;

-- Drop every existing policy on admin_users (the loose one that let the
-- public anon key read emails/passwords).
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT polname FROM pg_policy WHERE polrelid = 'public.admin_users'::regclass
  LOOP
    EXECUTE format('DROP POLICY %I ON public.admin_users', pol.polname);
  END LOOP;
END;
$$;

-- Single policy: only the service_role can touch this table.
-- (service_role already bypasses RLS; this makes intent explicit and
-- guarantees anon/authenticated clients get nothing.)
DROP POLICY IF EXISTS "admin_users_service_role_only" ON public.admin_users;
CREATE POLICY "admin_users_service_role_only"
  ON public.admin_users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Keep full table access for the server-side service_role used by API routes.
GRANT ALL ON TABLE public.admin_users TO service_role;

-- ------------------------------------------------------------
-- 2. Hash legacy plain-text passwords (bcrypt, cost 10)
--    Already-hashed rows ($2a$/$2b$/$2y$) are skipped, so this is
--    idempotent and the resulting $2a$ hashes verify in bcryptjs.
-- ------------------------------------------------------------
UPDATE public.admin_users
   SET password = crypt(password, gen_salt('bf', 10))
 WHERE password IS NOT NULL
   AND password NOT LIKE '$2a$%'
   AND password NOT LIKE '$2b$%'
   AND password NOT LIKE '$2y$%';
