import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  FeatureFlags,
  FeatureFlagConfig,
} from "./feature-flags.types";

@Injectable()
export class FeatureFlagsService {
  private readonly logger = new Logger(FeatureFlagsService.name);

  // Feature flag configurations with descriptions and defaults
  private readonly flagConfigs: Record<FeatureFlags, FeatureFlagConfig> = {
    [FeatureFlags.ENHANCED_TASK_METADATA]: {
      flag: FeatureFlags.ENHANCED_TASK_METADATA,
      description:
        "Enable enhanced task metadata fields (energy level, focus type, etc.)",
      defaultEnabled: true, // Already implemented and stable
      requiresAuth: true,
    },
    [FeatureFlags.AI_TASK_EXTRACTION]: {
      flag: FeatureFlags.AI_TASK_EXTRACTION,
      description: "Enable OpenAI integration for task parsing and extraction",
      defaultEnabled: true, // Recently implemented and tested
      requiresAuth: true,
    },
    [FeatureFlags.DAILY_PLANNING]: {
      flag: FeatureFlags.DAILY_PLANNING,
      description:
        "Enable intelligent scheduling algorithm and daily planning features",
      defaultEnabled: false, // Not yet implemented
      rolloutPercentage: 0,
      requiresAuth: true,
      dependencies: [FeatureFlags.ENHANCED_TASK_METADATA],
    },
    [FeatureFlags.MEM0_INTEGRATION]: {
      flag: FeatureFlags.MEM0_INTEGRATION,
      description: "Enable semantic memory and context with Mem0 integration",
      defaultEnabled: false, // Not yet implemented
      rolloutPercentage: 0,
      requiresAuth: true,
    },
    [FeatureFlags.ADVANCED_AI_FEATURES]: {
      flag: FeatureFlags.ADVANCED_AI_FEATURES,
      description:
        "Enable proactive suggestions and advanced AI learning features",
      defaultEnabled: false, // Not yet implemented
      rolloutPercentage: 0,
      requiresAuth: true,
      dependencies: [
        FeatureFlags.AI_TASK_EXTRACTION,
        FeatureFlags.MEM0_INTEGRATION,
      ],
    },
  };

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if a feature flag is enabled for a specific user
   * @param flag The feature flag to check
   * @param userId Optional user ID for user-specific overrides
   * @param userHash Optional hash for percentage rollouts
   * @returns true if the feature is enabled
   */
  async isEnabled(
    flag: FeatureFlags,
    userId?: string,
    userHash?: number,
  ): Promise<boolean> {
    try {
      const config = this.flagConfigs[flag];
      if (!config) {
        this.logger.warn(`Unknown feature flag: ${flag}`);
        return false;
      }

      // Check environment variable override (global)
      const envValue = process.env[`FF_${flag}`];
      if (envValue !== undefined) {
        const enabled = envValue.toLowerCase() === "true";
        this.logger.debug(
          `Feature flag ${flag} set via environment: ${enabled}`,
        );
        return enabled;
      }

      // Check user-specific override
      if (userId) {
        const userOverride = await this.getUserOverride(flag, userId);
        if (userOverride !== null) {
          this.logger.debug(
            `Feature flag ${flag} overridden for user ${userId}: ${userOverride}`,
          );
          return userOverride;
        }
      }

      // Check dependencies
      if (config.dependencies?.length) {
        for (const dependency of config.dependencies) {
          const dependencyEnabled = await this.isEnabled(
            dependency,
            userId,
            userHash,
          );
          if (!dependencyEnabled) {
            this.logger.debug(
              `Feature flag ${flag} disabled due to dependency ${dependency}`,
            );
            return false;
          }
        }
      }

      // Check percentage rollout
      if (config.rolloutPercentage !== undefined && userHash !== undefined) {
        const enabled = userHash % 100 < config.rolloutPercentage;
        this.logger.debug(
          `Feature flag ${flag} percentage rollout (${config.rolloutPercentage}%): ${enabled}`,
        );
        return enabled;
      }

      // Return default value
      return config.defaultEnabled;
    } catch (error) {
      this.logger.error(`Error checking feature flag ${flag}:`, error);
      return false; // Fail safe - return false on errors
    }
  }

  /**
   * Get user-specific feature flag override
   * @param flag The feature flag
   * @param userId The user ID
   * @returns true/false if override exists, null if no override
   */
  private async getUserOverride(
    _flag: FeatureFlags,
    _userId: string,
  ): Promise<boolean | null> {
    // For now, return null since we don't have the user overrides table
    // This would be implemented when we add a UserFeatureOverrides table to Prisma schema
    return null;
  }

  /**
   * Set user-specific feature flag override
   * @param flag The feature flag
   * @param userId The user ID
   * @param enabled Whether to enable or disable
   * @param expiresAt Optional expiration date
   */
  async setUserOverride(
    flag: FeatureFlags,
    userId: string,
    enabled: boolean,
    _expiresAt?: Date,
  ): Promise<void> {
    try {
      // This would be implemented when we add a UserFeatureOverrides table
      this.logger.log(
        `Would set user override: ${flag} = ${enabled} for user ${userId}`,
      );
    } catch (error) {
      this.logger.error(`Error setting user override for ${flag}:`, error);
    }
  }

  /**
   * Get all feature flag configurations
   * @returns All feature flag configs
   */
  getAllConfigs(): Record<FeatureFlags, FeatureFlagConfig> {
    return this.flagConfigs;
  }

  /**
   * Get current status of all feature flags for a user
   * @param userId Optional user ID
   * @param userHash Optional hash for percentage rollouts
   * @returns Object with all flags and their status
   */
  async getAllFlags(
    userId?: string,
    userHash?: number,
  ): Promise<Record<FeatureFlags, boolean>> {
    const flags: Record<FeatureFlags, boolean> = {} as any;

    for (const flag of Object.values(FeatureFlags)) {
      flags[flag] = await this.isEnabled(flag, userId, userHash);
    }

    return flags;
  }

  /**
   * Create a simple hash from user ID for percentage rollouts
   * @param userId The user ID
   * @returns A hash number 0-99
   */
  static createUserHash(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 100;
  }

  /**
   * Health check for feature flags service
   * @returns Health status
   */
  async healthCheck(): Promise<{
    status: string;
    flags: number;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // Validate all flag configurations
      const flagCount = Object.keys(this.flagConfigs).length;

      // Check if we can read environment variables
      for (const flag of Object.values(FeatureFlags)) {
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
    } catch (error) {
      return {
        status: "unhealthy",
        flags: 0,
        errors: [error.message],
      };
    }
  }
}
