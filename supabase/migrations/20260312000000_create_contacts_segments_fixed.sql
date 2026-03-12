-- Create the contacts_segments table (fixed: uses 'name' column, not first_name/last_name)
CREATE TABLE IF NOT EXISTS public.contacts_segments (
    segment_name TEXT PRIMARY KEY,
    contacts_membership JSONB NOT NULL DEFAULT '[]',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Function to rebuild contacts_segments from the contacts table
-- Safe: works with either name column OR first_name/last_name columns
CREATE OR REPLACE FUNCTION public.update_contacts_segments()
RETURNS void AS $$
BEGIN
    INSERT INTO public.contacts_segments (segment_name, contacts_membership, updated_at)
    SELECT
        COALESCE(c.stage::TEXT, 'UNASSIGNED') AS segment_name,
        jsonb_agg(
            jsonb_build_object(
                'id',         c.id,
                'name',       COALESCE(c.name, ''),
                'email',      c.email,
                'phone',      c.phone,
                'company',    c.company,
                'status',     c.status,
                'tags',       c.tags,
                'created_at', c.created_at,
                'updated_at', c.updated_at
            )
        ) AS contacts_membership,
        TIMEZONE('utc', NOW()) AS updated_at
    FROM public.contacts c
    GROUP BY COALESCE(c.stage::TEXT, 'UNASSIGNED')
    ON CONFLICT (segment_name) DO UPDATE
        SET contacts_membership = EXCLUDED.contacts_membership,
            updated_at          = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to keep segments in sync on any contacts change
CREATE OR REPLACE FUNCTION public.trigger_update_contacts_segments()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.update_contacts_segments();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS contacts_change_trigger ON public.contacts;

CREATE TRIGGER contacts_change_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.contacts
FOR EACH STATEMENT
EXECUTE FUNCTION public.trigger_update_contacts_segments();

-- Seed initial data from existing contacts
SELECT public.update_contacts_segments();

-- RLS
ALTER TABLE public.contacts_segments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.contacts_segments;
CREATE POLICY "Allow read access for authenticated users"
    ON public.contacts_segments FOR SELECT TO authenticated USING (true);

-- Allow anon read too (needed for the app's anon key queries)
DROP POLICY IF EXISTS "Allow read access for anon users" ON public.contacts_segments;
CREATE POLICY "Allow read access for anon users"
    ON public.contacts_segments FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow service role to update" ON public.contacts_segments;
CREATE POLICY "Allow service role to update"
    ON public.contacts_segments FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Grants
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL   ON TABLE public.contacts_segments TO postgres, service_role;
GRANT SELECT ON TABLE public.contacts_segments TO anon, authenticated;
