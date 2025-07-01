
-- Add media_url column to messages table to store image attachments
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS media_url TEXT;

-- Create index for better performance when querying messages with media
CREATE INDEX IF NOT EXISTS idx_messages_media_url 
ON public.messages(media_url) 
WHERE media_url IS NOT NULL;
