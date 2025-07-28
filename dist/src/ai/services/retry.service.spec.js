"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const retry_service_1 = require("./retry.service");
const openai_exceptions_1 = require("../exceptions/openai.exceptions");
describe('RetryService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [retry_service_1.RetryService],
        }).compile();
        service = module.get(retry_service_1.RetryService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('executeWithRetry', () => {
        it('should succeed on first attempt', async () => {
            const operation = jest.fn().mockResolvedValue('success');
            const config = {
                maxRetries: 3,
                baseDelay: 100,
                maxDelay: 1000,
                backoffMultiplier: 2,
                retryableStatusCodes: [429, 500, 502, 503, 504],
            };
            const result = await service.executeWithRetry(operation, config);
            expect(result).toBe('success');
            expect(operation).toHaveBeenCalledTimes(1);
        });
        it('should retry on retryable errors', async () => {
            const operation = jest.fn()
                .mockRejectedValueOnce(new Error('Retryable error'))
                .mockResolvedValue('success');
            const config = {
                maxRetries: 3,
                baseDelay: 10,
                maxDelay: 100,
                backoffMultiplier: 2,
                retryableStatusCodes: [429, 500, 502, 503, 504],
            };
            const result = await service.executeWithRetry(operation, config);
            expect(result).toBe('success');
            expect(operation).toHaveBeenCalledTimes(2);
        });
        it('should not retry on non-retryable errors', async () => {
            const operation = jest.fn()
                .mockRejectedValue(new openai_exceptions_1.OpenAIUnauthorizedException());
            const config = {
                maxRetries: 3,
                baseDelay: 10,
                maxDelay: 100,
                backoffMultiplier: 2,
                retryableStatusCodes: [429, 500, 502, 503, 504],
            };
            await expect(service.executeWithRetry(operation, config))
                .rejects.toThrow(openai_exceptions_1.OpenAIUnauthorizedException);
            expect(operation).toHaveBeenCalledTimes(1);
        });
        it('should throw after max retries', async () => {
            const error = new Error('Persistent error');
            const operation = jest.fn().mockRejectedValue(error);
            const config = {
                maxRetries: 2,
                baseDelay: 10,
                maxDelay: 100,
                backoffMultiplier: 2,
                retryableStatusCodes: [429, 500, 502, 503, 504],
            };
            await expect(service.executeWithRetry(operation, config))
                .rejects.toThrow('Persistent error');
            expect(operation).toHaveBeenCalledTimes(3);
        });
    });
});
//# sourceMappingURL=retry.service.spec.js.map