
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Create a Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Get the URL search params
    const url = new URL(req.url)
    const contactId = url.searchParams.get('contactId')

    // Get the request body (Twilio sends form data)
    const formData = await req.formData()
    const from = formData.get('From') as string
    const to = formData.get('To') as string
    const body = formData.get('Body') as string
    const messageSid = formData.get('MessageSid') as string

    console.log(`Received SMS from ${from} to ${to}: ${body}`)

    if (!body) {
      throw new Error('No message body received')
    }

    // If we have a contactId from query params, use it
    if (contactId) {
      // Insert the received message into the database
      const { data, error } = await supabase
        .from('messages')
        .insert({
          contact_id: contactId,
          content: body,
          sender: 'contact',
          channel: 'sms',
          sent_at: new Date().toISOString()
        })
        .select()

      if (error) {
        throw error
      }

      // Update last_activity for the contact
      await supabase
        .from('contacts')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', contactId)

      console.log('Message stored in database:', data)
    } else {
      // If no contactId provided, look up the contact by phone number
      const { data: contactData, error: contactError } = await supabase
        .from('contacts')
        .select('id, name')
        .eq('phone', from)
        .maybeSingle()

      if (contactError) {
        throw contactError
      }

      if (contactData) {
        // Insert the received message into the database
        const { data, error } = await supabase
          .from('messages')
          .insert({
            contact_id: contactData.id,
            content: body,
            sender: 'contact',
            channel: 'sms',
            sent_at: new Date().toISOString()
          })
          .select()

        if (error) {
          throw error
        }

        // Update last_activity for the contact
        await supabase
          .from('contacts')
          .update({ last_activity: new Date().toISOString() })
          .eq('id', contactData.id)

        // Log the received message
        await supabase
          .from('contact_logs')
          .insert({
            action: 'message_received',
            contact_info: {
              id: contactData.id,
              name: contactData.name,
              message: body,
              channel: 'sms',
              timestamp: new Date().toISOString()
            }
          })

        console.log('Message stored in database for contact:', contactData.name)
      } else {
        console.log('No matching contact found for phone number:', from)
      }
    }

    // Return a TwiML response to acknowledge receipt
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
      <Response></Response>`,
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'text/xml' 
        } 
      }
    )
  } catch (error) {
    console.error('Error handling SMS webhook:', error.message)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        message: 'Failed to process SMS webhook'
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
