import { Film, Clock, Brain } from 'lucide-react';

interface StatsBarProps {
  clipCount: number;
  duration: number;
}

export function StatsBar({ clipCount, duration }: StatsBarProps) {
  const totalMinutes = Math.ceil((clipCount * duration) / 60);
  
  return (
    <div className="w-full max-w-xl mx-auto glass rounded-xl p-4 animate-fade-in">
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Film className="w-4 h-4 text-primary" />
            <span className="text-2xl font-display font-bold">{clipCount}</span>
          </div>
          <span className="text-xs text-muted-foreground">Videos</span>
        </div>
        
        <div className="text-center border-x border-border">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-secondary" />
            <span className="text-2xl font-display font-bold">{totalMinutes}</span>
          </div>
          <span className="text-xs text-muted-foreground">Minutes</span>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Brain className="w-4 h-4 text-accent" />
            <span className="text-2xl font-display font-bold">{duration}s</span>
          </div>
          <span className="text-xs text-muted-foreground">Each</span>
        </div>
      </div>
    </div>
  );
}
