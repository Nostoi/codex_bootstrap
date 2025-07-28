import { Mem0Service } from './mem0.service';
export declare class AiService {
    private readonly mem0;
    constructor(mem0: Mem0Service);
    generateTasks(prompt: string): Promise<string[]>;
    getSuggestions(context: string): Promise<string[]>;
    summarize(text: string): Promise<string>;
    private request;
}
