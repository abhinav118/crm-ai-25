
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory cache
interface CacheEntry {
  suggestions: string[];
  timestamp: number;
}

const cache: Record<string, CacheEntry> = {};
const CACHE_TTL = 3600000; // 1 hour in milliseconds

const DEFAULT_SUGGESTIONS: Record<string, string[]> = {
  sms_text: [
    "20% off summer sale for our Mexican restaurant this weekend",
    "Buy one get one free lunch special today",
    "Join us for happy hour, 2-for-1 margaritas"
  ],
  sms_image: [
    "A delicious taco platter with summer themed decorations",
    "Colorful Mexican street food display",
    "Fresh guacamole and chips presentation"
  ],
  email_subject: [
    "Summer special menu launch at our Mexican restaurant",
    "Exclusive weekend dining experience",
    "New seasonal menu reveal"
  ],
  email_content: [
    "Promote our new summer menu with focus on fresh ingredients",
    "Special weekend brunch announcement",
    "Family dinner package promotion"
  ],
  email_image: [
    "A colorful spread of Mexican dishes with summer cocktails",
    "Restaurant interior with happy diners",
    "Chef preparing signature dishes"
  ]
};

async function generateSuggestions(type: string, brand: string): Promise<string[]> {
  const openAIKey = Deno.env.get("OPEN_AI_KEY");
  
  if (!openAIKey) {
    console.error("OpenAI API key not found");
    return DEFAULT_SUGGESTIONS[type] || [];
  }

  let prompt = "";
  let numSuggestions = 3;
  
  switch(type) {
    case "sms_text":
      prompt = `Generate ${numSuggestions} SMS marketing message ideas for a ${brand} restaurant. 
      Keep each message under 100 characters. Make them engaging and actionable.`;
      break;
    case "sms_image":
      prompt = `Generate ${numSuggestions} image prompt ideas for marketing photos for a ${brand} restaurant.
      These will be used to generate AI images for SMS marketing. Be descriptive but concise.`;
      break;
    case "email_subject":
      prompt = `Generate ${numSuggestions} email subject line ideas for a ${brand} restaurant marketing campaign.
      Keep them under 50 characters and make them attention-grabbing.`;
      break;
    case "email_content":
      prompt = `Generate ${numSuggestions} email content prompt ideas for a ${brand} restaurant marketing campaign.
      These will be used to generate full email content with AI. Focus on promotions, events, or menu highlights.`;
      break;
    case "email_image":
      prompt = `Generate ${numSuggestions} image prompt ideas for marketing photos for a ${brand} restaurant.
      These will be used to generate AI images for email marketing. Be descriptive but concise.`;
      break;
    default:
      return DEFAULT_SUGGESTIONS[type] || [];
  }

  try {
    console.log(`Generating suggestions for ${type} with brand ${brand}`);
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openAIKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that generates marketing campaign suggestions."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 256
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    console.log("Generated content:", content);
    
    // Extract suggestions - handle both numbered lists and bullet points
    let suggestions = content
      .split(/\n+/)
      .filter(line => line.trim().match(/^(\d+\.|\*|\-)/))
      .map(line => line.replace(/^(\d+\.|\*|\-)\s*/, '').trim());
    
    // If parsing failed, try to split by newlines
    if (suggestions.length === 0) {
      suggestions = content.split(/\n+/).filter(line => line.trim() !== '');
    }
    
    // Limit to requested number
    suggestions = suggestions.slice(0, numSuggestions);
    
    console.log(`Extracted ${suggestions.length} suggestions:`, suggestions);
    
    // Fall back to defaults if we couldn't parse any suggestions
    if (suggestions.length === 0) {
      console.log("Couldn't parse suggestions, using defaults");
      return DEFAULT_SUGGESTIONS[type] || [];
    }
    
    return suggestions;
  } catch (error) {
    console.error("Error generating suggestions:", error);
    return DEFAULT_SUGGESTIONS[type] || [];
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, brand = "Mexican Fast Casual" } = await req.json();
    
    if (!type) {
      return new Response(
        JSON.stringify({ error: "Type parameter is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Received request for ${type} suggestions with brand ${brand}`);

    // Check if we have cached suggestions
    const cacheKey = `${type}-${brand}`;
    const cachedEntry = cache[cacheKey];
    
    if (cachedEntry && (Date.now() - cachedEntry.timestamp < CACHE_TTL)) {
      console.log(`Returning cached suggestions for ${cacheKey}`);
      return new Response(
        JSON.stringify({ suggestions: cachedEntry.suggestions }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating new suggestions for ${cacheKey}`);
    const suggestions = await generateSuggestions(type, brand);
    
    // Update cache
    cache[cacheKey] = {
      suggestions,
      timestamp: Date.now()
    };
    
    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-suggestions function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
