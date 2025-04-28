import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = Deno.env.get('CLOUDINARY_CLOUD_NAME') ?? '';
const CLOUDINARY_API_KEY = Deno.env.get('CLOUDINARY_API_KEY') ?? '';
const CLOUDINARY_API_SECRET = Deno.env.get('CLOUDINARY_API_SECRET') ?? '';
const CLOUDINARY_UPLOAD_PRESET = Deno.env.get('CLOUDINARY_UPLOAD_PRESET') ?? '';
async function uploadToCloudinary(base64Image: string, folder: string = 'ai-generated-images') {
  try {
    const formData = new FormData();
    formData.append('file', `data:image/png;base64,${base64Image}`);
    formData.append('upload_preset',  `${CLOUDINARY_UPLOAD_PRESET}`);
    formData.append('folder', folder);
    formData.append('api_key', CLOUDINARY_API_KEY);
    formData.append('timestamp', Math.floor(Date.now() / 1000).toString());
    
    // Create signature
    const signature = await crypto.subtle.digest(
      'SHA-1',
      new TextEncoder().encode(
        `folder=${folder}&timestamp=${formData.get('timestamp')}${CLOUDINARY_API_SECRET}`
      )
    );
    formData.append('signature', Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join(''));

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Cloudinary upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Done Image uploaded to Cloudinary:', result.secure_url);
    return result;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check for both OPENAI_KEY and OPEN_AI_KEY environment variables
    const openAIApiKey = Deno.env.get('OPENAI_KEY') || Deno.env.get('OPEN_AI_KEY');
    
    if (!openAIApiKey) {
      console.error('OpenAI API key not found in environment variables. Checked OPENAI_KEY and OPEN_AI_KEY');
      throw new Error('OpenAI API key environment variable not set. Please set either OPENAI_KEY or OPEN_AI_KEY');
    }

    const { prompt, type } = await req.json();

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    if (type === 'image') {
      // Handle image generation with the latest GPT Image API
      const imagePrompt = `As a digital marketer generate an image for ${prompt}. Make it photorealistic`;
      
      console.log('Sending image generation request to OpenAI with prompt:', imagePrompt);
      
      try {
        // First attempt with gpt-image-1 model
        const response = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: "gpt-image-1",
            prompt: imagePrompt,
            n: 1,
            size: "1024x1024",
            quality: "high"
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('OpenAI Image API error details:', JSON.stringify(errorData));
          
          // If gpt-image-1 fails, try with DALL-E 3
          console.log('Retrying with DALL-E 3 model instead');
          
          const retryResponse = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openAIApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: "dall-e-3",
              prompt: imagePrompt,
              n: 1,
              size: "1024x1024",
              quality: "standard",
              response_format: "url",
            }),
          });
          
          if (!retryResponse.ok) {
            const retryErrorData = await retryResponse.json();
            console.error('DALL-E 3 fallback error:', JSON.stringify(retryErrorData));
            throw new Error(`OpenAI API error: ${retryErrorData.error?.message || 'Unknown error'}`);
          }
          
          const retryData = await retryResponse.json();
          console.log('DALL-E 3 generation successful, returning image URL');
          return new Response(JSON.stringify({ 
            result: retryData.data[0].url,
            format: 'url'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const data = await response.json();
        console.log('GPT Image generation successful, uploading to Cloudinary');
        
        // Upload the base64 image to Cloudinary
        const cloudinaryResult = await uploadToCloudinary(data.data[0].b64_json);
        
        return new Response(JSON.stringify({ 
          result: cloudinaryResult.secure_url,
          format: 'url',
          cloudinaryData: cloudinaryResult
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (imageError) {
        console.error('Error during image generation:', imageError);
        throw new Error(`Image generation failed: ${imageError.message}`);
      }
    } else {
      // Handle text generation
      let systemPrompt = "You are an expert digital marketing assistant.";
      
      switch (type) {
        case 'sms':
          systemPrompt += " Create a short, engaging SMS marketing message within 160 characters.";
          break;
        case 'email':
          systemPrompt += " Create a complete marketing email with engaging content.";
          break;
        case 'email_subject':
          systemPrompt += " Create a catchy email subject line that drives high open rates.";
          break;
        case 'blog':
          systemPrompt += " Create detailed blog post content that is SEO-optimized and engaging.";
          break;
        case 'blog_header':
          systemPrompt += " Create a catchy blog post headline that attracts readers.";
          break;
        case 'blog_layout':
          systemPrompt += " Create a suggested structure for a blog post with sections and subsections.";
          break;
        default:
          systemPrompt += " Create engaging marketing content based on the request.";
      }

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
            max_tokens: type === 'sms' ? 160 : 1000,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('OpenAI API error:', errorData);
          throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        console.log('Text generation successful');
        return new Response(JSON.stringify({ 
          result: data.choices[0].message.content 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (textError) {
        console.error('Error during text generation:', textError);
        throw new Error(`Text generation failed: ${textError.message}`);
      }
    }
  } catch (error) {
    console.error('Error in ai-generation function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
