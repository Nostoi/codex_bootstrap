import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { GoogleService } from './google.service';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('integrations')
@Controller('integrations/google')
export class GoogleController {
  constructor(private readonly googleService: GoogleService) {}

  @Get('drive/:userId')
  @ApiOperation({ summary: 'Get Google Drive files' })
  @ApiQuery({
    name: 'folderId',
    required: false,
    description: 'Folder ID to list files from',
  })
  @ApiResponse({ status: 200, description: 'Google Drive files retrieved' })
  getDriveFiles(@Param('userId') userId: string, @Query('folderId') folderId?: string) {
    return this.googleService.getDriveFiles(userId, folderId);
  }

  @Post('drive/:userId/files')
  @ApiOperation({ summary: 'Create file in Google Drive' })
  @ApiResponse({ status: 201, description: 'File created in Google Drive' })
  createDriveFile(
    @Param('userId') userId: string,
    @Body() fileData: { filename: string; content: string; mimeType?: string }
  ) {
    return this.googleService.createDriveFile(
      userId,
      fileData.filename,
      fileData.content,
      fileData.mimeType
    );
  }

  @Get('sheets/:userId/:spreadsheetId')
  @ApiOperation({ summary: 'Get Google Sheets data' })
  @ApiQuery({
    name: 'range',
    required: true,
    description: 'Sheet range (e.g., A1:Z100)',
  })
  @ApiResponse({ status: 200, description: 'Google Sheets data retrieved' })
  getSheetData(
    @Param('userId') userId: string,
    @Param('spreadsheetId') spreadsheetId: string,
    @Query('range') range: string
  ) {
    return this.googleService.getSheetData(userId, spreadsheetId, range);
  }

  @Post('sheets/:userId')
  @ApiOperation({ summary: 'Create Google Sheet' })
  @ApiResponse({ status: 201, description: 'Google Sheet created' })
  createSheet(@Param('userId') userId: string, @Body() sheetData: { title: string }) {
    return this.googleService.createSheet(userId, sheetData.title);
  }

  @Get('calendar/:userId/events')
  @ApiOperation({ summary: 'Get Google Calendar events' })
  @ApiQuery({
    name: 'calendarId',
    required: false,
    description: 'Calendar ID (default: primary)',
  })
  @ApiResponse({ status: 200, description: 'Google Calendar events retrieved' })
  getCalendarEvents(@Param('userId') userId: string, @Query('calendarId') calendarId?: string) {
    return this.googleService.getCalendarEvents(userId, calendarId);
  }

  @Post('calendar/:userId/events')
  @ApiOperation({ summary: 'Create Google Calendar event' })
  @ApiResponse({ status: 201, description: 'Calendar event created' })
  createCalendarEvent(
    @Param('userId') userId: string,
    @Body()
    eventData: {
      summary: string;
      description?: string;
      start: { dateTime: string; timeZone?: string };
      end: { dateTime: string; timeZone?: string };
      attendees?: { email: string }[];
      calendarId?: string;
    }
  ) {
    const { calendarId, ...event } = eventData;
    return this.googleService.createCalendarEvent(userId, event, calendarId);
  }

  @Post('configure/:userId')
  @ApiOperation({ summary: 'Configure Google integration' })
  @ApiResponse({ status: 201, description: 'Integration configured' })
  configureIntegration(
    @Param('userId') userId: string,
    @Body()
    config: {
      accessToken: string;
      refreshToken?: string;
      expiresAt?: string;
      scopes?: string[];
    }
  ) {
    const expiresAt = config.expiresAt ? new Date(config.expiresAt) : undefined;

    return this.googleService.saveIntegrationConfig(
      userId,
      config.accessToken,
      config.refreshToken,
      expiresAt,
      config.scopes
    );
  }

  @Get('gmail/:userId/messages')
  @ApiOperation({ summary: 'Get Gmail messages' })
  @ApiQuery({
    name: 'query',
    required: false,
    description: 'Gmail search query',
  })
  @ApiQuery({
    name: 'maxResults',
    required: false,
    description: 'Maximum number of results',
  })
  @ApiResponse({ status: 200, description: 'Gmail messages retrieved' })
  getGmailMessages(
    @Param('userId') userId: string,
    @Query('query') query?: string,
    @Query('maxResults') maxResults?: number
  ) {
    return this.googleService.getGmailMessages(userId, query, maxResults || 50);
  }

  @Get('gmail/:userId/messages/:messageId')
  @ApiOperation({ summary: 'Get specific Gmail message' })
  @ApiResponse({ status: 200, description: 'Gmail message retrieved' })
  getGmailMessage(@Param('userId') userId: string, @Param('messageId') messageId: string) {
    return this.googleService.getGmailMessage(userId, messageId);
  }

  @Get('gmail/:userId/tasks')
  @ApiOperation({ summary: 'Get Gmail messages for AI task extraction' })
  @ApiQuery({
    name: 'daysBack',
    required: false,
    description: 'Number of days to look back for emails (default: 7)',
  })
  @ApiResponse({ status: 200, description: 'Gmail messages for task extraction retrieved' })
  getGmailMessagesForTasks(@Param('userId') userId: string, @Query('daysBack') daysBack?: number) {
    return this.googleService.getGmailMessagesForTaskExtraction(userId, daysBack || 7);
  }
}
