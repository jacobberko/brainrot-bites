import { supabase } from '@/integrations/supabase/client';
import { VideoClip, VideoDuration } from '@/types';

// Import video assets
import bgVideo1 from '@/assets/videos/bg-1.mp4';
import bgVideo2 from '@/assets/videos/bg-2.mp4';
import bgVideo3 from '@/assets/videos/bg-3.mp4';
import bgVideo4 from '@/assets/videos/bg-4.mp4';

const BACKGROUND_VIDEOS = [bgVideo1, bgVideo2, bgVideo3, bgVideo4];

function getRandomBackground(): string {
  return BACKGROUND_VIDEOS[Math.floor(Math.random() * BACKGROUND_VIDEOS.length)];
}

export async function summarizeTextToClips(
  text: string, 
  duration: VideoDuration
): Promise<VideoClip[]> {
  const { data, error } = await supabase.functions.invoke('summarize-content', {
    body: { text, duration },
  });

  if (error) {
    console.error('Summarization error:', error);
    throw new Error(error.message || 'Failed to summarize content');
  }

  if (!data?.summaries || !Array.isArray(data.summaries)) {
    throw new Error('Invalid response from summarization');
  }

  return data.summaries.map((content: string, index: number) => ({
    id: `clip-${Date.now()}-${index}`,
    content: content.trim(),
    duration,
    backgroundUrl: getRandomBackground(),
    order: index,
  }));
}

export function shuffleClips(clips: VideoClip[]): VideoClip[] {
  const shuffled = [...clips];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.map((clip, index) => ({ ...clip, order: index }));
}
