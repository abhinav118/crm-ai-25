
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TelnyxMessagingProfile {
  id: string;
  name: string;
}

interface TelnyxPhoneNumber {
  phone_number: string;
  id: string;
}

interface CombinedNumberData {
  id: string;
  phone_number: string;
  messaging_profile_name: string;
  messaging_profile_id: string;
  type: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const telnyxApiKey = Deno.env.get('TELNYX_API_KEY');
    
    if (!telnyxApiKey) {
      console.error('TELNYX_API_KEY not found');
      return new Response(
        JSON.stringify({ error: 'Telnyx API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching messaging profiles...');

    // First API call: Get all messaging profiles
    const profilesResponse = await fetch('https://api.telnyx.com/v2/messaging_profiles', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${telnyxApiKey}`
      }
    });

    if (!profilesResponse.ok) {
      console.error('Failed to fetch messaging profiles:', profilesResponse.status);
      throw new Error(`Failed to fetch messaging profiles: ${profilesResponse.statusText}`);
    }

    const profilesData = await profilesResponse.json();
    console.log('Messaging profiles fetched:', profilesData.data?.length || 0);

    const combinedData: CombinedNumberData[] = [];

    // Second API call: For each messaging profile, get its phone numbers
    if (profilesData.data && Array.isArray(profilesData.data)) {
      for (const profile of profilesData.data as TelnyxMessagingProfile[]) {
        console.log(`Fetching phone numbers for profile: ${profile.name} (${profile.id})`);
        
        try {
          const numbersResponse = await fetch(`https://api.telnyx.com/v2/messaging_profiles/${profile.id}/phone_numbers`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${telnyxApiKey}`
            }
          });

          if (numbersResponse.ok) {
            const numbersData = await numbersResponse.json();
            
            if (numbersData.data && Array.isArray(numbersData.data)) {
              for (const phoneNumber of numbersData.data as TelnyxPhoneNumber[]) {
                combinedData.push({
                  id: phoneNumber.id,
                  phone_number: phoneNumber.phone_number,
                  messaging_profile_name: profile.name,
                  messaging_profile_id: profile.id,
                  type: 'Textable Number'
                });
              }
            }
          } else {
            console.error(`Failed to fetch phone numbers for profile ${profile.id}:`, numbersResponse.status);
          }
        } catch (error) {
          console.error(`Error fetching phone numbers for profile ${profile.id}:`, error);
        }
      }
    }

    console.log('Total numbers found:', combinedData.length);

    return new Response(
      JSON.stringify({ 
        data: combinedData,
        total: combinedData.length 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in fetch-telnyx-messaging-profiles:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch messaging profiles and phone numbers',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
