-- Update the trigger function to include all contact fields in contacts_membership
CREATE OR REPLACE FUNCTION update_contacts_membership_trigger()
RETURNS TRIGGER AS $$
DECLARE
    old_segment_name text;
    new_segment_name text;
BEGIN
    -- Handle DELETE operation
    IF TG_OP = 'DELETE' THEN
        old_segment_name := OLD.segment_name;
        
        -- Update the old segment's membership
        UPDATE contacts_segments
        SET 
            contacts_membership = (
                SELECT COALESCE(jsonb_agg(jsonb_build_object(
                    'id', c.id,
                    'name', CASE 
                        WHEN c.last_name IS NOT NULL THEN c.first_name || ' ' || c.last_name 
                        ELSE c.first_name 
                    END,
                    'first_name', c.first_name,
                    'last_name', c.last_name,
                    'email', c.email,
                    'phone', c.phone,
                    'company', c.company,
                    'status', c.status,
                    'tags', c.tags,
                    'created_at', c.created_at,
                    'updated_at', c.updated_at
                )), '[]'::jsonb)
                FROM contacts c
                WHERE c.segment_name = old_segment_name
            ),
            updated_at = TIMEZONE('utc', NOW())
        WHERE segment_name = old_segment_name;
        
        RETURN OLD;
    END IF;
    
    -- Handle INSERT and UPDATE operations
    new_segment_name := NEW.segment_name;
    
    -- For UPDATE, also handle the old segment if segment changed
    IF TG_OP = 'UPDATE' AND OLD.segment_name != NEW.segment_name THEN
        old_segment_name := OLD.segment_name;
        
        -- Update the old segment's membership (remove the contact)
        UPDATE contacts_segments
        SET 
            contacts_membership = (
                SELECT COALESCE(jsonb_agg(jsonb_build_object(
                    'id', c.id,
                    'name', CASE 
                        WHEN c.last_name IS NOT NULL THEN c.first_name || ' ' || c.last_name 
                        ELSE c.first_name 
                    END,
                    'first_name', c.first_name,
                    'last_name', c.last_name,
                    'email', c.email,
                    'phone', c.phone,
                    'company', c.company,
                    'status', c.status,
                    'tags', c.tags,
                    'created_at', c.created_at,
                    'updated_at', c.updated_at
                )), '[]'::jsonb)
                FROM contacts c
                WHERE c.segment_name = old_segment_name
            ),
            updated_at = TIMEZONE('utc', NOW())
        WHERE segment_name = old_segment_name;
    END IF;
    
    -- Update the new segment's membership
    UPDATE contacts_segments
    SET 
        contacts_membership = (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'id', c.id,
                'name', CASE 
                    WHEN c.last_name IS NOT NULL THEN c.first_name || ' ' || c.last_name 
                    ELSE c.first_name 
                END,
                'first_name', c.first_name,
                'last_name', c.last_name,
                'email', c.email,
                'phone', c.phone,
                'company', c.company,
                'status', c.status,
                'tags', c.tags,
                'created_at', c.created_at,
                'updated_at', c.updated_at
            )), '[]'::jsonb)
            FROM contacts c
            WHERE c.segment_name = new_segment_name
        ),
        updated_at = TIMEZONE('utc', NOW())
    WHERE segment_name = new_segment_name;
    
    -- Insert segment if it doesn't exist
    INSERT INTO contacts_segments (segment_name, contacts_membership, updated_at)
    SELECT 
        new_segment_name,
        (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'id', c.id,
                'name', CASE 
                    WHEN c.last_name IS NOT NULL THEN c.first_name || ' ' || c.last_name 
                    ELSE c.first_name 
                END,
                'first_name', c.first_name,
                'last_name', c.last_name,
                'email', c.email,
                'phone', c.phone,
                'company', c.company,
                'status', c.status,
                'tags', c.tags,
                'created_at', c.created_at,
                'updated_at', c.updated_at
            )), '[]'::jsonb)
            FROM contacts c
            WHERE c.segment_name = new_segment_name
        ),
        TIMEZONE('utc', NOW())
    WHERE NOT EXISTS (
        SELECT 1 FROM contacts_segments WHERE segment_name = new_segment_name
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Also update the main update_contacts_segments function to use the same structure
CREATE OR REPLACE FUNCTION public.update_contacts_segments()
RETURNS void
LANGUAGE plpgsql
AS $$
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
                'first_name', first_name,
                'last_name', last_name,
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
$$;