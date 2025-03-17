
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SMSRequest {
  to: string
  message: string
  contactId: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')
    const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER')

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      throw new Error('Missing Twilio credentials')
    }

    // Get the request body
    const requestBody = await req.json()
    const { to, message, contactId } = requestBody as SMSRequest

    if (!to || !message || !contactId) {
      throw new Error('Missing required parameters: to, message, or contactId')
    }

    console.log(`Sending SMS to ${to}: ${message}`)

    // Format phone number if needed
    let formattedPhone = to
    if (!to.startsWith('+')) {
      formattedPhone = `+${to.replace(/\D/g, '')}`
    }

    // Make request to Twilio API to send SMS
    const twilioEndpoint = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`
    
    const formData = new URLSearchParams()
    formData.append('To', formattedPhone)
    formData.append('From', TWILIO_PHONE_NUMBER)
    formData.append('Body', message)
    formData.append('StatusCallback', `https://nzsflibcvrisxjlzuxjn.supabase.co/functions/v1/twilio-webhook?contactId=${contactId}`)

    const twilioResponse = await fetch(twilioEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`
      },
      body: formData.toString()
    })

    const twilioData = await twilioResponse.json()

    if (!twilioResponse.ok) {
      console.error('Twilio API error:', JSON.stringify(twilioData))
      throw new Error(`Twilio API error: ${JSON.stringify(twilioData)}`)
    }

    // Log success
    console.log('SMS sent successfully:', twilioData.sid)

    // Return success response with CORS headers
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: twilioData,
        message: 'SMS sent successfully'
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Error sending SMS:', error.message)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        message: 'Failed to send SMS'
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
})
