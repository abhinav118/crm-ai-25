import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendTelnyxPayload {
  to: string | string[];
  message: string;
  media_url?: string;
  schedule_type?: 'now' | 'later' | 'recurring';
  schedule_time?: string; // ISO format
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TELNYX_API_KEY = Deno.env.get('TELNYX_API_KEY');
    const TELNYX_FROM_NUMBER = Deno.env.get('TELNYX_FROM_NUMBER') || '+17733897839';
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!TELNYX_API_KEY) {
      throw new Error('TELNYX_API_KEY not configured');
    }

    const payload: SendTelnyxPayload = await req.json();
    const { to, message, media_url, schedule_type , schedule_time } = payload;

    if (!to || !message) {
      throw new Error('Missing required parameters: to and message');
    }

    // // Handle scheduled campaigns
    // if (schedule_type === 'later') {
    //   if (!schedule_time) {
    //     throw new Error('Missing schedule_time for scheduled campaign');
    //   }

    //   const scheduledAt = new Date(schedule_time);
    //   const now = new Date();

    //   if (scheduledAt <= now) {
    //     throw new Error('Schedule time must be in the future');
    //   }

    //   // Create Supabase client for database operations
    //   const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    //   // Convert to array if single recipient
    //   const recipients = Array.isArray(to) ? to : [to];

    //   // Create scheduled jobs for each recipient
    //   const scheduledJobs = recipients.map(recipient => ({
    //     type: 'send_sms',
    //     payload: {
    //       to: recipient,
    //       message,
    //       media_url,
    //       from: TELNYX_FROM_NUMBER
    //     },
    //     scheduled_at: scheduledAt.toISOString()
    //   }));

    //   const { error: insertError } = await supabase
    //     .from('scheduled_jobs')
    //     .insert(scheduledJobs);

    //   if (insertError) {
    //     console.error('Error scheduling jobs:', insertError);
    //     throw new Error(`Failed to schedule messages: ${insertError.message}`);
    //   }

    //   console.log(`Scheduled ${recipients.length} messages for ${scheduledAt.toISOString()}`);

    //   return new Response(
    //     JSON.stringify({
    //       success: true,
    //       status: 'scheduled',
    //       scheduled_count: recipients.length,
    //       scheduled_for: scheduledAt.toISOString(),
    //       message: `${recipients.length} ${media_url ? 'MMS' : 'SMS'} message(s) scheduled for delivery`
    //     }),
    //     {
    //       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    //     }
    //   );
    // }

    // Handle immediate sending (existing logic)
    const recipients = Array.isArray(to) ? to : [to];
    console.log(`Sending ${media_url ? 'MMS' : 'SMS'} via Telnyx to ${recipients.length} recipient(s)`);

    const results = [];

    for (const recipient of recipients) {
      try {
        // Build payload based on whether media is attached
        const telnyxPayload: any = {
          from: TELNYX_FROM_NUMBER,
          to: recipient,
          text: message,
        };

        // Add media_urls for MMS if media_url is provided
        if (media_url) {
          telnyxPayload.media_urls = [media_url];
        }

        // Add scheduled time if provided
        if (schedule_type === 'later' && schedule_time) {
          telnyxPayload.send_at = new Date(schedule_time);
        }
        console.log("telnyxPayload",telnyxPayload);
        // Send SMS/MMS via Telnyx API
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
          console.error(`Telnyx API error for ${recipient}:`, responseData);
          results.push({
            recipient,
            success: false,
            error: responseData.message || 'Unknown error'
          });
        } else {
          console.log(`${media_url ? 'MMS' : 'SMS'} sent successfully to ${recipient}:`, responseData.data?.id);
          results.push({
            recipient,
            success: true,
            message_id: responseData.data?.id
          });
        }
      } catch (error) {
        console.error(`Error sending to ${recipient}:`, error.message);
        results.push({
          recipient,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        success: failCount === 0,
        sent_count: successCount,
        failed_count: failCount,
        results,
        message: `${successCount} ${media_url ? 'MMS' : 'SMS'} message(s) sent successfully${failCount > 0 ? `, ${failCount} failed` : ''}`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error(`Error in send-via-telnyx:`, error.message);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: 'Failed to process SMS/MMS request'
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
