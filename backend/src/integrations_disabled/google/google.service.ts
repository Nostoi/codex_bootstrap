import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GoogleService {
  private readonly logger = new Logger(GoogleService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create Google OAuth2 client with user's access token
   */
  private async createOAuth2Client(userId: string) {
    const config = await this.prisma.integrationConfig.findUnique({
      where: {
        provider_userId: {
          provider: 'google',
          userId,
        },
      },
    });

    if (!config?.accessToken) {
      throw new Error('Google integration not configured for user');
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: config.accessToken,
      refresh_token: config.refreshToken,
    });

    return oauth2Client;
  }

  /**
   * Get Google Drive files
   */
  async getDriveFiles(userId: string, folderId?: string) {
    try {
      const auth = await this.createOAuth2Client(userId);
      const drive = google.drive({ version: 'v3', auth });

      const params: any = {
        pageSize: 50,
        fields: 'nextPageToken, files(id, name, mimeType, createdTime, modifiedTime, size)',
      };

      if (folderId) {
        params.q = `'${folderId}' in parents`;
      }

      const response = await drive.files.list(params);
      return response.data;
    } catch (error) {
      this.logger.error('Error fetching Google Drive files:', error);
      throw error;
    }
  }

  /**
   * Create a file in Google Drive
   */
  async createDriveFile(
    userId: string,
    filename: string,
    content: string,
    mimeType = 'text/plain'
  ) {
    try {
      const auth = await this.createOAuth2Client(userId);
      const drive = google.drive({ version: 'v3', auth });

      const response = await drive.files.create({
        requestBody: {
          name: filename,
        },
        media: {
          mimeType,
          body: content,
        },
        fields: 'id, name, mimeType, createdTime',
      });

      return response.data;
    } catch (error) {
      this.logger.error('Error creating Google Drive file:', error);
      throw error;
    }
  }

  /**
   * Get Google Sheets data
   */
  async getSheetData(userId: string, spreadsheetId: string, range: string) {
    try {
      const auth = await this.createOAuth2Client(userId);
      const sheets = google.sheets({ version: 'v4', auth });

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      return response.data;
    } catch (error) {
      this.logger.error('Error fetching Google Sheets data:', error);
      throw error;
    }
  }

  /**
   * Create a Google Sheet
   */
  async createSheet(userId: string, title: string) {
    try {
      const auth = await this.createOAuth2Client(userId);
      const sheets = google.sheets({ version: 'v4', auth });

      const response = await sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title,
          },
        },
        fields: 'spreadsheetId, properties(title)',
      });

      return response.data;
    } catch (error) {
      this.logger.error('Error creating Google Sheet:', error);
      throw error;
    }
  }

  /**
   * Get Google Calendar events for a specific date range with enhanced error handling
   */
  async getCalendarEvents(userId: string, calendarId = 'primary', timeMin?: Date, timeMax?: Date) {
    const startTime = performance.now();

    try {
      this.logger.debug(`Fetching calendar events for user ${userId}, calendar ${calendarId}`, {
        userId,
        calendarId,
        timeMin: timeMin?.toISOString(),
        timeMax: timeMax?.toISOString(),
      });

      const auth = await this.createOAuth2Client(userId);
      const calendar = google.calendar({ version: 'v3', auth });

      const response = await calendar.events.list({
        calendarId,
        timeMin: (timeMin || new Date()).toISOString(),
        timeMax: timeMax?.toISOString(),
        maxResults: 50,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const responseTime = performance.now() - startTime;
      const eventCount = response.data.items?.length || 0;

      this.logger.log(
        `Successfully fetched ${eventCount} calendar events for user ${userId} in ${responseTime.toFixed(2)}ms`,
        {
          userId,
          calendarId,
          eventCount,
          responseTimeMs: responseTime,
        }
      );

      return response.data;
    } catch (error) {
      const responseTime = performance.now() - startTime;

      this.logger.error(`Error fetching Google Calendar events for user ${userId}:`, {
        userId,
        calendarId,
        error: error.message,
        errorCode: error.response?.status,
        responseTimeMs: responseTime,
      });

      // Handle specific Google API errors
      if (error.response?.status === 401) {
        this.logger.warn(`Authentication token expired for user ${userId}, attempting refresh`, {
          userId,
        });

        try {
          await this.refreshAccessToken(userId);
          this.logger.log(
            `Token refresh successful for user ${userId}, retrying calendar request`,
            { userId }
          );

          // Retry the request with refreshed token
          return this.getCalendarEvents(userId, calendarId, timeMin, timeMax);
        } catch (refreshError) {
          this.logger.error(`Token refresh failed for user ${userId}:`, {
            userId,
            refreshError: refreshError.message,
          });
          throw new Error(`Google Calendar authentication failed: ${refreshError.message}`);
        }
      }

      if (error.response?.status === 403) {
        throw new Error(
          'Insufficient permissions to access Google Calendar. Please re-authorize the application.'
        );
      }

      if (error.response?.status === 429) {
        throw new Error('Google Calendar API rate limit exceeded. Please try again later.');
      }

      throw error;
    }
  }

  /**
   * Refresh OAuth2 access token for a user
   */
  private async refreshAccessToken(userId: string): Promise<void> {
    try {
      const config = await this.prisma.integrationConfig.findUnique({
        where: {
          provider_userId: {
            provider: 'google',
            userId,
          },
        },
      });

      if (!config?.refreshToken) {
        throw new Error('No refresh token available for user');
      }

      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );

      oauth2Client.setCredentials({
        refresh_token: config.refreshToken,
      });

      const { credentials } = await oauth2Client.refreshAccessToken();

      if (!credentials.access_token) {
        throw new Error('Failed to obtain new access token');
      }

      // Update the stored access token
      await this.prisma.integrationConfig.update({
        where: {
          provider_userId: {
            provider: 'google',
            userId,
          },
        },
        data: {
          accessToken: credentials.access_token,
          updatedAt: new Date(),
        },
      });

      this.logger.log(`Access token refreshed successfully for user ${userId}`, { userId });
    } catch (error) {
      this.logger.error(`Failed to refresh access token for user ${userId}: ${error.message}`, {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Create a Google Calendar event
   */
  async createCalendarEvent(
    userId: string,
    eventData: {
      summary: string;
      description?: string;
      start: { dateTime: string; timeZone?: string };
      end: { dateTime: string; timeZone?: string };
      attendees?: { email: string }[];
    },
    calendarId = 'primary'
  ) {
    try {
      const auth = await this.createOAuth2Client(userId);
      const calendar = google.calendar({ version: 'v3', auth });

      const response = await calendar.events.insert({
        calendarId,
        requestBody: eventData,
      });

      return response.data;
    } catch (error) {
      this.logger.error('Error creating Google Calendar event:', error);
      throw error;
    }
  }

  /**
   * Store or update Google integration configuration
   */
  async saveIntegrationConfig(
    userId: string,
    accessToken: string,
    refreshToken?: string,
    expiresAt?: Date,
    scopes?: string[]
  ) {
    return this.prisma.integrationConfig.upsert({
      where: {
        provider_userId: {
          provider: 'google',
          userId,
        },
      },
      update: {
        accessToken,
        refreshToken,
        expiresAt,
        scopes: scopes || [],
      },
      create: {
        provider: 'google',
        userId,
        accessToken,
        refreshToken,
        expiresAt,
        scopes: scopes || [],
      },
    });
  }
}
