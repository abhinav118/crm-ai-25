
-- Update the status check constraint to include 'sending'
ALTER TABLE telnyx_campaigns 
DROP CONSTRAINT IF EXISTS telnyx_campaigns_status_check;

ALTER TABLE telnyx_campaigns 
ADD CONSTRAINT telnyx_campaigns_status_check 
CHECK (status IN ('pending', 'sent', 'failed', 'scheduled', 'sending', 'completed'));
