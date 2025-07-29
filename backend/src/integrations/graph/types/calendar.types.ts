/**
 * Microsoft Graph configuration types and constants
 */

export interface MicrosoftGraphConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  tenantId?: string;
  scopes: string[];
}

export interface CalendarEvent {
  id?: string;
  subject: string;
  body: {
    contentType: 'HTML' | 'Text';
    content: string;
  };
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: {
    displayName: string;
  };
  attendees?: Array<{
    emailAddress: {
      address: string;
      name?: string;
    };
    type: 'required' | 'optional' | 'resource';
  }>;
  isAllDay?: boolean;
  showAs?: 'free' | 'tentative' | 'busy' | 'oof' | 'workingElsewhere' | 'unknown';
  importance?: 'low' | 'normal' | 'high';
  sensitivity?: 'normal' | 'personal' | 'private' | 'confidential';
  recurrence?: {
    pattern: {
      type: 'daily' | 'weekly' | 'absoluteMonthly' | 'relativeMonthly' | 'absoluteYearly' | 'relativeYearly';
      interval: number;
      daysOfWeek?: string[];
      dayOfMonth?: number;
      firstDayOfWeek?: string;
      index?: 'first' | 'second' | 'third' | 'fourth' | 'last';
    };
    range: {
      type: 'endDate' | 'noEnd' | 'numbered';
      startDate: string;
      endDate?: string;
      numberOfOccurrences?: number;
    };
  };
}

export interface CalendarListOptions {
  startTime?: string;
  endTime?: string;
  timeZone?: string;
  maxResults?: number;
  orderBy?: 'start' | 'lastModified';
  showDeleted?: boolean;
}

/**
 * Microsoft Graph API endpoints for calendar operations
 */
export const GRAPH_ENDPOINTS = {
  ME: '/me',
  CALENDARS: '/me/calendars',
  DEFAULT_CALENDAR: '/me/calendar',
  EVENTS: '/me/events',
  CALENDAR_EVENTS: (calendarId: string) => `/me/calendars/${calendarId}/events`,
  EVENT: (eventId: string) => `/me/events/${eventId}`,
  CALENDAR_EVENT: (calendarId: string, eventId: string) => 
    `/me/calendars/${calendarId}/events/${eventId}`,
} as const;

/**
 * Required scopes for Microsoft Graph Calendar API
 */
export const REQUIRED_SCOPES = [
  'https://graph.microsoft.com/Calendars.Read',
  'https://graph.microsoft.com/Calendars.ReadWrite',
  'https://graph.microsoft.com/User.Read',
] as const;

/**
 * Optional scopes for enhanced calendar functionality
 */
export const OPTIONAL_SCOPES = [
  'https://graph.microsoft.com/Calendars.Read.Shared',
  'https://graph.microsoft.com/Calendars.ReadWrite.Shared',
  'https://graph.microsoft.com/offline_access', // For refresh tokens
] as const;

/**
 * All available scopes for calendar integration
 */
export const ALL_CALENDAR_SCOPES = [...REQUIRED_SCOPES, ...OPTIONAL_SCOPES] as const;

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
  timeZone: 'UTC',
  maxResults: 50,
  orderBy: 'start' as const,
  showDeleted: false,
} as const;

/**
 * Calendar colors mapping (Microsoft Graph standard colors)
 */
export const CALENDAR_COLORS = {
  auto: 'auto',
  lightBlue: 'lightBlue',
  lightGreen: 'lightGreen',
  lightOrange: 'lightOrange',
  lightGray: 'lightGray',
  lightYellow: 'lightYellow',
  lightTeal: 'lightTeal',
  lightPink: 'lightPink',
  lightBrown: 'lightBrown',
  lightRed: 'lightRed',
  maxColor: 'maxColor',
} as const;

export type CalendarColor = keyof typeof CALENDAR_COLORS;
