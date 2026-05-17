export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  completion_tokens_details?: {
    reasoning_tokens?: number;
  };
  prompt_tokens_details?: {
    cached_tokens?: number;
  };
}

export interface LLMResponse {
  content: string;
  reasoning?: string;
  usage?: LLMUsage;
  finishReason?: string;
}

export interface ImageGenerationData {
  url: string;
  size?: string;
}

export interface ImageResponse {
  urls: string[];
  size?: string;
  usage?: {
    generated_images: number;
    output_tokens: number;
    total_tokens: number;
  };
}

export type ProviderErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'RATE_LIMIT'
  | 'SERVER_ERROR'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'INVALID_RESPONSE'
  | 'UNKNOWN';

export interface ProviderError {
  code: ProviderErrorCode;
  message: string;
  status?: number;
  recoverable: boolean;
  originalError?: unknown;
}

export interface LogEntry {
  timestamp: number;
  level: 'info' | 'warn' | 'error';
  service: 'chat' | 'image' | 'tts';
  provider: string;
  message: string;
  duration?: number;
  status?: number;
  errorCode?: ProviderErrorCode;
  extra?: Record<string, unknown>;
}

export interface ChatRequest {
  characterId: string;
  systemPrompt: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  temperature?: number;
}

export interface ImageRequest {
  prompt: string;
  uid: string;
  size?: string;
  watermark?: boolean;
}

export interface TTSRequest {
  text: string;
  speaker: string;
  uid: string;
}

export interface ChatResponse {
  reply: string;
  error?: string;
}

export interface ImageApiResponse {
  imageUri: string;
  error?: string;
}

export interface TTSResponse {
  audioUri: string;
  audioSize: number;
  error?: string;
}
