import { ConfigService } from '@nestjs/config';
import { MicrosoftGraphConfig } from '../types/calendar.types';
export declare class GraphConfigService {
    private configService;
    private readonly logger;
    constructor(configService: ConfigService);
    getMicrosoftGraphConfig(): MicrosoftGraphConfig;
    getAuthorizationUrl(state?: string): string;
    getTokenEndpoint(): string;
    validateConfiguration(): {
        isValid: boolean;
        errors: string[];
    };
    getConfigSummary(): {
        hasClientId: boolean;
        hasClientSecret: boolean;
        redirectUri: string;
        tenantId: string;
        scopesCount: number;
        scopes: string[];
        error?: undefined;
    } | {
        error: any;
        hasClientId?: undefined;
        hasClientSecret?: undefined;
        redirectUri?: undefined;
        tenantId?: undefined;
        scopesCount?: undefined;
        scopes?: undefined;
    };
}
