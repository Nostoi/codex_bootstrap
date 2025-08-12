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
      console.warn('AI service not available, using mock response');
      if (error instanceof ApiError) {
        throw new Error(`AI service error: ${error.message}`);
      }

      // Return a mock response for testing when backend is not configured
      const mockResponse: ChatCompletionResponse = {
        data: this.generateMockResponse(request.messages),
        model: 'gpt-4o-mini-mock',
        requestId: `mock-${Date.now()}`,
        processingTimeMs: 100,
      };

      return mockResponse;
    }
  },

  /**
   * Generate a mock response for testing
   */
  generateMockResponse(messages: ChatMessage[]): string {
    const lastMessage = messages[messages.length - 1];
    const content = lastMessage?.content?.toLowerCase() || '';

    if (content.includes('task') || content.includes('todo')) {
      return "I can help you with task management! I notice you mentioned tasks. You can use the 'Extract Tasks' button to pull actionable items from our conversation. I'm currently running in demo mode, but the task extraction should still work!";
    }

    if (content.includes('prioritize') || content.includes('priority')) {
      return 'For ADHD-friendly prioritization, I recommend:\n\n1. **Energy matching**: Do high-energy tasks when you feel alert\n2. **Time boxing**: Break large tasks into 15-90 minute chunks\n3. **Focus batching**: Group similar tasks together\n4. **Quick wins**: Start with easy tasks to build momentum\n\nTry the task extraction feature to see how I can classify tasks by energy and focus type!';
    }

    if (content.includes('energy') || content.includes('focus')) {
      return 'Understanding your energy patterns is key for ADHD productivity:\n\n🔴 **High Energy**: Complex problem-solving, creative work, important decisions\n🟡 **Medium Energy**: Routine tasks, meetings, administrative work\n🟢 **Low Energy**: Simple tasks, organizing, light communication\n\nI can help classify your tasks by energy level and focus type!';
    }

    return "I'm your AI assistant, currently running in demo mode since the OpenAI service isn't fully configured. I can still help you extract tasks from text and provide ADHD-optimized productivity advice. Try typing some tasks or use the quick test buttons!";
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
      console.warn('AI task extraction not available, using mock extraction');

      // Return mock tasks for testing
      return this.generateMockTasks(request.text);
    }
  },

  /**
   * Generate mock tasks for testing when backend is not available
   */
  generateMockTasks(text: string): ExtractedTask[] {
    const tasks: ExtractedTask[] = [];

    // Simple pattern matching for common task phrases
    const taskPatterns = [
      {
        pattern: /call\s+(.+?)(?:\s|$|,|\.)/gi,
        priority: 'medium' as const,
        energyLevel: 'medium' as const,
        focusType: 'administrative' as const,
      },
      {
        pattern: /buy\s+(.+?)(?:\s|$|,|\.)/gi,
        priority: 'low' as const,
        energyLevel: 'low' as const,
        focusType: 'administrative' as const,
      },
      {
        pattern: /finish\s+(.+?)(?:\s|$|,|\.)/gi,
        priority: 'high' as const,
        energyLevel: 'high' as const,
        focusType: 'technical' as const,
      },
      {
        pattern: /write\s+(.+?)(?:\s|$|,|\.)/gi,
        priority: 'medium' as const,
        energyLevel: 'medium' as const,
        focusType: 'creative' as const,
      },
      {
        pattern: /meet\s+(.+?)(?:\s|$|,|\.)/gi,
        priority: 'medium' as const,
        energyLevel: 'medium' as const,
        focusType: 'collaborative' as const,
      },
      {
        pattern: /review\s+(.+?)(?:\s|$|,|\.)/gi,
        priority: 'medium' as const,
        energyLevel: 'low' as const,
        focusType: 'technical' as const,
      },
    ];

    taskPatterns.forEach(({ pattern, priority, energyLevel, focusType }, index) => {
      let match;
      while ((match = pattern.exec(text)) !== null && tasks.length < 5) {
        const taskTitle = `${match[0].trim()}`;
        if (taskTitle.length > 3) {
          tasks.push({
            title: taskTitle.charAt(0).toUpperCase() + taskTitle.slice(1),
            priority,
            energyLevel,
            focusType,
            estimatedDuration: 30 + index * 15, // Vary duration
            complexity: Math.ceil((index + 1) / 2),
          });
        }
      }
    });

    // If no patterns matched, create a generic task
    if (tasks.length === 0 && text.trim()) {
      tasks.push({
        title: text.length > 50 ? text.substring(0, 47) + '...' : text,
        priority: 'medium',
        energyLevel: 'medium',
        focusType: 'administrative',
        estimatedDuration: 30,
      });
    }

    return tasks;
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
