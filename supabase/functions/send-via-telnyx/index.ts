
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

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
    const TELNYX_FROM_NUMBER = Deno.env.get('TELNYX_FROM_NUMBER') || '+17733897839';

    if (!TELNYX_API_KEY) {
      throw new Error('TELNYX_API_KEY not configured');
    }

    const { to, message, media_url } = await req.json();

    if (!to || !message) {
      throw new Error('Missing required parameters: to and message');
    }

    console.log(`Sending ${media_url ? 'MMS' : 'SMS'} via Telnyx to ${to}: ${message}`);
    if (media_url) {
      console.log(`Media URL: ${media_url}`);
    }

    // Build payload based on whether media is attached
    const payload: any = {
      from: TELNYX_FROM_NUMBER,
      to: to,
      text: message,
    };

    // Add media_urls for MMS if media_url is provided
    if (media_url) {
      payload.media_urls = [media_url];
    }

    // Send SMS/MMS via Telnyx API
    const response = await fetch('https://api.telnyx.com/v2/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TELNYX_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Telnyx API error:', responseData);
      throw new Error(`Telnyx API error: ${responseData.message || 'Unknown error'}`);
    }

    console.log(`${media_url ? 'MMS' : 'SMS'} sent successfully via Telnyx:`, responseData.data?.id);

    return new Response(
      JSON.stringify({
        success: true,
        data: responseData.data,
        message: `${media_url ? 'MMS' : 'SMS'} sent successfully via Telnyx`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error(`Error sending ${error.message.includes('media') ? 'MMS' : 'SMS'} via Telnyx:`, error.message);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: `Failed to send ${error.message.includes('media') ? 'MMS' : 'SMS'} via Telnyx`
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
