
-- Create contacts table with proper structure
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  tags TEXT[],
  notes TEXT,
  last_activity TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  segment_name TEXT
);

-- Create messages table for communication history
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'contact')),
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  channel TEXT DEFAULT 'sms' CHECK (channel IN ('sms', 'email', 'chat')),
  direction TEXT DEFAULT 'outbound' CHECK (direction IN ('inbound', 'outbound')),
  is_read BOOLEAN DEFAULT false,
  media_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campaigns table for marketing campaigns
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'sms' CHECK (type IN ('sms', 'email')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'scheduled', 'cancelled')),
  message_content TEXT,
  recipients JSONB,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contact_logs table for activity tracking
CREATE TABLE public.contact_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  contact_info JSONB,
  batch_id UUID,
  batch_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sms_analytics table for tracking SMS metrics
CREATE TABLE public.sms_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  clicks INTEGER DEFAULT 0,
  last_clicked TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create telnyx_campaigns table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.telnyx_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'scheduled', 'cancelled')),
  message_content TEXT,
  recipients JSONB,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telnyx_campaigns ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for all tables (can be restricted later)
CREATE POLICY "Allow all operations on contacts" ON public.contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on messages" ON public.messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on campaigns" ON public.campaigns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on contact_logs" ON public.contact_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on sms_analytics" ON public.sms_analytics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on telnyx_campaigns" ON public.telnyx_campaigns FOR ALL USING (true) WITH CHECK (true);

-- Insert sample contacts data
INSERT INTO public.contacts (first_name, last_name, email, phone, company, status, tags, notes) VALUES
('John', 'Doe', 'john.doe@example.com', '+1234567890', 'Acme Corp', 'active', ARRAY['customer', 'premium'], 'VIP customer'),
('Jane', 'Smith', 'jane.smith@example.com', '+1234567891', 'Tech Solutions', 'active', ARRAY['lead'], 'Interested in premium package'),
('Bob', 'Johnson', 'bob.johnson@example.com', '+1234567892', 'StartupXYZ', 'inactive', ARRAY['prospect'], 'Follow up needed'),
('Alice', 'Brown', 'alice.brown@example.com', '+1234567893', 'Global Inc', 'active', ARRAY['customer'], 'Regular customer'),
('Charlie', 'Wilson', 'charlie.wilson@example.com', '+1234567894', 'Innovation Labs', 'active', ARRAY['lead', 'tech'], 'Technical decision maker');

-- Insert sample messages
INSERT INTO public.messages (contact_id, content, sender, channel, direction) VALUES
((SELECT id FROM public.contacts WHERE email = 'john.doe@example.com'), 'Hello, how can I help you today?', 'user', 'sms', 'outbound'),
((SELECT id FROM public.contacts WHERE email = 'john.doe@example.com'), 'Thanks for reaching out! I have a question about your services.', 'contact', 'sms', 'inbound'),
((SELECT id FROM public.contacts WHERE email = 'jane.smith@example.com'), 'Welcome to our platform!', 'user', 'sms', 'outbound'),
((SELECT id FROM public.contacts WHERE email = 'jane.smith@example.com'), 'Thank you! Looking forward to getting started.', 'contact', 'sms', 'inbound');

-- Create indexes for better performance
CREATE INDEX idx_contacts_email ON public.contacts(email);
CREATE INDEX idx_contacts_phone ON public.contacts(phone);
CREATE INDEX idx_contacts_status ON public.contacts(status);
CREATE INDEX idx_messages_contact_id ON public.messages(contact_id);
CREATE INDEX idx_messages_sent_at ON public.messages(sent_at);
CREATE INDEX idx_contact_logs_created_at ON public.contact_logs(created_at);
