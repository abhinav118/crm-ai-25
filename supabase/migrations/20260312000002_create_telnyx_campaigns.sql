-- =============================================================================
-- Create telnyx_campaigns table with all columns from the migration history.
-- Consolidates: 20250611191316, 20250611202326, 20250620121337, 20250620184739,
--               20250621185951, 20250627131751
-- =============================================================================

-- Ensure the updated_at trigger function exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.telnyx_campaigns (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name       TEXT NOT NULL,
  message             TEXT NOT NULL,
  recipients          TEXT[] NOT NULL,
  schedule_type       TEXT NOT NULL CHECK (schedule_type IN ('now', 'later', 'recurring')),
  schedule_time       TIMESTAMP WITH TIME ZONE,
  repeat_frequency    TEXT CHECK (repeat_frequency IN ('daily', 'weekly', 'monthly')),
  repeat_days         TEXT[],
  status              TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'scheduled', 'sending', 'completed')),
  segment_name        TEXT,
  media_url           TEXT,
  progress_percentage INTEGER DEFAULT 0,
  sent_count          INTEGER DEFAULT 0,
  total_count         INTEGER DEFAULT 0,
  error_count         INTEGER DEFAULT 0,
  errors              JSONB DEFAULT '[]'::jsonb,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add any columns that might be missing if the table already partially exists
ALTER TABLE public.telnyx_campaigns ADD COLUMN IF NOT EXISTS segment_name        TEXT;
ALTER TABLE public.telnyx_campaigns ADD COLUMN IF NOT EXISTS media_url           TEXT;
ALTER TABLE public.telnyx_campaigns ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0;
ALTER TABLE public.telnyx_campaigns ADD COLUMN IF NOT EXISTS sent_count          INTEGER DEFAULT 0;
ALTER TABLE public.telnyx_campaigns ADD COLUMN IF NOT EXISTS total_count         INTEGER DEFAULT 0;
ALTER TABLE public.telnyx_campaigns ADD COLUMN IF NOT EXISTS error_count         INTEGER DEFAULT 0;
ALTER TABLE public.telnyx_campaigns ADD COLUMN IF NOT EXISTS errors              JSONB DEFAULT '[]'::jsonb;

-- Update status constraint to include all valid values
ALTER TABLE public.telnyx_campaigns DROP CONSTRAINT IF EXISTS telnyx_campaigns_status_check;
ALTER TABLE public.telnyx_campaigns ADD CONSTRAINT telnyx_campaigns_status_check
  CHECK (status IN ('pending', 'sent', 'failed', 'scheduled', 'sending', 'completed'));

-- Enable realtime
ALTER TABLE public.telnyx_campaigns REPLICA IDENTITY FULL;

-- RLS
ALTER TABLE public.telnyx_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage campaigns" ON public.telnyx_campaigns;
CREATE POLICY "Users can manage campaigns"
  ON public.telnyx_campaigns FOR ALL USING (true) WITH CHECK (true);

-- Allow anon read (needed for the app's anon key)
DROP POLICY IF EXISTS "Allow anon read campaigns" ON public.telnyx_campaigns;
CREATE POLICY "Allow anon read campaigns"
  ON public.telnyx_campaigns FOR SELECT TO anon USING (true);

-- updated_at trigger
DROP TRIGGER IF EXISTS update_telnyx_campaigns_updated_at ON public.telnyx_campaigns;
CREATE TRIGGER update_telnyx_campaigns_updated_at
  BEFORE UPDATE ON public.telnyx_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.telnyx_campaigns TO anon, authenticated;
GRANT ALL ON public.telnyx_campaigns TO service_role;
