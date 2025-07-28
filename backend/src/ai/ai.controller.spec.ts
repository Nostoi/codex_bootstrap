import { Test, TestingModule } from "@nestjs/testing";
import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";
import { ConfigService } from "@nestjs/config";
import { Mem0Service } from "./mem0.service";
import { RetryService } from "./services/retry.service";

describe("AiController", () => {
  let controller: AiController;
  let aiService: jest.Mocked<AiService>;

  beforeEach(async () => {
    const mockAiService = {
      generateTasks: jest.fn(),
      getSuggestions: jest.fn(),
      summarize: jest.fn(),
      chatCompletion: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
      providers: [
        { provide: AiService, useValue: mockAiService },
        { provide: ConfigService, useValue: {} },
        { provide: Mem0Service, useValue: {} },
        { provide: RetryService, useValue: {} },
      ],
    }).compile();

    controller = module.get<AiController>(AiController);
    aiService = module.get(AiService);
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
        type: "improvement" as const,
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
        format: "paragraph" as const,
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
        messages: [{ role: "user" as const, content: "Hello" }],
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
