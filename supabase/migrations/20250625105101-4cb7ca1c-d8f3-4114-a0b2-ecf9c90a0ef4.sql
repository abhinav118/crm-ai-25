
-- First, backfill existing null segment_name values
UPDATE contacts
SET segment_name = 'UNASSIGNED'
WHERE segment_name IS NULL;

-- Then make segment_name NOT NULL with default
ALTER TABLE contacts
ALTER COLUMN segment_name SET DEFAULT 'UNASSIGNED',
ALTER COLUMN segment_name SET NOT NULL;

-- Ensure UNASSIGNED segment exists in contacts_segments
INSERT INTO contacts_segments (segment_name, contacts_membership, updated_at)
SELECT 'UNASSIGNED', '[]'::jsonb, TIMEZONE('utc', NOW())
WHERE NOT EXISTS (
  SELECT 1 FROM contacts_segments WHERE segment_name = 'UNASSIGNED'
);
