
// Follow this setup guide to integrate the Supabase Edge Functions:
// https://supabase.com/docs/guides/functions/connect-to-supabase

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1";

// Define CORS headers
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
    // Parse the request body
    const payload = await req.json();
    const body = payload.body || payload;
    console.log("Received webhook payload:", JSON.stringify(body));

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Required environment variables are not set');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate required webhook data
    if (!body.event_type || !body.link) {
      console.log("Missing required webhook data");
      return new Response(
        JSON.stringify({ error: "Missing required webhook data" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Check if this is a click event for our link
    if (body.event_type !== "clicked") {
      console.log("Ignoring non-click event");
      return new Response(
        JSON.stringify({ message: "Ignored non-click event" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const clickTime = body.click_time;
    console.log(`Processing click at ${clickTime} for link ${body.link}`);

    // Check if the link exists in the database
    const { data: existingLink, error: selectError } = await supabase
      .from("sms_analytics")
      .select("*")
      .eq("link", body.link)
      .maybeSingle();

    if (selectError) {
      console.error("Error querying sms_analytics:", selectError);
      throw selectError;
    }

    if (existingLink) {
      // Link exists, update the record
      const updatedClicks = (existingLink.clicks || 0) + 1;
      const ctr = calculateCTR(updatedClicks, existingLink.conversions || 0);
      
      console.log(`Updating existing link record. Clicks: ${updatedClicks}, CTR: ${ctr}`);
      
      const { error: updateError } = await supabase
        .from("sms_analytics")
        .update({
          clicks: updatedClicks,
          last_clicked: clickTime,
          ctr: ctr
        })
        .eq("link", body.link);

      if (updateError) {
        console.error("Error updating sms_analytics:", updateError);
        throw updateError;
      }
    } else {
      // Link doesn't exist, create a new record
      console.log("Creating new link record");
      
      const { error: insertError } = await supabase
        .from("sms_analytics")
        .insert({
          link: body.link,
          clicks: 1,
          last_clicked: clickTime,
          conversions: 0,
          ctr: 0
        });

      if (insertError) {
        console.error("Error inserting into sms_analytics:", insertError);
        throw insertError;
      }
    }

    // Return success response
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error processing webhook:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

// Calculate CTR (Click-Through Rate)
function calculateCTR(clicks: number, conversions: number): number {
  if (!clicks) return 0;
  return (conversions / clicks) * 100;
}
