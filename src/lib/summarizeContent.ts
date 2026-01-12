import { supabase } from '@/integrations/supabase/client';
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
