import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MicrosoftGraphConfig, ALL_CALENDAR_SCOPES } from '../types/calendar.types';

/**
 * Configuration service for Microsoft Graph integration
 * Handles environment variables and provides configuration objects
 */
@Injectable()
export class GraphConfigService {
  private readonly logger = new Logger(GraphConfigService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Get Microsoft Graph configuration from environment variables
   */
  getMicrosoftGraphConfig(): MicrosoftGraphConfig {
    const clientId = this.configService.get<string>('MICROSOFT_CLIENT_ID');
    const clientSecret = this.configService.get<string>('MICROSOFT_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('MICROSOFT_REDIRECT_URI');
    const tenantId = this.configService.get<string>('MICROSOFT_TENANT_ID');

    if (!clientId || !clientSecret || !redirectUri) {
      const missing = [];
      if (!clientId) missing.push('MICROSOFT_CLIENT_ID');
      if (!clientSecret) missing.push('MICROSOFT_CLIENT_SECRET');
      if (!redirectUri) missing.push('MICROSOFT_REDIRECT_URI');

      throw new Error(`Missing required Microsoft Graph configuration: ${missing.join(', ')}`);
    }

    return {
      clientId,
      clientSecret,
      redirectUri,
      tenantId,
      scopes: [...ALL_CALENDAR_SCOPES],
    };
  }

  /**
   * Get the OAuth 2.0 authorization URL for Microsoft Graph
   */
  getAuthorizationUrl(state?: string): string {
    const config = this.getMicrosoftGraphConfig();
    const params = new URLSearchParams({
      client_id: config.clientId,
      response_type: 'code',
      redirect_uri: config.redirectUri,
      scope: config.scopes.join(' '),
      response_mode: 'query',
    });

    if (state) {
      params.append('state', state);
    }

    if (config.tenantId) {
      params.append('tenant', config.tenantId);
    }

    const baseUrl = config.tenantId
      ? `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/authorize`
      : 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Get the token endpoint for Microsoft Graph
   */
  getTokenEndpoint(): string {
    const config = this.getMicrosoftGraphConfig();
    return config.tenantId
      ? `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`
      : 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
  }

  /**
   * Validate that all required environment variables are set
   */
  validateConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      this.getMicrosoftGraphConfig();
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }

    // Additional validation for optional but recommended settings
    const tenantId = this.configService.get<string>('MICROSOFT_TENANT_ID');
    if (!tenantId) {
      this.logger.warn(
        'MICROSOFT_TENANT_ID not set. Using multi-tenant configuration. ' +
          'Consider setting a specific tenant for enhanced security.'
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get configuration summary for debugging (without sensitive data)
   */
  getConfigSummary() {
    try {
      const config = this.getMicrosoftGraphConfig();
      return {
        hasClientId: !!config.clientId,
        hasClientSecret: !!config.clientSecret,
        redirectUri: config.redirectUri,
        tenantId: config.tenantId || 'common',
        scopesCount: config.scopes.length,
        scopes: config.scopes,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
