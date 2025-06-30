
-- Add is_read and direction columns to messages table if they don't exist
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS direction TEXT DEFAULT 'outbound';

-- Update existing messages to have proper direction based on sender
UPDATE public.messages 
SET direction = CASE 
  WHEN sender = 'contact' THEN 'inbound'
  WHEN sender = 'user' THEN 'outbound'
  ELSE 'outbound'
END
WHERE direction IS NULL OR direction = '';

-- Set existing inbound messages as unread by default
UPDATE public.messages 
SET is_read = false
WHERE direction = 'inbound' AND is_read IS NULL;

-- Set existing outbound messages as read by default
UPDATE public.messages 
SET is_read = true
WHERE direction = 'outbound' AND is_read IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_contact_read_direction 
ON public.messages(contact_id, is_read, direction);

CREATE INDEX IF NOT EXISTS idx_messages_unread_inbound 
ON public.messages(contact_id, direction, is_read) 
WHERE direction = 'inbound' AND is_read = false;
