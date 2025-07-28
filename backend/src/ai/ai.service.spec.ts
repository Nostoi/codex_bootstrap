import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { AiService } from "./ai.service";
import { Mem0Service } from "./mem0.service";
import { RetryService } from "./services/retry.service";

describe("AiService", () => {
  let service: AiService;
  let configService: jest.Mocked<ConfigService>;
  let mem0Service: jest.Mocked<Mem0Service>;
  let retryService: jest.Mocked<RetryService>;

  beforeEach(async () => {
    // Mock services
    const mockConfigService = {
      get: jest.fn().mockImplementation((key: string, defaultValue?: any) => {
        const config = {
          OPENAI_API_KEY: "test-api-key",
          OPENAI_DEFAULT_MODEL: "gpt-4o-mini",
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
      executeWithRetry: jest
        .fn()
        .mockImplementation((operation) => operation()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: Mem0Service, useValue: mockMem0Service },
        { provide: RetryService, useValue: mockRetryService },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    configService = module.get(ConfigService);
    mem0Service = module.get(Mem0Service);
    retryService = module.get(RetryService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("generateTasks", () => {
    it("should handle task generation errors gracefully", async () => {
      const dto = {
        projectDescription: "Test project",
        context: "Test context",
        maxTasks: 5,
      };

      // Mock the retry service to throw an error
      retryService.executeWithRetry.mockRejectedValue(
        new Error("OpenAI API error"),
      );

      await expect(service.generateTasks(dto)).rejects.toThrow();
    });
  });

  describe("summarize", () => {
    it("should handle summarization errors gracefully", async () => {
      const dto = {
        text: "Test text to summarize",
        maxLength: 100,
        format: "paragraph" as const,
      };

      // Mock the retry service to throw an error
      retryService.executeWithRetry.mockRejectedValue(
        new Error("OpenAI API error"),
      );

      await expect(service.summarize(dto)).rejects.toThrow();
    });
  });

  describe("getSuggestions", () => {
    it("should handle suggestion errors gracefully", async () => {
      const dto = {
        context: "Test context",
        type: "improvement" as const,
      };

      // Mock the retry service to throw an error
      retryService.executeWithRetry.mockRejectedValue(
        new Error("OpenAI API error"),
      );

      await expect(service.getSuggestions(dto)).rejects.toThrow();
    });
  });
});
