
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const SUPABASE_URL = "https://nzsflibcvrisxjlzuxjn.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY env variable");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Find scheduled campaigns due to be sent
    const { data: dueCampaigns, error: fetchError } = await supabase
      .from("telnyx_campaigns")
      .select("id")
      .eq("schedule_type", "later")
      .eq("status", "scheduled")
      .lte("schedule_time", new Date().toISOString());

    if (fetchError) {
      console.error("Error fetching due campaigns:", fetchError);
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!dueCampaigns || dueCampaigns.length === 0) {
      return new Response(
        JSON.stringify({ message: "No scheduled campaigns to update." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const idsToUpdate = dueCampaigns.map((row) => row.id);

    // Update their status to 'sent'
    const { error: updateError } = await supabase
      .from("telnyx_campaigns")
      .update({ status: "sent", updated_at: new Date().toISOString() })
      .in("id", idsToUpdate);

    if (updateError) {
      console.error("Error updating campaigns:", updateError);
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Updated ${idsToUpdate.length} scheduled campaigns to sent status`);
    return new Response(
      JSON.stringify({ updated: idsToUpdate.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Exception:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
