export enum FeatureFlags {
  ENHANCED_TASK_METADATA = "ENHANCED_TASK_METADATA",
  AI_TASK_EXTRACTION = "AI_TASK_EXTRACTION",
  DAILY_PLANNING = "DAILY_PLANNING",
  MEM0_INTEGRATION = "MEM0_INTEGRATION",
  ADVANCED_AI_FEATURES = "ADVANCED_AI_FEATURES",
}

export interface UserFeatureOverride {
  userId: string;
  flag: FeatureFlags;
  enabled: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export interface FeatureFlagConfig {
  flag: FeatureFlags;
  description: string;
  defaultEnabled: boolean;
  rolloutPercentage?: number;
  requiresAuth?: boolean;
  dependencies?: FeatureFlags[];
}
