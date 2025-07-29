import { GraphService } from "./graph.service";
import { CalendarEvent } from "./types/calendar.types";
export declare class GraphController {
    private readonly graphService;
    constructor(graphService: GraphService);
    getUserProfile(userId: string): Promise<any>;
    getOneDriveFiles(userId: string): Promise<any>;
    getTeams(userId: string): Promise<any>;
    configureIntegration(userId: string, config: {
        accessToken: string;
        refreshToken?: string;
        expiresAt?: string;
        scopes?: string[];
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        provider: string;
        accessToken: string | null;
        refreshToken: string | null;
        expiresAt: Date | null;
        scopes: string[];
    }>;
    createOneDriveFile(userId: string, fileData: {
        filename: string;
        content: string;
    }): Promise<any>;
    getCalendars(userId: string): Promise<any>;
    getCalendarEvents(userId: string, startTime?: string, endTime?: string, timeZone?: string, maxResults?: string, orderBy?: "start" | "lastModified"): Promise<any>;
    getCalendarEvent(userId: string, eventId: string): Promise<any>;
    createCalendarEvent(userId: string, event: CalendarEvent): Promise<any>;
    updateCalendarEvent(userId: string, eventId: string, updates: Partial<CalendarEvent>): Promise<any>;
    deleteCalendarEvent(userId: string, eventId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getCalendarEventsByCalendarId(userId: string, calendarId: string, startTime?: string, endTime?: string, timeZone?: string, maxResults?: string, orderBy?: "start" | "lastModified"): Promise<any>;
}
