-- Fix 1: Make contact_logs compatible with both old and new app payloads
ALTER TABLE public.contact_logs
ADD COLUMN IF NOT EXISTS contact_info JSONB;

ALTER TABLE public.contact_logs
ADD COLUMN IF NOT EXISTS details JSONB;

UPDATE public.contact_logs
SET contact_info = COALESCE(contact_info, details)
WHERE contact_info IS NULL;

UPDATE public.contact_logs
SET details = COALESCE(details, contact_info)
WHERE details IS NULL;

-- Fix 2: Allow client-side writes to contacts_segments (current app behavior)
ALTER TABLE public.contacts_segments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contacts_segments'
      AND policyname = 'Allow write access for anon users'
  ) THEN
    CREATE POLICY "Allow write access for anon users"
      ON public.contacts_segments
      FOR INSERT
      TO anon
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contacts_segments'
      AND policyname = 'Allow update access for anon users'
  ) THEN
    CREATE POLICY "Allow update access for anon users"
      ON public.contacts_segments
      FOR UPDATE
      TO anon
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contacts_segments'
      AND policyname = 'Allow delete access for anon users'
  ) THEN
    CREATE POLICY "Allow delete access for anon users"
      ON public.contacts_segments
      FOR DELETE
      TO anon
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contacts_segments'
      AND policyname = 'Allow write access for authenticated users'
  ) THEN
    CREATE POLICY "Allow write access for authenticated users"
      ON public.contacts_segments
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contacts_segments'
      AND policyname = 'Allow update access for authenticated users'
  ) THEN
    CREATE POLICY "Allow update access for authenticated users"
      ON public.contacts_segments
      FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contacts_segments'
      AND policyname = 'Allow delete access for authenticated users'
  ) THEN
    CREATE POLICY "Allow delete access for authenticated users"
      ON public.contacts_segments
      FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END
$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.contacts_segments TO anon, authenticated;
