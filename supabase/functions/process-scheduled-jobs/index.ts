
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
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const TELNYX_API_KEY = Deno.env.get('TELNYX_API_KEY');

    if (!TELNYX_API_KEY) {
      throw new Error('TELNYX_API_KEY not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('Processing scheduled jobs...');

    // Get pending jobs that are due
    const { data: pendingJobs, error: fetchError } = await supabase
      .from('scheduled_jobs')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true });

    if (fetchError) {
      console.error('Error fetching scheduled jobs:', fetchError);
      throw new Error(`Failed to fetch scheduled jobs: ${fetchError.message}`);
    }

    if (!pendingJobs || pendingJobs.length === 0) {
      console.log('No pending jobs to process');
      return new Response(
        JSON.stringify({
          success: true,
          processed_count: 0,
          message: 'No pending jobs to process'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Found ${pendingJobs.length} pending job(s) to process`);

    let successCount = 0;
    let failureCount = 0;

    // Process each job
    for (const job of pendingJobs) {
      try {
        console.log(`Processing job ${job.id} of type ${job.type}`);

        if (job.type === 'send_sms') {
          const { to, message, media_url, from } = job.payload;

          // Build Telnyx payload
          const telnyxPayload: any = {
            from,
            to,
            text: message,
          };

          if (media_url) {
            telnyxPayload.media_urls = [media_url];
          }

          // Send via Telnyx API
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
            throw new Error(`Telnyx API error: ${responseData.message || 'Unknown error'}`);
          }

          // Mark job as sent
          await supabase
            .from('scheduled_jobs')
            .update({ 
              status: 'sent',
              updated_at: new Date().toISOString()
            })
            .eq('id', job.id);

          console.log(`Job ${job.id} completed successfully. Message ID: ${responseData.data?.id}`);
          successCount++;

        } else {
          throw new Error(`Unknown job type: ${job.type}`);
        }

      } catch (error) {
        console.error(`Error processing job ${job.id}:`, error.message);
        
        // Mark job as failed
        await supabase
          .from('scheduled_jobs')
          .update({ 
            status: 'failed',
            error_message: error.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id);

        failureCount++;
      }
    }

    console.log(`Processed ${pendingJobs.length} jobs: ${successCount} successful, ${failureCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        processed_count: pendingJobs.length,
        success_count: successCount,
        failure_count: failureCount,
        message: `Processed ${pendingJobs.length} scheduled job(s)`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in process-scheduled-jobs:', error.message);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: 'Failed to process scheduled jobs'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
