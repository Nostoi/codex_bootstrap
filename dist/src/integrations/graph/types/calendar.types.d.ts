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
        response: 'none' | 'organizer' | 'tentativelyAccepted' | 'accepted' | 'declined' | 'notResponded';
        time?: string;
    };
    webLink?: string;
    lastModifiedDateTime?: string;
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
export interface EnhancedCalendarOptions extends CalendarListOptions {
    includeAttendees?: boolean;
    includeRecurrence?: boolean;
    expandRecurring?: boolean;
    categories?: string[];
    importance?: 'low' | 'normal' | 'high';
    sensitivity?: 'normal' | 'personal' | 'private' | 'confidential';
}
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
export interface MeetingInvitationResponse {
    id: string;
    status: 'sent' | 'failed';
    recipientCount: number;
    message?: string;
}
export interface CalendarPermission {
    id: string;
    emailAddress: {
        address: string;
        name?: string;
    };
    role: 'none' | 'freeBusyRead' | 'limitedRead' | 'read' | 'write' | 'delegateWithoutPrivateEventAccess' | 'delegateWithPrivateEventAccess' | 'custom';
    isRemovable: boolean;
    isInsideOrganization: boolean;
}
export interface AttendeeResponseStats {
    total: number;
    accepted: number;
    declined: number;
    tentative: number;
    noResponse: number;
    attendees: Array<{
        email: string;
        name?: string;
        response: 'none' | 'organizer' | 'tentativelyAccepted' | 'accepted' | 'declined' | 'notResponded';
        responseTime?: string;
    }>;
}
export declare const GRAPH_ENDPOINTS: {
    readonly ME: "/me";
    readonly CALENDARS: "/me/calendars";
    readonly DEFAULT_CALENDAR: "/me/calendar";
    readonly EVENTS: "/me/events";
    readonly CALENDAR_EVENTS: (calendarId: string) => string;
    readonly EVENT: (eventId: string) => string;
    readonly CALENDAR_EVENT: (calendarId: string, eventId: string) => string;
    readonly CALENDAR_PERMISSIONS: (calendarId: string) => string;
    readonly DEFAULT_CALENDAR_PERMISSIONS: "/me/calendar/calendarPermissions";
    readonly EVENT_FORWARD: (eventId: string) => string;
    readonly CALENDAR_EVENT_FORWARD: (calendarId: string, eventId: string) => string;
    readonly EVENT_INSTANCES: (eventId: string) => string;
    readonly CALENDAR_VIEW: "/me/calendarView";
    readonly BATCH: "/$batch";
    readonly GET_SCHEDULE: "/me/calendar/getSchedule";
    readonly FIND_MEETING_TIMES: "/me/findMeetingTimes";
};
export declare const REQUIRED_SCOPES: readonly ["https://graph.microsoft.com/Calendars.Read", "https://graph.microsoft.com/Calendars.ReadWrite", "https://graph.microsoft.com/User.Read"];
export declare const OPTIONAL_SCOPES: readonly ["https://graph.microsoft.com/Calendars.Read.Shared", "https://graph.microsoft.com/Calendars.ReadWrite.Shared", "https://graph.microsoft.com/offline_access"];
export declare const ALL_CALENDAR_SCOPES: readonly ["https://graph.microsoft.com/Calendars.Read", "https://graph.microsoft.com/Calendars.ReadWrite", "https://graph.microsoft.com/User.Read", "https://graph.microsoft.com/Calendars.Read.Shared", "https://graph.microsoft.com/Calendars.ReadWrite.Shared", "https://graph.microsoft.com/offline_access"];
export declare const DEFAULT_CONFIG: {
    readonly timeZone: "UTC";
    readonly maxResults: 50;
    readonly orderBy: "start";
    readonly showDeleted: false;
};
export declare const CALENDAR_COLORS: {
    readonly auto: "auto";
    readonly lightBlue: "lightBlue";
    readonly lightGreen: "lightGreen";
    readonly lightOrange: "lightOrange";
    readonly lightGray: "lightGray";
    readonly lightYellow: "lightYellow";
    readonly lightTeal: "lightTeal";
    readonly lightPink: "lightPink";
    readonly lightBrown: "lightBrown";
    readonly lightRed: "lightRed";
    readonly maxColor: "maxColor";
};
export type CalendarColor = keyof typeof CALENDAR_COLORS;
