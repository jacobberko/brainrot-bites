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
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressInterval = useRef<NodeJS.Timeout>();

  const currentClip = clips[currentIndex];

  const goToNext = useCallback(() => {
    if (currentIndex < clips.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    }
  }, [currentIndex, clips.length]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    }
  }, [currentIndex]);

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

  if (!currentClip) return null;

  return (
    <div 
      ref={containerRef}
      className="relative w-full max-w-sm mx-auto aspect-[9/16] rounded-3xl overflow-hidden glass animate-scale-in"
    >
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-500"
        style={{ backgroundImage: `url(${currentClip.backgroundUrl})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
      </div>

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

      {/* Content */}
      <div className="absolute inset-0 flex items-center justify-center p-8 z-10">
        <p className="text-white text-xl md:text-2xl font-display font-semibold text-center leading-relaxed text-glow animate-fade-in">
          {currentClip.content}
        </p>
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
