
-- Create conversations table to manage assignment/snooze/close state
CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at timestamp with time zone,
  last_message_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(contact_id)
);

-- Enable RLS on conversations table
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Create policies for conversations (assuming public access for now, adjust as needed)
CREATE POLICY "Allow all operations on conversations" ON public.conversations
FOR ALL USING (true) WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_conversations_status ON public.conversations(status);
CREATE INDEX idx_conversations_assigned_to ON public.conversations(assigned_to);
CREATE INDEX idx_conversations_last_message_at ON public.conversations(last_message_at);

-- Create trigger to automatically create conversation when first message is sent
CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert or update conversation for this contact
  INSERT INTO public.conversations (contact_id, last_message_at)
  VALUES (NEW.contact_id, NEW.sent_at)
  ON CONFLICT (contact_id) 
  DO UPDATE SET 
    last_message_at = NEW.sent_at,
    updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Create trigger on messages table
CREATE TRIGGER on_message_created
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_message();

-- Add realtime support for conversations and messages
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
