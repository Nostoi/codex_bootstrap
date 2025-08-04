import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@microsoft/microsoft-graph-client';
import { PrismaService } from '../../prisma/prisma.service';
import { GraphAuthService } from './auth/graph-auth.service';
import {
  CalendarEvent,
  CalendarListOptions,
  EnhancedCalendarOptions,
  BatchResponse,
  MeetingInvitationResponse,
  CalendarPermission,
  AttendeeResponseStats,
  GRAPH_ENDPOINTS,
  DEFAULT_CONFIG,
} from './types/calendar.types';

@Injectable()
export class GraphService {
  private readonly logger = new Logger(GraphService.name);

  constructor(
    private prisma: PrismaService,
    private graphAuthService: GraphAuthService
  ) {}

  /**
   * Create a Microsoft Graph client with user's access token
   */
  private async createGraphClient(userId: string): Promise<Client> {
    try {
      const accessToken = await this.graphAuthService.getAccessToken(userId);

      return Client.init({
        authProvider: {
          getAccessToken: async () => accessToken,
        } as any,
      });
    } catch (error) {
      this.logger.error(`Failed to create Graph client for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get user's Microsoft Graph profile
   */
  async getUserProfile(userId: string) {
    try {
      const graphClient = await this.createGraphClient(userId);
      const profile = await graphClient.api('/me').get();

      return profile;
    } catch (error) {
      this.logger.error('Error fetching Microsoft Graph profile:', error);
      throw error;
    }
  }

  /**
   * Get user's OneDrive files
   */
  async getOneDriveFiles(userId: string, folderId?: string) {
    try {
      const graphClient = await this.createGraphClient(userId);
      const endpoint = folderId
        ? `/me/drive/items/${folderId}/children`
        : '/me/drive/root/children';

      const files = await graphClient.api(endpoint).get();

      return files;
    } catch (error) {
      this.logger.error('Error fetching OneDrive files:', error);
      throw error;
    }
  }

  /**
   * Create a file in OneDrive
   */
  async createOneDriveFile(userId: string, filename: string, content: string) {
    try {
      const graphClient = await this.createGraphClient(userId);

      const file = await graphClient.api(`/me/drive/root:/${filename}:/content`).put(content);

      return file;
    } catch (error) {
      this.logger.error('Error creating OneDrive file:', error);
      throw error;
    }
  }

  /**
   * Get user's Teams
   */
  async getTeams(userId: string) {
    try {
      const graphClient = await this.createGraphClient(userId);
      const teams = await graphClient.api('/me/joinedTeams').get();

      return teams;
    } catch (error) {
      this.logger.error('Error fetching Teams:', error);
      throw error;
    }
  }

  /**
   * Store or update Microsoft integration configuration
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
          provider: 'microsoft',
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
        provider: 'microsoft',
        userId,
        accessToken,
        refreshToken,
        expiresAt,
        scopes: scopes || [],
      },
    });
  }

  // ============================================================================
  // CALENDAR OPERATIONS
  // ============================================================================

  /**
   * Get user's calendars
   */
  async getCalendars(userId: string) {
    try {
      const graphClient = await this.createGraphClient(userId);
      const calendars = await graphClient.api(GRAPH_ENDPOINTS.CALENDARS).get();

      return calendars;
    } catch (error) {
      this.logger.error('Error fetching calendars:', error);
      throw error;
    }
  }

  /**
   * Get calendar events with optional filtering - Enhanced for Google Calendar parity
   */
  async getCalendarEvents(
    userId: string,
    calendarId = 'primary',
    timeMin?: Date,
    timeMax?: Date,
    options: CalendarListOptions = {}
  ) {
    const startTime = performance.now();

    try {
      this.logger.debug(`Fetching calendar events for user ${userId}, calendar ${calendarId}`, {
        userId,
        calendarId,
        timeMin: timeMin?.toISOString(),
        timeMax: timeMax?.toISOString(),
        options,
      });

      const graphClient = await this.createGraphClient(userId);

      // Build query parameters
      const queryParams: string[] = [];

      // Time range filtering (prioritize method params over options)
      const startTimeFilter =
        timeMin || (options.startTime ? new Date(options.startTime) : new Date());
      const endTimeFilter = timeMax || (options.endTime ? new Date(options.endTime) : undefined);

      if (startTimeFilter) {
        queryParams.push(`start/dateTime ge '${startTimeFilter.toISOString()}'`);
      }

      if (endTimeFilter) {
        queryParams.push(`end/dateTime le '${endTimeFilter.toISOString()}'`);
      }

      if (queryParams.length > 0) {
        queryParams.unshift(`$filter=${queryParams.join(' and ')}`);
        queryParams.splice(1); // Remove individual filter components, keep combined $filter
      }

      if (options.orderBy) {
        queryParams.push(
          `$orderby=${options.orderBy === 'start' ? 'start/dateTime' : 'lastModifiedDateTime'}`
        );
      } else {
        queryParams.push(`$orderby=start/dateTime`);
      }

      const maxResults = options.maxResults || DEFAULT_CONFIG.maxResults;
      queryParams.push(`$top=${maxResults}`);

      // Include additional properties for rich calendar data
      queryParams.push(
        `$select=id,subject,body,start,end,location,attendees,isAllDay,showAs,importance,sensitivity,categories,recurrence,organizer,responseStatus,webLink,lastModifiedDateTime`
      );

      // Choose endpoint based on calendar
      const baseEndpoint =
        calendarId === 'primary'
          ? GRAPH_ENDPOINTS.EVENTS
          : GRAPH_ENDPOINTS.CALENDAR_EVENTS(calendarId);

      const endpoint = `${baseEndpoint}?${queryParams.join('&')}`;

      const response = await graphClient.api(endpoint).get();

      const responseTime = performance.now() - startTime;
      const eventCount = response.value?.length || 0;

      this.logger.log(
        `Successfully fetched ${eventCount} calendar events for user ${userId} in ${responseTime.toFixed(2)}ms`,
        {
          userId,
          calendarId,
          eventCount,
          responseTimeMs: responseTime,
        }
      );

      return {
        value: response.value || [],
        '@odata.nextLink': response['@odata.nextLink'],
        totalCount: eventCount,
      };
    } catch (error) {
      const responseTime = performance.now() - startTime;

      this.logger.error(`Error fetching Microsoft Graph calendar events for user ${userId}:`, {
        userId,
        calendarId,
        error: error.message,
        errorCode: error.code,
        responseTimeMs: responseTime,
      });

      // Handle specific Microsoft Graph API errors
      if (error.code === 'Forbidden' || error.code === 'Unauthorized') {
        throw new Error(
          `Calendar access denied. Please check permissions for calendar: ${calendarId}`
        );
      }

      if (error.code === 'TooManyRequests' || error.code === 'ThrottledRequest') {
        throw new Error('Calendar API rate limit exceeded. Please try again later.');
      }

      if (error.code === 'NotFound') {
        throw new Error(`Calendar not found: ${calendarId}`);
      }

      throw error;
    }
  }

  /**
   * Get a specific calendar event
   */
  async getCalendarEvent(userId: string, eventId: string) {
    try {
      const graphClient = await this.createGraphClient(userId);
      const event = await graphClient.api(GRAPH_ENDPOINTS.EVENT(eventId)).get();

      return event;
    } catch (error) {
      this.logger.error('Error fetching calendar event:', error);
      throw error;
    }
  }

  /**
   * Create a new calendar event - Enhanced for Google Calendar parity
   */
  async createCalendarEvent(
    userId: string,
    eventData: {
      subject: string;
      body?: {
        contentType?: 'HTML' | 'Text';
        content?: string;
      };
      start: { dateTime: string; timeZone?: string };
      end: { dateTime: string; timeZone?: string };
      location?: { displayName: string };
      attendees?: Array<{
        emailAddress: { address: string; name?: string };
        type?: 'required' | 'optional' | 'resource';
      }>;
      isAllDay?: boolean;
      showAs?: 'free' | 'tentative' | 'busy' | 'oof' | 'workingElsewhere';
      importance?: 'low' | 'normal' | 'high';
      sensitivity?: 'normal' | 'personal' | 'private' | 'confidential';
      categories?: string[];
      recurrence?: any;
    },
    calendarId = 'primary'
  ) {
    const startTime = performance.now();

    try {
      this.logger.debug(`Creating calendar event for user ${userId}`, {
        userId,
        calendarId,
        subject: eventData.subject,
        startTime: eventData.start.dateTime,
        endTime: eventData.end.dateTime,
      });

      const graphClient = await this.createGraphClient(userId);

      // Ensure required fields and apply defaults
      const event: CalendarEvent = {
        subject: eventData.subject,
        body: {
          contentType: eventData.body?.contentType || 'Text',
          content: eventData.body?.content || '',
        },
        start: {
          dateTime: eventData.start.dateTime,
          timeZone: eventData.start.timeZone || DEFAULT_CONFIG.timeZone,
        },
        end: {
          dateTime: eventData.end.dateTime,
          timeZone: eventData.end.timeZone || DEFAULT_CONFIG.timeZone,
        },
        location: eventData.location,
        attendees: eventData.attendees?.map(attendee => ({
          emailAddress: attendee.emailAddress,
          type: attendee.type || 'required',
        })),
        isAllDay: eventData.isAllDay || false,
        showAs: eventData.showAs || 'busy',
        importance: eventData.importance || 'normal',
        sensitivity: eventData.sensitivity || 'normal',
        categories: eventData.categories || [],
        recurrence: eventData.recurrence,
      };

      // Choose endpoint based on calendar
      const endpoint =
        calendarId === 'primary'
          ? GRAPH_ENDPOINTS.EVENTS
          : GRAPH_ENDPOINTS.CALENDAR_EVENTS(calendarId);

      const createdEvent = await graphClient.api(endpoint).post(event);

      const responseTime = performance.now() - startTime;

      this.logger.log(
        `Successfully created calendar event for user ${userId} in ${responseTime.toFixed(2)}ms`,
        {
          userId,
          calendarId,
          eventId: createdEvent.id,
          subject: createdEvent.subject,
          responseTimeMs: responseTime,
        }
      );

      return createdEvent;
    } catch (error) {
      const responseTime = performance.now() - startTime;

      this.logger.error(`Error creating calendar event for user ${userId}:`, {
        userId,
        calendarId,
        error: error.message,
        errorCode: error.code,
        responseTimeMs: responseTime,
      });

      // Handle specific Microsoft Graph API errors
      if (error.code === 'Forbidden' || error.code === 'Unauthorized') {
        throw new Error('Calendar write access denied. Please check permissions.');
      }

      if (error.code === 'TooManyRequests' || error.code === 'ThrottledRequest') {
        throw new Error('Calendar API rate limit exceeded. Please try again later.');
      }

      if (error.code === 'BadRequest') {
        throw new Error(`Invalid event data: ${error.message}`);
      }

      throw error;
    }
  }

  /**
   * Update an existing calendar event
   */
  async updateCalendarEvent(userId: string, eventId: string, updates: Partial<CalendarEvent>) {
    try {
      const graphClient = await this.createGraphClient(userId);
      const updatedEvent = await graphClient.api(GRAPH_ENDPOINTS.EVENT(eventId)).patch(updates);

      return updatedEvent;
    } catch (error) {
      this.logger.error('Error updating calendar event:', error);
      throw error;
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteCalendarEvent(userId: string, eventId: string) {
    try {
      const graphClient = await this.createGraphClient(userId);
      await graphClient.api(GRAPH_ENDPOINTS.EVENT(eventId)).delete();

      return { success: true, message: 'Event deleted successfully' };
    } catch (error) {
      this.logger.error('Error deleting calendar event:', error);
      throw error;
    }
  }

  /**
   * Get events from a specific calendar
   */
  async getCalendarEventsByCalendarId(
    userId: string,
    calendarId: string,
    options: CalendarListOptions = {}
  ) {
    try {
      const graphClient = await this.createGraphClient(userId);

      // Build query parameters
      const queryParams: string[] = [];

      if (options.startTime && options.endTime) {
        queryParams.push(
          `$filter=start/dateTime ge '${options.startTime}' and end/dateTime le '${options.endTime}'`
        );
      }

      if (options.orderBy) {
        queryParams.push(
          `$orderby=${options.orderBy === 'start' ? 'start/dateTime' : 'lastModifiedDateTime'}`
        );
      }

      if (options.maxResults) {
        queryParams.push(`$top=${options.maxResults}`);
      }

      const endpoint =
        queryParams.length > 0
          ? `${GRAPH_ENDPOINTS.CALENDAR_EVENTS(calendarId)}?${queryParams.join('&')}`
          : GRAPH_ENDPOINTS.CALENDAR_EVENTS(calendarId);

      const events = await graphClient.api(endpoint).get();

      return events;
    } catch (error) {
      this.logger.error('Error fetching calendar events by calendar ID:', error);
      throw error;
    }
  }

  /**
   * Batch create multiple calendar events for efficiency
   */
  async batchCreateCalendarEvents(
    userId: string,
    events: Array<{
      subject: string;
      body?: { contentType?: 'HTML' | 'Text'; content?: string };
      start: { dateTime: string; timeZone?: string };
      end: { dateTime: string; timeZone?: string };
      location?: { displayName: string };
      attendees?: Array<{
        emailAddress: { address: string; name?: string };
        type?: 'required' | 'optional' | 'resource';
      }>;
      isAllDay?: boolean;
      categories?: string[];
    }>,
    calendarId = 'primary'
  ) {
    const startTime = performance.now();

    try {
      this.logger.debug(`Batch creating ${events.length} calendar events for user ${userId}`, {
        userId,
        calendarId,
        eventCount: events.length,
      });

      const graphClient = await this.createGraphClient(userId);

      // Prepare batch requests
      const batchRequests = events.map((eventData, index) => {
        const event: CalendarEvent = {
          subject: eventData.subject,
          body: {
            contentType: eventData.body?.contentType || 'Text',
            content: eventData.body?.content || '',
          },
          start: {
            dateTime: eventData.start.dateTime,
            timeZone: eventData.start.timeZone || DEFAULT_CONFIG.timeZone,
          },
          end: {
            dateTime: eventData.end.dateTime,
            timeZone: eventData.end.timeZone || DEFAULT_CONFIG.timeZone,
          },
          location: eventData.location,
          attendees: eventData.attendees?.map(attendee => ({
            emailAddress: attendee.emailAddress,
            type: attendee.type || 'required',
          })),
          isAllDay: eventData.isAllDay || false,
          categories: eventData.categories || [],
        };

        return {
          id: `${index + 1}`,
          method: 'POST',
          url: calendarId === 'primary' ? '/me/events' : `/me/calendars/${calendarId}/events`,
          body: event,
          headers: {
            'Content-Type': 'application/json',
          },
        };
      });

      // Execute batch request (Microsoft Graph supports up to 20 requests per batch)
      const batchSize = 20;
      const results = [];

      for (let i = 0; i < batchRequests.length; i += batchSize) {
        const batch = batchRequests.slice(i, i + batchSize);
        const batchResponse = await graphClient.api('/$batch').post({
          requests: batch,
        });

        results.push(...batchResponse.responses);
      }

      const responseTime = performance.now() - startTime;
      const successCount = results.filter(r => r.status >= 200 && r.status < 300).length;

      this.logger.log(
        `Batch created ${successCount}/${events.length} calendar events for user ${userId} in ${responseTime.toFixed(2)}ms`,
        {
          userId,
          calendarId,
          totalEvents: events.length,
          successCount,
          responseTimeMs: responseTime,
        }
      );

      return {
        responses: results,
        successCount,
        totalCount: events.length,
      };
    } catch (error) {
      const responseTime = performance.now() - startTime;

      this.logger.error(`Error batch creating calendar events for user ${userId}:`, {
        userId,
        calendarId,
        eventCount: events.length,
        error: error.message,
        responseTimeMs: responseTime,
      });

      throw error;
    }
  }

  /**
   * Send meeting invitation and track responses
   */
  async sendMeetingInvitation(
    userId: string,
    eventId: string,
    message?: string,
    calendarId = 'primary'
  ) {
    try {
      this.logger.debug(`Sending meeting invitation for event ${eventId}`, {
        userId,
        eventId,
        calendarId,
      });

      const graphClient = await this.createGraphClient(userId);

      // Get the event first to ensure it exists
      const eventEndpoint =
        calendarId === 'primary'
          ? GRAPH_ENDPOINTS.EVENT(eventId)
          : GRAPH_ENDPOINTS.CALENDAR_EVENT(calendarId, eventId);

      const event = await graphClient.api(eventEndpoint).get();

      if (!event.attendees || event.attendees.length === 0) {
        throw new Error('Cannot send invitation: no attendees specified');
      }

      // Send invitation by updating the event with a comment
      const response = await graphClient.api(`${eventEndpoint}/forward`).post({
        comment: message || 'Meeting invitation',
        toRecipients: event.attendees.map(attendee => ({
          emailAddress: attendee.emailAddress,
        })),
      });

      this.logger.log(`Successfully sent meeting invitation for event ${eventId}`, {
        userId,
        eventId,
        calendarId,
        attendeeCount: event.attendees.length,
      });

      return response;
    } catch (error) {
      this.logger.error(`Error sending meeting invitation for event ${eventId}:`, {
        userId,
        eventId,
        calendarId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get calendar permissions and sharing settings
   */
  async getCalendarPermissions(userId: string, calendarId = 'primary') {
    try {
      this.logger.debug(`Getting calendar permissions for calendar ${calendarId}`, {
        userId,
        calendarId,
      });

      const graphClient = await this.createGraphClient(userId);

      const endpoint =
        calendarId === 'primary'
          ? '/me/calendar/calendarPermissions'
          : `/me/calendars/${calendarId}/calendarPermissions`;

      const permissions = await graphClient.api(endpoint).get();

      return permissions;
    } catch (error) {
      this.logger.error(`Error getting calendar permissions for calendar ${calendarId}:`, {
        userId,
        calendarId,
        error: error.message,
      });

      // Handle case where permissions endpoint is not available
      if (error.code === 'NotFound' || error.code === 'BadRequest') {
        this.logger.warn(
          'Calendar permissions endpoint not available, returning empty permissions'
        );
        return { value: [] };
      }

      throw error;
    }
  }

  /**
   * Share calendar with specific permissions
   */
  async shareCalendar(
    userId: string,
    recipientEmail: string,
    permission: 'read' | 'write' | 'owner' = 'read',
    calendarId = 'primary'
  ) {
    try {
      this.logger.debug(`Sharing calendar ${calendarId} with ${recipientEmail}`, {
        userId,
        calendarId,
        recipientEmail,
        permission,
      });

      const graphClient = await this.createGraphClient(userId);

      const endpoint =
        calendarId === 'primary'
          ? '/me/calendar/calendarPermissions'
          : `/me/calendars/${calendarId}/calendarPermissions`;

      const permissionData = {
        emailAddress: {
          address: recipientEmail,
        },
        isRemovable: true,
        isInsideOrganization: false,
        role:
          permission === 'read' ? 'limitedDetails' : permission === 'write' ? 'readWrite' : 'owner',
      };

      const result = await graphClient.api(endpoint).post(permissionData);

      this.logger.log(`Successfully shared calendar ${calendarId} with ${recipientEmail}`, {
        userId,
        calendarId,
        recipientEmail,
        permission,
      });

      return result;
    } catch (error) {
      this.logger.error(`Error sharing calendar ${calendarId} with ${recipientEmail}:`, {
        userId,
        calendarId,
        recipientEmail,
        permission,
        error: error.message,
      });

      throw error;
    }
  }

  /**
   * Get attendee response status for an event
   */
  async getEventAttendeeResponses(
    userId: string,
    eventId: string,
    calendarId = 'primary'
  ): Promise<AttendeeResponseStats> {
    try {
      this.logger.debug(`Getting attendee responses for event ${eventId}`, {
        userId,
        eventId,
        calendarId,
      });

      const graphClient = await this.createGraphClient(userId);

      const eventEndpoint =
        calendarId === 'primary'
          ? GRAPH_ENDPOINTS.EVENT(eventId)
          : GRAPH_ENDPOINTS.CALENDAR_EVENT(calendarId, eventId);

      const event = await graphClient
        .api(eventEndpoint)
        .select('attendees,organizer,subject')
        .get();

      const responseStats: AttendeeResponseStats = {
        total: event.attendees?.length || 0,
        accepted: 0,
        declined: 0,
        tentative: 0,
        noResponse: 0,
        attendees:
          event.attendees?.map(attendee => ({
            email: attendee.emailAddress.address,
            name: attendee.emailAddress.name,
            response: attendee.status?.response || 'none',
            responseTime: attendee.status?.time,
          })) || [],
      };

      // Count responses
      responseStats.attendees.forEach(attendee => {
        switch (attendee.response) {
          case 'accepted':
            responseStats.accepted++;
            break;
          case 'declined':
            responseStats.declined++;
            break;
          case 'tentativelyAccepted':
            responseStats.tentative++;
            break;
          default:
            responseStats.noResponse++;
        }
      });

      return responseStats;
    } catch (error) {
      this.logger.error(`Error getting attendee responses for event ${eventId}:`, {
        userId,
        eventId,
        calendarId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Find optimal meeting times based on attendee availability
   */
  async findMeetingTimes(
    userId: string,
    attendees: string[],
    duration: number, // in minutes
    timeConstraints?: {
      startTime?: string;
      endTime?: string;
      maxCandidates?: number;
    }
  ) {
    try {
      this.logger.debug(`Finding meeting times for ${attendees.length} attendees`, {
        userId,
        attendees: attendees.length,
        duration,
      });

      const graphClient = await this.createGraphClient(userId);

      const requestBody = {
        attendees: attendees.map(email => ({
          emailAddress: { address: email },
        })),
        timeConstraint: {
          timeslots: [
            {
              start: {
                dateTime: timeConstraints?.startTime || new Date().toISOString(),
                timeZone: DEFAULT_CONFIG.timeZone,
              },
              end: {
                dateTime:
                  timeConstraints?.endTime ||
                  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                timeZone: DEFAULT_CONFIG.timeZone,
              },
            },
          ],
        },
        meetingDuration: `PT${duration}M`,
        maxCandidates: timeConstraints?.maxCandidates || 20,
      };

      const response = await graphClient.api(GRAPH_ENDPOINTS.FIND_MEETING_TIMES).post(requestBody);

      this.logger.log(
        `Found ${response.meetingTimeSuggestions?.length || 0} meeting time suggestions`,
        { userId, attendees: attendees.length, duration }
      );

      return response;
    } catch (error) {
      this.logger.error(`Error finding meeting times:`, {
        userId,
        attendees: attendees.length,
        duration,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get free/busy information for attendees
   */
  async getFreeBusyInfo(
    userId: string,
    attendees: string[],
    startTime: string,
    endTime: string,
    intervalInMinutes = 30
  ) {
    try {
      this.logger.debug(`Getting free/busy info for ${attendees.length} attendees`, {
        userId,
        attendees: attendees.length,
        startTime,
        endTime,
      });

      const graphClient = await this.createGraphClient(userId);

      const requestBody = {
        schedules: attendees,
        startTime: {
          dateTime: startTime,
          timeZone: DEFAULT_CONFIG.timeZone,
        },
        endTime: {
          dateTime: endTime,
          timeZone: DEFAULT_CONFIG.timeZone,
        },
        availabilityViewInterval: intervalInMinutes,
      };

      const response = await graphClient.api(GRAPH_ENDPOINTS.GET_SCHEDULE).post(requestBody);

      this.logger.log(`Retrieved free/busy info for ${response.value?.length || 0} attendees`, {
        userId,
        attendees: attendees.length,
      });

      return response;
    } catch (error) {
      this.logger.error(`Error getting free/busy info:`, {
        userId,
        attendees: attendees.length,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get calendar view with enhanced filtering
   */
  async getCalendarView(
    userId: string,
    startTime: string,
    endTime: string,
    options: EnhancedCalendarOptions = {}
  ) {
    try {
      this.logger.debug(`Getting calendar view from ${startTime} to ${endTime}`, {
        userId,
        startTime,
        endTime,
        options,
      });

      const graphClient = await this.createGraphClient(userId);

      // Build query parameters
      const queryParams: string[] = [];

      queryParams.push(`startDateTime=${encodeURIComponent(startTime)}`);
      queryParams.push(`endDateTime=${encodeURIComponent(endTime)}`);

      if (options.maxResults) {
        queryParams.push(`$top=${options.maxResults}`);
      }

      if (options.orderBy) {
        queryParams.push(
          `$orderby=${options.orderBy === 'start' ? 'start/dateTime' : 'lastModifiedDateTime'}`
        );
      }

      // Select specific fields for efficiency
      const selectFields = [
        'id',
        'subject',
        'start',
        'end',
        'location',
        'isAllDay',
        'showAs',
        'importance',
        'sensitivity',
        'categories',
        'organizer',
      ];

      if (options.includeAttendees) {
        selectFields.push('attendees');
      }

      if (options.includeRecurrence) {
        selectFields.push('recurrence');
      }

      queryParams.push(`$select=${selectFields.join(',')}`);

      const endpoint = `${GRAPH_ENDPOINTS.CALENDAR_VIEW}?${queryParams.join('&')}`;
      const response = await graphClient.api(endpoint).get();

      this.logger.log(`Retrieved ${response.value?.length || 0} events from calendar view`, {
        userId,
        startTime,
        endTime,
        eventCount: response.value?.length || 0,
      });

      return response;
    } catch (error) {
      this.logger.error(`Error getting calendar view:`, {
        userId,
        startTime,
        endTime,
        error: error.message,
      });
      throw error;
    }
  }
}
