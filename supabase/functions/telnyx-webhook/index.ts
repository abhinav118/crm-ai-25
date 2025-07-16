
/// <reference types="https://deno.land/x/deno/cli/tsc/dts/lib.deno.d.ts" />
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};

// Opt-out keywords for detection
const OPT_OUT_KEYWORDS = [
  "stop", "stopall", "unsubscribe", "cancel", "end", "quit",
  "please stop", "stop sending", "remove", "remove me", "take me off",
  "opt out", "no more", "i want to stop", "don't text me", "do not text",
  "block", "cancel subscription", "stop texts", "i want to unsubscribe",
  "enough", "quit sending"
];

const FUZZY_MATCH_EXAMPLES = [
  "i no longer want to receive", "remove me from this list",
  "can you stop texting", "not interested", "don't message again"
];

// Check if message is an opt-out request
function isOptOut(text: string): boolean {
  const normalized = text.toLowerCase().trim();
  
  // Check for exact keyword matches
  if (OPT_OUT_KEYWORDS.some(keyword => normalized.includes(keyword))) {
    return true;
  }
  
  // Check for fuzzy matches
  if (FUZZY_MATCH_EXAMPLES.some(fuzzy => normalized.includes(fuzzy))) {
    return true;
  }
  
  return false;
}

// Log opt-out event
async function logOptOutEvent(supabase: any, phone: string, message: string, contactId?: string) {
  try {
    const { error } = await supabase
      .from('contact_logs')
      .insert({
        action: 'opt_out',
        contact_info: {
          phone,
          message,
          contact_id: contactId,
          timestamp: new Date().toISOString()
        }
      });
    
    if (error) {
      console.error('Error logging opt-out event:', error);
    } else {
      console.log('Opt-out event logged successfully');
    }
  } catch (error) {
    console.error('Failed to log opt-out event:', error);
  }
}

// Remove contact from all segments and add to UNSUBSCRIBED
async function handleContactOptOut(supabase: any, contactId: string) {
  try {
    // First, update the contact's segment to UNSUBSCRIBED
    const { error: contactUpdateError } = await supabase
      .from('contacts')
      .update({ 
        segment_name: 'UNSUBSCRIBED',
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', contactId);

    if (contactUpdateError) {
      console.error('Error updating contact segment:', contactUpdateError);
      throw contactUpdateError;
    }

    // Update the contacts_segments table
    await supabase.rpc('update_contacts_segments');

    console.log('Contact successfully moved to UNSUBSCRIBED segment');
  } catch (error) {
    console.error('Failed to handle contact opt-out:', error);
    throw error;
  }
}

// Send opt-out confirmation via Telnyx
async function sendOptOutConfirmation(supabase: any, toNumber: string, fromNumber: string) {
  try {
    const { data, error } = await supabase.functions.invoke('send-via-telnyx', {
      body: {
        to: toNumber,
        from: fromNumber,
        text: "You've been unsubscribed from our messaging list. You will no longer receive SMS messages from us. Reply START to resubscribe.",
        schedule_type: 'now'
      }
    });

    if (error) {
      console.error('Error sending opt-out confirmation:', error);
      throw error;
    }

    console.log('Opt-out confirmation sent successfully');
    return data;
  } catch (error) {
    console.error('Failed to send opt-out confirmation:', error);
    throw error;
  }
}

serve(async (req) => {
  console.log("Telnyx webhook received request");
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request");
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    console.log("Processing webhook request");
    
    // Create a Supabase client with service role key to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials');
    }

    // Use service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the URL search params
    const url = new URL(req.url);
    const contactId = url.searchParams.get('contactId');

    // Log request information
    console.log("Request URL:", req.url);
    console.log("Contact ID from params:", contactId);

    // Get the request body (Telnyx sends JSON)
    let webhookData;
    try {
      webhookData = await req.json();
    } catch (jsonError) {
      console.error("Error parsing JSON data:", jsonError);
      return new Response(JSON.stringify({
        success: false,
        error: "Failed to parse JSON data",
        details: jsonError.message
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Log all form fields for debugging
    console.log("Webhook data received:", JSON.stringify(webhookData));

    // Extract payload from webhook data
    const payload = webhookData?.data?.payload;
    if (!payload) {
      throw new Error('Invalid Telnyx webhook payload');
    } else if (webhookData.data.event_type !== 'message.received') {
      throw new Error('Not a Telnyx receive sms webhook.. handle later');
    }

    // Get specific fields we need
    const incomingMessage = payload.text || '';
    const fromNumber = payload.from?.phone_number || '';
    const toNumber = payload.to?.[0]?.phone_number || '';
    const messageId = payload.id || '';

    console.log(`Received SMS from ${fromNumber} to ${toNumber}: ${incomingMessage}`);
    console.log(`Message ID: ${messageId}, Contact ID: ${contactId || 'not provided'}`);

    if (!incomingMessage) {
      throw new Error('No message body received');
    }

    // Check if this is an opt-out request
    const isOptOutRequest = isOptOut(incomingMessage);
    console.log(`Opt-out check result: ${isOptOutRequest}`);

    let foundContactId = contactId;

    // If we don't have a contactId from query params, look up the contact by phone number
    if (!foundContactId) {
      console.log(`No contactId provided, looking up contact by phone: ${fromNumber}`);
      
      // Clean up phone number format for matching
      let cleanFrom = fromNumber.replace(/\D/g, ''); // Remove all non-digit characters
      
      if (cleanFrom.length === 11 && cleanFrom.startsWith('1')) {
        cleanFrom = cleanFrom.substring(1); // Remove leading '1' for US numbers
      }
      
      // Format to (XXX) XXX-XXXX if it's a 10-digit number
      if (cleanFrom.length === 10) {
        cleanFrom = `(${cleanFrom.substring(0, 3)}) ${cleanFrom.substring(3, 6)}-${cleanFrom.substring(6, 10)}`;
      } else {
        cleanFrom = fromNumber; // Fallback to the original number if not a 10-digit US number
      }

      console.log(`Looking for contact with phone number like: ${cleanFrom}`);

      // Look up the contact by phone number
      const { data: contactData, error: contactError } = await supabase
        .from('contacts')
        .select('id, first_name, phone')
        .eq('phone', cleanFrom)
        .maybeSingle();

      if (contactError) {
        console.error('Error looking up contact by phone:', contactError);
        throw contactError;
      }

      if (contactData) {
        foundContactId = contactData.id;
        console.log('Found contact by phone number:', contactData);
      } else {
        console.log('No matching contact found for phone number:', fromNumber);
        
        // Create a new contact entry for this unknown sender
        const { data: newContact, error: newContactError } = await supabase
          .from('contacts')
          .insert({
            first_name: `New Contact (${fromNumber})`,
            last_name: '',
            phone: cleanFrom,
            status: 'active',
            tags: ['sms-inbound'],
            last_activity: new Date().toISOString()
          })
          .select()
          .single();

        if (newContactError) {
          console.error('Error creating new contact:', newContactError);
          throw newContactError;
        }

        foundContactId = newContact.id;
        console.log('Created new contact:', newContact);
      }
    }

    // Handle opt-out request if detected
    if (isOptOutRequest && foundContactId) {
      console.log('Processing opt-out request for contact:', foundContactId);
      
      try {
        // Log the opt-out event
        await logOptOutEvent(supabase, fromNumber, incomingMessage, foundContactId);
        
        // Handle contact opt-out (move to UNSUBSCRIBED segment)
        await handleContactOptOut(supabase, foundContactId);
        
        // Send opt-out confirmation
        await sendOptOutConfirmation(supabase, fromNumber, toNumber);
        
        console.log('Opt-out request processed successfully');
        
        return new Response(JSON.stringify({
          success: true,
          message: 'Opt-out request processed successfully'
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
        
      } catch (optOutError) {
        console.error('Error processing opt-out request:', optOutError);
        // Continue with normal message processing even if opt-out fails
      }
    }

    // Normal message processing (if not opt-out or if opt-out failed)
    if (foundContactId) {
      console.log(`Processing normal message for contactId: ${foundContactId}`);
      
      // Insert the received message into the database
      const { data, error } = await supabase
        .from('messages')
        .insert({
          contact_id: foundContactId,
          content: incomingMessage,
          sender: 'contact',
          channel: 'sms',
          sent_at: new Date().toISOString()
        })
        .select();

      if (error) {
        console.error('Error inserting message:', error);
        throw error;
      }

      // Update last_activity for the contact
      await supabase
        .from('contacts')
        .update({
          last_activity: new Date().toISOString()
        })
        .eq('id', foundContactId);

      // Log the received message
      await supabase
        .from('contact_logs')
        .insert({
          action: 'message_received',
          contact_info: {
            id: foundContactId,
            message: incomingMessage,
            channel: 'sms',
            timestamp: new Date().toISOString()
          }
        });

      console.log('Message stored in database successfully');
    }

    // Return a 200 OK response to acknowledge receipt
    return new Response(JSON.stringify({
      success: true
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('Error handling SMS webhook:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: 'Failed to process SMS webhook'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
