
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
    const TELNYX_FROM_NUMBER = Deno.env.get('TELNYX_FROM_NUMBER') || '+1773-389-7839';

    if (!TELNYX_API_KEY) {
      throw new Error('TELNYX_API_KEY not configured');
    }

    const { to, message } = await req.json();

    if (!to || !message) {
      throw new Error('Missing required parameters: to and message');
    }

    console.log(`Sending SMS via Telnyx to ${to}: ${message}`);

    // Send SMS via Telnyx API
    const response = await fetch('https://api.telnyx.com/v2/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TELNYX_API_KEY}`,
      },
      body: JSON.stringify({
        from: TELNYX_FROM_NUMBER,
        to: to,
        text: message,
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Telnyx API error:', responseData);
      throw new Error(`Telnyx API error: ${responseData.message || 'Unknown error'}`);
    }

    console.log('SMS sent successfully via Telnyx:', responseData.data?.id);

    return new Response(
      JSON.stringify({
        success: true,
        data: responseData.data,
        message: 'SMS sent successfully via Telnyx'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error sending SMS via Telnyx:', error.message);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: 'Failed to send SMS via Telnyx'
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
