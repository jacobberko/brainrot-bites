import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GenerateButtonProps {
  onClick: () => void;
  isGenerating: boolean;
  disabled: boolean;
}

export function GenerateButton({ onClick, isGenerating, disabled }: GenerateButtonProps) {
  return (
    <Button
      variant="gradient"
      size="xl"
      onClick={onClick}
      disabled={disabled || isGenerating}
      className={cn(
        'w-full max-w-xl mx-auto',
        !disabled && !isGenerating && 'hover:scale-[1.02] active:scale-[0.98]'
      )}
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-6 h-6 animate-spin" />
          Generating brainrot...
        </>
      ) : (
        <>
          <Sparkles className="w-6 h-6" />
          Generate Videos
        </>
      )}
    </Button>
  );
}
