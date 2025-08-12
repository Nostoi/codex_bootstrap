import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { GraphService } from './graph.service';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CalendarEvent, CalendarListOptions } from './types/calendar.types';

@ApiTags('integrations')
@Controller('integrations/microsoft')
export class GraphController {
  constructor(private readonly graphService: GraphService) {}

  @Get('profile/:userId')
  @ApiOperation({ summary: 'Get Microsoft Graph user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  @ApiResponse({ status: 404, description: 'Integration not configured' })
  getUserProfile(@Param('userId') userId: string) {
    return this.graphService.getUserProfile(userId);
  }

  @Get('onedrive/:userId')
  @ApiOperation({ summary: 'Get OneDrive files' })
  @ApiResponse({ status: 200, description: 'OneDrive files retrieved' })
  getOneDriveFiles(@Param('userId') userId: string) {
    return this.graphService.getOneDriveFiles(userId);
  }

  @Get('teams/:userId')
  @ApiOperation({ summary: 'Get user Teams' })
  @ApiResponse({ status: 200, description: 'Teams retrieved' })
  getTeams(@Param('userId') userId: string) {
    return this.graphService.getTeams(userId);
  }

  @Post('configure/:userId')
  @ApiOperation({ summary: 'Configure Microsoft integration' })
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

    return this.graphService.saveIntegrationConfig(
      userId,
      config.accessToken,
      config.refreshToken,
      expiresAt,
      config.scopes
    );
  }

  @Post('onedrive/:userId/files')
  @ApiOperation({ summary: 'Create file in OneDrive' })
  @ApiResponse({ status: 201, description: 'File created in OneDrive' })
  createOneDriveFile(
    @Param('userId') userId: string,
    @Body() fileData: { filename: string; content: string }
  ) {
    return this.graphService.createOneDriveFile(userId, fileData.filename, fileData.content);
  }

  // ============================================================================
  // CALENDAR ENDPOINTS
  // ============================================================================

  @Get('calendars/:userId')
  @ApiOperation({ summary: "Get user's calendars" })
  @ApiResponse({ status: 200, description: 'Calendars retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Integration not configured' })
  getCalendars(@Param('userId') userId: string) {
    return this.graphService.getCalendars(userId);
  }

  @Get('calendar/:userId/events')
  @ApiOperation({ summary: 'Get calendar events with optional filtering' })
  @ApiResponse({ status: 200, description: 'Calendar events retrieved successfully' })
  @ApiQuery({ name: 'startTime', required: false, description: 'Start time filter (ISO 8601)' })
  @ApiQuery({ name: 'endTime', required: false, description: 'End time filter (ISO 8601)' })
  @ApiQuery({ name: 'timeZone', required: false, description: 'Time zone for the query' })
  @ApiQuery({ name: 'maxResults', required: false, description: 'Maximum number of results' })
  @ApiQuery({ name: 'orderBy', required: false, description: 'Order by: start or lastModified' })
  getCalendarEvents(
    @Param('userId') userId: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
    @Query('timeZone') timeZone?: string,
    @Query('maxResults') maxResults?: string,
    @Query('orderBy') orderBy?: 'start' | 'lastModified'
  ) {
    const options: CalendarListOptions = {
      startTime,
      endTime,
      timeZone,
      maxResults: maxResults ? parseInt(maxResults, 10) : undefined,
      orderBy,
    };

    return this.graphService.getCalendarEvents(
      userId,
      'primary',
      startTime ? new Date(startTime) : undefined,
      endTime ? new Date(endTime) : undefined,
      options
    );
  }

  @Get('calendar/:userId/events/:eventId')
  @ApiOperation({ summary: 'Get a specific calendar event' })
  @ApiResponse({ status: 200, description: 'Calendar event retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  getCalendarEvent(@Param('userId') userId: string, @Param('eventId') eventId: string) {
    return this.graphService.getCalendarEvent(userId, eventId);
  }

  @Post('calendar/:userId/events')
  @ApiOperation({ summary: 'Create a new calendar event' })
  @ApiResponse({ status: 201, description: 'Calendar event created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid event data' })
  createCalendarEvent(@Param('userId') userId: string, @Body() event: CalendarEvent) {
    return this.graphService.createCalendarEvent(userId, event);
  }

  @Put('calendar/:userId/events/:eventId')
  @ApiOperation({ summary: 'Update an existing calendar event' })
  @ApiResponse({ status: 200, description: 'Calendar event updated successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  updateCalendarEvent(
    @Param('userId') userId: string,
    @Param('eventId') eventId: string,
    @Body() updates: Partial<CalendarEvent>
  ) {
    return this.graphService.updateCalendarEvent(userId, eventId, updates);
  }

  @Delete('calendar/:userId/events/:eventId')
  @ApiOperation({ summary: 'Delete a calendar event' })
  @ApiResponse({ status: 200, description: 'Calendar event deleted successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  deleteCalendarEvent(@Param('userId') userId: string, @Param('eventId') eventId: string) {
    return this.graphService.deleteCalendarEvent(userId, eventId);
  }

  @Get('calendar/:userId/calendars/:calendarId/events')
  @ApiOperation({ summary: 'Get events from a specific calendar' })
  @ApiResponse({ status: 200, description: 'Calendar events retrieved successfully' })
  @ApiQuery({ name: 'startTime', required: false, description: 'Start time filter (ISO 8601)' })
  @ApiQuery({ name: 'endTime', required: false, description: 'End time filter (ISO 8601)' })
  @ApiQuery({ name: 'timeZone', required: false, description: 'Time zone for the query' })
  @ApiQuery({ name: 'maxResults', required: false, description: 'Maximum number of results' })
  @ApiQuery({ name: 'orderBy', required: false, description: 'Order by: start or lastModified' })
  getCalendarEventsByCalendarId(
    @Param('userId') userId: string,
    @Param('calendarId') calendarId: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
    @Query('timeZone') timeZone?: string,
    @Query('maxResults') maxResults?: string,
    @Query('orderBy') orderBy?: 'start' | 'lastModified'
  ) {
    const options: CalendarListOptions = {
      startTime,
      endTime,
      timeZone,
      maxResults: maxResults ? parseInt(maxResults, 10) : undefined,
      orderBy,
    };

    return this.graphService.getCalendarEventsByCalendarId(userId, calendarId, options);
  }

  @Get('mail/:userId/messages')
  @ApiOperation({ summary: 'Get Outlook mail messages' })
  @ApiQuery({
    name: 'folderId',
    required: false,
    description: 'Mail folder ID (default: inbox)',
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    description: 'OData filter expression',
  })
  @ApiQuery({
    name: 'top',
    required: false,
    description: 'Maximum number of results',
  })
  @ApiResponse({ status: 200, description: 'Mail messages retrieved' })
  getMailMessages(
    @Param('userId') userId: string,
    @Query('folderId') folderId?: string,
    @Query('filter') filter?: string,
    @Query('top') top?: number
  ) {
    return this.graphService.getMailMessages(userId, folderId || 'inbox', filter, top || 50);
  }

  @Get('mail/:userId/messages/:messageId')
  @ApiOperation({ summary: 'Get specific mail message' })
  @ApiResponse({ status: 200, description: 'Mail message retrieved' })
  getMailMessage(@Param('userId') userId: string, @Param('messageId') messageId: string) {
    return this.graphService.getMailMessage(userId, messageId);
  }

  @Get('mail/:userId/tasks')
  @ApiOperation({ summary: 'Get mail messages for AI task extraction' })
  @ApiQuery({
    name: 'daysBack',
    required: false,
    description: 'Number of days to look back for emails (default: 7)',
  })
  @ApiResponse({ status: 200, description: 'Mail messages for task extraction retrieved' })
  getMailMessagesForTasks(@Param('userId') userId: string, @Query('daysBack') daysBack?: number) {
    return this.graphService.getMailMessagesForTaskExtraction(userId, daysBack || 7);
  }

  @Get('mail/:userId/folders')
  @ApiOperation({ summary: 'Get mail folders' })
  @ApiResponse({ status: 200, description: 'Mail folders retrieved' })
  getMailFolders(@Param('userId') userId: string) {
    return this.graphService.getMailFolders(userId);
  }
}
