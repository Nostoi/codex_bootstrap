import { PrismaService } from "../../prisma/prisma.service";
import { GraphAuthService } from "./auth/graph-auth.service";
import { CalendarEvent, CalendarListOptions, EnhancedCalendarOptions, AttendeeResponseStats } from "./types/calendar.types";
export declare class GraphService {
    private prisma;
    private graphAuthService;
    private readonly logger;
    constructor(prisma: PrismaService, graphAuthService: GraphAuthService);
    private createGraphClient;
    getUserProfile(userId: string): Promise<any>;
    getOneDriveFiles(userId: string, folderId?: string): Promise<any>;
    createOneDriveFile(userId: string, filename: string, content: string): Promise<any>;
    getTeams(userId: string): Promise<any>;
    saveIntegrationConfig(userId: string, accessToken: string, refreshToken?: string, expiresAt?: Date, scopes?: string[]): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        scopes: string[];
        provider: string;
        accessToken: string | null;
        refreshToken: string | null;
        expiresAt: Date | null;
    }>;
    getCalendars(userId: string): Promise<any>;
    getCalendarEvents(userId: string, calendarId?: string, timeMin?: Date, timeMax?: Date, options?: CalendarListOptions): Promise<{
        value: any;
        '@odata.nextLink': any;
        totalCount: any;
    }>;
    getCalendarEvent(userId: string, eventId: string): Promise<any>;
    createCalendarEvent(userId: string, eventData: {
        subject: string;
        body?: {
            contentType?: 'HTML' | 'Text';
            content?: string;
        };
        start: {
            dateTime: string;
            timeZone?: string;
        };
        end: {
            dateTime: string;
            timeZone?: string;
        };
        location?: {
            displayName: string;
        };
        attendees?: Array<{
            emailAddress: {
                address: string;
                name?: string;
            };
            type?: 'required' | 'optional' | 'resource';
        }>;
        isAllDay?: boolean;
        showAs?: 'free' | 'tentative' | 'busy' | 'oof' | 'workingElsewhere';
        importance?: 'low' | 'normal' | 'high';
        sensitivity?: 'normal' | 'personal' | 'private' | 'confidential';
        categories?: string[];
        recurrence?: any;
    }, calendarId?: string): Promise<any>;
    updateCalendarEvent(userId: string, eventId: string, updates: Partial<CalendarEvent>): Promise<any>;
    deleteCalendarEvent(userId: string, eventId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getCalendarEventsByCalendarId(userId: string, calendarId: string, options?: CalendarListOptions): Promise<any>;
    batchCreateCalendarEvents(userId: string, events: Array<{
        subject: string;
        body?: {
            contentType?: 'HTML' | 'Text';
            content?: string;
        };
        start: {
            dateTime: string;
            timeZone?: string;
        };
        end: {
            dateTime: string;
            timeZone?: string;
        };
        location?: {
            displayName: string;
        };
        attendees?: Array<{
            emailAddress: {
                address: string;
                name?: string;
            };
            type?: 'required' | 'optional' | 'resource';
        }>;
        isAllDay?: boolean;
        categories?: string[];
    }>, calendarId?: string): Promise<{
        responses: any[];
        successCount: number;
        totalCount: number;
    }>;
    sendMeetingInvitation(userId: string, eventId: string, message?: string, calendarId?: string): Promise<any>;
    getCalendarPermissions(userId: string, calendarId?: string): Promise<any>;
    shareCalendar(userId: string, recipientEmail: string, permission?: 'read' | 'write' | 'owner', calendarId?: string): Promise<any>;
    getEventAttendeeResponses(userId: string, eventId: string, calendarId?: string): Promise<AttendeeResponseStats>;
    findMeetingTimes(userId: string, attendees: string[], duration: number, timeConstraints?: {
        startTime?: string;
        endTime?: string;
        maxCandidates?: number;
    }): Promise<any>;
    getFreeBusyInfo(userId: string, attendees: string[], startTime: string, endTime: string, intervalInMinutes?: number): Promise<any>;
    getCalendarView(userId: string, startTime: string, endTime: string, options?: EnhancedCalendarOptions): Promise<any>;
}
