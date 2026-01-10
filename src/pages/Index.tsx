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
    <div className="min-h-screen bg-background">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-secondary/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <Header />

        <main className="container max-w-4xl mx-auto px-4 py-8">
          {clips.length === 0 ? (
            <div className="space-y-8 animate-fade-in">
              {/* Upload Section */}
              <section className="space-y-4">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-display font-semibold mb-2">
                    Upload Your Study Material
                  </h2>
                  <p className="text-muted-foreground">
                    Transform boring notes into addictive short-form content
                  </p>
                </div>
                <FileUpload 
                  onFileContent={handleFileContent}
                  uploadState={uploadState}
                  setUploadState={setUploadState}
                />
                {fileName && (
                  <p className="text-center text-sm text-muted-foreground">
                    Loaded: <span className="text-primary font-medium">{fileName}</span>
                  </p>
                )}
              </section>

              {/* Duration Selector */}
              <section className={`transition-opacity duration-300 ${isReady ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <DurationSelector selected={duration} onSelect={setDuration} />
              </section>

              {/* Generate Button */}
              <section className="pt-4">
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
