
-- Add first_name and last_name columns to contacts table
ALTER TABLE public.contacts 
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;

-- Migrate existing data from name column to first_name and last_name
-- This splits names on the first space, treating everything before as first_name
-- and everything after as last_name
UPDATE public.contacts 
SET 
  first_name = CASE 
    WHEN position(' ' in name) > 0 THEN 
      substring(name from 1 for position(' ' in name) - 1)
    ELSE 
      name
  END,
  last_name = CASE 
    WHEN position(' ' in name) > 0 THEN 
      substring(name from position(' ' in name) + 1)
    ELSE 
      ''
  END
WHERE name IS NOT NULL;

-- Make first_name required (not null) since every contact should have at least a first name
ALTER TABLE public.contacts 
ALTER COLUMN first_name SET NOT NULL;

-- Add indexes for better search performance
CREATE INDEX idx_contacts_first_name ON public.contacts(first_name);
CREATE INDEX idx_contacts_last_name ON public.contacts(last_name);
CREATE INDEX idx_contacts_full_name ON public.contacts(first_name, last_name);

-- Drop the old name column after successful migration
ALTER TABLE public.contacts 
DROP COLUMN name;
