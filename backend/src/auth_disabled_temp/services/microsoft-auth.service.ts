import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { Client } from '@microsoft/microsoft-graph-client';
import { AuthenticationProvider } from '@microsoft/microsoft-graph-client';
import { getErrorMessage } from '../../common/utils/error.utils';

export interface MicrosoftCalendarEvent {
  id: string;
  subject: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  bodyPreview?: string;
  location?: { displayName: string };
}

class CustomAuthProvider implements AuthenticationProvider {
  constructor(private accessToken: string) {}

  async getAccessToken(): Promise<string> {
    return this.accessToken;
  }
}

@Injectable()
export class MicrosoftAuthService {
  private readonly logger = new Logger(MicrosoftAuthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {}

  /**
   * Get Microsoft Graph client for a user
   */
  async getMicrosoftGraphClient(userId: string): Promise<Client> {
    try {
      const oauthProvider = await this.prisma.oAuthProvider.findFirst({
        where: {
          userId,
          provider: 'microsoft',
        },
      });

      if (!oauthProvider || !oauthProvider.accessToken) {
        throw new Error('Microsoft OAuth not configured for user');
      }

      const authProvider = new CustomAuthProvider(oauthProvider.accessToken);

      return Client.initWithMiddleware({
        authProvider,
      });
    } catch (error) {
      this.logger.error(
        `Failed to get Microsoft Graph client for user: ${userId}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  /**
   * Refresh Microsoft OAuth tokens for a user
   */
  async refreshMicrosoftTokens(userId: string): Promise<boolean> {
    try {
      const oauthProvider = await this.prisma.oAuthProvider.findFirst({
        where: {
          userId,
          provider: 'microsoft',
        },
      });

      if (!oauthProvider || !oauthProvider.refreshToken) {
        return false;
      }

      // Microsoft Graph token refresh
      const tokenEndpoint = `https://login.microsoftonline.com/${this.configService.get('MICROSOFT_TENANT_ID', 'common')}/oauth2/v2.0/token`;

      const params = new URLSearchParams({
        client_id: this.configService.get<string>('MICROSOFT_CLIENT_ID')!,
        client_secret: this.configService.get<string>('MICROSOFT_CLIENT_SECRET')!,
        grant_type: 'refresh_token',
        refresh_token: oauthProvider.refreshToken,
        scope: 'user.read calendars.read offline_access',
      });

      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      const tokens = (await response.json()) as any;

      await this.prisma.oAuthProvider.updateMany({
        where: {
          userId,
          provider: 'microsoft',
        },
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || oauthProvider.refreshToken,
          tokenExpiry: tokens.expires_in
            ? new Date(Date.now() + tokens.expires_in * 1000)
            : undefined,
          updatedAt: new Date(),
        },
      });

      this.logger.log(`Microsoft tokens refreshed for user: ${userId}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to refresh Microsoft tokens for user: ${userId}`,
        error instanceof Error ? error.stack : undefined
      );
      return false;
    }
  }

  /**
   * Get Microsoft Calendar events for a user
   */
  async getCalendarEvents(
    userId: string,
    timeMin?: Date,
    timeMax?: Date
  ): Promise<MicrosoftCalendarEvent[]> {
    try {
      const graphClient = await this.getMicrosoftGraphClient(userId);

      let url = '/me/events';

      // Add date filters if provided
      if (timeMin || timeMax) {
        const filter = [];
        if (timeMin) {
          filter.push(`start/dateTime ge '${timeMin.toISOString()}'`);
        }
        if (timeMax) {
          filter.push(`end/dateTime le '${timeMax.toISOString()}'`);
        }
        url += `?$filter=${filter.join(' and ')}&$orderby=start/dateTime&$top=100`;
      } else {
        url += '?$orderby=start/dateTime&$top=100';
      }

      const response = await graphClient.api(url).get();

      this.logger.debug(
        `Retrieved ${response.value?.length || 0} Microsoft Calendar events for user: ${userId}`
      );

      return (response.value || []).map((event: any) => ({
        id: event.id,
        subject: event.subject || 'No title',
        start: event.start,
        end: event.end,
        bodyPreview: event.bodyPreview,
        location: event.location,
      }));
    } catch (error) {
      this.logger.error(
        `Failed to get Microsoft Calendar events for user: ${userId}`,
        error instanceof Error ? error.stack : undefined
      );

      // Try to refresh tokens if unauthorized
      if (
        error &&
        typeof error === 'object' &&
        (('code' in error && error.code === 401) ||
          ('statusCode' in error && error.statusCode === 401))
      ) {
        const refreshed = await this.refreshMicrosoftTokens(userId);
        if (refreshed) {
          // Retry the request once
          return this.getCalendarEvents(userId, timeMin, timeMax);
        }
      }

      throw error;
    }
  }

  /**
   * Check if user has valid Microsoft OAuth tokens
   */
  async hasValidMicrosoftAuth(userId: string): Promise<boolean> {
    try {
      const oauthProvider = await this.prisma.oAuthProvider.findFirst({
        where: {
          userId,
          provider: 'microsoft',
        },
      });

      if (!oauthProvider || !oauthProvider.accessToken) {
        return false;
      }

      // Check if token is expired
      if (oauthProvider.tokenExpiry && oauthProvider.tokenExpiry < new Date()) {
        // Try to refresh
        return await this.refreshMicrosoftTokens(userId);
      }

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to check Microsoft auth validity for user: ${userId}`,
        error instanceof Error ? error.stack : undefined
      );
      return false;
    }
  }

  /**
   * Revoke Microsoft OAuth access for a user
   */
  async revokeMicrosoftAuth(userId: string): Promise<boolean> {
    try {
      // Remove from database (Microsoft doesn't have a simple revoke endpoint)
      await this.prisma.oAuthProvider.deleteMany({
        where: {
          userId,
          provider: 'microsoft',
        },
      });

      this.logger.log(`Microsoft OAuth revoked for user: ${userId}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to revoke Microsoft OAuth for user: ${userId}`,
        error instanceof Error ? error.stack : undefined
      );
      return false;
    }
  }

  /**
   * Get user profile from Microsoft Graph
   */
  async getUserProfile(userId: string): Promise<any> {
    try {
      const graphClient = await this.getMicrosoftGraphClient(userId);

      const profile = await graphClient.api('/me').get();

      this.logger.debug(`Retrieved Microsoft profile for user: ${userId}`);
      return profile;
    } catch (error) {
      this.logger.error(
        `Failed to get Microsoft profile for user: ${userId}`,
        error instanceof Error ? error.stack : undefined
      );

      // Try to refresh tokens if unauthorized
      if (
        error &&
        typeof error === 'object' &&
        (('code' in error && error.code === 401) ||
          ('statusCode' in error && error.statusCode === 401))
      ) {
        const refreshed = await this.refreshMicrosoftTokens(userId);
        if (refreshed) {
          // Retry the request once
          return this.getUserProfile(userId);
        }
      }

      throw error;
    }
  }
}
