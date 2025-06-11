
-- Add media_url column to telnyx_campaigns table for image attachments
ALTER TABLE public.telnyx_campaigns 
ADD COLUMN media_url TEXT;
