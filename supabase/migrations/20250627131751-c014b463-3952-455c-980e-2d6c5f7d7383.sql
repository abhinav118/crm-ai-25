
-- Add errors column to telnyx_campaigns table to store detailed error information
ALTER TABLE public.telnyx_campaigns 
ADD COLUMN errors JSONB DEFAULT '[]'::jsonb;

-- Add comment to document the structure
COMMENT ON COLUMN public.telnyx_campaigns.errors IS 'Array of error objects with structure: [{error_details: string, phone_number: string, contact_id: string}]';
