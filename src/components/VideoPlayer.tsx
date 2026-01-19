import { useState, useEffect, useRef, useCallback } from 'react';
import { VideoClip } from '@/types';
import { cn } from '@/lib/utils';
import { Play, Pause, Volume2, VolumeX, Shuffle, RotateCcw, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoPlayerProps {
  clips: VideoClip[];
  onShuffle: () => void;
  onReset: () => void;
}

export function VideoPlayer({ clips, onShuffle, onReset }: VideoPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false); // Start unmuted to hear TTS
  const [progress, setProgress] = useState(0);

  // Word-by-word animation state
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [words, setWords] = useState<string[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval>>();
  const wordInterval = useRef<ReturnType<typeof setInterval>>();
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  const currentClip = clips[currentIndex];

  // Split content into words when clip changes
  useEffect(() => {
    if (currentClip?.content) {
      const splitWords = currentClip.content.split(/\s+/).filter(w => w.length > 0);
      setWords(splitWords);
      setCurrentWordIndex(0);
    }
  }, [currentClip?.content]);

  // Text-to-Speech function
  const speakClip = useCallback((text: string) => {
    console.log('speakClip called with:', { text: text?.substring(0, 30), isMuted });

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    if (!text || isMuted) {
      console.log('Skipping TTS - text empty or muted');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1; // Slightly faster for "brainrot" style
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to use a more energetic voice if available
    const voices = window.speechSynthesis.getVoices();
    console.log('Available voices:', voices.length);

    const preferredVoice = voices.find(v =>
      v.name.includes('Samantha') ||
      v.name.includes('Alex') ||
      v.name.includes('Google') ||
      v.lang.startsWith('en')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
      console.log('Using voice:', preferredVoice.name);
    }

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    console.log('Speech synthesis started, speaking:', window.speechSynthesis.speaking);
  }, [isMuted]);

  // Handle mute changes for TTS
  useEffect(() => {
    if (isMuted) {
      window.speechSynthesis.cancel();
    } else if (isPlaying && currentClip?.content && currentWordIndex > 0) {
      // Resume from current position (simplified: restart from beginning)
      speakClip(currentClip.content);
    }
  }, [isMuted]);

  // Start TTS when clip changes or playback starts
  useEffect(() => {
    if (isPlaying && currentClip?.content && !isMuted) {
      speakClip(currentClip.content);
    } else {
      window.speechSynthesis.cancel();
    }

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [currentIndex, isPlaying, speakClip, currentClip?.content, isMuted]);

  // Pause/resume speech synthesis with playback
  useEffect(() => {
    if (isPlaying) {
      window.speechSynthesis.resume();
    } else {
      window.speechSynthesis.pause();
    }
  }, [isPlaying]);

  const goToNext = useCallback(() => {
    window.speechSynthesis.cancel();
    if (currentIndex < clips.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
      setCurrentWordIndex(0);
    }
  }, [currentIndex, clips.length]);

  const goToPrev = useCallback(() => {
    window.speechSynthesis.cancel();
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
      setCurrentWordIndex(0);
    }
  }, [currentIndex]);

  // Control video playback
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => { });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, currentIndex]);

  // Control video mute (background video is always muted for TTS clarity)
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true; // Always mute background video
    }
  }, []);

  // Word-by-word animation timer
  useEffect(() => {
    if (isPlaying && words.length > 0) {
      // Calculate time per word - speed up to LEAD the voice
      // TTS at 1.1x rate speaks ~3.5 words/sec = ~285ms per word
      // We want text to appear slightly BEFORE it's spoken
      const msPerWord = (currentClip.duration * 1000) / words.length;
      // Cap at speed (min 180ms, max 320ms per word) - slightly ahead of voice
      const clampedMs = Math.max(180, Math.min(320, msPerWord * 0.9));

      wordInterval.current = setInterval(() => {
        setCurrentWordIndex(prev => {
          if (prev >= words.length - 1) {
            return prev; // Stay at last word
          }
          return prev + 1;
        });
      }, clampedMs);
    }

    return () => {
      if (wordInterval.current) {
        clearInterval(wordInterval.current);
      }
    };
  }, [isPlaying, words.length, currentClip?.duration]);

  // Progress timer for clip duration
  useEffect(() => {
    if (isPlaying && currentClip) {
      progressInterval.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            goToNext();
            return 0;
          }
          return prev + (100 / (currentClip.duration * 10));
        });
      }, 100);
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isPlaying, currentClip, goToNext]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') goToPrev();
      if (e.key === 'ArrowDown') goToNext();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndY = e.changedTouches[0].clientY;
      const diff = touchStartY - touchEndY;

      if (Math.abs(diff) > 50) {
        if (diff > 0) goToNext();
        else goToPrev();
      }
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [goToNext, goToPrev]);

  // Load voices on mount (needed for some browsers)
  useEffect(() => {
    window.speechSynthesis.getVoices();
  }, []);

  if (!currentClip) return null;

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-sm mx-auto aspect-[9/16] rounded-3xl overflow-hidden glass animate-scale-in"
    >
      {/* Background Video */}
      <video
        ref={videoRef}
        key={currentClip.backgroundUrl}
        src={currentClip.backgroundUrl}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />

      {/* Progress Bars */}
      <div className="absolute top-4 left-4 right-4 flex gap-1.5 z-20">
        {clips.map((_, index) => (
          <div
            key={index}
            className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
          >
            <div
              className={cn(
                'h-full bg-white transition-all duration-100',
                index < currentIndex && 'w-full',
                index > currentIndex && 'w-0'
              )}
              style={{
                width: index === currentIndex ? `${progress}%` : undefined
              }}
            />
          </div>
        ))}
      </div>

      {/* Rapid-Fire Word Display */}
      <div className="absolute inset-0 flex items-center justify-center p-8 z-10">
        <div className="text-center">
          {words.map((word, index) => (
            <span
              key={`${currentIndex}-${index}`}
              className={cn(
                'inline-block mx-1 font-display font-bold transition-all duration-150',
                index <= currentWordIndex ? 'opacity-100' : 'opacity-0 scale-50',
                index === currentWordIndex
                  ? 'text-3xl md:text-4xl text-white scale-110 text-glow'
                  : 'text-xl md:text-2xl text-white/70'
              )}
              style={{
                transitionDelay: index <= currentWordIndex ? '0ms' : '0ms',
                textShadow: index === currentWordIndex
                  ? '0 0 20px rgba(255,255,255,0.8), 0 0 40px rgba(139,92,246,0.6)'
                  : '0 2px 4px rgba(0,0,0,0.5)'
              }}
            >
              {word}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
        {/* Counter */}
        <div className="text-center mb-4">
          <span className="text-white/80 text-sm font-medium">
            {currentIndex + 1} / {clips.length}
          </span>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="glass"
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
            className="rounded-full"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>

          <Button
            variant="glass"
            size="icon"
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-14 h-14 rounded-full"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </Button>

          <Button
            variant="glass"
            size="icon"
            onClick={onShuffle}
            className="rounded-full"
          >
            <Shuffle className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Side Navigation Hints */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
        <button
          onClick={goToPrev}
          disabled={currentIndex === 0}
          className={cn(
            'p-2 rounded-full glass transition-opacity',
            currentIndex === 0 ? 'opacity-30' : 'opacity-70 hover:opacity-100'
          )}
        >
          <ChevronUp className="w-5 h-5 text-white" />
        </button>
        <button
          onClick={goToNext}
          disabled={currentIndex === clips.length - 1}
          className={cn(
            'p-2 rounded-full glass transition-opacity',
            currentIndex === clips.length - 1 ? 'opacity-30' : 'opacity-70 hover:opacity-100'
          )}
        >
          <ChevronDown className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Reset Button */}
      <button
        onClick={onReset}
        className="absolute top-14 right-4 p-2 rounded-full glass opacity-70 hover:opacity-100 transition-opacity z-20"
      >
        <RotateCcw className="w-4 h-4 text-white" />
      </button>
    </div>
  );
}
