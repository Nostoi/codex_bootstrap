import { RetryConfig } from '../interfaces/openai.interfaces';
export declare class RetryService {
    private readonly logger;
    executeWithRetry<T>(operation: () => Promise<T>, config: RetryConfig, context?: string): Promise<T>;
    private shouldNotRetry;
    private calculateDelay;
    private sleep;
}
