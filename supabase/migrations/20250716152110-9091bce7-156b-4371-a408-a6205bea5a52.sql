
-- Insert test profile data for the existing user
INSERT INTO public.user_profiles (
  id,
  email,
  first_name,
  last_name,
  company,
  mobile_number,
  time_zone,
  created_at,
  updated_at
) VALUES (
  '03aa1bcd-5cb3-47b3-b5af-138bc4802f2b',
  'abhik.voice@gmail.com',
  'Abhik',
  'Admin', 
  'Test Company',
  '(555) 123-4567',
  'America/New_York',
  NOW(),
  NOW()
);
