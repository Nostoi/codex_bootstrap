"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var RetryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetryService = void 0;
const common_1 = require("@nestjs/common");
const openai_exceptions_1 = require("../exceptions/openai.exceptions");
let RetryService = RetryService_1 = class RetryService {
    constructor() {
        this.logger = new common_1.Logger(RetryService_1.name);
    }
    async executeWithRetry(operation, config, context = 'Operation') {
        let lastError;
        for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
            try {
                if (attempt > 0) {
                    this.logger.warn(`${context} - Retry attempt ${attempt}/${config.maxRetries}`);
                }
                return await operation();
            }
            catch (error) {
                lastError = error;
                if (this.shouldNotRetry(error)) {
                    this.logger.error(`${context} - Non-retryable error: ${error.message}`);
                    throw error;
                }
                if (attempt === config.maxRetries) {
                    this.logger.error(`${context} - Max retries (${config.maxRetries}) exceeded`);
                    break;
                }
                const delay = this.calculateDelay(attempt, config);
                this.logger.warn(`${context} - Attempt ${attempt + 1} failed: ${error.message}. Retrying in ${delay}ms`);
                await this.sleep(delay);
            }
        }
        throw lastError;
    }
    shouldNotRetry(error) {
        if (error instanceof openai_exceptions_1.OpenAIUnauthorizedException ||
            error instanceof openai_exceptions_1.OpenAIInvalidRequestException ||
            error instanceof openai_exceptions_1.OpenAIQuotaExceededException) {
            return true;
        }
        const nonRetryableStatuses = [400, 401, 403, 404, 422];
        if (error.status && nonRetryableStatuses.includes(error.status)) {
            return true;
        }
        return false;
    }
    calculateDelay(attempt, config) {
        const exponentialDelay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
        const jitter = Math.random() * 0.1 * exponentialDelay;
        const delay = Math.min(exponentialDelay + jitter, config.maxDelay);
        return Math.floor(delay);
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};
exports.RetryService = RetryService;
exports.RetryService = RetryService = RetryService_1 = __decorate([
    (0, common_1.Injectable)()
], RetryService);
//# sourceMappingURL=retry.service.js.map