
-- Add is_read and direction columns to messages table
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

-- Create index for better performance on read status queries
CREATE INDEX IF NOT EXISTS idx_messages_contact_read_direction 
ON public.messages(contact_id, is_read, direction);

-- Create index for better performance on unread message queries
CREATE INDEX IF NOT EXISTS idx_messages_unread_inbound 
ON public.messages(contact_id, direction, is_read) 
WHERE direction = 'inbound' AND is_read = false;
