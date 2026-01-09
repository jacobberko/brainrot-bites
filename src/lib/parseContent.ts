import { VideoClip, VideoDuration } from '@/types';

// Import video assets
import bgVideo1 from '@/assets/videos/bg-1.mp4';
import bgVideo2 from '@/assets/videos/bg-2.mp4';
import bgVideo3 from '@/assets/videos/bg-3.mp4';
import bgVideo4 from '@/assets/videos/bg-4.mp4';

const BACKGROUND_VIDEOS = [
  bgVideo1,
  bgVideo2,
  bgVideo3,
  bgVideo4,
];

function getRandomBackground(): string {
  return BACKGROUND_VIDEOS[Math.floor(Math.random() * BACKGROUND_VIDEOS.length)];
}

function splitIntoSentences(text: string): string[] {
  return text
    .replace(/([.!?])\s+/g, '$1|')
    .split('|')
    .map(s => s.trim())
    .filter(s => s.length > 10);
}

function chunkContent(sentences: string[], duration: VideoDuration): string[] {
  const wordsPerChunk = duration === 15 ? 20 : duration === 30 ? 40 : 80;
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    const wordCount = (currentChunk + ' ' + sentence).split(' ').length;
    
    if (wordCount <= wordsPerChunk) {
      currentChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;
    } else {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = sentence;
    }
  }

  if (currentChunk) chunks.push(currentChunk);
  return chunks;
}

export function parseTextToClips(text: string, duration: VideoDuration): VideoClip[] {
  const cleanedText = text
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const sentences = splitIntoSentences(cleanedText);
  const chunks = chunkContent(sentences, duration);

  return chunks.map((content, index) => ({
    id: `clip-${Date.now()}-${index}`,
    content,
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
