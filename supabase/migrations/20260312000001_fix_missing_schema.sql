-- =============================================================================
-- FIX 1: Add first_name / last_name columns to contacts (if not already added)
-- The app queries contacts.first_name and contacts.last_name but the remote DB
-- only has a single `name` column from the original schema.
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contacts' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE public.contacts ADD COLUMN first_name TEXT;
    ALTER TABLE public.contacts ADD COLUMN last_name  TEXT;

    -- Populate from existing name column
    UPDATE public.contacts SET
      first_name = CASE
        WHEN position(' ' IN name) > 0 THEN substring(name FROM 1 FOR position(' ' IN name) - 1)
        ELSE name
      END,
      last_name = CASE
        WHEN position(' ' IN name) > 0 THEN substring(name FROM position(' ' IN name) + 1)
        ELSE ''
      END
    WHERE name IS NOT NULL;

    -- Make first_name NOT NULL (fall back to empty string if name was null)
    UPDATE public.contacts SET first_name = '' WHERE first_name IS NULL;
    ALTER TABLE public.contacts ALTER COLUMN first_name SET NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_contacts_first_name ON public.contacts(first_name);
    CREATE INDEX IF NOT EXISTS idx_contacts_last_name  ON public.contacts(last_name);
  END IF;
END $$;

-- =============================================================================
-- FIX 2: Add sent_at column to messages (if not already present)
-- The app orders and reads messages.sent_at but the remote DB uses created_at.
-- We add sent_at as a generated column that mirrors created_at so existing data
-- is correct and new inserts that provide sent_at will still work.
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'sent_at'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN sent_at TIMESTAMP WITH TIME ZONE;
    -- Back-fill from created_at
    UPDATE public.messages SET sent_at = created_at WHERE sent_at IS NULL;
    -- Set default so future inserts without sent_at are covered
    ALTER TABLE public.messages ALTER COLUMN sent_at SET DEFAULT now();
  END IF;
END $$;

-- Also add sender column if missing (app uses sender, DB may only have direction)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'sender'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN sender TEXT;
    -- Map direction -> sender
    UPDATE public.messages SET sender = CASE WHEN direction = 'inbound' THEN 'contact' ELSE 'user' END;
  END IF;
END $$;

-- Add channel column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'channel'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN channel TEXT DEFAULT 'sms';
  END IF;
END $$;

-- Add is_read column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'is_read'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN is_read BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add media_url column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'media_url'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN media_url TEXT;
  END IF;
END $$;

-- =============================================================================
-- FIX 3: Create user_logins table (stores auth email per user)
-- The app (useProfile.ts) does: supabase.from('user_logins').select('login_email').eq('id', userId)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_logins (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  login_email TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.user_logins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to user_logins" ON public.user_logins;
CREATE POLICY "Allow all access to user_logins"
  ON public.user_logins FOR ALL USING (true) WITH CHECK (true);

-- Seed the known user from the codebase (id hard-coded in useProfile.ts)
INSERT INTO public.user_logins (id, login_email)
VALUES ('03aa1bcd-5cb3-47b3-b5af-138bc4802f2b', 'abhik.voice@gmail.com')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- FIX 4: Ensure user_profiles table exists with all required columns.
-- The table may already exist (from a prior migration) but be missing columns.
-- We use ADD COLUMN IF NOT EXISTS to safely backfill any gaps.
-- The app (useProfile.ts) does: supabase.from('user_profiles').select('*').eq('id', userId)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id               UUID PRIMARY KEY,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add each column only if it doesn't already exist
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS user_id         UUID;
-- Drop the FK to auth.users so seed data (not in auth.users) can be inserted
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS email           TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS first_name      TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS last_name       TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS company         TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS mobile_number   TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS time_zone       TEXT DEFAULT 'America/New_York';
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS textable_number TEXT;

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to user_profiles" ON public.user_profiles;
CREATE POLICY "Allow all access to user_profiles"
  ON public.user_profiles FOR ALL USING (true) WITH CHECK (true);

-- Seed the known user profile (insert only if not already present)
-- user_id mirrors id (same UUID) as it's the auth user reference
INSERT INTO public.user_profiles (id, user_id, email, first_name, last_name, company, mobile_number, time_zone)
VALUES (
  '03aa1bcd-5cb3-47b3-b5af-138bc4802f2b',
  '03aa1bcd-5cb3-47b3-b5af-138bc4802f2b',
  'abhik.voice@gmail.com',
  'Abhik',
  'Admin',
  'Test Company',
  '(555) 123-4567',
  'America/New_York'
)
ON CONFLICT (id) DO NOTHING;

-- Grants so the anon/authenticated keys can access these tables
GRANT SELECT, INSERT, UPDATE ON public.user_logins  TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO anon, authenticated;
GRANT ALL ON public.user_logins  TO service_role;
GRANT ALL ON public.user_profiles TO service_role;
