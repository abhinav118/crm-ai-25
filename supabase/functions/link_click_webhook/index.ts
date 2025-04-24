// Follow this setup guide to integrate the Supabase Edge Functions:
// https://supabase.com/docs/guides/functions/connect-to-supabase
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1";
// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    // Parse the request body
    const payload = await req.json();
    const body = payload.body || payload;
    console.log("Received webhook payload:", JSON.stringify(body));
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    // Get the link from the webhook payload
    const link = body.link;
    const clickTime = body.click_time;
    const clicked_by = body.to;
      console.log(`Processing click at ${clickTime} for link ${link} by ${clicked_by}`);
    // Check if the link exists in the database
    const { data, error } = await supabase.from("sms_analytics").select("*").eq("link", link).maybeSingle();
    if (error) {
      console.error("Error querying sms_analytics:", error);
      throw error;
    }
    if (data) {
      // Link exists, update the record
      const updatedClicks = (data.clicks || 0) + 1;
      const ctr = calculateCTR(updatedClicks, data.conversions || 0);
      const existingClickedBy = data.clicked_by || [];
      const updatedClickedBy = existingClickedBy.includes(clicked_by) 
        ? existingClickedBy 
        : [...existingClickedBy, clicked_by];
      
      console.log(`Updating existing link record. Clicks: ${updatedClicks}, CTR: ${ctr}`);
      
      const { error: updateError } = await supabase.from("sms_analytics").update({
        clicks: updatedClicks,
        last_clicked: clickTime,
        ctr: ctr,
        clicked_by: updatedClickedBy
      }).eq("link", link);
      if (updateError) {
        console.error("Error updating sms_analytics:", updateError);
        throw updateError;
      }
    } else {
      // Link doesn't exist, create a new record
      console.log("Creating new link record");
      const { error: insertError } = await supabase.from("sms_analytics").insert({
        link,
        clicks: 1,
        last_clicked: clickTime,
        conversions: 0,
        ctr: 0,
        clicked_by:[clicked_by]
      });
      //update contact_logs 
      const { error: updateError } = await supabase.from("contact_logs").update({
        action: "link_clicked",
        contact_info: contactInfo,
        created_at: new Date().toISOString(),
        batch_id: batchId,
        batch_name: batchName
      });

      if (insertError) {
        console.error("Error inserting into sms_analytics:", insertError);
        throw insertError;
      }
    }
    // Return success response
    return new Response(JSON.stringify({
      success: true
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 200
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 500
    });
  }
});
// Calculate CTR (Click-Through Rate)
function calculateCTR(clicks, conversions) {
  if (!clicks) return 0;
  return conversions / clicks * 100;
}
