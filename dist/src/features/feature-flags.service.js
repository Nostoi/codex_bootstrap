"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var FeatureFlagsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureFlagsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const feature_flags_types_1 = require("./feature-flags.types");
let FeatureFlagsService = FeatureFlagsService_1 = class FeatureFlagsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(FeatureFlagsService_1.name);
        this.flagConfigs = {
            [feature_flags_types_1.FeatureFlags.ENHANCED_TASK_METADATA]: {
                flag: feature_flags_types_1.FeatureFlags.ENHANCED_TASK_METADATA,
                description: "Enable enhanced task metadata fields (energy level, focus type, etc.)",
                defaultEnabled: true,
                requiresAuth: true,
            },
            [feature_flags_types_1.FeatureFlags.AI_TASK_EXTRACTION]: {
                flag: feature_flags_types_1.FeatureFlags.AI_TASK_EXTRACTION,
                description: "Enable OpenAI integration for task parsing and extraction",
                defaultEnabled: true,
                requiresAuth: true,
            },
            [feature_flags_types_1.FeatureFlags.DAILY_PLANNING]: {
                flag: feature_flags_types_1.FeatureFlags.DAILY_PLANNING,
                description: "Enable intelligent scheduling algorithm and daily planning features",
                defaultEnabled: false,
                rolloutPercentage: 0,
                requiresAuth: true,
                dependencies: [feature_flags_types_1.FeatureFlags.ENHANCED_TASK_METADATA],
            },
            [feature_flags_types_1.FeatureFlags.MEM0_INTEGRATION]: {
                flag: feature_flags_types_1.FeatureFlags.MEM0_INTEGRATION,
                description: "Enable semantic memory and context with Mem0 integration",
                defaultEnabled: false,
                rolloutPercentage: 0,
                requiresAuth: true,
            },
            [feature_flags_types_1.FeatureFlags.ADVANCED_AI_FEATURES]: {
                flag: feature_flags_types_1.FeatureFlags.ADVANCED_AI_FEATURES,
                description: "Enable proactive suggestions and advanced AI learning features",
                defaultEnabled: false,
                rolloutPercentage: 0,
                requiresAuth: true,
                dependencies: [
                    feature_flags_types_1.FeatureFlags.AI_TASK_EXTRACTION,
                    feature_flags_types_1.FeatureFlags.MEM0_INTEGRATION,
                ],
            },
        };
    }
    async isEnabled(flag, userId, userHash) {
        try {
            const config = this.flagConfigs[flag];
            if (!config) {
                this.logger.warn(`Unknown feature flag: ${flag}`);
                return false;
            }
            const envValue = process.env[`FF_${flag}`];
            if (envValue !== undefined) {
                const enabled = envValue.toLowerCase() === "true";
                this.logger.debug(`Feature flag ${flag} set via environment: ${enabled}`);
                return enabled;
            }
            if (userId) {
                const userOverride = await this.getUserOverride(flag, userId);
                if (userOverride !== null) {
                    this.logger.debug(`Feature flag ${flag} overridden for user ${userId}: ${userOverride}`);
                    return userOverride;
                }
            }
            if (config.dependencies?.length) {
                for (const dependency of config.dependencies) {
                    const dependencyEnabled = await this.isEnabled(dependency, userId, userHash);
                    if (!dependencyEnabled) {
                        this.logger.debug(`Feature flag ${flag} disabled due to dependency ${dependency}`);
                        return false;
                    }
                }
            }
            if (config.rolloutPercentage !== undefined && userHash !== undefined) {
                const enabled = userHash % 100 < config.rolloutPercentage;
                this.logger.debug(`Feature flag ${flag} percentage rollout (${config.rolloutPercentage}%): ${enabled}`);
                return enabled;
            }
            return config.defaultEnabled;
        }
        catch (error) {
            this.logger.error(`Error checking feature flag ${flag}:`, error);
            return false;
        }
    }
    async getUserOverride(_flag, _userId) {
        return null;
    }
    async setUserOverride(flag, userId, enabled, _expiresAt) {
        try {
            this.logger.log(`Would set user override: ${flag} = ${enabled} for user ${userId}`);
        }
        catch (error) {
            this.logger.error(`Error setting user override for ${flag}:`, error);
        }
    }
    getAllConfigs() {
        return this.flagConfigs;
    }
    async getAllFlags(userId, userHash) {
        const flags = {};
        for (const flag of Object.values(feature_flags_types_1.FeatureFlags)) {
            flags[flag] = await this.isEnabled(flag, userId, userHash);
        }
        return flags;
    }
    static createUserHash(userId) {
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            const char = userId.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash;
        }
        return Math.abs(hash) % 100;
    }
    async healthCheck() {
        const errors = [];
        try {
            const flagCount = Object.keys(this.flagConfigs).length;
            for (const flag of Object.values(feature_flags_types_1.FeatureFlags)) {
                const envValue = process.env[`FF_${flag}`];
                if (envValue && !["true", "false"].includes(envValue.toLowerCase())) {
                    errors.push(`Invalid environment value for ${flag}: ${envValue}`);
                }
            }
            return {
                status: errors.length === 0 ? "healthy" : "degraded",
                flags: flagCount,
                errors,
            };
        }
        catch (error) {
            return {
                status: "unhealthy",
                flags: 0,
                errors: [error.message],
            };
        }
    }
};
exports.FeatureFlagsService = FeatureFlagsService;
exports.FeatureFlagsService = FeatureFlagsService = FeatureFlagsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FeatureFlagsService);
//# sourceMappingURL=feature-flags.service.js.map