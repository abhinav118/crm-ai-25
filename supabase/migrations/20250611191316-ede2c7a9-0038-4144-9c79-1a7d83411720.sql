
-- Create the telnyx_campaigns table (fixed reserved keyword issue)
CREATE TABLE public.telnyx_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name TEXT NOT NULL,
  message TEXT NOT NULL,
  recipients TEXT[] NOT NULL, -- list of phone numbers (changed from 'to' which is reserved)
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('now', 'later', 'recurring')),
  schedule_time TIMESTAMP WITH TIME ZONE,
  repeat_frequency TEXT CHECK (repeat_frequency IN ('daily', 'weekly', 'monthly')),
  repeat_days TEXT[], -- e.g. ['Monday', 'Wednesday']
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'scheduled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add Row Level Security
ALTER TABLE public.telnyx_campaigns ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Users can manage campaigns" 
  ON public.telnyx_campaigns 
  FOR ALL 
  USING (true);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_telnyx_campaigns_updated_at
    BEFORE UPDATE ON public.telnyx_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
