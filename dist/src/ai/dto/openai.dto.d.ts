export declare class OpenAICompletionDto {
    prompt: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    stop?: string[];
    stream?: boolean;
}
export declare class OpenAIChatMessageDto {
    role: "system" | "user" | "assistant";
    content: string;
}
export declare class OpenAIChatCompletionDto {
    messages: OpenAIChatMessageDto[];
    model?: string;
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
    jsonMode?: boolean;
}
export declare class TaskGenerationDto {
    projectDescription: string;
    context?: string;
    maxTasks?: number;
}
export declare class SuggestionRequestDto {
    context: string;
    type: "improvement" | "feature" | "optimization" | "bug-fix";
    codebase?: string;
}
export declare class TaskExtractionDto {
    text: string;
    maxTasks?: number;
}
export declare class SummarizationDto {
    text: string;
    maxLength?: number;
    format?: "paragraph" | "bullet-points" | "key-points";
}
