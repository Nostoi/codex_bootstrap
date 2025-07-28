"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const feature_flags_service_1 = require("./feature-flags.service");
const prisma_service_1 = require("../prisma/prisma.service");
const feature_flags_types_1 = require("./feature-flags.types");
describe('FeatureFlagsService', () => {
    let service;
    let prismaService;
    const mockPrismaService = {};
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                feature_flags_service_1.FeatureFlagsService,
                {
                    provide: prisma_service_1.PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();
        service = module.get(feature_flags_service_1.FeatureFlagsService);
        prismaService = module.get(prisma_service_1.PrismaService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('isEnabled', () => {
        beforeEach(() => {
            Object.keys(process.env).forEach(key => {
                if (key.startsWith('FF_')) {
                    delete process.env[key];
                }
            });
        });
        it('should return default value when no overrides exist', async () => {
            const result = await service.isEnabled(feature_flags_types_1.FeatureFlags.ENHANCED_TASK_METADATA);
            expect(result).toBe(true);
        });
        it('should respect environment variable overrides', async () => {
            process.env.FF_ENHANCED_TASK_METADATA = 'false';
            const result = await service.isEnabled(feature_flags_types_1.FeatureFlags.ENHANCED_TASK_METADATA);
            expect(result).toBe(false);
        });
        it('should handle percentage rollouts', async () => {
            const userHash = 25;
            const result = await service.isEnabled(feature_flags_types_1.FeatureFlags.DAILY_PLANNING, 'test-user', userHash);
            expect(typeof result).toBe('boolean');
        });
        it('should handle dependencies correctly', async () => {
            process.env.FF_AI_TASK_EXTRACTION = 'false';
            const result = await service.isEnabled(feature_flags_types_1.FeatureFlags.ADVANCED_AI_FEATURES);
            expect(result).toBe(false);
        });
        it('should fail safe on errors', async () => {
            const result = await service.isEnabled('INVALID_FLAG');
            expect(result).toBe(false);
        });
    });
    describe('createUserHash', () => {
        it('should create consistent hash for same user ID', () => {
            const userId = 'test-user-123';
            const hash1 = feature_flags_service_1.FeatureFlagsService.createUserHash(userId);
            const hash2 = feature_flags_service_1.FeatureFlagsService.createUserHash(userId);
            expect(hash1).toBe(hash2);
        });
        it('should create hash in range 0-99', () => {
            const userId = 'test-user-123';
            const hash = feature_flags_service_1.FeatureFlagsService.createUserHash(userId);
            expect(hash).toBeGreaterThanOrEqual(0);
            expect(hash).toBeLessThan(100);
        });
        it('should create different hashes for different users', () => {
            const hash1 = feature_flags_service_1.FeatureFlagsService.createUserHash('user1');
            const hash2 = feature_flags_service_1.FeatureFlagsService.createUserHash('user2');
            expect(hash1).not.toBe(hash2);
        });
    });
    describe('getAllFlags', () => {
        it('should return all flags with their status', async () => {
            const flags = await service.getAllFlags();
            expect(Object.keys(flags)).toEqual(Object.values(feature_flags_types_1.FeatureFlags));
            Object.values(flags).forEach(value => {
                expect(typeof value).toBe('boolean');
            });
        });
    });
    describe('healthCheck', () => {
        it('should return healthy status with valid configuration', async () => {
            const health = await service.healthCheck();
            expect(health.status).toBe('healthy');
            expect(health.flags).toBeGreaterThan(0);
            expect(health.errors).toEqual([]);
        });
        it('should detect invalid environment variables', async () => {
            process.env.FF_ENHANCED_TASK_METADATA = 'invalid';
            const health = await service.healthCheck();
            expect(health.status).toBe('degraded');
            expect(health.errors.length).toBeGreaterThan(0);
        });
    });
    describe('getAllConfigs', () => {
        it('should return all feature flag configurations', () => {
            const configs = service.getAllConfigs();
            expect(Object.keys(configs)).toEqual(Object.values(feature_flags_types_1.FeatureFlags));
            Object.values(configs).forEach(config => {
                expect(config).toHaveProperty('flag');
                expect(config).toHaveProperty('description');
                expect(config).toHaveProperty('defaultEnabled');
            });
        });
    });
});
//# sourceMappingURL=feature-flags.service.spec.js.map