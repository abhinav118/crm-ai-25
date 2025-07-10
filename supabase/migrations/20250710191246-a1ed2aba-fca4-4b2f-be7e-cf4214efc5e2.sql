-- Seed the database with the hardcoded user
-- Note: We'll create the user through Supabase's auth system by using the auth.users table

-- First, let's check if we can insert directly into auth.users
-- Since auth.users is managed by Supabase, we'll use a different approach

-- Create a temporary function to handle user creation
CREATE OR REPLACE FUNCTION seed_hardcoded_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id UUID;
BEGIN
    -- Check if user already exists
    SELECT id INTO user_id 
    FROM auth.users 
    WHERE email = 'abhik.voice@gmail.com';
    
    -- If user doesn't exist, we'll create a profile entry that can be linked later
    IF user_id IS NULL THEN
        -- Create a placeholder profile that will be updated when the user signs up
        INSERT INTO public.user_profiles (
            user_id, 
            email, 
            first_name, 
            last_name, 
            role
        ) VALUES (
            '00000000-0000-0000-0000-000000000001'::UUID,
            'abhik.voice@gmail.com',
            'Abhik',
            'Admin',
            'admin'
        ) ON CONFLICT (email) DO UPDATE SET
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            role = EXCLUDED.role,
            updated_at = NOW();
            
        RAISE NOTICE 'Profile created for abhik.voice@gmail.com. User must sign up through the application.';
    ELSE
        RAISE NOTICE 'User already exists with ID: %', user_id;
    END IF;
END;
$$;

-- Execute the seeding function
SELECT seed_hardcoded_user();

-- Clean up the temporary function
DROP FUNCTION seed_hardcoded_user();