import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";
import { Mem0Service } from "./mem0.service";
import { RetryService } from "./services/retry.service";
import {
  OpenAIException,
  OpenAIRateLimitException,
  OpenAIQuotaExceededException,
  OpenAIInvalidRequestException,
  OpenAIUnauthorizedException,
  OpenAIServerException,
  OpenAITimeoutException,
} from "./exceptions/openai.exceptions";
import {
  OpenAIConfig,
  OpenAIResponse,
  ChatCompletionRequest,
  CompletionRequest,
  Task,
  Suggestion,
  SummaryResponse,
  ChatMessage,
} from "./interfaces/openai.interfaces";
import {
  TaskGenerationDto,
  TaskExtractionDto,
  SuggestionRequestDto,
  SummarizationDto,
} from "./dto/openai.dto";
import {
  getTaskExtractionValidator,
  getTaskClassificationValidator,
} from "./schemas/validate";

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
    private retryService: RetryService,
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
      apiKey: this.configService.get<string>("OPENAI_API_KEY"),
      baseURL: this.configService.get<string>("OPENAI_BASE_URL"),
      organization: this.configService.get<string>("OPENAI_ORGANIZATION"),
      project: this.configService.get<string>("OPENAI_PROJECT"),
      timeout: this.configService.get<number>("OPENAI_TIMEOUT", 30000),
      maxTokens: this.configService.get<number>("OPENAI_MAX_TOKENS", 4096),
      defaultModel: this.configService.get<string>(
        "OPENAI_DEFAULT_MODEL",
        "gpt-4o-mini",
      ),
      retry: {
        maxRetries: this.configService.get<number>("OPENAI_MAX_RETRIES", 3),
        baseDelay: this.configService.get<number>("OPENAI_BASE_DELAY", 1000),
        maxDelay: this.configService.get<number>("OPENAI_MAX_DELAY", 10000),
        backoffMultiplier: this.configService.get<number>(
          "OPENAI_BACKOFF_MULTIPLIER",
          2,
        ),
        retryableStatusCodes: [429, 500, 502, 503, 504],
      },
    };
  }

  async generateTasks(dto: TaskGenerationDto): Promise<OpenAIResponse<Task[]>> {
    const prompt = this.buildTaskGenerationPrompt(dto);
    const messages: ChatMessage[] = [
      {
        role: "system",
        content:
          "You are a project management assistant. Generate actionable tasks in valid JSON format.",
      },
      {
        role: "user",
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
        `Task generation for project: ${dto.projectDescription}. Generated ${tasks.length} tasks.`,
      );

      return {
        data: tasks,
        usage: response.usage,
        model: response.model,
        requestId: response.requestId,
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error("Error generating tasks:", error);  
      throw this.handleError(error);
    }
  }

  async extractTasks(dto: TaskExtractionDto): Promise<OpenAIResponse<Task[]>> {
    const prompt = this.buildTaskExtractionPrompt(dto);
    const messages: ChatMessage[] = [
      {
        role: "system",
        content:
          "You are an AI assistant that extracts actionable tasks from conversational text. Analyze the provided text and identify specific, actionable tasks mentioned or implied. Return results in valid JSON format.",
      },
      {
        role: "user",
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
        `Task extraction from conversation text. Extracted ${tasks.length} tasks.`,
      );

      return {
        data: tasks,
        usage: response.usage,
        model: response.model,
        requestId: response.requestId,
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error("Error extracting tasks:", error);
      throw this.handleError(error);
    }
  }

  async classifyTask(taskDescription: string): Promise<OpenAIResponse<any>> {
    const prompt = this.buildTaskClassificationPrompt(taskDescription);
    const messages: ChatMessage[] = [
      {
        role: "system",
        content:
          "You are a task classification assistant. Analyze the task and predict metadata in valid JSON format.",
      },
      {
        role: "user",
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

      const classification = this.parseTaskClassificationResponse(
        response.data,
      );

      // Store context in memory
      await this.mem0Service.storeInteraction(
        `Task classification for: ${taskDescription}. Predicted metadata.`,
      );

      return {
        data: classification,
        usage: response.usage,
        model: response.model,
        requestId: response.requestId,
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error("Error classifying task:", error);
      throw this.handleError(error);
    }
  }

  async getSuggestions(
    dto: SuggestionRequestDto,
  ): Promise<OpenAIResponse<Suggestion[]>> {
    const prompt = this.buildSuggestionsPrompt(dto);
    const messages: ChatMessage[] = [
      {
        role: "system",
        content:
          "You are a technical advisor. Provide actionable suggestions in valid JSON format.",
      },
      {
        role: "user",
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
      this.logger.error("Error getting suggestions:", error);
      throw this.handleError(error);
    }
  }

  async summarize(
    dto: SummarizationDto,
  ): Promise<OpenAIResponse<SummaryResponse>> {
    const prompt = this.buildSummarizationPrompt(dto);
    const messages: ChatMessage[] = [
      {
        role: "system",
        content:
          "You are a summarization expert. Provide concise summaries in the requested format.",
      },
      {
        role: "user",
        content: prompt,
      },
    ];

    try {
      const startTime = Date.now();
      const response = await this.chatCompletion({
        messages,
        model: this.config.defaultModel,
        temperature: 0.3,
        maxTokens: dto.maxLength * 2 || 400,
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
      this.logger.error("Error summarizing text:", error);
      throw this.handleError(error);
    }
  }

  async chatCompletion(
    request: ChatCompletionRequest,
  ): Promise<OpenAIResponse<string>> {
    const operation = async () => {
      try {
        const completion = await this.openai.chat.completions.create({
          model: request.model || this.config.defaultModel,
          messages: request.messages,
          temperature: request.temperature || 0.7,
          max_tokens: request.maxTokens || this.config.maxTokens,
          stream: false, // Force non-streaming to handle types properly
          response_format: request.jsonMode
            ? { type: "json_object" }
            : undefined,
          stop: request.stop,
        });

        // Type assertion for non-streaming response
        const nonStreamCompletion =
          completion as OpenAI.Chat.Completions.ChatCompletion;

        return {
          data: nonStreamCompletion.choices[0].message.content || "",
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
      "OpenAI Chat Completion",
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
          role: "user",
          content: "Respond with 'OK' if you can hear me.",
        },
      ];

      const response = await this.chatCompletion({
        messages: testMessages,
        model: this.config.defaultModel,
        temperature: 0,
        maxTokens: 10,
      });

      const isHealthy =
        response.data && response.data.trim().toLowerCase().includes("ok");

      return {
        status: isHealthy ? "healthy" : "degraded",
        timestamp: new Date(),
        version: "1.0.0",
      };
    } catch (error) {
      this.logger.error("Health check failed:", error.message);
      return {
        status: "unhealthy",
        timestamp: new Date(),
        version: "1.0.0",
      };
    }
  }

  async completion(
    request: CompletionRequest,
  ): Promise<OpenAIResponse<string>> {
    // Note: Completions API is legacy, but including for completeness
    const chatRequest: ChatCompletionRequest = {
      messages: [{ role: "user", content: request.prompt }],
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
Based on the following project description${dto.context ? " and context" : ""}, generate ${dto.maxTasks || 10} actionable tasks:

Project: ${dto.projectDescription}
${dto.context ? `Context: ${dto.context}` : ""}

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
Analyze the following text and extract up to ${dto.maxTasks || 10} actionable tasks that are mentioned or implied:

Text: ${dto.text}

Instructions:
- Identify specific tasks, action items, or to-dos mentioned in the text
- Extract tasks that have clear actionable outcomes
- Include tasks that are implied but not explicitly stated
- Prioritize tasks based on urgency and importance mentioned in context
- Estimate time based on task complexity and context clues

Return as a JSON object with a "tasks" array containing objects with:
- id: unique identifier (string)
- name: concise task name (string)
- description: detailed description including context (string)
- priority: priority level 1-10 based on urgency/importance (number)
- estimatedHours: estimated time in hours (number)
- dependencies: array of task IDs this depends on (string[])
- tags: relevant tags for categorization (string[])

Example format:
{
  "tasks": [
    {
      "id": "extracted-1",
      "name": "Call team meeting",
      "description": "Schedule and conduct team sync to discuss project status",
      "priority": 7,
      "estimatedHours": 1,
      "dependencies": [],
      "tags": ["meeting", "communication"]
    }
  ]
}
    `.trim();
  }

  private buildSuggestionsPrompt(dto: SuggestionRequestDto): string {
    return `
Based on the following context, provide ${dto.type} suggestions:

Context: ${dto.context}
${dto.codebase ? `Codebase: ${dto.codebase}` : ""}

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
Summarize the following text in ${dto.maxLength || 200} words or less, using ${dto.format || "paragraph"} format:

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
Analyze the following task and predict its metadata characteristics:

Task: ${taskDescription}

Based on the task description, predict the following metadata in JSON format:
- energyLevel: "LOW", "MEDIUM", or "HIGH" (mental energy required)
- focusType: "CREATIVE", "TECHNICAL", "ADMINISTRATIVE", or "SOCIAL" 
- estimatedMinutes: estimated time in minutes (number)
- priority: priority level 1-5 (number, where 5 is highest)
- softDeadline: suggested deadline if applicable (ISO date string or null)
- hardDeadline: absolute deadline if applicable (ISO date string or null)
- source: "SELF", "BOSS", "TEAM", or "AI_GENERATED"
- aiSuggestion: helpful tip or suggestion for completing this task (string)

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
          "Task classification response failed schema validation:",
          this.taskClassificationValidator.errors,
        );

        // Return defaults if validation fails
        return {
          energyLevel: "MEDIUM",
          focusType: "TECHNICAL",
          estimatedMinutes: 60,
          priority: 3,
          softDeadline: null,
          hardDeadline: null,
          source: "AI_GENERATED",
          aiSuggestion: "Task classification data unavailable",
        };
      }

      return parsed;
    } catch (error) {
      this.logger.warn(
        "Failed to parse task classification response as JSON:",
        error.message,
      );

      // Return defaults if parsing fails
      return {
        energyLevel: "MEDIUM",
        focusType: "TECHNICAL",
        estimatedMinutes: 60,
        priority: 3,
        softDeadline: null,
        hardDeadline: null,
        source: "AI_GENERATED",
        aiSuggestion: "Task classification data unavailable",
      };
    }
  }

  private parseTasksResponse(response: string): Task[] {
    try {
      const parsed = JSON.parse(response);

      // Validate against JSON schema
      const isValid = this.taskExtractionValidator(parsed);

      if (!isValid) {
        this.logger.warn(
          "Task extraction response failed schema validation:",
          this.taskExtractionValidator.errors,
        );

        // Try to repair common issues
        const repairedTasks = this.repairTasksResponse(parsed);
        if (repairedTasks.length > 0) {
          this.logger.log(
            `Repaired ${repairedTasks.length} tasks from malformed response`,
          );
          return repairedTasks;
        }

        // Fallback to empty array if repair fails
        return [];
      }

      return parsed.tasks || [];
    } catch (error) {
      this.logger.warn(
        "Failed to parse tasks response as JSON:",
        error.message,
      );
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
      this.logger.warn("Failed to repair tasks response:", error.message);
      return [];
    }
  }

  private repairSingleTask(task: any): Task | null {
    try {
      // Skip if not an object
      if (!task || typeof task !== "object") {
        return null;
      }

      // Provide default values for required fields
      const repairedTask: Task = {
        id:
          task.id ||
          `generated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: task.name || task.title || "Untitled Task",
        description: task.description || "",
        priority: this.validatePriority(task.priority) ? task.priority : 3,
        estimatedHours:
          typeof task.estimatedHours === "number" && task.estimatedHours > 0
            ? task.estimatedHours
            : 2,
        dependencies: Array.isArray(task.dependencies) ? task.dependencies : [],
        tags: Array.isArray(task.tags) ? task.tags : [],
      };

      return repairedTask;
    } catch (error) {
      this.logger.warn("Failed to repair single task:", error.message);
      return null;
    }
  }

  private validatePriority(priority: any): boolean {
    return typeof priority === "number" && priority >= 1 && priority <= 5;
  }

  private parseSuggestionsResponse(response: string): Suggestion[] {
    try {
      const parsed = JSON.parse(response);
      return parsed.suggestions || [];
    } catch (error) {
      this.logger.warn(
        "Failed to parse suggestions response as JSON, falling back to text",
      );
      return [];
    }
  }

  private parseSummaryResponse(
    response: string,
    originalText: string,
  ): SummaryResponse {
    try {
      const parsed = JSON.parse(response);
      return {
        summary: parsed.summary || response,
        keyPoints: parsed.keyPoints || [],
        originalLength: originalText.length,
        summaryLength: parsed.summary?.length || response.length,
        compressionRatio:
          parsed.compressionRatio || response.length / originalText.length,
      };
    } catch (error) {
      this.logger.warn(
        "Failed to parse summary response as JSON, falling back to text",
      );
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
        case "insufficient_quota":
          return new OpenAIQuotaExceededException(error);
        case "rate_limit_exceeded":
          return new OpenAIRateLimitException(
            error.headers?.["retry-after"],
            error,
          );
        case "invalid_request_error":
          return new OpenAIInvalidRequestException(error.message, error);
        case "authentication_error":
          return new OpenAIUnauthorizedException(error);
        case "server_error":
          return new OpenAIServerException(error.message, error);
        case "timeout":
          return new OpenAITimeoutException(error);
        default:
          return new OpenAIException(
            error.message || "Unknown OpenAI error",
            undefined,
            error.type,
            error,
          );
      }
    }

    // Handle HTTP errors
    if (error.status) {
      switch (error.status) {
        case 401:
          return new OpenAIUnauthorizedException(error);
        case 429:
          return new OpenAIRateLimitException(
            error.headers?.["retry-after"],
            error,
          );
        case 402:
          return new OpenAIQuotaExceededException(error);
        case 400:
        case 422:
          return new OpenAIInvalidRequestException(error.message, error);
        case 500:
        case 502:
        case 503:
        case 504:
          return new OpenAIServerException(error.message, error);
        default:
          return new OpenAIException(
            error.message || "HTTP error",
            undefined,
            `HTTP_${error.status}`,
            error,
          );
      }
    }

    // Generic error
    return new OpenAIException(
      error.message || "Unknown error",
      undefined,
      "UNKNOWN_ERROR",
      error,
    );
  }
}
