export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableStatusCodes: number[];
}

export interface OpenAIConfig {
  apiKey: string;
  baseURL?: string;
  organization?: string;
  project?: string;
  timeout: number;
  maxTokens: number;
  defaultModel: string;
  retry: RetryConfig;
}

export interface OpenAIResponse<T = any> {
  data: T;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  requestId?: string;
  processingTimeMs: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  jsonMode?: boolean;
  stop?: string[];
}

export interface CompletionRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stop?: string[];
  stream?: boolean;
}

export interface TaskGenerationRequest {
  projectDescription: string;
  context?: string;
  maxTasks?: number;
}

export interface Task {
  id: string;
  name: string;
  description: string;
  priority: number;
  estimatedHours: number;
  dependencies: string[];
  tags: string[];
}

export interface Suggestion {
  type: 'improvement' | 'feature' | 'optimization' | 'bug-fix';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  priority: number;
}

export interface SummaryResponse {
  summary: string;
  keyPoints: string[];
  originalLength: number;
  summaryLength: number;
  compressionRatio: number;
}
