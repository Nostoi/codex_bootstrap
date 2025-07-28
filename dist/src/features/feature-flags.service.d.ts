import { PrismaService } from '../prisma/prisma.service';
import { FeatureFlags, FeatureFlagConfig } from './feature-flags.types';
export declare class FeatureFlagsService {
    private readonly prisma;
    private readonly logger;
    private readonly flagConfigs;
    constructor(prisma: PrismaService);
    isEnabled(flag: FeatureFlags, userId?: string, userHash?: number): Promise<boolean>;
    private getUserOverride;
    setUserOverride(flag: FeatureFlags, userId: string, enabled: boolean, expiresAt?: Date): Promise<void>;
    getAllConfigs(): Record<FeatureFlags, FeatureFlagConfig>;
    getAllFlags(userId?: string, userHash?: number): Promise<Record<FeatureFlags, boolean>>;
    static createUserHash(userId: string): number;
    healthCheck(): Promise<{
        status: string;
        flags: number;
        errors: string[];
    }>;
}
