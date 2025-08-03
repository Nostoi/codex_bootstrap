import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { google } from 'googleapis';

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  description?: string;
  location?: string;
}

@Injectable()
export class GoogleAuthService {
  private readonly logger = new Logger(GoogleAuthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Get Google OAuth client for a user
   */
  async getGoogleOAuthClient(userId: string): Promise<any> {
    try {
      const oauthProvider = await this.prisma.oAuthProvider.findFirst({
        where: {
          userId,
          provider: 'google',
        },
      });

      if (!oauthProvider || !oauthProvider.accessToken) {
        throw new Error('Google OAuth not configured for user');
      }

      const oauth2Client = new google.auth.OAuth2(
        this.configService.get<string>('GOOGLE_CLIENT_ID'),
        this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
        this.configService.get<string>('GOOGLE_CALLBACK_URL'),
      );

      oauth2Client.setCredentials({
        access_token: oauthProvider.accessToken,
        refresh_token: oauthProvider.refreshToken,
      });

      return oauth2Client;
    } catch (error) {
      this.logger.error(`Failed to get Google OAuth client for user: ${userId}`, error.stack);
      throw error;
    }
  }

  /**
   * Refresh Google OAuth tokens for a user
   */
  async refreshGoogleTokens(userId: string): Promise<boolean> {
    try {
      const oauth2Client = await this.getGoogleOAuthClient(userId);
      
      const { credentials } = await oauth2Client.refreshAccessToken();
      
      if (credentials.access_token) {
        await this.prisma.oAuthProvider.updateMany({
          where: {
            userId,
            provider: 'google',
          },
          data: {
            accessToken: credentials.access_token,
            refreshToken: credentials.refresh_token || undefined,
            tokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined,
            updatedAt: new Date(),
          },
        });

        this.logger.log(`Google tokens refreshed for user: ${userId}`);
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(`Failed to refresh Google tokens for user: ${userId}`, error.stack);
      return false;
    }
  }

  /**
   * Get Google Calendar events for a user
   */
  async getCalendarEvents(userId: string, timeMin?: Date, timeMax?: Date): Promise<GoogleCalendarEvent[]> {
    try {
      const oauth2Client = await this.getGoogleOAuthClient(userId);
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin?.toISOString() || new Date().toISOString(),
        timeMax: timeMax?.toISOString(),
        maxResults: 100,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items || [];
      
      this.logger.debug(`Retrieved ${events.length} Google Calendar events for user: ${userId}`);
      
      return events.map(event => ({
        id: event.id!,
        summary: event.summary || 'No title',
        start: event.start!,
        end: event.end!,
        description: event.description,
        location: event.location,
      }));
    } catch (error) {
      this.logger.error(`Failed to get Google Calendar events for user: ${userId}`, error.stack);
      
      // Try to refresh tokens if unauthorized
      if (error.code === 401) {
        const refreshed = await this.refreshGoogleTokens(userId);
        if (refreshed) {
          // Retry the request once
          return this.getCalendarEvents(userId, timeMin, timeMax);
        }
      }
      
      throw error;
    }
  }

  /**
   * Check if user has valid Google OAuth tokens
   */
  async hasValidGoogleAuth(userId: string): Promise<boolean> {
    try {
      const oauthProvider = await this.prisma.oAuthProvider.findFirst({
        where: {
          userId,
          provider: 'google',
        },
      });

      if (!oauthProvider || !oauthProvider.accessToken) {
        return false;
      }

      // Check if token is expired
      if (oauthProvider.tokenExpiry && oauthProvider.tokenExpiry < new Date()) {
        // Try to refresh
        return await this.refreshGoogleTokens(userId);
      }

      return true;
    } catch (error) {
      this.logger.error(`Failed to check Google auth validity for user: ${userId}`, error.stack);
      return false;
    }
  }

  /**
   * Revoke Google OAuth access for a user
   */
  async revokeGoogleAuth(userId: string): Promise<boolean> {
    try {
      const oauth2Client = await this.getGoogleOAuthClient(userId);
      
      // Revoke the tokens with Google
      await oauth2Client.revokeCredentials();
      
      // Remove from database
      await this.prisma.oAuthProvider.deleteMany({
        where: {
          userId,
          provider: 'google',
        },
      });

      this.logger.log(`Google OAuth revoked for user: ${userId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to revoke Google OAuth for user: ${userId}`, error.stack);
      return false;
    }
  }
}
