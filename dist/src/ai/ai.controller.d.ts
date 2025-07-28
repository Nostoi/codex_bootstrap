import { AiService } from "./ai.service";
import { TaskGenerationDto, SuggestionRequestDto, SummarizationDto, OpenAIChatCompletionDto } from "./dto/openai.dto";
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    generateTasks(dto: TaskGenerationDto): Promise<import("./interfaces/openai.interfaces").OpenAIResponse<import("./interfaces/openai.interfaces").Task[]>>;
    getSuggestions(dto: SuggestionRequestDto): Promise<import("./interfaces/openai.interfaces").OpenAIResponse<import("./interfaces/openai.interfaces").Suggestion[]>>;
    summarize(dto: SummarizationDto): Promise<import("./interfaces/openai.interfaces").OpenAIResponse<import("./interfaces/openai.interfaces").SummaryResponse>>;
    classifyTask(description: string): Promise<import("./interfaces/openai.interfaces").OpenAIResponse<any>>;
    healthCheck(): Promise<{
        status: string;
        timestamp: Date;
        version: string;
    }>;
    chatCompletion(dto: OpenAIChatCompletionDto): Promise<import("./interfaces/openai.interfaces").OpenAIResponse<string>>;
}
