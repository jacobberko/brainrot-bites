import { useState, useCallback } from 'react';
import { Upload, FileText, Loader2, Sparkles } from 'lucide-react';
import { UploadState } from '@/types';
import { cn } from '@/lib/utils';
import * as pdfjsLib from 'pdfjs-dist';

// Set the worker source for pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

interface FileUploadProps {
  onFileContent: (content: string, fileName: string) => void;
  uploadState: UploadState;
  setUploadState: (state: UploadState) => void;
}

async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n\n';
  }
  
  return fullText;
}

export function FileUpload({ onFileContent, uploadState, setUploadState }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!file) return;

    const validTypes = ['text/plain', 'application/pdf', 'text/markdown', '.txt', '.md', '.pdf'];
    const isValid = validTypes.some(type => 
      file.type.includes(type) || file.name.endsWith('.txt') || file.name.endsWith('.md') || file.name.endsWith('.pdf')
    );

    if (!isValid) {
      setUploadState({
        status: 'error',
        progress: 0,
        message: 'Please upload a .txt, .md, or .pdf file',
      });
      return;
    }

    setUploadState({
      status: 'uploading',
      progress: 30,
      message: 'Reading file...',
    });

    try {
      let text: string;
      
      if (file.name.endsWith('.pdf') || file.type === 'application/pdf') {
        setUploadState({
          status: 'parsing',
          progress: 50,
          message: 'Extracting text from PDF...',
        });
        text = await extractTextFromPDF(file);
      } else {
        text = await file.text();
      }
      
      setUploadState({
        status: 'parsing',
        progress: 80,
        message: 'Parsing content...',
      });

      // Simulate parsing delay for UX
      await new Promise(resolve => setTimeout(resolve, 500));

      setUploadState({
        status: 'complete',
        progress: 100,
        message: 'Ready to generate!',
      });

      onFileContent(text, file.name);
    } catch (error) {
      console.error('File parsing error:', error);
      setUploadState({
        status: 'error',
        progress: 0,
        message: 'Failed to read file. Please try again.',
      });
    }
  }, [onFileContent, setUploadState]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const isLoading = uploadState.status === 'uploading' || uploadState.status === 'parsing';

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        'relative w-full max-w-xl mx-auto p-8 rounded-2xl transition-all duration-300 cursor-pointer group',
        'gradient-border',
        isDragging && 'scale-105 glow-primary',
        uploadState.status === 'complete' && 'glow-accent',
        uploadState.status === 'error' && 'border-destructive'
      )}
    >
      <input
        type="file"
        accept=".txt,.md,.pdf,text/plain,text/markdown"
        onChange={handleInputChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        disabled={isLoading}
      />

      <div className="flex flex-col items-center gap-6 text-center">
        <div className={cn(
          'p-6 rounded-2xl glass transition-all duration-300',
          isDragging && 'scale-110 glow-primary',
          uploadState.status === 'complete' && 'glow-accent'
        )}>
          {isLoading ? (
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          ) : uploadState.status === 'complete' ? (
            <Sparkles className="w-12 h-12 text-accent" />
          ) : (
            <Upload className={cn(
              'w-12 h-12 transition-colors duration-300',
              isDragging ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
            )} />
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-display font-semibold">
            {isLoading ? uploadState.message : 
             uploadState.status === 'complete' ? 'File Ready!' :
             'Drop your notes here'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {uploadState.status === 'idle' && 'Upload .txt, .md, or .pdf files'}
            {uploadState.status === 'error' && (
              <span className="text-destructive">{uploadState.message}</span>
            )}
            {uploadState.status === 'complete' && 'Configure your video settings below'}
          </p>
        </div>

        {isLoading && (
          <div className="w-full max-w-xs">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 ease-out"
                style={{ width: `${uploadState.progress}%` }}
              />
            </div>
          </div>
        )}

        {uploadState.status === 'idle' && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <FileText className="w-4 h-4" />
            <span>Supports textbooks, lecture notes, study guides</span>
          </div>
        )}
      </div>
    </div>
  );
}
