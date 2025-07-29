import { Test, TestingModule } from "@nestjs/testing";
import { FeatureFlagsService } from "./feature-flags.service";
import { PrismaService } from "../prisma/prisma.service";
import { FeatureFlags } from "./feature-flags.types";

describe("FeatureFlagsService", () => {
  let service: FeatureFlagsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    // Mock Prisma methods as needed
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureFlagsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<FeatureFlagsService>(FeatureFlagsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("isEnabled", () => {
    beforeEach(() => {
      // Clear environment variables before each test
      Object.keys(process.env).forEach((key) => {
        if (key.startsWith("FF_")) {
          delete process.env[key];
        }
      });
    });

    it("should return default value when no overrides exist", async () => {
      const result = await service.isEnabled(
        FeatureFlags.ENHANCED_TASK_METADATA,
      );
      expect(result).toBe(true); // Default is true for this flag
    });

    it("should respect environment variable overrides", async () => {
      process.env.FF_ENHANCED_TASK_METADATA = "false";
      const result = await service.isEnabled(
        FeatureFlags.ENHANCED_TASK_METADATA,
      );
      expect(result).toBe(false);
    });

    it("should handle percentage rollouts", async () => {
      const userHash = 25; // 25%
      const result = await service.isEnabled(
        FeatureFlags.DAILY_PLANNING,
        "test-user",
        userHash,
      );
      expect(typeof result).toBe("boolean");
    });

    it("should handle dependencies correctly", async () => {
      // ADVANCED_AI_FEATURES depends on AI_TASK_EXTRACTION and MEM0_INTEGRATION
      process.env.FF_AI_TASK_EXTRACTION = "false";
      const result = await service.isEnabled(FeatureFlags.ADVANCED_AI_FEATURES);
      expect(result).toBe(false); // Should be false due to dependency
    });

    it("should fail safe on errors", async () => {
      // Test with invalid flag
      const result = await service.isEnabled("INVALID_FLAG" as FeatureFlags);
      expect(result).toBe(false);
    });
  });

  describe("createUserHash", () => {
    it("should create consistent hash for same user ID", () => {
      const userId = "test-user-123";
      const hash1 = FeatureFlagsService.createUserHash(userId);
      const hash2 = FeatureFlagsService.createUserHash(userId);
      expect(hash1).toBe(hash2);
    });

    it("should create hash in range 0-99", () => {
      const userId = "test-user-123";
      const hash = FeatureFlagsService.createUserHash(userId);
      expect(hash).toBeGreaterThanOrEqual(0);
      expect(hash).toBeLessThan(100);
    });

    it("should create different hashes for different users", () => {
      const hash1 = FeatureFlagsService.createUserHash("user1");
      const hash2 = FeatureFlagsService.createUserHash("user2");
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("getAllFlags", () => {
    it("should return all flags with their status", async () => {
      const flags = await service.getAllFlags();
      expect(Object.keys(flags)).toEqual(Object.values(FeatureFlags));
      Object.values(flags).forEach((value) => {
        expect(typeof value).toBe("boolean");
      });
    });
  });

  describe("healthCheck", () => {
    it("should return healthy status with valid configuration", async () => {
      const health = await service.healthCheck();
      expect(health.status).toBe("healthy");
      expect(health.flags).toBeGreaterThan(0);
      expect(health.errors).toEqual([]);
    });

    it("should detect invalid environment variables", async () => {
      process.env.FF_ENHANCED_TASK_METADATA = "invalid";
      const health = await service.healthCheck();
      expect(health.status).toBe("degraded");
      expect(health.errors.length).toBeGreaterThan(0);
    });
  });

  describe("getAllConfigs", () => {
    it("should return all feature flag configurations", () => {
      const configs = service.getAllConfigs();
      expect(Object.keys(configs)).toEqual(Object.values(FeatureFlags));

      Object.values(configs).forEach((config) => {
        expect(config).toHaveProperty("flag");
        expect(config).toHaveProperty("description");
        expect(config).toHaveProperty("defaultEnabled");
      });
    });
  });
});
