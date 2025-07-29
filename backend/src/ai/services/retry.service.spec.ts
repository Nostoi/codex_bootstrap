import { Test, TestingModule } from "@nestjs/testing";
import { RetryService } from "./retry.service";
import {
  OpenAIUnauthorizedException,
} from "../exceptions/openai.exceptions";

describe("RetryService", () => {
  let service: RetryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RetryService],
    }).compile();

    service = module.get<RetryService>(RetryService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("executeWithRetry", () => {
    it("should succeed on first attempt", async () => {
      const operation = jest.fn().mockResolvedValue("success");
      const config = {
        maxRetries: 3,
        baseDelay: 100,
        maxDelay: 1000,
        backoffMultiplier: 2,
        retryableStatusCodes: [429, 500, 502, 503, 504],
      };

      const result = await service.executeWithRetry(operation, config);

      expect(result).toBe("success");
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it("should retry on retryable errors", async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error("Retryable error"))
        .mockResolvedValue("success");

      const config = {
        maxRetries: 3,
        baseDelay: 10,
        maxDelay: 100,
        backoffMultiplier: 2,
        retryableStatusCodes: [429, 500, 502, 503, 504],
      };

      const result = await service.executeWithRetry(operation, config);

      expect(result).toBe("success");
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it("should not retry on non-retryable errors", async () => {
      const operation = jest
        .fn()
        .mockRejectedValue(new OpenAIUnauthorizedException());

      const config = {
        maxRetries: 3,
        baseDelay: 10,
        maxDelay: 100,
        backoffMultiplier: 2,
        retryableStatusCodes: [429, 500, 502, 503, 504],
      };

      await expect(service.executeWithRetry(operation, config)).rejects.toThrow(
        OpenAIUnauthorizedException,
      );

      expect(operation).toHaveBeenCalledTimes(1);
    });

    it("should throw after max retries", async () => {
      const error = new Error("Persistent error");
      const operation = jest.fn().mockRejectedValue(error);

      const config = {
        maxRetries: 2,
        baseDelay: 10,
        maxDelay: 100,
        backoffMultiplier: 2,
        retryableStatusCodes: [429, 500, 502, 503, 504],
      };

      await expect(service.executeWithRetry(operation, config)).rejects.toThrow(
        "Persistent error",
      );

      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });
});
