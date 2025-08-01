import { api, ApiError } from './api'
import { ChatMessage, ExtractedTask } from '@/components/ui/ChatGPTIntegration'

export interface ChatCompletionRequest {
  messages: ChatMessage[]
  model?: string
  temperature?: number
  maxTokens?: number
  stream?: boolean
  jsonMode?: boolean
}

export interface ChatCompletionResponse {
  data: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model: string
  requestId?: string
  processingTimeMs: number
}

export interface TaskExtractionRequest {
  text: string
  maxTasks?: number
}

export interface BackendTask {
  id: string
  name: string
  description: string
  priority: number
  estimatedHours: number
  dependencies: string[]
  tags: string[]
}

export interface TaskExtractionResponse {
  data: BackendTask[]
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model: string
  requestId?: string
  processingTimeMs: number
}

// Convert backend Task to frontend ExtractedTask format
function convertBackendTaskToExtractedTask(backendTask: BackendTask): ExtractedTask {
  return {
    title: backendTask.name,
    priority: backendTask.priority >= 8 ? 'high' : backendTask.priority >= 5 ? 'medium' : 'low',
    dueDate: undefined, // Backend doesn't provide due dates for extracted tasks
    project: backendTask.tags.find(tag => tag.includes('project')) || undefined,
    estimatedDuration: backendTask.estimatedHours * 60, // Convert hours to minutes
  }
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
          content: msg.content
        })),
        model: request.model || 'gpt-4o-mini',
        temperature: request.temperature || 0.7,
        maxTokens: request.maxTokens || 1000,
        stream: request.stream || false,
        jsonMode: request.jsonMode || false
      })
      
      return response
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(`AI service error: ${error.message}`)
      }
      throw new Error('Failed to send chat message')
    }
  },

  /**
   * Extract tasks from conversation text
   */
  async extractTasks(request: TaskExtractionRequest): Promise<ExtractedTask[]> {
    try {
      const response = await api.post<TaskExtractionResponse>('/api/ai/extract-tasks', {
        text: request.text,
        maxTasks: request.maxTasks || 10
      })
      
      // Convert backend Task format to frontend ExtractedTask format
      return response.data.map(convertBackendTaskToExtractedTask)
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(`Task extraction error: ${error.message}`)
      }
      throw new Error('Failed to extract tasks')
    }
  },

  /**
   * Check if AI service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      await api.get('/api/ai/health')
      return true
    } catch (error) {
      return false
    }
  }
}
