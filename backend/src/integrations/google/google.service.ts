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
  async createDriveFile(userId: string, filename: string, content: string, mimeType = 'text/plain') {
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
   * Get Google Calendar events
   */
  async getCalendarEvents(userId: string, calendarId = 'primary') {
    try {
      const auth = await this.createOAuth2Client(userId);
      const calendar = google.calendar({ version: 'v3', auth });

      const response = await calendar.events.list({
        calendarId,
        timeMin: new Date().toISOString(),
        maxResults: 50,
        singleEvents: true,
        orderBy: 'startTime',
      });

      return response.data;
    } catch (error) {
      this.logger.error('Error fetching Google Calendar events:', error);
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
    calendarId = 'primary',
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
    scopes?: string[],
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
