import { Injectable, Logger } from "@nestjs/common";
import { Client } from "@microsoft/microsoft-graph-client";
import { PrismaService } from "../../prisma/prisma.service";
import { GraphAuthService } from "./auth/graph-auth.service";
import { 
  CalendarEvent, 
  CalendarListOptions, 
  GRAPH_ENDPOINTS, 
  DEFAULT_CONFIG 
} from "./types/calendar.types";

@Injectable()
export class GraphService {
  private readonly logger = new Logger(GraphService.name);

  constructor(
    private prisma: PrismaService,
    private graphAuthService: GraphAuthService,
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
      const profile = await graphClient.api("/me").get();

      return profile;
    } catch (error) {
      this.logger.error("Error fetching Microsoft Graph profile:", error);
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
        : "/me/drive/root/children";

      const files = await graphClient.api(endpoint).get();

      return files;
    } catch (error) {
      this.logger.error("Error fetching OneDrive files:", error);
      throw error;
    }
  }

  /**
   * Create a file in OneDrive
   */
  async createOneDriveFile(userId: string, filename: string, content: string) {
    try {
      const graphClient = await this.createGraphClient(userId);

      const file = await graphClient
        .api(`/me/drive/root:/${filename}:/content`)
        .put(content);

      return file;
    } catch (error) {
      this.logger.error("Error creating OneDrive file:", error);
      throw error;
    }
  }

  /**
   * Get user's Teams
   */
  async getTeams(userId: string) {
    try {
      const graphClient = await this.createGraphClient(userId);
      const teams = await graphClient.api("/me/joinedTeams").get();

      return teams;
    } catch (error) {
      this.logger.error("Error fetching Teams:", error);
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
    scopes?: string[],
  ) {
    return this.prisma.integrationConfig.upsert({
      where: {
        provider_userId: {
          provider: "microsoft",
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
        provider: "microsoft",
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
      this.logger.error("Error fetching calendars:", error);
      throw error;
    }
  }

  /**
   * Get calendar events with optional filtering
   */
  async getCalendarEvents(userId: string, options: CalendarListOptions = {}) {
    try {
      const graphClient = await this.createGraphClient(userId);
      
      // Build query parameters
      const queryParams: string[] = [];
      
      if (options.startTime && options.endTime) {
        queryParams.push(`$filter=start/dateTime ge '${options.startTime}' and end/dateTime le '${options.endTime}'`);
      }
      
      if (options.orderBy) {
        queryParams.push(`$orderby=${options.orderBy === 'start' ? 'start/dateTime' : 'lastModifiedDateTime'}`);
      }
      
      if (options.maxResults) {
        queryParams.push(`$top=${options.maxResults}`);
      }

      const endpoint = queryParams.length > 0 
        ? `${GRAPH_ENDPOINTS.EVENTS}?${queryParams.join('&')}`
        : GRAPH_ENDPOINTS.EVENTS;

      const events = await graphClient.api(endpoint).get();

      return events;
    } catch (error) {
      this.logger.error("Error fetching calendar events:", error);
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
      this.logger.error("Error fetching calendar event:", error);
      throw error;
    }
  }

  /**
   * Create a new calendar event
   */
  async createCalendarEvent(userId: string, event: CalendarEvent) {
    try {
      const graphClient = await this.createGraphClient(userId);
      
      // Ensure required fields and apply defaults
      const eventData = {
        ...event,
        start: {
          ...event.start,
          timeZone: event.start.timeZone || DEFAULT_CONFIG.timeZone,
        },
        end: {
          ...event.end,
          timeZone: event.end.timeZone || DEFAULT_CONFIG.timeZone,
        },
      };

      const createdEvent = await graphClient
        .api(GRAPH_ENDPOINTS.EVENTS)
        .post(eventData);

      return createdEvent;
    } catch (error) {
      this.logger.error("Error creating calendar event:", error);
      throw error;
    }
  }

  /**
   * Update an existing calendar event
   */
  async updateCalendarEvent(userId: string, eventId: string, updates: Partial<CalendarEvent>) {
    try {
      const graphClient = await this.createGraphClient(userId);
      const updatedEvent = await graphClient
        .api(GRAPH_ENDPOINTS.EVENT(eventId))
        .patch(updates);

      return updatedEvent;
    } catch (error) {
      this.logger.error("Error updating calendar event:", error);
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

      return { success: true, message: "Event deleted successfully" };
    } catch (error) {
      this.logger.error("Error deleting calendar event:", error);
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
        queryParams.push(`$filter=start/dateTime ge '${options.startTime}' and end/dateTime le '${options.endTime}'`);
      }
      
      if (options.orderBy) {
        queryParams.push(`$orderby=${options.orderBy === 'start' ? 'start/dateTime' : 'lastModifiedDateTime'}`);
      }
      
      if (options.maxResults) {
        queryParams.push(`$top=${options.maxResults}`);
      }

      const endpoint = queryParams.length > 0 
        ? `${GRAPH_ENDPOINTS.CALENDAR_EVENTS(calendarId)}?${queryParams.join('&')}`
        : GRAPH_ENDPOINTS.CALENDAR_EVENTS(calendarId);

      const events = await graphClient.api(endpoint).get();

      return events;
    } catch (error) {
      this.logger.error("Error fetching calendar events by calendar ID:", error);
      throw error;
    }
  }
}
