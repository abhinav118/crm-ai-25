/// <reference types="https://deno.land/x/deno/cli/tsc/dts/lib.deno.d.ts" />
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
  console.log("Telnyx webhook received request")
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request")
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    })
  }

  try {
    console.log("Processing webhook request")
    
    // Create a Supabase client with service role key to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials')
    }
    
    // Use service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get the URL search params
    const url = new URL(req.url)
    const contactId = url.searchParams.get('contactId')
    
    // Log request information
    console.log("Request URL:", req.url)
    console.log("Contact ID from params:", contactId)
    
    // Log headers for debugging
    const headers: Record<string, string> = {}
    req.headers.forEach((value, key) => {
      headers[key] = value
    })
    console.log("Request headers:", JSON.stringify(headers))

    // Get the request body (Telnyx sends JSON)
    let webhookData: any
    try {
      webhookData = await req.json()
    } catch (jsonError) {
      console.error("Error parsing JSON data:", jsonError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to parse JSON data",
          details: (jsonError as Error).message 
        }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      )
    }
    
    // Log all form fields for debugging
    console.log("Webhook data received:", JSON.stringify(webhookData))
    
    // Extract payload from webhook data
    const payload = webhookData?.data?.payload

    if (!payload) {
      throw new Error('Invalid Telnyx webhook payload')
    }
    
    // Get specific fields we need
    const incomingMessage = payload.text || ''
    const fromNumber = payload.from?.phone_number || ''
    const toNumber = payload.to?.[0]?.phone_number || ''
    const messageId = payload.id || ''

    console.log(`Received SMS from ${fromNumber} to ${toNumber}: ${incomingMessage}`)
    console.log(`Message ID: ${messageId}, Contact ID: ${contactId || 'not provided'}`)

    if (!incomingMessage) {
      throw new Error('No message body received')
    }

    // Create a message object to store
    const messageObj = {
      id: messageId,
      text: incomingMessage,
      sender: 'external',
      timestamp: new Date().toISOString(),
      fromNumber: fromNumber
    }

    // If we have a contactId from query params, use it
    if (contactId) {
      console.log(`Using provided contactId: ${contactId}`)
      
      // Insert the received message into the database
      const { data, error } = await supabase
        .from('messages')
        .insert({
          contact_id: contactId,
          content: incomingMessage,
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
            message: incomingMessage,
            channel: 'sms',
            timestamp: new Date().toISOString()
          }
        })

      console.log('Message stored in database using provided contactId:', data)
    } else {
      console.log(`No contactId provided, looking up contact by phone: ${fromNumber}`)
      
      // Clean up phone number format for matching - handle multiple formats
      let cleanFrom = fromNumber.replace(/\D/g, '')
      
      // If the phone starts with a plus sign, keep it for the search
      if (fromNumber.startsWith('+')) {
        cleanFrom = fromNumber
      } else if (cleanFrom.length === 10) {
        // Add US country code if it's a 10-digit number without country code
        cleanFrom = `+1${cleanFrom}`
      } else if (cleanFrom.length === 11 && cleanFrom.startsWith('1')) {
        // Format 11-digit US number with country code
        cleanFrom = `+${cleanFrom}`
      }
      
      console.log(`Looking for contact with phone number like: ${cleanFrom}`)
      
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
            content: incomingMessage,
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
              message: incomingMessage,
              channel: 'sms',
              timestamp: new Date().toISOString()
            }
          })

        console.log('Message stored in database for contact:', contactData.name)
      } else {
        console.log('No matching contact found for phone number:', fromNumber)
        console.log('Creating a new contact for this phone number')
        
        // Create a new contact entry for this unknown sender
        const { data: newContact, error: newContactError } = await supabase
          .from('contacts')
          .insert({
            name: `Unknown (${fromNumber})`,
            phone: fromNumber,
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
            content: incomingMessage,
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
              message: incomingMessage,
              channel: 'sms',
              timestamp: new Date().toISOString()
            }
          })
          
        console.log('Created new contact and stored message:', newContact.name)
      }
    }

    // Return a 200 OK response to acknowledge receipt
    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    )
  } catch (error) {
    console.error('Error handling SMS webhook:', error)
    console.error('Error message:', (error as Error).message)
    console.error('Error stack:', (error as Error).stack)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error as Error).message,
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
