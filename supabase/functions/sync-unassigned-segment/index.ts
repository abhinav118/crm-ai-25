
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { contact } = await req.json()
    
    if (!contact || !contact.id) {
      return new Response(
        JSON.stringify({ error: 'Contact data is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Ensure segment_name is set, default to UNASSIGNED
    const segmentName = contact.segment_name || 'UNASSIGNED'

    // Prepare contact data for segment membership
    const contactData = {
      id: contact.id,
      first_name: contact.first_name,
      last_name: contact.last_name || '',
      email: contact.email || '',
      phone: contact.phone || '',
      company: contact.company || '',
      status: contact.status || 'active',
      tags: contact.tags || [],
      created_at: contact.created_at || new Date().toISOString(),
      updated_at: contact.updated_at || new Date().toISOString()
    }

    // Check if the segment exists
    const { data: segment, error: fetchError } = await supabaseClient
      .from('contacts_segments')
      .select('contacts_membership')
      .eq('segment_name', segmentName)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError
    }

    if (segment) {
      // Segment exists - check if contact is already in it
      const currentMembers = Array.isArray(segment.contacts_membership) 
        ? segment.contacts_membership 
        : []
      
      const contactExists = currentMembers.some((member: any) => 
        member && typeof member === 'object' && member.id === contact.id
      )

      if (!contactExists) {
        // Add contact to existing segment
        const updatedMembers = [...currentMembers, contactData]
        
        const { error: updateError } = await supabaseClient
          .from('contacts_segments')
          .update({ 
            contacts_membership: updatedMembers,
            updated_at: new Date().toISOString()
          })
          .eq('segment_name', segmentName)

        if (updateError) throw updateError
      }
    } else {
      // Segment doesn't exist - create it with the contact
      const { error: insertError } = await supabaseClient
        .from('contacts_segments')
        .insert([{
          segment_name: segmentName,
          contacts_membership: [contactData],
          updated_at: new Date().toISOString()
        }])

      if (insertError) throw insertError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Contact synced to segment: ${segmentName}` 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in sync-unassigned-segment function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
