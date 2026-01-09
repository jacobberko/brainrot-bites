import { Brain, Sparkles } from 'lucide-react';

export function Header() {
  return (
    <header className="w-full py-6 px-4">
      <div className="max-w-4xl mx-auto flex items-center justify-center gap-3">
        <div className="relative">
          <Brain className="w-10 h-10 text-primary animate-float" />
          <Sparkles className="w-4 h-4 text-accent absolute -top-1 -right-1" />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold gradient-text">
            BrainRot
          </h1>
          <p className="text-xs text-muted-foreground tracking-wider uppercase">
            Learn through dopamine
          </p>
        </div>
      </div>
    </header>
  );
}
