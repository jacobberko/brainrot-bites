import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper for linear/exponential backoff
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, duration } = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Text content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Dynamic chunk count based on text length
    // 1 clip per ~500 characters, min 5, max 50 (for long files)
    const targetChunkCount = Math.min(50, Math.max(5, Math.ceil(text.length / 500)));

    console.log(`Summarizing content (length: ${text.length}). Targeting ~${targetChunkCount} summaries.`);

    const systemPrompt = `You are a viral content creator that turns long study notes into addictive, bite-sized "brainrot" style scripts.
Your goal is to extract the MOST interesting facts, definitions, and concepts and turn them into short, punchy hooks.

Rules:
- Create ALMOST EXACTLY ${targetChunkCount} separate clips (between ${Math.floor(targetChunkCount * 0.8)} and ${targetChunkCount} clips)
- EXTREMELY IMPORTANT: Return a raw JSON array of strings. Do not use Markdown code blocks.
- Each clip must be UNDER 30 words.
- Use GEN Z slang occasionally but accurately (e.g., "cooked", "based", "real", "fr", "no cap").
- Make it sound like a fast-paced TikTok voiceover.
- Ignore boring filler, focus on the "tea" (key facts).
- Example style: "Mitochondria is the powerhouse of the cell, no cap. It's basically the battery pack for your whole life."

Format:
["Clip 1 text...", "Clip 2 text...", ...]`;

    // CHANGED: Use gemini-1.5-flash-latest for stability and cost
    const MODEL = 'gemini-1.5-flash-latest';
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    // Robust fetch with retry logic for 429s
    const fetchWithRetry = async (url: string, options: any, retries = 3, backoff = 1000) => {
      try {
        const response = await fetch(url, options);

        if (response.status === 429) {
          if (retries > 0) {
            console.log(`Rate limit hit. Retrying in ${backoff}ms... (${retries} retries left)`);
            await delay(backoff);
            return fetchWithRetry(url, options, retries - 1, backoff * 2); // Exponential backoff
          } else {
            console.error("Max retries exceeded for rate limit.");
          }
        }

        return response;
      } catch (error) {
        if (retries > 0) {
          console.log(`Network error: ${error}. Retrying in ${backoff}ms...`);
          await delay(backoff);
          return fetchWithRetry(url, options, retries - 1, backoff * 2);
        }
        throw error;
      }
    };

    console.log(`Calling Gemini Model: ${MODEL}`);

    const response = await fetchWithRetry(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${systemPrompt}\n\nReview the following study material and generate the scripts:\n\n${text}`
          }]
        }]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: `Gemini API Error: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      console.error('No content in Gemini response');
      return new Response(
        JSON.stringify({ error: 'No content generated' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON array from the response
    let summaries: string[];
    try {
      // Clean up potential markdown formatting
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      summaries = JSON.parse(cleanContent);

      if (!Array.isArray(summaries)) {
        throw new Error('Response is not an array');
      }
    } catch (e) {
      console.error('Failed to parse Gemini response:', e);
      console.log('Raw content:', content);

      // Fallback: split by newlines if simple list
      summaries = content.split('\n')
        .map(s => s.replace(/^["-]|["-]$/g, '').trim()) // remove quotes/dashes
        .filter(s => s.length > 10);
    }

    console.log(`Gemini generated ${summaries.length} summaries`);

    return new Response(
      JSON.stringify({ summaries }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in summarize-content:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
