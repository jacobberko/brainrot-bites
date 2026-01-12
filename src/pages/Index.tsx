import { useState, useCallback } from 'react';
import { Header } from '@/components/Header';
import { FileUpload } from '@/components/FileUpload';
import { DurationSelector } from '@/components/DurationSelector';
import { GenerateButton } from '@/components/GenerateButton';
import { VideoPlayer } from '@/components/VideoPlayer';
import { StatsBar } from '@/components/StatsBar';
import { VideoClip, VideoDuration, UploadState } from '@/types';
import { summarizeTextToClips, shuffleClips } from '@/lib/summarizeContent';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Index() {
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [duration, setDuration] = useState<VideoDuration>(30);
  const [clips, setClips] = useState<VideoClip[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  const handleFileContent = useCallback((content: string, name: string) => {
    setFileContent(content);
    setFileName(name);
  }, []);

  const { toast } = useToast();

  const handleGenerate = useCallback(async () => {
    if (!fileContent) return;

    setIsGenerating(true);

    try {
      const generatedClips = await summarizeTextToClips(fileContent, duration);
      const shuffledClips = shuffleClips(generatedClips);
      setClips(shuffledClips);
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to summarize content',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  }, [fileContent, duration, toast]);

  const handleShuffle = useCallback(() => {
    setClips(prev => shuffleClips(prev));
  }, []);

  const handleReset = useCallback(() => {
    setClips([]);
    setFileContent('');
    setFileName('');
    setUploadState({ status: 'idle', progress: 0, message: '' });
  }, []);

  const isReady = uploadState.status === 'complete' && fileContent.length > 0;

  return (
    <div className="min-h-screen bg-background relative selection:bg-indigo-500/30 selection:text-indigo-200 font-sans antialiased overflow-hidden">
      {/* Decorative background - Minimalist Dot Pattern with Subtle Glow */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] bg-primary/20 blur-[120px] rounded-full opacity-50" />
        <div className="absolute inset-0 bg-[radial-gradient(#71717a_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen selection:bg-white selection:text-black">
        <Header />

        <main className="container max-w-3xl mx-auto px-6 py-20 flex-grow flex flex-col justify-center">
          {clips.length === 0 ? (
            <div className="space-y-16 animate-fade-in w-full">
              {/* Upload Section */}
              <section className="space-y-8 text-center">
                <div className="space-y-6">
                  <div className="inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-sm font-medium text-indigo-300">
                    <span className="flex h-2 w-2 rounded-full bg-indigo-400 mr-2 animate-pulse"></span>
                    AI Video Generator
                  </div>
                  <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white space-y-2">
                    <span className="block">Transform text.</span>
                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Create content.</span>
                  </h1>
                  <p className="text-lg text-zinc-400 max-w-lg mx-auto leading-relaxed">
                    Upload your notes and let our AI generate engaging short-form video content instantly.
                  </p>
                </div>
                <FileUpload
                  onFileContent={handleFileContent}
                  uploadState={uploadState}
                  setUploadState={setUploadState}
                />
                {fileName && (
                  <p className="text-center text-sm text-zinc-500 animate-fade-in">
                    Selected: <span className="text-white font-medium">{fileName}</span>
                  </p>
                )}
              </section>

              {/* Duration Selector */}
              <section className={`transition-opacity duration-300 ${isReady ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <DurationSelector selected={duration} onSelect={setDuration} />
              </section>

              {/* Generate Button */}
              <section className="pt-4 flex justify-center">
                <GenerateButton
                  onClick={handleGenerate}
                  isGenerating={isGenerating}
                  disabled={!isReady}
                />
              </section>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              {/* Back Button */}
              <Button
                variant="ghost"
                onClick={handleReset}
                className="mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                New Upload
              </Button>

              {/* Stats */}
              <StatsBar clipCount={clips.length} duration={duration} />

              {/* Video Player */}
              <div className="py-4">
                <VideoPlayer
                  clips={clips}
                  onShuffle={handleShuffle}
                  onReset={handleReset}
                />
              </div>

              {/* Instructions */}
              <div className="text-center text-sm text-muted-foreground space-y-1">
                <p>Swipe up/down or use arrow keys to navigate</p>
                <p>Press space to pause/play</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
