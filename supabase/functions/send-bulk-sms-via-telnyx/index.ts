
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Personalization function
function personalizeMessage(template: string, contact: any) {
  return template
    .replace(/{{first_name}}/gi, contact.first_name || '')
    .replace(/{{last_name}}/gi, contact.last_name || '')
    .replace(/{{company}}/gi, contact.company || '');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TELNYX_API_KEY = Deno.env.get('TELNYX_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!TELNYX_API_KEY) {
      throw new Error('TELNYX_API_KEY not configured');
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const payload = await req.json();
    const { segment_name, text, from, media_urls, campaign_id, send_at } = payload;

    // Validate required fields
    if (!segment_name || !text || !campaign_id) {
      throw new Error('Missing required parameters: segment_name, text, and campaign_id');
    }

    console.log(`Processing bulk SMS for segment: ${segment_name}, campaign: ${campaign_id}`);
    if (send_at) {
      console.log(`Scheduled for: ${send_at}`);
    }

    // Query contacts by segment
    const { data: segmentData, error: segmentError } = await supabase
      .from('contacts_segments')
      .select('contacts_membership')
      .eq('segment_name', segment_name)
      .single();

    if (segmentError || !segmentData) {
      console.error('Segment query error:', segmentError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Segment not found',
          segment_name 
        }), 
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const contacts = segmentData.contacts_membership || [];
    console.log(`Found ${contacts.length} contacts in segment`);

    // Extract and format phone numbers with contact mapping
    const contactsWithPhones = contacts
      .map(contact => {
        if (!contact.phone) return null;
        
        // Clean phone number (remove all non-digits)
        const cleaned = contact.phone.replace(/\D/g, '');
        
        // Handle different formats
        let formattedPhone = null;
        if (cleaned.length === 10) {
          formattedPhone = `+1${cleaned}`;
        } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
          formattedPhone = `+${cleaned}`;
        }
        
        return formattedPhone ? { ...contact, formattedPhone } : null;
      })
      .filter(contact => contact !== null);

    console.log(`Extracted ${contactsWithPhones.length} valid contacts with phone numbers`);

    if (contactsWithPhones.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No valid phone numbers found in segment',
          segment_name,
          total_contacts: contacts.length
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extract phone numbers for campaign tracking
    const phoneNumbers = contactsWithPhones.map(contact => contact.formattedPhone);

    // Update campaign with initial progress and set status to sending or scheduled
    const initialStatus = send_at ? 'scheduled' : 'sending';
    const { error: initUpdateError } = await supabase
      .from('telnyx_campaigns')
      .update({
        recipients: phoneNumbers,
        segment_name: segment_name,
        status: initialStatus,
        total_count: contactsWithPhones.length,
        sent_count: 0,
        error_count: 0,
        progress_percentage: 0,
        errors: []
      })
      .eq('id', campaign_id);
    
    if (initUpdateError) {
      console.error('Error initializing campaign progress:', initUpdateError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to initialize campaign progress' 
        }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Start background SMS sending process for all campaigns
    const backgroundSendProcess = async () => {
      const fromNumber = from || '+17733897839';
      let sentCount = 0;
      let errorCount = 0;
      const errors: Array<{error_details: string, phone_number: string, contact_id: string}> = [];
      const batchSize = 10; // Process 10 messages at a time
      
      console.log(`Starting background SMS sending for ${contactsWithPhones.length} recipients`);

      for (let i = 0; i < contactsWithPhones.length; i += batchSize) {
        const batch = contactsWithPhones.slice(i, i + batchSize);
        
        // Process batch
        for (const contact of batch) {
          try {
            // Personalize the message for this specific contact
            
            if(!contact.first_name){
              contact.first_name = contact.name?contact.name.split(' ')[0]:'there';
            }
            if(!contact.last_name){
              contact.last_name = contact.name?contact.name.split(' ')[1]:'there';
            }
            const personalizedText = personalizeMessage(text, contact);
            console.log(`Sending personalized SMS to ${contact.formattedPhone} (${contact.first_name || 'N/A'})`);
            
            const telnyxPayload = {
              to: contact.formattedPhone,
              from: fromNumber,
              text: personalizedText,
              send_at: send_at ? send_at : undefined,
              ...(media_urls && media_urls.length > 0 && { media_urls })
            };

            const telnyxResponse = await fetch('https://api.telnyx.com/v2/messages', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${TELNYX_API_KEY}`
              },
              body: JSON.stringify(telnyxPayload)
            });

            const responseData = await telnyxResponse.json();
            console.log(">>telnyx response :",JSON.stringify(responseData));
            if (!telnyxResponse.ok) {
              console.error(`Telnyx error for ${contact.formattedPhone}:`, responseData);
              errorCount++;
              
              // Store detailed error information
              errors.push({
                error_details: responseData.errors?.[0]?.detail || responseData.message || 'Unknown Telnyx API error',
                phone_number: contact.formattedPhone,
                contact_id: contact.id || 'unknown'
              });
            } else {
              console.log(`SMS sent successfully to ${contact.formattedPhone}:`, responseData.data?.id);
              sentCount++;
            }

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));

          } catch (error) {
            console.error(`Error sending to ${contact.formattedPhone}:`, error.message);
            errorCount++;
            
            // Store detailed error information
            errors.push({
              error_details: error.message || 'Failed to send SMS',
              phone_number: contact.formattedPhone,
              contact_id: contact.id || 'unknown'
            });
          }
        }

        // Update progress after each batch
        const totalProcessed = sentCount + errorCount;
        const progressPercentage = Math.round((totalProcessed / contactsWithPhones.length) * 100);
        
        const { error: progressError } = await supabase
          .from('telnyx_campaigns')
          .update({
            sent_count: sentCount,
            error_count: errorCount,
            progress_percentage: progressPercentage,
            errors: errors
          })
          .eq('id', campaign_id);

        if (progressError) {
          console.error('Error updating progress:', progressError);
        }

        console.log(`Progress: ${totalProcessed}/${contactsWithPhones.length} (${progressPercentage}%)`);
      }

      // Final status update
      const finalStatus = errorCount === contactsWithPhones.length ? 'failed' : 'completed';
      const { error: finalError } = await supabase
        .from('telnyx_campaigns')
        .update({
          status: finalStatus,
          progress_percentage: 100,
          sent_count: sentCount,
          error_count: errorCount,
          errors: errors
        })
        .eq('id', campaign_id);

      if (finalError) {
        console.error('Error updating final status:', finalError);
      }

      // Insert personalized messages into messages table for all campaign recipients
      const messagesToInsert = contactsWithPhones.map(contact => ({
        contact_id: contact.id,
        content: personalizeMessage(text, contact), // Store the personalized message
        sender: 'user',
        channel: 'sms',
        sent_at: new Date().toISOString(),
      }));

      const { error: messagesError } = await supabase
        .from('messages')
        .insert(messagesToInsert);

      if (messagesError) {
        console.error('Error inserting campaign messages:', messagesError);
      }

      console.log(`Bulk SMS completed: ${sentCount} sent, ${errorCount} failed, ${errors.length} errors logged`);
    };

    // Use EdgeRuntime.waitUntil to run the background process
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(backgroundSendProcess());
    } else {
      // Fallback for environments that don't support EdgeRuntime.waitUntil
      backgroundSendProcess().catch(console.error);
    }

    // Return immediate response indicating the process has started
    return new Response(
      JSON.stringify({
        success: true,
        message: send_at ? 'Bulk SMS campaign scheduled successfully' : 'Bulk SMS sending started',
        campaign_id,
        segment_name,
        total_recipients: contactsWithPhones.length,
        status: send_at ? 'scheduled' : 'sending',
        ...(send_at && { scheduled_for: send_at })
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Bulk SMS function error:', error.message);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: 'Failed to process bulk SMS campaign'
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
