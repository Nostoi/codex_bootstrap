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
  showAs?: 'free' | 'tentative' | 'busy' | 'oof' | 'workingElsewhere';
  importance?: 'low' | 'normal' | 'high';
  sensitivity?: 'normal' | 'personal' | 'private' | 'confidential';
  categories?: string[];
  organizer?: {
    emailAddress: {
      address: string;
      name?: string;
    };
  };
  responseStatus?: {
    response:
      | 'none'
      | 'organizer'
      | 'tentativelyAccepted'
      | 'accepted'
      | 'declined'
      | 'notResponded';
    time?: string;
  };
  webLink?: string;
  lastModifiedDateTime?: string;
  recurrence?: {
    pattern: {
      type:
        | 'daily'
        | 'weekly'
        | 'absoluteMonthly'
        | 'relativeMonthly'
        | 'absoluteYearly'
        | 'relativeYearly';
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
 * Enhanced options for calendar event operations
 */
export interface EnhancedCalendarOptions extends CalendarListOptions {
  includeAttendees?: boolean;
  includeRecurrence?: boolean;
  expandRecurring?: boolean;
  categories?: string[];
  importance?: 'low' | 'normal' | 'high';
  sensitivity?: 'normal' | 'personal' | 'private' | 'confidential';
}

/**
 * Batch operation response interface
 */
export interface BatchResponse {
  responses: Array<{
    id: string;
    status: number;
    body: any;
    headers?: Record<string, string>;
  }>;
  successCount: number;
  totalCount: number;
}

/**
 * Meeting invitation response interface
 */
export interface MeetingInvitationResponse {
  id: string;
  status: 'sent' | 'failed';
  recipientCount: number;
  message?: string;
}

/**
 * Calendar permission interface
 */
export interface CalendarPermission {
  id: string;
  emailAddress: {
    address: string;
    name?: string;
  };
  role:
    | 'none'
    | 'freeBusyRead'
    | 'limitedRead'
    | 'read'
    | 'write'
    | 'delegateWithoutPrivateEventAccess'
    | 'delegateWithPrivateEventAccess'
    | 'custom';
  isRemovable: boolean;
  isInsideOrganization: boolean;
}

/**
 * Attendee response statistics
 */
export interface AttendeeResponseStats {
  total: number;
  accepted: number;
  declined: number;
  tentative: number;
  noResponse: number;
  attendees: Array<{
    email: string;
    name?: string;
    response:
      | 'none'
      | 'organizer'
      | 'tentativelyAccepted'
      | 'accepted'
      | 'declined'
      | 'notResponded';
    responseTime?: string;
  }>;
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

  // Enhanced endpoints for advanced functionality
  CALENDAR_PERMISSIONS: (calendarId: string) => `/me/calendars/${calendarId}/calendarPermissions`,
  DEFAULT_CALENDAR_PERMISSIONS: '/me/calendar/calendarPermissions',
  EVENT_FORWARD: (eventId: string) => `/me/events/${eventId}/forward`,
  CALENDAR_EVENT_FORWARD: (calendarId: string, eventId: string) =>
    `/me/calendars/${calendarId}/events/${eventId}/forward`,
  EVENT_INSTANCES: (eventId: string) => `/me/events/${eventId}/instances`,
  CALENDAR_VIEW: '/me/calendarView',
  BATCH: '/$batch',

  // Free/Busy and availability endpoints
  GET_SCHEDULE: '/me/calendar/getSchedule',
  FIND_MEETING_TIMES: '/me/findMeetingTimes',
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
