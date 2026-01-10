import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine number of chunks based on duration
    const chunkCount = duration === 15 ? 8 : duration === 30 ? 5 : 3;
    
    console.log(`Summarizing content for ${duration}s clips, targeting ${chunkCount} summaries`);

    const systemPrompt = `You are a study content summarizer that creates bite-sized, memorable learning chunks. Your goal is to transform study notes into short, punchy summaries that are easy to memorize.

Rules:
- Create exactly ${chunkCount} separate summaries from the provided text
- Each summary should be 1-2 sentences MAX (under 30 words)
- Use simple, direct language
- Focus on the KEY facts, concepts, or definitions
- Make each summary standalone and memorable
- Use active voice and present tense when possible
- Include specific numbers, dates, or terms when relevant
- Format as a JSON array of strings

Example output format:
["The mitochondria is the powerhouse of the cell, producing ATP through cellular respiration.", "DNA has a double helix structure discovered by Watson and Crick in 1953."]`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Summarize this study material into ${chunkCount} bite-sized learning chunks:\n\n${text.slice(0, 15000)}` }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded, please try again in a moment' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to generate summaries' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('No content in AI response');
      return new Response(
        JSON.stringify({ error: 'No content generated' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON array from the response
    let summaries: string[];
    try {
      // Extract JSON array from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        summaries = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: split by newlines if not valid JSON
        summaries = content.split('\n').filter((s: string) => s.trim().length > 10);
      }
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      // Fallback: use the raw content split by periods
      summaries = content.split(/[.!?]+/).filter((s: string) => s.trim().length > 10).map((s: string) => s.trim() + '.');
    }

    console.log(`Generated ${summaries.length} summaries`);

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
