import { FeatureFlagsService } from "./feature-flags.service";
import { FeatureFlags } from "./feature-flags.types";
export declare class FeatureFlagsController {
    private readonly featureFlagsService;
    constructor(featureFlagsService: FeatureFlagsService);
    getAllFlags(userId?: string): Promise<{
        flags: Record<FeatureFlags, boolean>;
        userId: string;
        userHash: number;
    }>;
    getAllConfigs(): {
        configs: Record<FeatureFlags, import("./feature-flags.types").FeatureFlagConfig>;
    };
    getHealth(): Promise<{
        status: string;
        flags: number;
        errors: string[];
    }>;
    isEnabled(flag: FeatureFlags, userId?: string): Promise<{
        flag: FeatureFlags;
        enabled: boolean;
        userId: string;
        userHash: number;
    }>;
    setUserOverride(flag: FeatureFlags, userId: string, body: {
        enabled: boolean;
        expiresAt?: string;
    }): Promise<{
        message: string;
        flag: FeatureFlags;
        userId: string;
        enabled: boolean;
        expiresAt: Date;
    }>;
}
