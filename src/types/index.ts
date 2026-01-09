export interface VideoClip {
  id: string;
  content: string;
  duration: number;
  backgroundUrl: string;
  order: number;
}

export interface ParsedContent {
  id: string;
  title: string;
  clips: VideoClip[];
  totalDuration: number;
  createdAt: Date;
}

export type VideoDuration = 15 | 30 | 60;

export interface UploadState {
  status: 'idle' | 'uploading' | 'parsing' | 'generating' | 'complete' | 'error';
  progress: number;
  message: string;
}
