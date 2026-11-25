-- ============================================================
-- CVNova Phase 1: Real-time Chatroom System
-- Run once in Supabase Dashboard -> SQL Editor (safe to re-run).
-- ============================================================

-- ------------------------------------------------------------
-- 1. CHAT COLUMNS ON user_profiles
-- ------------------------------------------------------------
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS chat_id      text,
  ADD COLUMN IF NOT EXISTS is_online    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

-- ------------------------------------------------------------
-- 2. CHAT ID GENERATOR  (e.g. @Faisal4268205)
--    Signup par profile insert hote hi BEFORE INSERT trigger isay
--    generate karke save karta hai.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cvnova_generate_chat_id(display_name text)
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
  source := COALESCE(NULLIF(btrim(display_name), ''), 'CVNovaUser');
  -- Pehla word (first name) lein: "Faisal Khan" -> "Faisal"
  base := split_part(source, ' ', 1);
  -- Email fallback ke liye '@' se pehle ka hissa
  base := split_part(base, '@', 1);
  -- Sirf latin letters/digits rakhein
  base := regexp_replace(base, '[^A-Za-z0-9]', '', 'g');
  IF base = '' THEN
    base := 'CVNovaUser';
  END IF;
  base := initcap(lower(substring(base FROM 1 FOR 14)));

  LOOP
    attempt := attempt + 1;
    candidate := '@' || base || lpad((floor(random() * 10000000))::bigint::text, 7, '0');

    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.user_profiles WHERE chat_id = candidate
    );

    -- Practically unreachable, but never return a duplicate id
    IF attempt >= 50 THEN
      candidate := '@' || base || extract(epoch FROM clock_timestamp())::bigint::text;
      EXIT;
    END IF;
  END LOOP;

  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.cvnova_set_chat_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.chat_id IS NULL OR btrim(NEW.chat_id) = '' THEN
    NEW.chat_id := public.cvnova_generate_chat_id(COALESCE(NEW.full_name, NEW.email));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cvnova_set_chat_id ON public.user_profiles;
CREATE TRIGGER trg_cvnova_set_chat_id
  BEFORE INSERT ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.cvnova_set_chat_id();

-- Backfill existing registered users one row at a time so ids stay unique
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT id, COALESCE(full_name, email) AS display_name
      FROM public.user_profiles
     WHERE chat_id IS NULL
  LOOP
    UPDATE public.user_profiles
       SET chat_id = public.cvnova_generate_chat_id(r.display_name)
     WHERE id = r.id;
  END LOOP;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_chat_id_key
  ON public.user_profiles (chat_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_is_online
  ON public.user_profiles (is_online);

-- ------------------------------------------------------------
-- 3. DIRECT MESSAGES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_text text NOT NULL CHECK (length(btrim(message_text)) > 0),
  is_read      boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CHECK (sender_id <> receiver_id)
);

CREATE INDEX IF NOT EXISTS idx_messages_sender_created
  ON public.messages (sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_created
  ON public.messages (receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation
  ON public.messages (sender_id, receiver_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread
  ON public.messages (receiver_id) WHERE is_read = false;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own messages" ON public.messages;
CREATE POLICY "Users read own messages" ON public.messages
  FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users send own messages" ON public.messages;
CREATE POLICY "Users send own messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND sender_id <> receiver_id);

DROP POLICY IF EXISTS "Receivers mark messages read" ON public.messages;
CREATE POLICY "Receivers mark messages read" ON public.messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO service_role;

-- ------------------------------------------------------------
-- 4. REALTIME (INSERT/UPDATE events without page refresh)
-- ------------------------------------------------------------
ALTER TABLE public.messages      REPLICA IDENTITY FULL;
ALTER TABLE public.user_profiles REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime'
       AND schemaname = 'public'
       AND tablename = 'messages'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.messages';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime'
       AND schemaname = 'public'
       AND tablename = 'user_profiles'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.user_profiles';
  END IF;
END;
$$;
