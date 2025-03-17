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
    console.log(`Message SID: ${messageSid}, Contact ID: ${contactId || 'not provided'}`)

    if (!body) {
      throw new Error('No message body received')
    }

    // If we have a contactId from query params, use it
    if (contactId) {
      console.log(`Using provided contactId: ${contactId}`)
      
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
        console.error('Error inserting message:', error)
        throw error
      }

      // Update last_activity for the contact
      await supabase
        .from('contacts')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', contactId)

      // Log the received message to contact_logs
      await supabase
        .from('contact_logs')
        .insert({
          action: 'message_received',
          contact_info: {
            id: contactId,
            message: body,
            channel: 'sms',
            timestamp: new Date().toISOString()
          }
        })

      console.log('Message stored in database using provided contactId:', data)
    } else {
      console.log(`No contactId provided, looking up contact by phone: ${from}`)
      
      // Clean up phone number format for matching - handle multiple formats
      let cleanFrom = from.replace(/\D/g, '')
      
      // If the phone starts with a plus sign, keep it for the search
      if (from.startsWith('+')) {
        cleanFrom = from;
      } else if (cleanFrom.length === 10) {
        // Add US country code if it's a 10-digit number without country code
        cleanFrom = `+1${cleanFrom}`;
      } else if (cleanFrom.length === 11 && cleanFrom.startsWith('1')) {
        // Format 11-digit US number with country code
        cleanFrom = `+${cleanFrom}`;
      }
      
      console.log(`Looking for contact with phone number like: ${cleanFrom}`);
      
      // If no contactId provided, look up the contact by phone number
      // Use multiple search patterns to increase chances of matching
      const { data: contactData, error: contactError } = await supabase
        .from('contacts')
        .select('id, name, phone')
        .or(`phone.eq.${cleanFrom},phone.ilike.%${cleanFrom.slice(-10)}%`)
        .maybeSingle()

      if (contactError) {
        console.error('Error looking up contact by phone:', contactError)
        throw contactError
      }

      if (contactData) {
        console.log('Found contact by phone number:', contactData)
        
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
          console.error('Error inserting message:', error)
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
        console.log('Creating a new contact for this phone number')
        
        // Create a new contact entry for this unknown sender
        const { data: newContact, error: newContactError } = await supabase
          .from('contacts')
          .insert({
            name: `Unknown (${from})`,
            phone: from,
            status: 'active',
            tags: ['sms-inbound'],
            last_activity: new Date().toISOString()
          })
          .select()
          .single()
          
        if (newContactError) {
          console.error('Error creating new contact:', newContactError)
          throw newContactError
        }
        
        // Insert the received message for the new contact
        const { data, error } = await supabase
          .from('messages')
          .insert({
            contact_id: newContact.id,
            content: body,
            sender: 'contact',
            channel: 'sms',
            sent_at: new Date().toISOString()
          })
          .select()
          
        if (error) {
          console.error('Error inserting message for new contact:', error)
          throw error
        }
        
        // Log the received message for the new contact
        await supabase
          .from('contact_logs')
          .insert({
            action: 'message_received',
            contact_info: {
              id: newContact.id,
              name: newContact.name,
              message: body,
              channel: 'sms',
              timestamp: new Date().toISOString()
            }
          })
          
        console.log('Created new contact and stored message:', newContact.name)
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
