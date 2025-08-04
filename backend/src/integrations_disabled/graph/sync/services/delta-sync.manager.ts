import { Injectable, Logger } from '@nestjs/common';
import { GraphService } from '../../graph.service';
import { GraphAuthService } from '../../auth/graph-auth.service';
import {
  GraphCalendarEvent,
  GraphDeltaResponse,
  DeltaSyncOptions,
} from '../types/calendar-sync.types';

/**
 * Delta Sync Manager
 * Handles incremental synchronization using Microsoft Graph delta queries
 */
@Injectable()
export class DeltaSyncManager {
  private readonly logger = new Logger(DeltaSyncManager.name);

  constructor(
    private readonly graphService: GraphService,
    private readonly graphAuthService: GraphAuthService
  ) {}

  /**
   * Get delta changes from Microsoft Graph
   */
  async getDeltaChanges(
    userId: string,
    deltaToken: string,
    options: DeltaSyncOptions = {}
  ): Promise<{ events: GraphCalendarEvent[]; deltaToken?: string }> {
    this.logger.log(`Getting delta changes for user ${userId} with token: ${deltaToken}`);

    try {
      const graphClient = await this.createGraphClient(userId);
      const calendarId = options.calendarId || 'default';

      // Build delta query URL
      let deltaUrl = `/me/calendars/${calendarId}/events/delta`;

      // Add query parameters
      const queryParams: string[] = [];

      if (options.maxResults) {
        queryParams.push(`$top=${options.maxResults}`);
      }

      // Add select fields to optimize response
      queryParams.push(
        `$select=id,subject,body,location,start,end,isAllDay,recurrence,lastModifiedDateTime,createdDateTime`
      );

      if (queryParams.length > 0) {
        deltaUrl += `?${queryParams.join('&')}`;
      }

      // If we have a delta token, use the delta link
      let requestUrl = deltaUrl;
      if (deltaToken && deltaToken !== 'initial') {
        // Delta token contains the full URL for the next request
        requestUrl = deltaToken;
      }

      this.logger.debug(`Delta request URL: ${requestUrl}`);

      // Make the delta request
      const response = await this.makeGraphRequest(graphClient, requestUrl);

      const events = response.value || [];
      let newDeltaToken: string | undefined;

      // Extract delta token from response
      if (response['@odata.deltaLink']) {
        newDeltaToken = response['@odata.deltaLink'];
        this.logger.debug(`Received delta link: ${newDeltaToken}`);
      } else if (response['@odata.nextLink']) {
        // If there are more pages, we need to continue fetching
        const allEvents = [...events];
        let nextLink = response['@odata.nextLink'];

        while (nextLink) {
          this.logger.debug(`Fetching next page: ${nextLink}`);
          const nextResponse = await this.makeGraphRequest(graphClient, nextLink);
          allEvents.push(...(nextResponse.value || []));

          if (nextResponse['@odata.deltaLink']) {
            newDeltaToken = nextResponse['@odata.deltaLink'];
            break;
          }

          nextLink = nextResponse['@odata.nextLink'];
        }

        return {
          events: this.filterDeltaEvents(allEvents, options),
          deltaToken: newDeltaToken,
        };
      }

      return {
        events: this.filterDeltaEvents(events, options),
        deltaToken: newDeltaToken,
      };
    } catch (error) {
      this.logger.error(`Failed to get delta changes for user ${userId}:`, error);

      // If delta token is invalid, we might need to start fresh
      if (this.isDeltaTokenError(error)) {
        this.logger.warn('Delta token is invalid, suggesting full sync');
        throw new Error('DELTA_TOKEN_INVALID');
      }

      throw error;
    }
  }

  /**
   * Initialize delta sync for a user (get initial delta token)
   */
  async initializeDeltaSync(userId: string, options: DeltaSyncOptions = {}): Promise<string> {
    this.logger.log(`Initializing delta sync for user ${userId}`);

    try {
      const graphClient = await this.createGraphClient(userId);
      const calendarId = options.calendarId || 'default';

      // Make initial delta request to get the delta token
      const deltaUrl = `/me/calendars/${calendarId}/events/delta?$select=id&$top=1`;
      const response = await this.makeGraphRequest(graphClient, deltaUrl);

      // Skip through all pages to get to the delta link
      let nextLink = response['@odata.nextLink'];
      while (nextLink) {
        const nextResponse = await this.makeGraphRequest(graphClient, nextLink);
        if (nextResponse['@odata.deltaLink']) {
          return nextResponse['@odata.deltaLink'];
        }
        nextLink = nextResponse['@odata.nextLink'];
      }

      if (response['@odata.deltaLink']) {
        return response['@odata.deltaLink'];
      }

      throw new Error('Failed to get initial delta token');
    } catch (error) {
      this.logger.error(`Failed to initialize delta sync for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Check if delta sync is supported for the user
   */
  async isDeltaSyncSupported(userId: string): Promise<boolean> {
    try {
      // Try to initialize delta sync
      await this.initializeDeltaSync(userId);
      return true;
    } catch (error) {
      this.logger.warn(`Delta sync not supported for user ${userId}:`, error.message);
      return false;
    }
  }

  /**
   * Parse delta response to identify change types
   */
  parseDeltaChanges(events: GraphCalendarEvent[]): {
    created: GraphCalendarEvent[];
    updated: GraphCalendarEvent[];
    deleted: string[]; // Only IDs for deleted events
  } {
    const created: GraphCalendarEvent[] = [];
    const updated: GraphCalendarEvent[] = [];
    const deleted: string[] = [];

    for (const event of events) {
      if (event['@removed']) {
        // Event was deleted
        deleted.push(event.id);
      } else if (event.createdDateTime === event.lastModifiedDateTime) {
        // Event was created (created and modified times are the same)
        created.push(event);
      } else {
        // Event was updated
        updated.push(event);
      }
    }

    this.logger.debug(
      `Delta changes: ${created.length} created, ${updated.length} updated, ${deleted.length} deleted`
    );

    return { created, updated, deleted };
  }

  /**
   * Create authenticated Graph client
   */
  private async createGraphClient(userId: string) {
    const accessToken = await this.graphAuthService.getAccessToken(userId);
    return this.graphService['createGraphClient'](accessToken);
  }

  /**
   * Make Graph API request with error handling
   */
  private async makeGraphRequest(graphClient: any, url: string): Promise<GraphDeltaResponse> {
    try {
      const response = await graphClient.api(url).get();
      return response;
    } catch (error) {
      this.logger.error(`Graph API request failed for URL ${url}:`, error);
      throw error;
    }
  }

  /**
   * Filter delta events based on options
   */
  private filterDeltaEvents(
    events: GraphCalendarEvent[],
    options: DeltaSyncOptions
  ): GraphCalendarEvent[] {
    let filteredEvents = events;

    if (options.skipDeleted) {
      filteredEvents = filteredEvents.filter(event => !event['@removed']);
    }

    return filteredEvents;
  }

  /**
   * Check if error is related to invalid delta token
   */
  private isDeltaTokenError(error: any): boolean {
    // Check for common delta token error patterns
    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code?.toLowerCase() || '';

    return (
      (errorMessage.includes('delta') && errorMessage.includes('invalid')) ||
      (errorMessage.includes('delta') && errorMessage.includes('expired')) ||
      errorCode === 'invalidrequest' ||
      errorCode === 'resyncrequest'
    );
  }

  /**
   * Validate delta token format
   */
  isValidDeltaToken(deltaToken: string): boolean {
    if (!deltaToken || deltaToken === 'initial') {
      return false;
    }

    // Microsoft Graph delta tokens are typically URLs or encoded strings
    try {
      // Check if it's a URL
      new URL(deltaToken);
      return true;
    } catch {
      // Check if it's a base64-encoded string (sometimes used)
      try {
        const decoded = Buffer.from(deltaToken, 'base64').toString();
        return decoded.length > 0;
      } catch {
        return false;
      }
    }
  }

  /**
   * Get sync window for delta queries (events within a specific date range)
   */
  async getDeltaChangesInWindow(
    userId: string,
    deltaToken: string,
    startDate: Date,
    endDate: Date,
    options: DeltaSyncOptions = {}
  ): Promise<{ events: GraphCalendarEvent[]; deltaToken?: string }> {
    this.logger.log(
      `Getting delta changes for user ${userId} between ${startDate.toISOString()} and ${endDate.toISOString()}`
    );

    const result = await this.getDeltaChanges(userId, deltaToken, options);

    // Filter events by date range
    const filteredEvents = result.events.filter(event => {
      if (event['@removed']) {
        return true; // Include deleted events regardless of date
      }

      const eventStart = new Date(event.start.dateTime);
      const eventEnd = new Date(event.end.dateTime);

      // Include event if it overlaps with the window
      return eventStart <= endDate && eventEnd >= startDate;
    });

    return {
      events: filteredEvents,
      deltaToken: result.deltaToken,
    };
  }
}
