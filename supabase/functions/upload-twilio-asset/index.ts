
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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

  try {
    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      throw new Error('Missing Twilio credentials')
    }

    // Get the request data
    const formData = await req.formData()
    const file = formData.get('file')
    
    if (!file || !(file instanceof File)) {
      throw new Error('No file or invalid file provided')
    }

    // Convert file to ArrayBuffer
    const fileBuffer = await file.arrayBuffer()
    
    // Create a unique friendly name with timestamp and original filename
    const timestamp = new Date().getTime()
    const friendlyName = `${timestamp}_${file.name.replace(/\s+/g, '_')}`
    
    // Create form data for Twilio
    const twilioFormData = new FormData()
    twilioFormData.append('FriendlyName', friendlyName)
    
    // Create Blob from ArrayBuffer and add to form data
    const fileBlob = new Blob([fileBuffer], { type: file.type })
    twilioFormData.append('Content', fileBlob)

    console.log(`Uploading file to Twilio: ${friendlyName} (${file.type})`)

    // Upload to Twilio Media Resource API using the correct endpoint
    const twilioResponse = await fetch(
      `https://mcs.us1.twilio.com/v1/Media`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
        },
        body: twilioFormData,
      }
    )

    if (!twilioResponse.ok) {
      const errorText = await twilioResponse.text()
      console.error('Twilio API error response:', errorText)
      try {
        const errorJson = JSON.parse(errorText)
        throw new Error(`Twilio API error: ${JSON.stringify(errorJson)}`)
      } catch (e) {
        throw new Error(`Twilio API error: ${errorText}`)
      }
    }

    const twilioData = await twilioResponse.json()
    console.log('Twilio API success response:', JSON.stringify(twilioData))

    // Return success response with CORS headers
    return new Response(
      JSON.stringify({
        success: true,
        data: twilioData,
        mediaUrl: twilioData.links.content,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error('Error uploading media:', error.message)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: 'Failed to upload media',
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
})
