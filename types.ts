
export interface StoryboardScene {
  id: number;
  title: string;
  description: string;
  visualPrompt: string;
  imageUrl?: string;
}

export interface StoryboardData {
  scenes: StoryboardScene[];
}

export enum AppStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  GENERATING_IMAGES = 'GENERATING_IMAGES',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface ProcessingState {
  status: AppStatus;
  progress: number;
  message: string;
  error?: string;
}
