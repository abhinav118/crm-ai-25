
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

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
    // Get Cloudinary configuration from environment
    const CLOUDINARY_CLOUD_NAME = Deno.env.get('CLOUDINARY_CLOUD_NAME') ?? '';
    const CLOUDINARY_API_KEY = Deno.env.get('CLOUDINARY_API_KEY') ?? '';
    const CLOUDINARY_UPLOAD_PRESET = Deno.env.get('CLOUDINARY_UPLOAD_PRESET') ?? '';

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY) {
      throw new Error('Cloudinary configuration missing. Please set CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY');
    }

    const { base64Image } = await req.json();

    if (!base64Image) {
      throw new Error('Missing base64Image in request body');
    }

    console.log('Uploading image to Cloudinary...');

    // Upload to Cloudinary
    const formData = new FormData();
    formData.append('file', `data:image/png;base64,${base64Image}`);
    formData.append('api_key', CLOUDINARY_API_KEY);
    
    // Use upload preset if available, otherwise use unsigned upload
    if (CLOUDINARY_UPLOAD_PRESET) {
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    }

    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!cloudinaryResponse.ok) {
      const errorText = await cloudinaryResponse.text();
      console.error('Cloudinary upload error:', errorText);
      throw new Error(`Cloudinary upload failed: ${cloudinaryResponse.statusText} - ${errorText}`);
    }

    const result = await cloudinaryResponse.json();
    console.log('Cloudinary upload successful, URL:', result.secure_url);

    return new Response(
      JSON.stringify({
        success: true,
        media_url: result.secure_url
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error.message);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: 'Failed to upload image to Cloudinary'
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
