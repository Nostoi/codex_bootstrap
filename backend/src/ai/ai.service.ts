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
  TaskGenerationRequest,
  Task,
  Suggestion,
  SummaryResponse,
  ChatMessage,
} from "./interfaces/openai.interfaces";
import {
  OpenAICompletionDto,
  OpenAIChatCompletionDto,
  TaskGenerationDto,
  SuggestionRequestDto,
  SummarizationDto,
} from "./dto/openai.dto";

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openai: OpenAI;
  private readonly config: OpenAIConfig;

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

  private parseTasksResponse(response: string): Task[] {
    try {
      const parsed = JSON.parse(response);
      return parsed.tasks || [];
    } catch (error) {
      this.logger.warn(
        "Failed to parse tasks response as JSON, falling back to text",
      );
      return [];
    }
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
