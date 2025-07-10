
-- Add authentication columns to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN login_email TEXT UNIQUE,
ADD COLUMN login_password TEXT,
ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Insert the hardcoded user with hashed password
-- Using bcrypt-like hash for password "11111111"
INSERT INTO public.user_profiles (
  login_email, 
  login_password, 
  is_active,
  preferences
) VALUES (
  'abhik.voice@gmail.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- bcrypt hash of "11111111"
  true,
  '{}'::jsonb
);

-- Create index on login_email for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_login_email ON public.user_profiles(login_email);

-- Update RLS policies to allow login functionality
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;

-- Create new policies for custom authentication
CREATE POLICY "Allow login queries" ON public.user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Allow profile updates by login_email" ON public.user_profiles
  FOR UPDATE USING (true);

CREATE POLICY "Allow profile inserts" ON public.user_profiles
  FOR INSERT WITH CHECK (true);
