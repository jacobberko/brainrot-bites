import { GoogleGenerativeAI } from '@google/generative-ai';
import { VideoClip, VideoDuration } from '@/types';

// Import video assets - Classic brainrot backgrounds
import subwaySurfers from '@/assets/videos/subway-surfers.mp4';
import minecraftParkour from '@/assets/videos/minecraft-parkour.mp4';

const BACKGROUND_VIDEOS = [subwaySurfers, minecraftParkour];

function getRandomBackground(): string {
  return BACKGROUND_VIDEOS[Math.floor(Math.random() * BACKGROUND_VIDEOS.length)];
}

export async function summarizeTextToClips(
  text: string,
  duration: VideoDuration
): Promise<VideoClip[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY is not configured in your .env file');
  }

  console.log(`API Key loaded: ${apiKey.substring(0, 8)}...`);
  console.log(`Text length: ${text.length} characters`);

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const targetChunkCount = Math.min(50, Math.max(5, Math.ceil(text.length / 500)));

  console.log(`Targeting ~${targetChunkCount} summaries.`);

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

  const prompt = `${systemPrompt}\n\nReview the following study material and generate the scripts:\n\n${text}`;

  // Retry logic for rate limit errors
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (attempt > 0) {
        const waitTime = Math.pow(2, attempt) * 10000; // 20s, 40s
        console.log(`Rate limited. Waiting ${waitTime / 1000}s before retry (attempt ${attempt + 1}/3)...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      console.log(`Making Gemini API call (attempt ${attempt + 1})...`);
      const result = await model.generateContent(prompt);
      const response = result.response;
      const content = response.text();

      if (!content) {
        throw new Error('No content generated from Gemini');
      }

      // Parse the JSON array from the response
      let summaries: string[];
      try {
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
          .map(s => s.replace(/^["-]|["-]$/g, '').trim())
          .filter(s => s.length > 10);
      }

      console.log(`Gemini generated ${summaries.length} summaries`);

      return summaries.map((content: string, index: number) => ({
        id: `clip-${Date.now()}-${index}`,
        content: content.trim(),
        duration,
        backgroundUrl: getRandomBackground(),
        order: index,
      }));
    } catch (error) {
      lastError = error as Error;
      const errorMessage = lastError.message || '';

      // Check if it's a rate limit error (429)
      if (errorMessage.includes('429') || errorMessage.includes('quota')) {
        console.warn(`Rate limit hit on attempt ${attempt + 1}:`, errorMessage);
        continue; // Retry
      }

      // For non-rate-limit errors, throw immediately
      throw error;
    }
  }

  // All retries exhausted
  throw new Error(`Failed after 3 attempts. Last error: ${lastError?.message}`);
}

export function shuffleClips(clips: VideoClip[]): VideoClip[] {
  const shuffled = [...clips];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.map((clip, index) => ({ ...clip, order: index }));
}
