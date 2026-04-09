export interface Team {
  id: string;
  name: string;
  password: string;
  xp: number;
  createdAt: string;
  disabled?: boolean;
}

export interface Session {
  id: string;
  teamId: string;
  createdAt: string;
  expiresAt: string;
}

export type GalleryItemType = 'chat' | 'voice' | 'vision' | 'chain';

export interface GalleryItem {
  id: string;
  teamId: string;
  teamName: string;
  type: GalleryItemType;
  title: string;
  description?: string;
  data: unknown;
  createdAt: string;
  views: number;
  forks: number;
  featured: boolean;
}

export interface ChainBlock {
  id: string;
  type: ChainBlockType;
  config: Record<string, unknown>;
}

export type ChainBlockType =
  | 'input-text'
  | 'input-image'
  | 'input-audio'
  | 'process-chat-gpt'
  | 'process-chat-claude'
  | 'process-transcribe'
  | 'process-tts'
  | 'process-vision-gpt'
  | 'process-vision-claude'
  | 'process-translate'
  | 'process-extract-json'
  | 'process-summarize'
  | 'output-text'
  | 'output-audio'
  | 'output-image';

export interface Chain {
  id: string;
  teamId: string;
  teamName: string;
  name: string;
  description?: string;
  blocks: ChainBlock[];
  createdAt: string;
  forkedFrom?: string;
  runs: number;
}

export interface ChainExecution {
  chainId: string;
  teamId: string;
  timestamp: string;
  blockResults: Array<{
    blockId: string;
    blockType: ChainBlockType;
    input: unknown;
    output: unknown;
    durationMs: number;
    error?: string;
  }>;
  success: boolean;
  totalDurationMs: number;
}

export interface ActivityEvent {
  id: string;
  teamId: string;
  teamName: string;
  type: 'login' | 'chat-saved' | 'voice-saved' | 'vision-saved' | 'chain-saved' | 'chain-run' | 'chain-forked' | 'item-featured';
  message: string;
  messageFr: string;
  timestamp: string;
}

export interface UsageRecord {
  teamId: string;
  hour: string;
  calls: number;
  estimatedCostUsd: number;
}

export interface Config {
  dailyChallenge: {
    en: string;
    fr: string;
  };
  dailyChallengeUpdatedAt: string;
  enabledModules: {
    chat: boolean;
    voice: boolean;
    vision: boolean;
    chain: boolean;
    gallery: boolean;
  };
  rateLimitPerHour: number;
  broadcastMessage?: {
    en: string;
    fr: string;
    expiresAt: string;
  };
}
