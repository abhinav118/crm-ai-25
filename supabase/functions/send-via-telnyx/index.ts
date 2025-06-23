
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
    const TELNYX_FROM_NUMBER = Deno.env.get('TELNYX_FROM_NUMBER') || '+17733897839';

    if (!TELNYX_API_KEY) {
      throw new Error('TELNYX_API_KEY not configured');
    }

    const payload = await req.json();
    const { to, from, text, subject, schedule_type, schedule_time, media_url, contactId } = payload;

    // Validate required fields
    if (!to || !text) {
      throw new Error('Missing required parameters: to and text');
    }

    // Validate scheduled delivery parameters
    if (schedule_type === 'later') {
      if (!schedule_time) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Missing schedule_time for scheduled message' 
          }), 
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    console.log(`Sending ${schedule_type === 'later' ? 'scheduled' : 'immediate'} ${media_url ? 'MMS' : 'SMS'} via Telnyx to ${Array.isArray(to) ? to.join(', ') : to}: ${text}`);
    if (schedule_type === 'later') {
      console.log(`Scheduled for: ${schedule_time}`);
    }
    if (media_url) {
      console.log(`Media URL: ${media_url}`);
    }
    if (contactId) {
      console.log(`Contact ID: ${contactId}`);
    }

    // Build Telnyx payload
    const telnyxPayload: Record<string, any> = {
      from: from || TELNYX_FROM_NUMBER,
      to: Array.isArray(to) ? to : [to],
      text: text,
    };

    // Add optional fields
    if (schedule_type === 'later' && schedule_time) {
      telnyxPayload.send_at = schedule_time;
    }

    if (subject) {
      telnyxPayload.subject = subject;
    }

    if (media_url) {
      telnyxPayload.media_urls = [media_url];
    }

    console.log('Telnyx payload:', JSON.stringify(telnyxPayload, null, 2));

    // Send to Telnyx API
    const response = await fetch('https://api.telnyx.com/v2/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TELNYX_API_KEY}`,
      },
      body: JSON.stringify(telnyxPayload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Telnyx API error:', responseData);
      throw new Error(`Telnyx API error: ${responseData.errors?.[0]?.detail || responseData.message || 'Unknown error'}`);
    }

    const messageType = media_url ? 'MMS' : 'SMS';
    const deliveryType = schedule_type === 'later' ? 'scheduled' : 'sent';
    
    console.log(`${messageType} ${deliveryType} successfully via Telnyx:`, responseData.data?.id);

    // Database logging - only if contactId is provided
    if (contactId) {
      try {
        console.log('Setting up database logging for contactId:', contactId);
        
        // Create Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        
        if (!supabaseUrl || !supabaseServiceKey) {
          console.warn('Supabase credentials not available - skipping database logging');
        } else {
          const supabase = createClient(supabaseUrl, supabaseServiceKey);
          
          // Insert the sent message into the database
          const { data: messageData, error: messageError } = await supabase
            .from('messages')
            .insert({
              contact_id: contactId,
              content: text,
              sender: 'user',
              channel: 'sms',
              sent_at: new Date().toISOString()
            })
            .select();

          if (messageError) {
            console.error('Error inserting message to database:', messageError);
          } else {
            console.log('Message logged to database:', messageData);
          }

          // Get contact information for logging
          const { data: contactData, error: contactError } = await supabase
            .from('contacts')
            .select('id, first_name, last_name')
            .eq('id', contactId)
            .single();

          if (contactError) {
            console.error('Error fetching contact for logging:', contactError);
          } else {
            // Log the sent message activity
            const { error: logError } = await supabase
              .from('contact_logs')
              .insert({
                action: 'message_sent',
                contact_info: {
                  id: contactData.id,
                  first_name: contactData.first_name,
                  last_name: contactData.last_name,
                  message: text,
                  channel: 'sms',
                  timestamp: new Date().toISOString()
                }
              });

            if (logError) {
              console.error('Error logging contact activity:', logError);
            } else {
              console.log('Contact activity logged successfully');
            }
          }
        }
      } catch (dbError) {
        console.error('Database logging failed:', dbError);
        // Don't fail the main request if database logging fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: responseData.data,
        message: `${messageType} ${deliveryType} successfully via Telnyx`,
        schedule_type: schedule_type,
        recipients: Array.isArray(to) ? to : [to]
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error(`Error with Telnyx delivery:`, error.message);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: `Failed to process message via Telnyx`
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
