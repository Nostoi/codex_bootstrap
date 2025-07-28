import { ConfigService } from '@nestjs/config';
import { Mem0Service } from './mem0.service';
import { RetryService } from './services/retry.service';
import { OpenAIResponse, ChatCompletionRequest, CompletionRequest, Task, Suggestion, SummaryResponse } from './interfaces/openai.interfaces';
import { TaskGenerationDto, SuggestionRequestDto, SummarizationDto } from './dto/openai.dto';
export declare class AiService {
    private configService;
    private mem0Service;
    private retryService;
    private readonly logger;
    private readonly openai;
    private readonly config;
    constructor(configService: ConfigService, mem0Service: Mem0Service, retryService: RetryService);
    private loadConfig;
    generateTasks(dto: TaskGenerationDto): Promise<OpenAIResponse<Task[]>>;
    getSuggestions(dto: SuggestionRequestDto): Promise<OpenAIResponse<Suggestion[]>>;
    summarize(dto: SummarizationDto): Promise<OpenAIResponse<SummaryResponse>>;
    chatCompletion(request: ChatCompletionRequest): Promise<OpenAIResponse<string>>;
    completion(request: CompletionRequest): Promise<OpenAIResponse<string>>;
    private buildTaskGenerationPrompt;
    private buildSuggestionsPrompt;
    private buildSummarizationPrompt;
    private parseTasksResponse;
    private parseSuggestionsResponse;
    private parseSummaryResponse;
    private handleError;
}
