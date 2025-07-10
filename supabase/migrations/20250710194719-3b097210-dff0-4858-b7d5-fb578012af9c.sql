
-- Create user_logins table for custom authentication
CREATE TABLE public.user_logins (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  login_email text NOT NULL UNIQUE,
  login_password text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_logins ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public access for authentication
CREATE POLICY "Allow public access for authentication" 
  ON public.user_logins 
  FOR SELECT 
  USING (true);

-- Insert the hardcoded user with hashed password
-- Note: In production, you should hash the password properly
INSERT INTO public.user_logins (login_email, login_password, first_name, last_name, is_active)
VALUES ('abhik.voice@gmail.com', '11111111', 'Abhik', 'Admin', true);

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_user_logins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER update_user_logins_updated_at_trigger
    BEFORE UPDATE ON public.user_logins
    FOR EACH ROW
    EXECUTE FUNCTION update_user_logins_updated_at();
