import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { getErrorMessage } from '../common/utils/error.utils';
import { Mem0Service } from './mem0.service';
import { RetryService } from './services/retry.service';
import {
  OpenAIException,
  OpenAIRateLimitException,
  OpenAIQuotaExceededException,
  OpenAIInvalidRequestException,
  OpenAIUnauthorizedException,
  OpenAIServerException,
  OpenAITimeoutException,
} from './exceptions/openai.exceptions';
import {
  OpenAIConfig,
  OpenAIResponse,
  ChatCompletionRequest,
  CompletionRequest,
  Task,
  Suggestion,
  SummaryResponse,
  ChatMessage,
} from './interfaces/openai.interfaces';
import {
  TaskGenerationDto,
  TaskExtractionDto,
  SuggestionRequestDto,
  SummarizationDto,
} from './dto/openai.dto';
import { getTaskExtractionValidator, getTaskClassificationValidator } from './schemas/validate';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openai: OpenAI;
  private readonly config: OpenAIConfig;
  private readonly taskExtractionValidator;
  private readonly taskClassificationValidator;

  constructor(
    private configService: ConfigService,
    private mem0Service: Mem0Service,
    private retryService: RetryService
  ) {
    this.config = this.loadConfig();
    this.openai = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseURL,
      organization: this.config.organization,
      project: this.config.project,
      timeout: this.config.timeout,
    });

    // Initialize JSON schema validators
    this.taskExtractionValidator = getTaskExtractionValidator();
    this.taskClassificationValidator = getTaskClassificationValidator();
  }

  private loadConfig(): OpenAIConfig {
    return {
      apiKey: this.configService.get<string>('OPENAI_API_KEY') || '',
      baseURL: this.configService.get<string>('OPENAI_BASE_URL'),
      organization: this.configService.get<string>('OPENAI_ORGANIZATION'),
      project: this.configService.get<string>('OPENAI_PROJECT'),
      timeout: this.configService.get<number>('OPENAI_TIMEOUT', 30000),
      maxTokens: this.configService.get<number>('OPENAI_MAX_TOKENS', 4096),
      defaultModel: this.configService.get<string>('OPENAI_DEFAULT_MODEL', 'gpt-4o-mini'),
      retry: {
        maxRetries: this.configService.get<number>('OPENAI_MAX_RETRIES', 3),
        baseDelay: this.configService.get<number>('OPENAI_BASE_DELAY', 1000),
        maxDelay: this.configService.get<number>('OPENAI_MAX_DELAY', 10000),
        backoffMultiplier: this.configService.get<number>('OPENAI_BACKOFF_MULTIPLIER', 2),
        retryableStatusCodes: [429, 500, 502, 503, 504],
      },
    };
  }

  async generateTasks(dto: TaskGenerationDto): Promise<OpenAIResponse<Task[]>> {
    const prompt = this.buildTaskGenerationPrompt(dto);
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content:
          'You are a project management assistant. Generate actionable tasks in valid JSON format.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    try {
      const startTime = Date.now();
      const response = await this.chatCompletion({
        messages,
        model: this.config.defaultModel,
        temperature: 0.7,
        maxTokens: 2000,
        jsonMode: true,
      });

      const tasks = this.parseTasksResponse(response.data);

      // Store context in memory
      await this.mem0Service.storeInteraction(
        `Task generation for project: ${dto.projectDescription}. Generated ${tasks.length} tasks.`
      );

      return {
        data: tasks,
        usage: response.usage,
        model: response.model,
        requestId: response.requestId,
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error('Error generating tasks:', error);
      throw this.handleError(error);
    }
  }

  async extractTasks(dto: TaskExtractionDto): Promise<OpenAIResponse<Task[]>> {
    const prompt = this.buildTaskExtractionPrompt(dto);
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content:
          'You are an AI assistant specialized in extracting actionable tasks for ADHD users. Focus on creating clear, specific tasks that reduce cognitive load and support executive function. Break complex work into manageable chunks (15-90 minutes), provide clear completion criteria, and consider energy levels and focus types for optimal scheduling.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    try {
      const startTime = Date.now();
      const response = await this.chatCompletion({
        messages,
        model: this.config.defaultModel,
        temperature: 0.3,
        maxTokens: 2000,
        jsonMode: true,
      });

      const tasks = this.parseTasksResponse(response.data);

      // Store context in memory
      await this.mem0Service.storeInteraction(
        `Task extraction from conversation text. Extracted ${tasks.length} tasks.`
      );

      return {
        data: tasks,
        usage: response.usage,
        model: response.model,
        requestId: response.requestId,
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error('Error extracting tasks:', error);
      throw this.handleError(error);
    }
  }

  async classifyTask(taskDescription: string): Promise<OpenAIResponse<any>> {
    const prompt = this.buildTaskClassificationPrompt(taskDescription);
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content:
          'You are an ADHD-aware task classification assistant. Analyze tasks and predict metadata that optimizes for ADHD executive function: appropriate energy levels for scheduling, focus types for batching, realistic time estimates considering time perception challenges, and helpful completion strategies.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    try {
      const startTime = Date.now();
      const response = await this.chatCompletion({
        messages,
        model: this.config.defaultModel,
        temperature: 0.3,
        maxTokens: 500,
        jsonMode: true,
      });

      const classification = this.parseTaskClassificationResponse(response.data);

      // Store context in memory
      await this.mem0Service.storeInteraction(
        `Task classification for: ${taskDescription}. Predicted metadata.`
      );

      return {
        data: classification,
        usage: response.usage,
        model: response.model,
        requestId: response.requestId,
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error('Error classifying task:', error);
      throw this.handleError(error);
    }
  }

  async getSuggestions(dto: SuggestionRequestDto): Promise<OpenAIResponse<Suggestion[]>> {
    const prompt = this.buildSuggestionsPrompt(dto);
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content:
          'You are a technical advisor. Provide actionable suggestions in valid JSON format.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    try {
      const startTime = Date.now();
      const response = await this.chatCompletion({
        messages,
        model: this.config.defaultModel,
        temperature: 0.8,
        maxTokens: 1500,
        jsonMode: true,
      });

      const suggestions = this.parseSuggestionsResponse(response.data);

      return {
        data: suggestions,
        usage: response.usage,
        model: response.model,
        requestId: response.requestId,
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error('Error getting suggestions:', error);
      throw this.handleError(error);
    }
  }

  async summarize(dto: SummarizationDto): Promise<OpenAIResponse<SummaryResponse>> {
    const prompt = this.buildSummarizationPrompt(dto);
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content:
          'You are a summarization expert. Provide concise summaries in the requested format.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    try {
      const startTime = Date.now();
      const response = await this.chatCompletion({
        messages,
        model: this.config.defaultModel,
        temperature: 0.3,
        maxTokens: (dto.maxLength || 200) * 2,
        jsonMode: true,
      });

      const summary = this.parseSummaryResponse(response.data, dto.text);

      return {
        data: summary,
        usage: response.usage,
        model: response.model,
        requestId: response.requestId,
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error('Error summarizing text:', error);
      throw this.handleError(error);
    }
  }

  async chatCompletion(request: ChatCompletionRequest): Promise<OpenAIResponse<string>> {
    const operation = async () => {
      try {
        const completion = await this.openai.chat.completions.create({
          model: request.model || this.config.defaultModel,
          messages: request.messages,
          temperature: request.temperature || 0.7,
          max_tokens: request.maxTokens || this.config.maxTokens,
          stream: false, // Force non-streaming to handle types properly
          response_format: request.jsonMode ? { type: 'json_object' } : undefined,
          stop: request.stop,
        });

        // Type assertion for non-streaming response
        const nonStreamCompletion = completion as OpenAI.Chat.Completions.ChatCompletion;

        return {
          data: nonStreamCompletion.choices[0].message.content || '',
          usage: {
            promptTokens: nonStreamCompletion.usage?.prompt_tokens || 0,
            completionTokens: nonStreamCompletion.usage?.completion_tokens || 0,
            totalTokens: nonStreamCompletion.usage?.total_tokens || 0,
          },
          model: nonStreamCompletion.model,
          requestId: nonStreamCompletion.id,
          processingTimeMs: 0, // Will be set by caller
        };
      } catch (error) {
        throw this.handleError(error);
      }
    };

    return this.retryService.executeWithRetry(
      operation,
      this.config.retry,
      'OpenAI Chat Completion'
    );
  }

  async healthCheck(): Promise<{
    status: string;
    timestamp: Date;
    version: string;
  }> {
    try {
      // Test a simple completion to verify OpenAI connectivity
      const testMessages: ChatMessage[] = [
        {
          role: 'user',
          content: "Respond with 'OK' if you can hear me.",
        },
      ];

      const response = await this.chatCompletion({
        messages: testMessages,
        model: this.config.defaultModel,
        temperature: 0,
        maxTokens: 10,
      });

      const isHealthy = response.data && response.data.trim().toLowerCase().includes('ok');

      return {
        status: isHealthy ? 'healthy' : 'degraded',
        timestamp: new Date(),
        version: '1.0.0',
      };
    } catch (error) {
      this.logger.error('Health check failed:', getErrorMessage(error));
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        version: '1.0.0',
      };
    }
  }

  async completion(request: CompletionRequest): Promise<OpenAIResponse<string>> {
    // Note: Completions API is legacy, but including for completeness
    const chatRequest: ChatCompletionRequest = {
      messages: [{ role: 'user', content: request.prompt }],
      model: request.model,
      temperature: request.temperature,
      maxTokens: request.maxTokens,
      stream: request.stream,
      stop: request.stop,
    };

    return this.chatCompletion(chatRequest);
  }

  private buildTaskGenerationPrompt(dto: TaskGenerationDto): string {
    return `
Based on the following project description${dto.context ? ' and context' : ''}, generate ${dto.maxTasks || 10} actionable tasks:

Project: ${dto.projectDescription}
${dto.context ? `Context: ${dto.context}` : ''}

Generate specific, actionable tasks that would help complete this project.
Return as a JSON object with a "tasks" array containing objects with:
- id: unique identifier (string)
- name: task name (string)
- description: detailed description (string)
- priority: priority level 1-10 (number)
- estimatedHours: estimated time in hours (number)
- dependencies: array of task IDs this depends on (string[])
- tags: relevant tags for categorization (string[])

Example format:
{
  "tasks": [
    {
      "id": "task-1",
      "name": "Setup development environment",
      "description": "Configure development tools and dependencies",
      "priority": 9,
      "estimatedHours": 4,
      "dependencies": [],
      "tags": ["setup", "infrastructure"]
    }
  ]
}
    `.trim();
  }

  private buildTaskExtractionPrompt(dto: TaskExtractionDto): string {
    return `
Analyze the following text and extract up to ${dto.maxTasks || 10} actionable tasks for an ADHD-optimized task management system:

Text: ${dto.text}

ADHD-Focused Instructions:
- Identify specific, concrete tasks with clear completion criteria
- Break down complex tasks into manageable subtasks (15-90 minute chunks)
- Extract tasks that have clear actionable outcomes to prevent overwhelm
- Include implied tasks but make them explicit and specific
- Consider energy levels: HIGH (creative/strategic), MEDIUM (analysis/planning), LOW (routine/administrative)
- Prioritize based on urgency and importance, noting hard vs. soft deadlines
- Estimate realistic time considering ADHD time perception challenges

Return as a JSON object with a "tasks" array containing objects with:
- id: unique identifier (string)
- name: concise, action-oriented task name (string)
- description: detailed description with clear success criteria and context (string)
- priority: priority level 1-10 based on urgency/importance (number)
- estimatedHours: realistic time estimate in hours (number)
- energyLevel: "LOW", "MEDIUM", or "HIGH" (predicted energy requirement)
- focusType: "CREATIVE", "TECHNICAL", "ADMINISTRATIVE", or "SOCIAL" (predicted focus type)
- dependencies: array of task IDs this depends on (string[])
- tags: relevant tags for categorization and filtering (string[])

Example format:
{
  "tasks": [
    {
      "id": "extracted-1",
      "name": "Schedule team sync meeting",
      "description": "Set up 1-hour team meeting to discuss project status and next steps by end of week",
      "priority": 7,
      "estimatedHours": 0.25,
      "energyLevel": "LOW",
      "focusType": "ADMINISTRATIVE",
      "dependencies": [],
      "tags": ["meeting", "communication", "team"]
    }
  ]
}
    `.trim();
  }

  private buildSuggestionsPrompt(dto: SuggestionRequestDto): string {
    return `
Based on the following context, provide ${dto.type} suggestions:

Context: ${dto.context}
${dto.codebase ? `Codebase: ${dto.codebase}` : ''}

Generate 3-5 specific suggestions for ${dto.type}.
Return as a JSON object with a "suggestions" array containing objects with:
- type: suggestion type (string)
- title: suggestion title (string)
- description: detailed description (string)
- impact: expected impact "low" | "medium" | "high" (string)
- effort: required effort "low" | "medium" | "high" (string)
- priority: priority score 1-10 (number)

Example format:
{
  "suggestions": [
    {
      "type": "${dto.type}",
      "title": "Implement caching layer",
      "description": "Add Redis caching to improve performance",
      "impact": "high",
      "effort": "medium",
      "priority": 8
    }
  ]
}
    `.trim();
  }

  private buildSummarizationPrompt(dto: SummarizationDto): string {
    return `
Summarize the following text in ${dto.maxLength || 200} words or less, using ${dto.format || 'paragraph'} format:

${dto.text}

Return as a JSON object with:
- summary: the main summary text (string)
- keyPoints: array of key points (string[])
- originalLength: character count of original text (number)
- summaryLength: character count of summary (number)
- compressionRatio: ratio of compression (number)

Example format:
{
  "summary": "Main summary text here...",
  "keyPoints": ["Key point 1", "Key point 2"],
  "originalLength": 1000,
  "summaryLength": 200,
  "compressionRatio": 0.8
}
    `.trim();
  }

  private buildTaskClassificationPrompt(taskDescription: string): string {
    return `
Analyze the following task and predict its metadata characteristics for an ADHD-optimized task management system:

Task: ${taskDescription}

Based on the task description, predict the following metadata in JSON format:
- energyLevel: "LOW" (routine/administrative work, best when tired), "MEDIUM" (focused analysis/planning), or "HIGH" (creative/strategic work requiring peak mental energy)
- focusType: "CREATIVE" (writing/design/brainstorming), "TECHNICAL" (coding/debugging/analysis), "ADMINISTRATIVE" (email/reports/data entry), or "SOCIAL" (meetings/calls/collaboration)
- estimatedMinutes: realistic time estimate in minutes (consider ADHD time perception challenges)
- priority: priority level 1-5 (number, where 5 is urgent/critical with hard deadlines)
- softDeadline: suggested deadline if applicable (ISO date string or null)
- hardDeadline: absolute deadline if applicable (ISO date string or null)
- source: "SELF", "BOSS", "TEAM", or "AI_GENERATED"
- aiSuggestion: ADHD-friendly tip for completing this task (consider energy management, focus strategies, or breaking down complexity)

Return only valid JSON in this format:
{
  "energyLevel": "MEDIUM",
  "focusType": "TECHNICAL",
  "estimatedMinutes": 60,
  "priority": 3,
  "softDeadline": null,
  "hardDeadline": null,
  "source": "AI_GENERATED",
  "aiSuggestion": "Break this task into smaller chunks for better focus"
}
    `.trim();
  }

  private parseTaskClassificationResponse(response: string): any {
    try {
      const parsed = JSON.parse(response);

      // Validate against JSON schema
      const isValid = this.taskClassificationValidator(parsed);

      if (!isValid) {
        this.logger.warn(
          'Task classification response failed schema validation:',
          this.taskClassificationValidator.errors
        );

        // Return defaults if validation fails
        return {
          energyLevel: 'MEDIUM',
          focusType: 'TECHNICAL',
          estimatedMinutes: 60,
          priority: 3,
          softDeadline: null,
          hardDeadline: null,
          source: 'AI_GENERATED',
          aiSuggestion: 'Task classification data unavailable',
        };
      }

      return parsed;
    } catch (error) {
      this.logger.warn(
        'Failed to parse task classification response as JSON:',
        getErrorMessage(error)
      );

      // Return defaults if parsing fails
      return {
        energyLevel: 'MEDIUM',
        focusType: 'TECHNICAL',
        estimatedMinutes: 60,
        priority: 3,
        softDeadline: null,
        hardDeadline: null,
        source: 'AI_GENERATED',
        aiSuggestion: 'Task classification data unavailable',
      };
    }
  }

  private parseTasksResponse(response: string): Task[] {
    try {
      const parsed = JSON.parse(response) as any;

      // Validate against JSON schema
      const isValid = this.taskExtractionValidator(parsed);

      if (!isValid) {
        this.logger.warn(
          'Task extraction response failed schema validation:',
          this.taskExtractionValidator.errors
        );

        // Try to repair common issues
        const repairedTasks = this.repairTasksResponse(parsed);
        if (repairedTasks.length > 0) {
          this.logger.log(`Repaired ${repairedTasks.length} tasks from malformed response`);
          return repairedTasks;
        }

        // Fallback to empty array if repair fails
        return [];
      }

      return (parsed as any).tasks || [];
    } catch (error) {
      this.logger.warn('Failed to parse tasks response as JSON:', getErrorMessage(error));
      return [];
    }
  }

  private repairTasksResponse(parsed: any): Task[] {
    try {
      // Ensure we have a tasks array
      let tasks = parsed.tasks || parsed || [];
      if (!Array.isArray(tasks)) {
        tasks = [tasks];
      }

      // Repair each task object
      return tasks
        .map((task: any) => this.repairSingleTask(task))
        .filter((task: Task | null) => task !== null);
    } catch (error) {
      this.logger.warn('Failed to repair tasks response:', getErrorMessage(error));
      return [];
    }
  }

  private repairSingleTask(task: any): Task | null {
    try {
      // Skip if not an object
      if (!task || typeof task !== 'object') {
        return null;
      }

      // Provide default values for required fields
      const repairedTask: Task = {
        id: task.id || `generated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: task.name || task.title || 'Untitled Task',
        description: task.description || '',
        priority: this.validatePriority(task.priority) ? task.priority : 3,
        estimatedHours:
          typeof task.estimatedHours === 'number' && task.estimatedHours > 0
            ? task.estimatedHours
            : 2,
        dependencies: Array.isArray(task.dependencies) ? task.dependencies : [],
        tags: Array.isArray(task.tags) ? task.tags : [],
      };

      return repairedTask;
    } catch (error) {
      this.logger.warn('Failed to repair single task:', getErrorMessage(error));
      return null;
    }
  }

  private validatePriority(priority: any): boolean {
    return typeof priority === 'number' && priority >= 1 && priority <= 5;
  }

  private parseSuggestionsResponse(response: string): Suggestion[] {
    try {
      const parsed = JSON.parse(response);
      return parsed.suggestions || [];
    } catch (error) {
      this.logger.warn('Failed to parse suggestions response as JSON, falling back to text');
      return [];
    }
  }

  private parseSummaryResponse(response: string, originalText: string): SummaryResponse {
    try {
      const parsed = JSON.parse(response);
      return {
        summary: parsed.summary || response,
        keyPoints: parsed.keyPoints || [],
        originalLength: originalText.length,
        summaryLength: parsed.summary?.length || response.length,
        compressionRatio: parsed.compressionRatio || response.length / originalText.length,
      };
    } catch (error) {
      this.logger.warn('Failed to parse summary response as JSON, falling back to text');
      return {
        summary: response,
        keyPoints: [],
        originalLength: originalText.length,
        summaryLength: response.length,
        compressionRatio: response.length / originalText.length,
      };
    }
  }

  private handleError(error: any): OpenAIException {
    if (error instanceof OpenAIException) {
      return error;
    }

    // Handle OpenAI SDK errors
    if (error.type) {
      switch (error.type) {
        case 'insufficient_quota':
          return new OpenAIQuotaExceededException(error);
        case 'rate_limit_exceeded':
          return new OpenAIRateLimitException(error.headers?.['retry-after'], error);
        case 'invalid_request_error':
          return new OpenAIInvalidRequestException(getErrorMessage(error), error);
        case 'authentication_error':
          return new OpenAIUnauthorizedException(error);
        case 'server_error':
          return new OpenAIServerException(getErrorMessage(error), error);
        case 'timeout':
          return new OpenAITimeoutException(error);
        default:
          return new OpenAIException(
            getErrorMessage(error) || 'Unknown OpenAI error',
            undefined,
            error.type,
            error
          );
      }
    }

    // Handle HTTP errors
    if (error.status) {
      switch (error.status) {
        case 401:
          return new OpenAIUnauthorizedException(error);
        case 429:
          return new OpenAIRateLimitException(error.headers?.['retry-after'], error);
        case 402:
          return new OpenAIQuotaExceededException(error);
        case 400:
        case 422:
          return new OpenAIInvalidRequestException(getErrorMessage(error), error);
        case 500:
        case 502:
        case 503:
        case 504:
          return new OpenAIServerException(error.message, error);
        default:
          return new OpenAIException(
            error.message || 'HTTP error',
            undefined,
            `HTTP_${error.status}`,
            error
          );
      }
    }

    // Generic error
    return new OpenAIException(error.message || 'Unknown error', undefined, 'UNKNOWN_ERROR', error);
  }

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
  ): Promise<OpenAIResponse<Task[]>> {
    const emailContent = emails.map(email => ({
      ...email,
      // Truncate very long content to avoid token limits
      content:
        email.content.length > 4000 ? email.content.substring(0, 4000) + '...' : email.content,
    }));

    const prompt = this.buildEmailTaskExtractionPrompt(emailContent);
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are an AI assistant specialized in extracting actionable tasks from email content. 
        Analyze the provided emails and identify specific, actionable tasks mentioned or implied. 
        Focus on:
        - Action items mentioned in the email
        - Deadlines or time-sensitive requests
        - Follow-up actions required
        - Meeting preparation tasks
        - Deliverables or commitments mentioned
        
        Return results in valid JSON format as an array of tasks.`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    try {
      const startTime = Date.now();
      const response = await this.chatCompletion({
        messages,
        model: this.config.defaultModel,
        temperature: 0.3,
        maxTokens: 2500,
        jsonMode: true,
      });

      const tasks = this.parseTasksResponse(response.data);

      // Store context in memory
      await this.mem0Service.storeInteraction(
        `Task extraction from ${emails.length} emails. Extracted ${tasks.length} tasks.`
      );

      return {
        data: tasks,
        usage: response.usage,
        model: response.model,
        requestId: response.requestId,
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error('Error extracting tasks from emails:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Build email-specific task extraction prompt
   */
  private buildEmailTaskExtractionPrompt(
    emails: Array<{
      id: string;
      subject: string;
      from: string;
      date: string;
      content: string;
      snippet?: string;
    }>
  ): string {
    const emailSummaries = emails
      .map((email, index) => {
        return `
EMAIL ${index + 1}:
Subject: ${email.subject}
From: ${email.from}
Date: ${email.date}
Content:
${email.content}

---`;
      })
      .join('\n');

    return `
Please analyze the following emails and extract actionable tasks. 
For each task found, provide:
- title: A clear, concise title for the task
- description: Detailed description of what needs to be done
- priority: high, medium, or low based on email context and urgency
- dueDate: If mentioned or implied in the email (format: YYYY-MM-DD)
- category: The type of task (meeting, follow-up, deliverable, etc.)
- source: Which email this task came from (use email subject)

${emailSummaries}

Return the tasks as a JSON array in this format:
{
  "tasks": [
    {
      "title": "Task title",
      "description": "Detailed description",
      "priority": "high|medium|low",
      "dueDate": "YYYY-MM-DD or null",
      "category": "meeting|follow-up|deliverable|other",
      "source": "Email subject this task came from"
    }
  ]
}`;
  }

  /**
   * Classify email content for task extraction relevance
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
    const prompt = `
Analyze this email and determine if it contains actionable tasks or requests:

Subject: ${email.subject}
From: ${email.from}
Content: ${email.content.length > 1000 ? email.content.substring(0, 1000) + '...' : email.content}

Respond with JSON containing:
- hasActionableContent: boolean (true if email contains tasks/requests)
- confidence: number 0-1 (how confident you are)
- categories: array of strings (types of actions: meeting, deadline, follow-up, etc.)
- urgency: string (high/medium/low based on language and context)
`;

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content:
          'You are an email classifier that determines if emails contain actionable content. Respond only with valid JSON.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    try {
      const response = await this.chatCompletion({
        messages,
        model: this.config.defaultModel,
        temperature: 0.2,
        maxTokens: 500,
        jsonMode: true,
      });

      return JSON.parse(response.data);
    } catch (error) {
      this.logger.error('Error classifying email for tasks:', error);
      // Return safe default
      return {
        hasActionableContent: false,
        confidence: 0,
        categories: [],
        urgency: 'low',
      };
    }
  }
}
