import { VideoDuration } from '@/types';
import { cn } from '@/lib/utils';
import { Clock, Zap, Timer, Hourglass } from 'lucide-react';

interface DurationSelectorProps {
  selected: VideoDuration;
  onSelect: (duration: VideoDuration) => void;
}

const durations: { value: VideoDuration; label: string; description: string; icon: React.ReactNode }[] = [
  { value: 15, label: '15s', description: 'Quick bites', icon: <Zap className="w-5 h-5" /> },
  { value: 30, label: '30s', description: 'Balanced', icon: <Timer className="w-5 h-5" /> },
  { value: 60, label: '60s', description: 'Deep dive', icon: <Hourglass className="w-5 h-5" /> },
];

export function DurationSelector({ selected, onSelect }: DurationSelectorProps) {
  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-display font-semibold">Video Duration</h3>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        {durations.map(({ value, label, description, icon }) => (
          <button
            key={value}
            onClick={() => onSelect(value)}
            className={cn(
              'relative p-6 rounded-xl transition-all duration-300 group',
              'glass border-2',
              selected === value 
                ? 'border-primary glow-primary' 
                : 'border-transparent hover:border-primary/50'
            )}
          >
            <div className="flex flex-col items-center gap-3">
              <div className={cn(
                'p-3 rounded-lg transition-colors duration-300',
                selected === value 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground group-hover:text-primary'
              )}>
                {icon}
              </div>
              <div className="text-center">
                <div className="text-2xl font-display font-bold">{label}</div>
                <div className="text-xs text-muted-foreground mt-1">{description}</div>
              </div>
            </div>
            
            {selected === value && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full animate-pulse" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
