-- Create the contacts_segments table
CREATE TABLE IF NOT EXISTS contacts_segments (
    segment_name TEXT PRIMARY KEY,
    contacts_membership JSONB NOT NULL DEFAULT '[]',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create function to update contacts_segments
CREATE OR REPLACE FUNCTION update_contacts_segments()
RETURNS void AS $$
DECLARE
    segment text;
    contacts_json jsonb;
BEGIN
    -- Create temp table for new segment data
    CREATE TEMP TABLE new_segments AS
    SELECT 
        COALESCE(segment_name, 'unassigned') as segment_name,
        jsonb_agg(
            jsonb_build_object(
                'id', id,
                'name', CASE 
                    WHEN last_name IS NOT NULL THEN first_name || ' ' || last_name 
                    ELSE first_name 
                END,
                'email', email,
                'phone', phone,
                'company', company,
                'status', status,
                'tags', tags,
                'created_at', created_at,
                'updated_at', updated_at
            )
        ) as contacts_membership
    FROM contacts
    GROUP BY segment_name;

    -- Update existing segments or insert new ones
    INSERT INTO contacts_segments (segment_name, contacts_membership, updated_at)
    SELECT 
        segment_name,
        contacts_membership,
        TIMEZONE('utc', NOW())
    FROM new_segments
    ON CONFLICT (segment_name) DO UPDATE
    SET 
        contacts_membership = EXCLUDED.contacts_membership,
        updated_at = TIMEZONE('utc', NOW());

    -- Clean up temp table
    DROP TABLE new_segments;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update contacts_segments when contacts change
CREATE OR REPLACE FUNCTION trigger_update_contacts_segments()
RETURNS TRIGGER AS $$
BEGIN
    -- Schedule the update to run asynchronously
    PERFORM pg_notify('update_contacts_segments', '');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS contacts_change_trigger ON contacts;

-- Create trigger for any changes to contacts table
CREATE TRIGGER contacts_change_trigger
AFTER INSERT OR UPDATE OR DELETE ON contacts
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_update_contacts_segments();

-- Set up initial data
SELECT update_contacts_segments();

-- Add RLS policies
ALTER TABLE contacts_segments ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Allow read access for authenticated users"
ON contacts_segments
FOR SELECT
TO authenticated
USING (true);

-- Allow service role to update
CREATE POLICY "Allow service role to update"
ON contacts_segments
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create cron job to update segments every 5 seconds
SELECT cron.schedule(
    'update_contacts_segments_job',   -- job name
    '*/5 * * * * *',                 -- every 5 seconds
    'SELECT update_contacts_segments();'
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE contacts_segments TO postgres, service_role;
GRANT SELECT ON TABLE contacts_segments TO anon, authenticated; 