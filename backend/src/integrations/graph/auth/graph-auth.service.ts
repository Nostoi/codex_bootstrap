import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { GraphConfigService } from '../config/graph-config.service';
import { ConfidentialClientApplication, AuthenticationResult } from '@azure/msal-node';
import { ALL_CALENDAR_SCOPES } from '../types/calendar.types';

/**
 * Microsoft Graph Authentication Service
 * Handles OAuth 2.0 authentication flows using Azure MSAL
 */
@Injectable()
export class GraphAuthService {
  private readonly logger = new Logger(GraphAuthService.name);
  private msalClient: ConfidentialClientApplication;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private graphConfig: GraphConfigService
  ) {
    this.initializeMsalClient();
  }

  /**
   * Initialize MSAL client with configuration
   */
  private initializeMsalClient(): void {
    try {
      const config = this.graphConfig.getMicrosoftGraphConfig();

      this.msalClient = new ConfidentialClientApplication({
        auth: {
          clientId: config.clientId,
          clientSecret: config.clientSecret,
          authority: config.tenantId
            ? `https://login.microsoftonline.com/${config.tenantId}`
            : 'https://login.microsoftonline.com/common',
        },
        system: {
          loggerOptions: {
            loggerCallback: (level, message, containsPii) => {
              if (!containsPii) {
                this.logger.debug(`MSAL [${level}]: ${message}`);
              }
            },
            piiLoggingEnabled: false,
            logLevel: this.configService.get('NODE_ENV') === 'development' ? 3 : 1, // Verbose in dev, Error in prod
          },
        },
      });

      this.logger.log('MSAL client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize MSAL client:', error);
      throw error;
    }
  }

  /**
   * Get authorization URL for user consent
   */
  async getAuthorizationUrl(userId: string, state?: string): Promise<string> {
    try {
      const config = this.graphConfig.getMicrosoftGraphConfig();

      const authCodeUrlParameters = {
        scopes: [...ALL_CALENDAR_SCOPES],
        redirectUri: config.redirectUri,
        state: state || userId, // Use state to track the user
      };

      const response = await this.msalClient.getAuthCodeUrl(authCodeUrlParameters);

      this.logger.log(`Generated authorization URL for user ${userId}`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to generate authorization URL for user ${userId}:`, error);
      throw new Error('Failed to generate authorization URL');
    }
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForTokens(
    code: string,
    userId: string,
    state?: string
  ): Promise<AuthenticationResult> {
    try {
      const config = this.graphConfig.getMicrosoftGraphConfig();

      const tokenRequest = {
        code,
        scopes: [...ALL_CALENDAR_SCOPES],
        redirectUri: config.redirectUri,
      };

      const response = await this.msalClient.acquireTokenByCode(tokenRequest);

      if (!response) {
        throw new Error('No token response received');
      }

      // Store tokens in database
      await this.storeTokens(userId, response);

      this.logger.log(`Successfully exchanged code for tokens for user ${userId}`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to exchange code for tokens for user ${userId}:`, error);
      throw new UnauthorizedException('Failed to authenticate with Microsoft Graph');
    }
  }

  /**
   * Get valid access token for user (refresh if needed)
   */
  async getAccessToken(userId: string): Promise<string> {
    try {
      const config = await this.prisma.integrationConfig.findUnique({
        where: {
          provider_userId: {
            provider: 'microsoft',
            userId,
          },
        },
      });

      if (!config) {
        throw new UnauthorizedException('Microsoft integration not configured for user');
      }

      // Check if token is expired or about to expire (5 minutes buffer)
      const expirationBuffer = 5 * 60 * 1000; // 5 minutes in milliseconds
      const now = new Date();
      const expiresAt = config.expiresAt;

      if (!expiresAt || expiresAt.getTime() - now.getTime() < expirationBuffer) {
        // Token is expired or about to expire, refresh it using MSAL silent flow
        if (config.refreshToken) {
          return await this.refreshAccessToken(userId, config.refreshToken);
        } else {
          throw new UnauthorizedException(
            'No account information available, re-authentication required'
          );
        }
      }

      return config.accessToken || '';
    } catch (error) {
      this.logger.error(`Failed to get access token for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Refresh access token using MSAL silent flow
   */
  async refreshAccessToken(userId: string, accountId: string): Promise<string> {
    try {
      const silentRequest = {
        scopes: [...ALL_CALENDAR_SCOPES],
        account: {
          homeAccountId: accountId,
        } as any,
      };

      const response = await this.msalClient.acquireTokenSilent(silentRequest);

      if (!response) {
        throw new Error('No response from silent token request');
      }

      // Update stored tokens
      await this.storeTokens(userId, response);

      this.logger.log(`Successfully refreshed access token for user ${userId}`);
      return response.accessToken;
    } catch (error) {
      this.logger.error(`Failed to refresh access token for user ${userId}:`, error);

      // If refresh fails, clear the stored tokens to force re-authentication
      await this.clearTokens(userId);
      throw new UnauthorizedException('Token refresh failed, re-authentication required');
    }
  }

  /**
   * Store authentication tokens in database
   */
  private async storeTokens(userId: string, authResult: AuthenticationResult): Promise<void> {
    try {
      const expiresAt = authResult.expiresOn || new Date(Date.now() + 3600 * 1000); // Default 1 hour if not provided

      await this.prisma.integrationConfig.upsert({
        where: {
          provider_userId: {
            provider: 'microsoft',
            userId,
          },
        },
        update: {
          accessToken: authResult.accessToken,
          refreshToken: authResult.account?.homeAccountId, // Store account ID for MSAL refresh
          expiresAt,
          scopes: authResult.scopes || [...ALL_CALENDAR_SCOPES],
        },
        create: {
          provider: 'microsoft',
          userId,
          accessToken: authResult.accessToken,
          refreshToken: authResult.account?.homeAccountId, // Store account ID for MSAL refresh
          expiresAt,
          scopes: authResult.scopes || [...ALL_CALENDAR_SCOPES],
        },
      });

      this.logger.log(`Stored tokens for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to store tokens for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Clear stored tokens for user
   */
  async clearTokens(userId: string): Promise<void> {
    try {
      await this.prisma.integrationConfig.deleteMany({
        where: {
          provider: 'microsoft',
          userId,
        },
      });

      this.logger.log(`Cleared tokens for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to clear tokens for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Check if user has valid Microsoft Graph integration
   */
  async isUserAuthenticated(userId: string): Promise<boolean> {
    try {
      const config = await this.prisma.integrationConfig.findUnique({
        where: {
          provider_userId: {
            provider: 'microsoft',
            userId,
          },
        },
      });

      if (!config) {
        return false;
      }

      // Check if we have a valid token or account info for refresh
      const hasValidToken =
        (config.accessToken && config.expiresAt && config.expiresAt > new Date()) ||
        config.refreshToken; // refreshToken field now stores account ID

      return !!hasValidToken;
    } catch (error) {
      this.logger.error(`Failed to check authentication status for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Check if user has a valid Microsoft Graph token
   * Alias for isUserAuthenticated for backward compatibility
   */
  async isTokenValid(userId: string): Promise<boolean> {
    return this.isUserAuthenticated(userId);
  }

  /**
   * Get user's Microsoft Graph profile information
   */
  async getUserInfo(userId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken(userId);

      // Use the existing GraphService to get user profile
      // This creates a circular dependency, so we'll implement basic fetch here
      const response = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Graph API error: ${response.status} ${response.statusText}`);
      }

      const userInfo = await response.json();
      this.logger.log(`Retrieved user info for user ${userId}`);

      return userInfo;
    } catch (error) {
      this.logger.error(`Failed to get user info for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Revoke authentication and clear tokens
   */
  async revokeAuthentication(userId: string): Promise<void> {
    try {
      // Clear tokens from database
      await this.clearTokens(userId);

      this.logger.log(`Revoked authentication for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to revoke authentication for user ${userId}:`, error);
      throw error;
    }
  }
}
