"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const config_1 = require("@nestjs/config");
const ai_service_1 = require("./ai.service");
const mem0_service_1 = require("./mem0.service");
const retry_service_1 = require("./services/retry.service");
describe('AiService', () => {
    let service;
    let configService;
    let mem0Service;
    let retryService;
    beforeEach(async () => {
        const mockConfigService = {
            get: jest.fn().mockImplementation((key, defaultValue) => {
                const config = {
                    OPENAI_API_KEY: 'test-api-key',
                    OPENAI_DEFAULT_MODEL: 'gpt-4o-mini',
                    OPENAI_TIMEOUT: 30000,
                    OPENAI_MAX_TOKENS: 4096,
                    OPENAI_MAX_RETRIES: 3,
                    OPENAI_BASE_DELAY: 1000,
                    OPENAI_MAX_DELAY: 10000,
                    OPENAI_BACKOFF_MULTIPLIER: 2,
                };
                return config[key] || defaultValue;
            }),
        };
        const mockMem0Service = {
            storeInteraction: jest.fn().mockResolvedValue(undefined),
            search: jest.fn().mockResolvedValue([]),
        };
        const mockRetryService = {
            executeWithRetry: jest.fn().mockImplementation((operation) => operation()),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                ai_service_1.AiService,
                { provide: config_1.ConfigService, useValue: mockConfigService },
                { provide: mem0_service_1.Mem0Service, useValue: mockMem0Service },
                { provide: retry_service_1.RetryService, useValue: mockRetryService },
            ],
        }).compile();
        service = module.get(ai_service_1.AiService);
        configService = module.get(config_1.ConfigService);
        mem0Service = module.get(mem0_service_1.Mem0Service);
        retryService = module.get(retry_service_1.RetryService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('generateTasks', () => {
        it('should handle task generation errors gracefully', async () => {
            const dto = {
                projectDescription: 'Test project',
                context: 'Test context',
                maxTasks: 5,
            };
            retryService.executeWithRetry.mockRejectedValue(new Error('OpenAI API error'));
            await expect(service.generateTasks(dto)).rejects.toThrow();
        });
    });
    describe('summarize', () => {
        it('should handle summarization errors gracefully', async () => {
            const dto = {
                text: 'Test text to summarize',
                maxLength: 100,
                format: 'paragraph',
            };
            retryService.executeWithRetry.mockRejectedValue(new Error('OpenAI API error'));
            await expect(service.summarize(dto)).rejects.toThrow();
        });
    });
    describe('getSuggestions', () => {
        it('should handle suggestion errors gracefully', async () => {
            const dto = {
                context: 'Test context',
                type: 'improvement',
            };
            retryService.executeWithRetry.mockRejectedValue(new Error('OpenAI API error'));
            await expect(service.getSuggestions(dto)).rejects.toThrow();
        });
    });
});
//# sourceMappingURL=ai.service.spec.js.map