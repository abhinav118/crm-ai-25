
-- Add unique constraint on phone numbers to prevent duplicates at database level
-- First, remove any existing duplicates by keeping only the most recent entry for each phone
WITH duplicates AS (
  SELECT id, phone,
         ROW_NUMBER() OVER (PARTITION BY phone ORDER BY created_at DESC) as rn
  FROM contacts 
  WHERE phone IS NOT NULL AND phone != ''
)
DELETE FROM contacts 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Now add the unique constraint on phone numbers
ALTER TABLE contacts ADD CONSTRAINT contacts_phone_unique UNIQUE (phone);

-- Create an index on phone for better performance
CREATE INDEX IF NOT EXISTS idx_contacts_phone_normalized ON contacts(phone) WHERE phone IS NOT NULL;
