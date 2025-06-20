
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const TELNYX_API_KEY = Deno.env.get('TELNYX_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!TELNYX_API_KEY) {
      throw new Error('TELNYX_API_KEY not configured');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    const { segment_name, text, from, media_urls } = await req.json();

    if (!segment_name || !text || !from) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: segment_name, text, from' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Sending bulk SMS to segment: ${segment_name}`);

    // Query contacts by segment
    const { data, error } = await supabase
      .from('contacts_segments')
      .select('contacts_membership')
      .eq('segment_name', segment_name)
      .single();

    if (error || !data) {
      console.error('Segment query error:', error);
      return new Response(
        JSON.stringify({ error: 'Segment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const contacts = Array.isArray(data.contacts_membership) ? data.contacts_membership : [];
    console.log(`Found ${contacts.length} contacts in segment`);

    // Extract and format phone numbers
    const phoneNumbers = contacts
      .map((contact: any) => {
        if (!contact?.phone) return null;
        const cleaned = contact.phone.replace(/\D/g, '');
        if (cleaned.length === 10) return `+1${cleaned}`;
        if (cleaned.length === 11 && cleaned.startsWith('1')) return `+${cleaned}`;
        return null;
      })
      .filter((phone: string | null) => phone !== null);

    console.log(`Sending to ${phoneNumbers.length} valid phone numbers`);

    const results = [];

    // Send SMS to each contact individually
    for (const to of phoneNumbers) {
      try {
        const payload: any = {
          to,
          from,
          text,
        };

        // Add media URLs if provided
        if (media_urls && Array.isArray(media_urls) && media_urls.length > 0) {
          payload.media_urls = media_urls;
        }

        console.log(`Sending SMS to ${to}`);

        const response = await fetch('https://api.telnyx.com/v2/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${TELNYX_API_KEY}`,
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (response.ok) {
          results.push({ 
            to, 
            status: 'sent', 
            message_id: result.data?.id,
            telnyx_response: result 
          });
          console.log(`SMS sent successfully to ${to}, ID: ${result.data?.id}`);
        } else {
          results.push({ 
            to, 
            status: 'error', 
            error: result.errors?.[0]?.detail || 'Unknown Telnyx error',
            telnyx_response: result 
          });
          console.error(`Failed to send SMS to ${to}:`, result);
        }
      } catch (err) {
        results.push({ 
          to, 
          status: 'error', 
          error: err.message 
        });
        console.error(`Exception sending SMS to ${to}:`, err.message);
      }
    }

    const successCount = results.filter(r => r.status === 'sent').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    console.log(`Bulk SMS complete: ${successCount} sent, ${errorCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        segment_name,
        message: `Bulk SMS sent to segment "${segment_name}": ${successCount} sent, ${errorCount} failed`,
        total_contacts: contacts.length,
        valid_phone_numbers: phoneNumbers.length,
        sent_count: successCount,
        error_count: errorCount,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Bulk SMS error:', error.message);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: 'Failed to send bulk SMS'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
