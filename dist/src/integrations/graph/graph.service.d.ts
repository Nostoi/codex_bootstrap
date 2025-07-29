import { PrismaService } from "../../prisma/prisma.service";
import { CalendarEvent, CalendarListOptions } from "./types/calendar.types";
export declare class GraphService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
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
        provider: string;
        accessToken: string | null;
        refreshToken: string | null;
        expiresAt: Date | null;
        scopes: string[];
    }>;
    getCalendars(userId: string): Promise<any>;
    getCalendarEvents(userId: string, options?: CalendarListOptions): Promise<any>;
    getCalendarEvent(userId: string, eventId: string): Promise<any>;
    createCalendarEvent(userId: string, event: CalendarEvent): Promise<any>;
    updateCalendarEvent(userId: string, eventId: string, updates: Partial<CalendarEvent>): Promise<any>;
    deleteCalendarEvent(userId: string, eventId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getCalendarEventsByCalendarId(userId: string, calendarId: string, options?: CalendarListOptions): Promise<any>;
}
