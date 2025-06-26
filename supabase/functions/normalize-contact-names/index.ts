
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('Starting contacts_membership name normalization...');

    // Fetch all segments with their contacts_membership
    const { data: segments, error: fetchError } = await supabase
      .from('contacts_segments')
      .select('segment_name, contacts_membership');

    if (fetchError) {
      console.error('Error fetching segments:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${segments.length} segments to process`);

    let totalProcessed = 0;
    let totalUpdated = 0;

    // Process each segment
    for (const segment of segments) {
      console.log(`Processing segment: ${segment.segment_name}`);
      
      const contactsArray = Array.isArray(segment.contacts_membership) 
        ? segment.contacts_membership 
        : [];

      if (contactsArray.length === 0) {
        console.log(`Skipping empty segment: ${segment.segment_name}`);
        continue;
      }

      // Normalize each contact's name field
      const updatedContacts = contactsArray.map((contact: any) => {
        totalProcessed++;
        
        // Skip if already has first_name and last_name, or no name field
        if (!contact.name || (contact.first_name && contact.last_name)) {
          return contact;
        }

        // Split name on first space
        const nameParts = (contact.name || '').trim().split(' ');
        const first_name = nameParts[0] || '';
        const last_name = nameParts.slice(1).join(' ') || '';

        console.log(`Normalizing: "${contact.name}" → first: "${first_name}", last: "${last_name}"`);

        // Create updated contact without the original name field
        const { name, ...contactWithoutName } = contact;
        
        return {
          ...contactWithoutName,
          first_name,
          last_name
        };
      });

      // Update the segment with normalized contacts
      const { error: updateError } = await supabase
        .from('contacts_segments')
        .update({ contacts_membership: updatedContacts })
        .eq('segment_name', segment.segment_name);

      if (updateError) {
        console.error(`Error updating segment ${segment.segment_name}:`, updateError);
        throw updateError;
      }

      totalUpdated++;
      console.log(`Successfully updated segment: ${segment.segment_name} with ${contactsArray.length} contacts`);
    }

    const result = {
      success: true,
      message: 'Contact names normalized successfully',
      segments_processed: segments.length,
      segments_updated: totalUpdated,
      contacts_processed: totalProcessed
    };

    console.log('Normalization complete:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Name normalization error:', error.message);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: 'Failed to normalize contact names'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
