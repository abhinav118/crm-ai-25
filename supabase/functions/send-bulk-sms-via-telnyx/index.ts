
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { segment_name, text, from, media_urls } = await req.json();
    
    console.log('Bulk SMS request received:', { segment_name, from, text_length: text?.length });
    
    const API_KEY = Deno.env.get("TELNYX_API_KEY");
    if (!API_KEY) {
      console.error('TELNYX_API_KEY not found');
      return new Response(
        JSON.stringify({ error: "Telnyx API key not configured" }), 
        { status: 500, headers: corsHeaders }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Query contacts by segment
    const { data, error } = await supabase
      .from("contacts_segments")
      .select("contacts_membership")
      .eq("segment_name", segment_name)
      .single();

    if (error || !data) {
      console.error('Segment not found:', error);
      return new Response(
        JSON.stringify({ error: "Segment not found" }), 
        { status: 404, headers: corsHeaders }
      );
    }

    const contacts = data.contacts_membership;
    console.log(`Found ${contacts.length} contacts in segment ${segment_name}`);
    
    // Extract and format phone numbers
    const phoneNumbers = contacts
      .map(c => c.phone?.replace(/\D/g, ''))
      .filter(p => p?.length === 10)
      .map(p => `+1${p}`);

    console.log(`Extracted ${phoneNumbers.length} valid phone numbers`);

    const results = [];

    // Send SMS to each contact individually
    for (const to of phoneNumbers) {
      try {
        const payload = {
          to,
          from,
          text,
          ...(media_urls && media_urls.length > 0 && { media_urls })
        };

        console.log(`Sending SMS to ${to}`);

        const res = await fetch("https://api.telnyx.com/v2/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${API_KEY}`
          },
          body: JSON.stringify(payload)
        });

        const result = await res.json();
        
        if (res.ok) {
          console.log(`SMS sent successfully to ${to}`);
          results.push({ to, status: "sent", telnyx_response: result });
        } else {
          console.error(`Failed to send SMS to ${to}:`, result);
          results.push({ to, status: "error", error: result });
        }
      } catch (err) {
        console.error(`Exception sending SMS to ${to}:`, err);
        results.push({ to, status: "error", error: err.message });
      }
    }

    const successCount = results.filter(r => r.status === "sent").length;
    const errorCount = results.filter(r => r.status === "error").length;

    console.log(`Bulk SMS completed: ${successCount} sent, ${errorCount} failed`);

    return new Response(JSON.stringify({
      segment_name,
      message: `Sent to ${successCount} contacts (${errorCount} failed)`,
      total_contacts: contacts.length,
      valid_phone_numbers: phoneNumbers.length,
      success_count: successCount,
      error_count: errorCount,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Bulk SMS function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
})
