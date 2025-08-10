import { api, ApiError } from './api';
import { ChatMessage, ExtractedTask } from '@/components/ui/ChatGPTIntegration';

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  jsonMode?: boolean;
}

export interface ChatCompletionResponse {
  data: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  requestId?: string;
  processingTimeMs: number;
}

export interface TaskExtractionRequest {
  text: string;
  maxTasks?: number;
}

export interface BackendTask {
  id: string;
  name: string;
  description: string;
  priority: number;
  estimatedHours: number;
  dependencies: string[];
  tags: string[];
  flags?: string[]; // For sensitive data detection and other flags
}

export interface TaskExtractionResponse {
  data: BackendTask[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  requestId?: string;
  processingTimeMs: number;
}

// Convert backend Task to frontend ExtractedTask format
function convertBackendTaskToExtractedTask(backendTask: BackendTask): ExtractedTask {
  return {
    title: backendTask.name,
    priority: backendTask.priority >= 8 ? 'high' : backendTask.priority >= 5 ? 'medium' : 'low',
    dueDate: (backendTask as any).dueDate || undefined, // Include dueDate if provided by AI
    project: backendTask.tags.find(tag => tag.includes('project')) || undefined,
    estimatedDuration: backendTask.estimatedHours * 60, // Convert hours to minutes
    // Include AI classification metadata if present
    energyLevel: (backendTask as any).energyLevel,
    focusType: (backendTask as any).focusType,
    complexity: (backendTask as any).complexity,
    flags: backendTask.flags, // Pass through flags for sensitive data detection
  };
}

export const aiService = {
  /**
   * Send a chat message to the AI service
   */
  async sendChatMessage(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    try {
      const response = await api.post<ChatCompletionResponse>('/api/ai/chat', {
        messages: request.messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        model: request.model || 'gpt-4o-mini',
        temperature: request.temperature || 0.7,
        maxTokens: request.maxTokens || 1000,
        stream: request.stream || false,
        jsonMode: request.jsonMode || false,
      });

      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(`AI service error: ${error.message}`);
      }
      throw new Error('Failed to send chat message');
    }
  },

  /**
   * Extract tasks from conversation text
   */
  async extractTasks(request: TaskExtractionRequest): Promise<ExtractedTask[]> {
    try {
      const response = await api.post<TaskExtractionResponse>('/api/ai/extract-tasks', {
        text: request.text,
        maxTasks: request.maxTasks || 10,
      });

      // Convert backend Task format to frontend ExtractedTask format
      return response.data.map(convertBackendTaskToExtractedTask);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 408) {
          throw new Error('Request timed out');
        } else if (error.status === 429) {
          throw new Error('API quota limit exceeded');
        }
        throw new Error(`Task extraction error: ${error.message}`);
      }
      throw new Error('Failed to extract tasks');
    }
  },

  /**
   * Check if AI service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      await api.get('/api/ai/health');
      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Extract tasks from email content
   */
  async extractTasksFromEmails(
    emails: Array<{
      id: string;
      subject: string;
      from: string;
      date: string;
      content: string;
      snippet?: string;
    }>
  ): Promise<ExtractedTask[]> {
    try {
      const response = await api.post<TaskExtractionResponse>('/api/email-ai/extract-tasks', {
        emails,
      });

      // Convert backend Task format to frontend ExtractedTask format
      return response.data.map(convertBackendTaskToExtractedTask);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(`Email task extraction error: ${error.message}`);
      }
      throw new Error('Failed to extract tasks from emails');
    }
  },

  /**
   * Get Gmail messages for task extraction
   */
  async getGmailMessagesForTasks(userId: string, daysBack: number = 7): Promise<any[]> {
    try {
      const response = await api.get<any[]>(`/api/integrations/google/gmail/${userId}/tasks`, {
        params: { daysBack },
      });
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(`Gmail integration error: ${error.message}`);
      }
      throw new Error('Failed to get Gmail messages');
    }
  },

  /**
   * Get Outlook messages for task extraction
   */
  async getOutlookMessagesForTasks(userId: string, daysBack: number = 7): Promise<any[]> {
    try {
      const response = await api.get<any[]>(`/api/integrations/microsoft/mail/${userId}/tasks`, {
        params: { daysBack },
      });
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(`Outlook integration error: ${error.message}`);
      }
      throw new Error('Failed to get Outlook messages');
    }
  },

  /**
   * Extract tasks from both Gmail and Outlook emails
   */
  async extractTasksFromAllEmails(
    userId: string,
    daysBack: number = 7,
    provider: 'google' | 'microsoft' | 'both' = 'both'
  ): Promise<{
    tasks: ExtractedTask[];
    emailsProcessed: number;
    tasksExtracted: number;
    usage?: any;
    processingTimeMs?: number;
  }> {
    try {
      const response = await api.get<any>(`/api/email-ai/${userId}/extract-tasks`, {
        params: { daysBack, provider },
      });

      // Convert backend response format
      const tasks = response.data.tasks?.map(convertBackendTaskToExtractedTask) || [];

      return {
        tasks,
        emailsProcessed: response.data.emailsProcessed || 0,
        tasksExtracted: response.data.tasksExtracted || 0,
        usage: response.data.usage,
        processingTimeMs: response.data.processingTimeMs,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(`Email task extraction error: ${error.message}`);
      }
      throw new Error('Failed to extract tasks from emails');
    }
  },

  /**
   * Classify email for task extraction relevance
   */
  async classifyEmailForTasks(email: {
    subject: string;
    from: string;
    content: string;
    snippet?: string;
  }): Promise<{
    hasActionableContent: boolean;
    confidence: number;
    categories: string[];
    urgency: 'high' | 'medium' | 'low';
  }> {
    try {
      const response = await api.post<any>(`/api/email-ai/classify-email`, email);
      return (
        response.data || {
          hasActionableContent: false,
          confidence: 0,
          categories: [],
          urgency: 'low',
        }
      );
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(`Email classification error: ${error.message}`);
      }
      throw new Error('Failed to classify email');
    }
  },
};
