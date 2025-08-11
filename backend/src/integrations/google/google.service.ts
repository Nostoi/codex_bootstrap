import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { PrismaService } from '../../prisma/prisma.service';
import { getErrorMessage } from '../../common/utils/error.utils';

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
   * Get calendar events for a specific calendar
   */
  async getCalendarEvents(
    userId: string,
    calendarId = 'primary',
    timeMin?: Date,
    timeMax?: Date
  ): Promise<any> {
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
        error: getErrorMessage(error),
        errorCode:
          error &&
          typeof error === 'object' &&
          error !== null &&
          'response' in error &&
          error.response &&
          typeof error.response === 'object' &&
          'status' in error.response
            ? error.response.status
            : 'Unknown',
        responseTimeMs: responseTime,
      });

      // Handle specific Google API errors
      if (
        error &&
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'status' in error.response &&
        error.response.status === 401
      ) {
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
            refreshError: getErrorMessage(refreshError),
          });
          throw new Error(
            `Google Calendar authentication failed: ${getErrorMessage(refreshError)}`
          );
        }
      }

      if (
        error &&
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'status' in error.response &&
        error.response.status === 403
      ) {
        throw new Error(
          'Insufficient permissions to access Google Calendar. Please re-authorize the application.'
        );
      }

      if (
        error &&
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'status' in error.response &&
        error.response.status === 429
      ) {
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
      this.logger.error(
        `Failed to refresh access token for user ${userId}: ${getErrorMessage(error)}`,
        {
          userId,
          error: getErrorMessage(error),
        }
      );
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
   * Get Gmail messages
   */
  async getGmailMessages(
    userId: string,
    query?: string,
    maxResults: number = 50,
    labelIds?: string[]
  ) {
    try {
      const auth = await this.createOAuth2Client(userId);
      const gmail = google.gmail({ version: 'v1', auth });

      const params: any = {
        userId: 'me',
        maxResults,
      };

      if (query) {
        params.q = query;
      }

      if (labelIds) {
        params.labelIds = labelIds;
      }

      const response = await gmail.users.messages.list(params);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get Gmail messages for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get Gmail message content
   */
  async getGmailMessage(userId: string, messageId: string) {
    try {
      const auth = await this.createOAuth2Client(userId);
      const gmail = google.gmail({ version: 'v1', auth });

      const response = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get Gmail message ${messageId} for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Extract text content from Gmail message
   */
  private extractGmailTextContent(message: any): string {
    let content = '';

    const extractFromPart = (part: any): string => {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return Buffer.from(part.body.data, 'base64').toString('utf-8');
      }

      if (part.mimeType === 'text/html' && part.body?.data) {
        const htmlContent = Buffer.from(part.body.data, 'base64').toString('utf-8');
        // Basic HTML to text conversion - strip tags
        return htmlContent
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      }

      if (part.parts) {
        return part.parts.map(extractFromPart).join('\n');
      }

      return '';
    };

    if (message.payload) {
      content = extractFromPart(message.payload);
    }

    return content;
  }

  /**
   * Get Gmail messages with task extraction potential
   */
  async getGmailMessagesForTaskExtraction(userId: string, daysBack: number = 7) {
    try {
      const dateFilter = new Date();
      dateFilter.setDate(dateFilter.getDate() - daysBack);
      const query = `after:${Math.floor(dateFilter.getTime() / 1000)}`;

      const messages = await this.getGmailMessages(userId, query, 20);

      if (!messages.messages) {
        return [];
      }

      const emailsWithContent = await Promise.all(
        messages.messages.map(async msg => {
          const fullMessage = await this.getGmailMessage(userId, msg.id!);
          const textContent = this.extractGmailTextContent(fullMessage);

          // Extract basic email metadata
          const headers = fullMessage.payload?.headers || [];
          const subject = headers.find(h => h.name === 'Subject')?.value || '';
          const from = headers.find(h => h.name === 'From')?.value || '';
          const date = headers.find(h => h.name === 'Date')?.value || '';

          return {
            id: msg.id,
            subject,
            from,
            date,
            content: textContent,
            snippet: fullMessage.snippet || '',
          };
        })
      );

      return emailsWithContent.filter(email => email.content.length > 50);
    } catch (error) {
      this.logger.error(
        `Failed to get Gmail messages for task extraction for user ${userId}:`,
        error
      );
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
