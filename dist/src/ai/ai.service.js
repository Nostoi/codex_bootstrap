"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const openai_1 = require("openai");
const mem0_service_1 = require("./mem0.service");
const retry_service_1 = require("./services/retry.service");
const openai_exceptions_1 = require("./exceptions/openai.exceptions");
const validate_1 = require("./schemas/validate");
let AiService = AiService_1 = class AiService {
    constructor(configService, mem0Service, retryService) {
        this.configService = configService;
        this.mem0Service = mem0Service;
        this.retryService = retryService;
        this.logger = new common_1.Logger(AiService_1.name);
        this.config = this.loadConfig();
        this.openai = new openai_1.default({
            apiKey: this.config.apiKey,
            baseURL: this.config.baseURL,
            organization: this.config.organization,
            project: this.config.project,
            timeout: this.config.timeout,
        });
        this.taskExtractionValidator = (0, validate_1.getTaskExtractionValidator)();
        this.taskClassificationValidator = (0, validate_1.getTaskClassificationValidator)();
    }
    loadConfig() {
        return {
            apiKey: this.configService.get("OPENAI_API_KEY"),
            baseURL: this.configService.get("OPENAI_BASE_URL"),
            organization: this.configService.get("OPENAI_ORGANIZATION"),
            project: this.configService.get("OPENAI_PROJECT"),
            timeout: this.configService.get("OPENAI_TIMEOUT", 30000),
            maxTokens: this.configService.get("OPENAI_MAX_TOKENS", 4096),
            defaultModel: this.configService.get("OPENAI_DEFAULT_MODEL", "gpt-4o-mini"),
            retry: {
                maxRetries: this.configService.get("OPENAI_MAX_RETRIES", 3),
                baseDelay: this.configService.get("OPENAI_BASE_DELAY", 1000),
                maxDelay: this.configService.get("OPENAI_MAX_DELAY", 10000),
                backoffMultiplier: this.configService.get("OPENAI_BACKOFF_MULTIPLIER", 2),
                retryableStatusCodes: [429, 500, 502, 503, 504],
            },
        };
    }
    async generateTasks(dto) {
        const prompt = this.buildTaskGenerationPrompt(dto);
        const messages = [
            {
                role: "system",
                content: "You are a project management assistant. Generate actionable tasks in valid JSON format.",
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
            await this.mem0Service.storeInteraction(`Task generation for project: ${dto.projectDescription}. Generated ${tasks.length} tasks.`);
            return {
                data: tasks,
                usage: response.usage,
                model: response.model,
                requestId: response.requestId,
                processingTimeMs: Date.now() - startTime,
            };
        }
        catch (error) {
            this.logger.error("Error generating tasks:", error);
            throw this.handleError(error);
        }
    }
    async classifyTask(taskDescription) {
        const prompt = this.buildTaskClassificationPrompt(taskDescription);
        const messages = [
            {
                role: "system",
                content: "You are a task classification assistant. Analyze the task and predict metadata in valid JSON format.",
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
            const classification = this.parseTaskClassificationResponse(response.data);
            await this.mem0Service.storeInteraction(`Task classification for: ${taskDescription}. Predicted metadata.`);
            return {
                data: classification,
                usage: response.usage,
                model: response.model,
                requestId: response.requestId,
                processingTimeMs: Date.now() - startTime,
            };
        }
        catch (error) {
            this.logger.error("Error classifying task:", error);
            throw this.handleError(error);
        }
    }
    async getSuggestions(dto) {
        const prompt = this.buildSuggestionsPrompt(dto);
        const messages = [
            {
                role: "system",
                content: "You are a technical advisor. Provide actionable suggestions in valid JSON format.",
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
        }
        catch (error) {
            this.logger.error("Error getting suggestions:", error);
            throw this.handleError(error);
        }
    }
    async summarize(dto) {
        const prompt = this.buildSummarizationPrompt(dto);
        const messages = [
            {
                role: "system",
                content: "You are a summarization expert. Provide concise summaries in the requested format.",
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
        }
        catch (error) {
            this.logger.error("Error summarizing text:", error);
            throw this.handleError(error);
        }
    }
    async chatCompletion(request) {
        const operation = async () => {
            try {
                const completion = await this.openai.chat.completions.create({
                    model: request.model || this.config.defaultModel,
                    messages: request.messages,
                    temperature: request.temperature || 0.7,
                    max_tokens: request.maxTokens || this.config.maxTokens,
                    stream: false,
                    response_format: request.jsonMode
                        ? { type: "json_object" }
                        : undefined,
                    stop: request.stop,
                });
                const nonStreamCompletion = completion;
                return {
                    data: nonStreamCompletion.choices[0].message.content || "",
                    usage: {
                        promptTokens: nonStreamCompletion.usage?.prompt_tokens || 0,
                        completionTokens: nonStreamCompletion.usage?.completion_tokens || 0,
                        totalTokens: nonStreamCompletion.usage?.total_tokens || 0,
                    },
                    model: nonStreamCompletion.model,
                    requestId: nonStreamCompletion.id,
                    processingTimeMs: 0,
                };
            }
            catch (error) {
                throw this.handleError(error);
            }
        };
        return this.retryService.executeWithRetry(operation, this.config.retry, "OpenAI Chat Completion");
    }
    async healthCheck() {
        try {
            const testMessages = [
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
            const isHealthy = response.data && response.data.trim().toLowerCase().includes('ok');
            return {
                status: isHealthy ? 'healthy' : 'degraded',
                timestamp: new Date(),
                version: '1.0.0'
            };
        }
        catch (error) {
            this.logger.error("Health check failed:", error.message);
            return {
                status: 'unhealthy',
                timestamp: new Date(),
                version: '1.0.0'
            };
        }
    }
    async completion(request) {
        const chatRequest = {
            messages: [{ role: "user", content: request.prompt }],
            model: request.model,
            temperature: request.temperature,
            maxTokens: request.maxTokens,
            stream: request.stream,
            stop: request.stop,
        };
        return this.chatCompletion(chatRequest);
    }
    buildTaskGenerationPrompt(dto) {
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
    buildSuggestionsPrompt(dto) {
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
    buildSummarizationPrompt(dto) {
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
    buildTaskClassificationPrompt(taskDescription) {
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
    parseTaskClassificationResponse(response) {
        try {
            const parsed = JSON.parse(response);
            const isValid = this.taskClassificationValidator(parsed);
            if (!isValid) {
                this.logger.warn("Task classification response failed schema validation:", this.taskClassificationValidator.errors);
                return {
                    energyLevel: "MEDIUM",
                    focusType: "TECHNICAL",
                    estimatedMinutes: 60,
                    priority: 3,
                    softDeadline: null,
                    hardDeadline: null,
                    source: "AI_GENERATED",
                    aiSuggestion: "Task classification data unavailable"
                };
            }
            return parsed;
        }
        catch (error) {
            this.logger.warn("Failed to parse task classification response as JSON:", error.message);
            return {
                energyLevel: "MEDIUM",
                focusType: "TECHNICAL",
                estimatedMinutes: 60,
                priority: 3,
                softDeadline: null,
                hardDeadline: null,
                source: "AI_GENERATED",
                aiSuggestion: "Task classification data unavailable"
            };
        }
    }
    parseTasksResponse(response) {
        try {
            const parsed = JSON.parse(response);
            const isValid = this.taskExtractionValidator(parsed);
            if (!isValid) {
                this.logger.warn("Task extraction response failed schema validation:", this.taskExtractionValidator.errors);
                const repairedTasks = this.repairTasksResponse(parsed);
                if (repairedTasks.length > 0) {
                    this.logger.log(`Repaired ${repairedTasks.length} tasks from malformed response`);
                    return repairedTasks;
                }
                return [];
            }
            return parsed.tasks || [];
        }
        catch (error) {
            this.logger.warn("Failed to parse tasks response as JSON:", error.message);
            return [];
        }
    }
    repairTasksResponse(parsed) {
        try {
            let tasks = parsed.tasks || parsed || [];
            if (!Array.isArray(tasks)) {
                tasks = [tasks];
            }
            return tasks
                .map((task) => this.repairSingleTask(task))
                .filter((task) => task !== null);
        }
        catch (error) {
            this.logger.warn("Failed to repair tasks response:", error.message);
            return [];
        }
    }
    repairSingleTask(task) {
        try {
            if (!task || typeof task !== 'object') {
                return null;
            }
            const repairedTask = {
                id: task.id || `generated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: task.name || task.title || "Untitled Task",
                description: task.description || "",
                priority: this.validatePriority(task.priority) ? task.priority : 3,
                estimatedHours: typeof task.estimatedHours === 'number' && task.estimatedHours > 0 ? task.estimatedHours : 2,
                dependencies: Array.isArray(task.dependencies) ? task.dependencies : [],
                tags: Array.isArray(task.tags) ? task.tags : [],
            };
            return repairedTask;
        }
        catch (error) {
            this.logger.warn("Failed to repair single task:", error.message);
            return null;
        }
    }
    validatePriority(priority) {
        return typeof priority === 'number' && priority >= 1 && priority <= 5;
    }
    parseSuggestionsResponse(response) {
        try {
            const parsed = JSON.parse(response);
            return parsed.suggestions || [];
        }
        catch (error) {
            this.logger.warn("Failed to parse suggestions response as JSON, falling back to text");
            return [];
        }
    }
    parseSummaryResponse(response, originalText) {
        try {
            const parsed = JSON.parse(response);
            return {
                summary: parsed.summary || response,
                keyPoints: parsed.keyPoints || [],
                originalLength: originalText.length,
                summaryLength: parsed.summary?.length || response.length,
                compressionRatio: parsed.compressionRatio || response.length / originalText.length,
            };
        }
        catch (error) {
            this.logger.warn("Failed to parse summary response as JSON, falling back to text");
            return {
                summary: response,
                keyPoints: [],
                originalLength: originalText.length,
                summaryLength: response.length,
                compressionRatio: response.length / originalText.length,
            };
        }
    }
    handleError(error) {
        if (error instanceof openai_exceptions_1.OpenAIException) {
            return error;
        }
        if (error.type) {
            switch (error.type) {
                case "insufficient_quota":
                    return new openai_exceptions_1.OpenAIQuotaExceededException(error);
                case "rate_limit_exceeded":
                    return new openai_exceptions_1.OpenAIRateLimitException(error.headers?.["retry-after"], error);
                case "invalid_request_error":
                    return new openai_exceptions_1.OpenAIInvalidRequestException(error.message, error);
                case "authentication_error":
                    return new openai_exceptions_1.OpenAIUnauthorizedException(error);
                case "server_error":
                    return new openai_exceptions_1.OpenAIServerException(error.message, error);
                case "timeout":
                    return new openai_exceptions_1.OpenAITimeoutException(error);
                default:
                    return new openai_exceptions_1.OpenAIException(error.message || "Unknown OpenAI error", undefined, error.type, error);
            }
        }
        if (error.status) {
            switch (error.status) {
                case 401:
                    return new openai_exceptions_1.OpenAIUnauthorizedException(error);
                case 429:
                    return new openai_exceptions_1.OpenAIRateLimitException(error.headers?.["retry-after"], error);
                case 402:
                    return new openai_exceptions_1.OpenAIQuotaExceededException(error);
                case 400:
                case 422:
                    return new openai_exceptions_1.OpenAIInvalidRequestException(error.message, error);
                case 500:
                case 502:
                case 503:
                case 504:
                    return new openai_exceptions_1.OpenAIServerException(error.message, error);
                default:
                    return new openai_exceptions_1.OpenAIException(error.message || "HTTP error", undefined, `HTTP_${error.status}`, error);
            }
        }
        return new openai_exceptions_1.OpenAIException(error.message || "Unknown error", undefined, "UNKNOWN_ERROR", error);
    }
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        mem0_service_1.Mem0Service,
        retry_service_1.RetryService])
], AiService);
//# sourceMappingURL=ai.service.js.map