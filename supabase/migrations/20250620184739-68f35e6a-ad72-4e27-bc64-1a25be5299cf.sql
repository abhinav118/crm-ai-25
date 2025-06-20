
-- Add progress tracking fields to telnyx_campaigns table
ALTER TABLE telnyx_campaigns 
ADD COLUMN progress_percentage INTEGER DEFAULT 0,
ADD COLUMN sent_count INTEGER DEFAULT 0,
ADD COLUMN total_count INTEGER DEFAULT 0,
ADD COLUMN error_count INTEGER DEFAULT 0;

-- Enable realtime for telnyx_campaigns table
ALTER TABLE telnyx_campaigns REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE telnyx_campaigns;
