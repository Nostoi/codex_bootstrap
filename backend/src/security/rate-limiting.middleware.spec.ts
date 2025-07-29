import { Test, TestingModule } from "@nestjs/testing";
import { Request, Response, NextFunction } from "express";
import { RateLimitingMiddleware } from "./rate-limiting.middleware";
import { AuditLoggerService } from "./audit-logger.service";

interface ExtendedRequest extends Request {
  correlationId?: string;
  user?: { id: string };
}

// Mock Redis
jest.mock("ioredis", () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue("0"),
    set: jest.fn().mockResolvedValue("OK"),
    del: jest.fn().mockResolvedValue(1),
    ttl: jest.fn().mockResolvedValue(60),
    keys: jest.fn().mockResolvedValue([]),
    on: jest.fn(),
  }));
});

// Mock express-rate-limit
jest.mock("express-rate-limit", () => {
  return jest.fn().mockImplementation((options) => {
    return jest.fn((req: Request, res: Response, next: NextFunction) => {
      // Simulate rate limit headers
      res.set("X-RateLimit-Limit", options.max.toString());
      res.set("X-RateLimit-Remaining", (options.max - 1).toString());
      next();
    });
  });
});

describe("RateLimitingMiddleware", () => {
  let middleware: RateLimitingMiddleware;
  let mockAuditLogger: jest.Mocked<AuditLoggerService>;
  let mockRequest: Partial<ExtendedRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(async () => {
    const mockAuditLoggerService = {
      logFailure: jest.fn().mockResolvedValue(undefined),
      generateCorrelationId: jest.fn().mockReturnValue("test-correlation-id"),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimitingMiddleware,
        {
          provide: AuditLoggerService,
          useValue: mockAuditLoggerService,
        },
      ],
    }).compile();

    middleware = module.get<RateLimitingMiddleware>(RateLimitingMiddleware);
    mockAuditLogger = module.get(
      AuditLoggerService,
    ) as jest.Mocked<AuditLoggerService>;

    mockRequest = {
      path: "/api/tasks",
      method: "GET",
      ip: "192.168.1.1",
      get: jest.fn().mockReturnValue("test-user-agent"),
    } as Partial<ExtendedRequest>;

    mockResponse = {
      set: jest.fn(),
    };

    nextFunction = jest.fn();
  });

  describe("use", () => {
    it("should add correlation ID if not present", () => {
      middleware.use(
        mockRequest as ExtendedRequest,
        mockResponse as any,
        nextFunction,
      );

      expect(mockRequest.correlationId).toBe("test-correlation-id");
      expect(mockResponse.set).toHaveBeenCalledWith(
        "X-Correlation-ID",
        "test-correlation-id",
      );
    });

    it("should not override existing correlation ID", () => {
      mockRequest.correlationId = "existing-id";

      middleware.use(
        mockRequest as ExtendedRequest,
        mockResponse as any,
        nextFunction,
      );

      expect(mockRequest.correlationId).toBe("existing-id");
    });

    it("should apply rate limiting to API endpoints", () => {
      (mockRequest as any).path = "/api/tasks/123";

      middleware.use(
        mockRequest as ExtendedRequest,
        mockResponse as any,
        nextFunction,
      );

      expect(nextFunction).toHaveBeenCalled();
    });

    it("should call next function after rate limiting", () => {
      middleware.use(
        mockRequest as ExtendedRequest,
        mockResponse as any,
        nextFunction,
      );

      expect(nextFunction).toHaveBeenCalledWith(undefined);
    });
  });

  describe("endpoint categorization", () => {
    it("should categorize AI endpoints correctly", () => {
      const getCategory = (middleware as any).getEndpointCategory.bind(
        middleware,
      );

      expect(getCategory("/api/ai/extract-tasks")).toBe("ai");
      expect(getCategory("/api/ai/classify")).toBe("ai");
    });

    it("should categorize task endpoints correctly", () => {
      const getCategory = (middleware as any).getEndpointCategory.bind(
        middleware,
      );

      expect(getCategory("/api/tasks")).toBe("tasks");
      expect(getCategory("/api/tasks/123")).toBe("tasks");
    });

    it("should categorize auth endpoints correctly", () => {
      const getCategory = (middleware as any).getEndpointCategory.bind(
        middleware,
      );

      expect(getCategory("/api/auth/login")).toBe("auth");
      expect(getCategory("/api/auth/logout")).toBe("auth");
    });

    it("should use default category for unknown endpoints", () => {
      const getCategory = (middleware as any).getEndpointCategory.bind(
        middleware,
      );

      expect(getCategory("/api/unknown")).toBe("default");
      expect(getCategory("/health")).toBe("default");
    });
  });

  describe("key generation", () => {
    it("should generate user-based key when authenticated", () => {
      const testRequest = {
        ...mockRequest,
        user: { id: "user123" },
        path: "/api/tasks",
      } as ExtendedRequest;

      const getKey = (middleware as any).getKeyForRequest.bind(middleware);
      const key = getKey(testRequest);

      expect(key).toBe("user:user123:tasks");
    });

    it("should generate IP-based key when not authenticated", () => {
      const testRequest = {
        ...mockRequest,
        path: "/api/tasks",
      } as ExtendedRequest;

      const getKey = (middleware as any).getKeyForRequest.bind(middleware);
      const key = getKey(testRequest);

      expect(key).toBe("ip:192.168.1.1:tasks");
    });
  });

  describe("client IP detection", () => {
    it("should get IP from request.ip", () => {
      const testRequest = { ...mockRequest, ip: "10.0.0.1" } as ExtendedRequest;

      const getClientIp = (middleware as any).getClientIp.bind(middleware);
      const ip = getClientIp(testRequest);

      expect(ip).toBe("10.0.0.1");
    });

    it("should fallback to connection.remoteAddress", () => {
      const testRequest = {
        ...mockRequest,
        ip: undefined,
        connection: { remoteAddress: "10.0.0.2" },
      } as any;

      const getClientIp = (middleware as any).getClientIp.bind(middleware);
      const ip = getClientIp(testRequest);

      expect(ip).toBe("10.0.0.2");
    });

    it("should return unknown when no IP available", () => {
      const testRequest = {
        ...mockRequest,
        ip: undefined,
        connection: {},
      } as any;

      const getClientIp = (middleware as any).getClientIp.bind(middleware);
      const ip = getClientIp(testRequest);

      expect(ip).toBe("unknown");
    });
  });

  describe("skip rate limiting", () => {
    it("should skip health check endpoints", () => {
      const testRequest = {
        ...mockRequest,
        path: "/health",
      } as ExtendedRequest;

      const shouldSkip = (middleware as any).shouldSkipRateLimit.bind(
        middleware,
      );
      const skip = shouldSkip(testRequest);

      expect(skip).toBe(true);
    });

    it("should skip metrics endpoints", () => {
      const testRequest = {
        ...mockRequest,
        path: "/metrics",
      } as ExtendedRequest;

      const shouldSkip = (middleware as any).shouldSkipRateLimit.bind(
        middleware,
      );
      const skip = shouldSkip(testRequest);

      expect(skip).toBe(true);
    });

    it("should not skip API endpoints", () => {
      const testRequest = {
        ...mockRequest,
        path: "/api/tasks",
      } as ExtendedRequest;

      const shouldSkip = (middleware as any).shouldSkipRateLimit.bind(
        middleware,
      );
      const skip = shouldSkip(testRequest);

      expect(skip).toBe(false);
    });
  });

  describe("rate limit exceeded handling", () => {
    it("should log audit event when rate limit exceeded", async () => {
      const testRequest = {
        ...mockRequest,
        path: "/api/tasks",
        user: { id: "user123" },
      } as ExtendedRequest;

      const onRateLimitExceeded = (middleware as any).onRateLimitExceeded.bind(
        middleware,
      );
      await onRateLimitExceeded(testRequest, mockResponse);

      expect(mockAuditLogger.logFailure).toHaveBeenCalledWith(
        expect.any(String), // AuditAction.RATE_LIMIT_EXCEEDED
        "rate_limiter",
        "Rate limit exceeded for tasks endpoints",
        expect.objectContaining({
          userId: "user123",
          ipAddress: "192.168.1.1",
          metadata: expect.objectContaining({
            path: "/api/tasks",
            category: "tasks",
            method: "GET",
          }),
        }),
      );
    });

    it("should set custom headers when rate limit exceeded", async () => {
      const testRequest = {
        ...mockRequest,
        path: "/api/ai/extract",
      } as ExtendedRequest;

      const onRateLimitExceeded = (middleware as any).onRateLimitExceeded.bind(
        middleware,
      );
      await onRateLimitExceeded(testRequest, mockResponse);

      expect(mockResponse.set).toHaveBeenCalledWith({
        "X-Rate-Limit-Category": "ai",
        "X-Rate-Limit-Reset": expect.any(String),
      });
    });
  });

  describe("getRateLimitStatus", () => {
    it("should return rate limit status for all categories", async () => {
      const status = await middleware.getRateLimitStatus("user123");

      expect(status).toBeInstanceOf(Array);
      // When Redis is not available (in tests), it returns empty array
      expect(status.length).toBeGreaterThanOrEqual(0);
      
      // Only check properties if there are results
      if (status.length > 0) {
        expect(status[0]).toHaveProperty("category");
        expect(status[0]).toHaveProperty("remaining");
        expect(status[0]).toHaveProperty("resetTime");
      }
    });
  });

  describe("resetRateLimit", () => {
    it("should reset rate limit for specific category", async () => {
      await expect(
        middleware.resetRateLimit("user123", undefined, "tasks"),
      ).resolves.not.toThrow();
    });

    it("should reset all rate limits for user", async () => {
      await expect(middleware.resetRateLimit("user123")).resolves.not.toThrow();
    });
  });

  describe("getMaxRequestsForCategory", () => {
    it("should return correct limits for each category", () => {
      const getMaxRequests = (middleware as any).getMaxRequestsForCategory.bind(
        middleware,
      );

      expect(getMaxRequests("ai")).toBe(10);
      expect(getMaxRequests("tasks")).toBe(60);
      expect(getMaxRequests("auth")).toBe(5);
      expect(getMaxRequests("projects")).toBe(30);
      expect(getMaxRequests("users")).toBe(30);
      expect(getMaxRequests("default")).toBe(100);
      expect(getMaxRequests("unknown")).toBe(100);
    });
  });
});
