import { VideoClip, VideoDuration } from '@/types';

const BACKGROUND_VIDEOS = [
  'https://images.unsplash.com/photo-1557683316-973673baf926?w=400&h=700&fit=crop',
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&h=700&fit=crop',
  'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=400&h=700&fit=crop',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=700&fit=crop',
  'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=400&h=700&fit=crop',
  'https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=400&h=700&fit=crop',
  'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=700&fit=crop',
  'https://images.unsplash.com/photo-1614851099511-773084f6911d?w=400&h=700&fit=crop',
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
