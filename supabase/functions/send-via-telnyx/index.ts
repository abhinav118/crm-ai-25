import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
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
    const TELNYX_API_KEY = Deno.env.get('TELNYX_API_KEY');
    const TELNYX_FROM_NUMBER = Deno.env.get('TELNYX_FROM_NUMBER') || '+17733897839';
    if (!TELNYX_API_KEY) {
      throw new Error('TELNYX_API_KEY not configured');
    }
    const payload = await req.json();
    const { to, from, text, subject, schedule_type, schedule_time, media_url } = payload;
    // Validate required fields
    if (!to || !text) {
      throw new Error('Missing required parameters: to and text');
    }
    // Format phone number from (XXX) XXX-XXXX to +1XXXXXXXXXX
    let formattedPhone = to;
    if (typeof to === 'string') {
      // Remove all non-digit characters
      const digits = to.replace(/\D/g, '');
      // If it's a 10 digit number, add +1 prefix
      if (digits.length === 10) {
        formattedPhone = `+1${digits}`;
      }
    } else if (Array.isArray(to)) {
      // Handle array of phone numbers
      formattedPhone = to.map((number)=>{
        const digits = number.replace(/\D/g, '');
        return digits.length === 10 ? `+1${digits}` : number;
      });
    }
    // Update the to field with formatted number(s)
    // Validate scheduled delivery parameters
    if (schedule_type === 'later') {
      if (!schedule_time) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Missing schedule_time for scheduled message'
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
    }
    console.log(`Sending ${schedule_type === 'later' ? 'scheduled' : 'immediate'} ${media_url ? 'MMS' : 'SMS'} via Telnyx to ${Array.isArray(to) ? to.join(', ') : to}: ${text}`);
    if (schedule_type === 'later') {
      console.log(`Scheduled for: ${schedule_time}`);
    }
    if (media_url) {
      console.log(`Media URL: ${media_url}`);
    }
    // Build Telnyx payload
    const telnyxPayload = {
      from: from || TELNYX_FROM_NUMBER,
      to: Array.isArray(formattedPhone) ? formattedPhone : [
        formattedPhone
      ],
      text: text
    };
    // Add optional fields
    if (schedule_type === 'later' && schedule_time) {
      telnyxPayload.send_at = schedule_time;
    }
    if (subject) {
      telnyxPayload.subject = subject;
    }
    if (media_url) {
      telnyxPayload.media_urls = [
        media_url
      ];
    }
    console.log('Telnyx payload:', JSON.stringify(telnyxPayload, null, 2));
    // Send to Telnyx API
    const response = await fetch('https://api.telnyx.com/v2/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TELNYX_API_KEY}`
      },
      body: JSON.stringify(telnyxPayload)
    });
    const responseData = await response.json();
    if (!response.ok) {
      console.error('Telnyx API error:', responseData);
      throw new Error(`Telnyx API error: ${responseData.errors?.[0]?.detail || responseData.message || 'Unknown error'}`);
    }
    const messageType = media_url ? 'MMS' : 'SMS';
    const deliveryType = schedule_type === 'later' ? 'scheduled' : 'sent';
    console.log(`${messageType} ${deliveryType} successfully via Telnyx:`, responseData.data?.id);
    return new Response(JSON.stringify({
      success: true,
      data: responseData.data,
      message: `${messageType} ${deliveryType} successfully via Telnyx`,
      schedule_type: schedule_type,
      recipients: Array.isArray(to) ? to : [
        to
      ]
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error(`Error with Telnyx delivery:`, error.message);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: `Failed to process message via Telnyx`
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
