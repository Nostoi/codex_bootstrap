"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const ai_controller_1 = require("./ai.controller");
const ai_service_1 = require("./ai.service");
const config_1 = require("@nestjs/config");
const mem0_service_1 = require("./mem0.service");
const retry_service_1 = require("./services/retry.service");
describe("AiController", () => {
    let controller;
    let aiService;
    beforeEach(async () => {
        const mockAiService = {
            generateTasks: jest.fn(),
            getSuggestions: jest.fn(),
            summarize: jest.fn(),
            chatCompletion: jest.fn(),
        };
        const module = await testing_1.Test.createTestingModule({
            controllers: [ai_controller_1.AiController],
            providers: [
                { provide: ai_service_1.AiService, useValue: mockAiService },
                { provide: config_1.ConfigService, useValue: {} },
                { provide: mem0_service_1.Mem0Service, useValue: {} },
                { provide: retry_service_1.RetryService, useValue: {} },
            ],
        }).compile();
        controller = module.get(ai_controller_1.AiController);
        aiService = module.get(ai_service_1.AiService);
    });
    it("should be defined", () => {
        expect(controller).toBeDefined();
    });
    describe("generateTasks", () => {
        it("should call aiService.generateTasks", async () => {
            const dto = {
                projectDescription: "Test project",
                maxTasks: 5,
            };
            const expectedResult = {
                data: [],
                usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
                model: "gpt-4o-mini",
                processingTimeMs: 100,
            };
            aiService.generateTasks.mockResolvedValue(expectedResult);
            const result = await controller.generateTasks(dto);
            expect(aiService.generateTasks).toHaveBeenCalledWith(dto);
            expect(result).toBe(expectedResult);
        });
    });
    describe("getSuggestions", () => {
        it("should call aiService.getSuggestions", async () => {
            const dto = {
                context: "Test context",
                type: "improvement",
            };
            const expectedResult = {
                data: [],
                usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
                model: "gpt-4o-mini",
                processingTimeMs: 100,
            };
            aiService.getSuggestions.mockResolvedValue(expectedResult);
            const result = await controller.getSuggestions(dto);
            expect(aiService.getSuggestions).toHaveBeenCalledWith(dto);
            expect(result).toBe(expectedResult);
        });
    });
    describe("summarize", () => {
        it("should call aiService.summarize", async () => {
            const dto = {
                text: "Test text",
                maxLength: 100,
                format: "paragraph",
            };
            const expectedResult = {
                data: {
                    summary: "Test summary",
                    keyPoints: [],
                    originalLength: 9,
                    summaryLength: 12,
                    compressionRatio: 0.75,
                },
                usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
                model: "gpt-4o-mini",
                processingTimeMs: 100,
            };
            aiService.summarize.mockResolvedValue(expectedResult);
            const result = await controller.summarize(dto);
            expect(aiService.summarize).toHaveBeenCalledWith(dto);
            expect(result).toBe(expectedResult);
        });
    });
    describe("chatCompletion", () => {
        it("should call aiService.chatCompletion", async () => {
            const dto = {
                messages: [{ role: "user", content: "Hello" }],
                model: "gpt-4o-mini",
                temperature: 0.7,
                maxTokens: 100,
            };
            const expectedResult = {
                data: "Hello! How can I help you?",
                usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
                model: "gpt-4o-mini",
                processingTimeMs: 100,
            };
            aiService.chatCompletion.mockResolvedValue(expectedResult);
            const result = await controller.chatCompletion(dto);
            expect(aiService.chatCompletion).toHaveBeenCalledWith({
                messages: dto.messages,
                model: dto.model,
                temperature: dto.temperature,
                maxTokens: dto.maxTokens,
                stream: undefined,
                jsonMode: undefined,
            });
            expect(result).toBe(expectedResult);
        });
    });
});
//# sourceMappingURL=ai.controller.spec.js.map