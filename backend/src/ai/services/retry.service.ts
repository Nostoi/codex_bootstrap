import { Injectable, Logger } from "@nestjs/common";
import {
  OpenAIException,
  OpenAIRateLimitException,
  OpenAIQuotaExceededException,
  OpenAIInvalidRequestException,
  OpenAIUnauthorizedException,
  OpenAIServerException,
  OpenAITimeoutException,
} from "../exceptions/openai.exceptions";
import { RetryConfig } from "../interfaces/openai.interfaces";

@Injectable()
export class RetryService {
  private readonly logger = new Logger(RetryService.name);

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig,
    context: string = "Operation",
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          this.logger.warn(
            `${context} - Retry attempt ${attempt}/${config.maxRetries}`,
          );
        }

        return await operation();
      } catch (error) {
        lastError = error;

        // Don't retry for certain error types
        if (this.shouldNotRetry(error)) {
          this.logger.error(
            `${context} - Non-retryable error: ${error.message}`,
          );
          throw error;
        }

        // Don't retry on the last attempt
        if (attempt === config.maxRetries) {
          this.logger.error(
            `${context} - Max retries (${config.maxRetries}) exceeded`,
          );
          break;
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateDelay(attempt, config);

        this.logger.warn(
          `${context} - Attempt ${attempt + 1} failed: ${error.message}. Retrying in ${delay}ms`,
        );

        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  private shouldNotRetry(error: any): boolean {
    // Don't retry for authentication, validation, or quota errors
    if (
      error instanceof OpenAIUnauthorizedException ||
      error instanceof OpenAIInvalidRequestException ||
      error instanceof OpenAIQuotaExceededException
    ) {
      return true;
    }

    // Check for specific HTTP status codes that shouldn't be retried
    const nonRetryableStatuses = [400, 401, 403, 404, 422];
    if (error.status && nonRetryableStatuses.includes(error.status)) {
      return true;
    }

    return false;
  }

  private calculateDelay(attempt: number, config: RetryConfig): number {
    const exponentialDelay =
      config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
    const jitter = Math.random() * 0.1 * exponentialDelay; // Add 10% jitter
    const delay = Math.min(exponentialDelay + jitter, config.maxDelay);

    return Math.floor(delay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
