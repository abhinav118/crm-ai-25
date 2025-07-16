
-- Add textable_number field to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN textable_number TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.user_profiles.textable_number IS 'The currently selected textable phone number for this user';
