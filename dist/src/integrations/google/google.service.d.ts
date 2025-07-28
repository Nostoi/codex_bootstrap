import { PrismaService } from '../../prisma/prisma.service';
export declare class GoogleService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private createOAuth2Client;
    getDriveFiles(userId: string, folderId?: string): Promise<import("googleapis").drive_v3.Schema$FileList>;
    createDriveFile(userId: string, filename: string, content: string, mimeType?: string): Promise<import("googleapis").drive_v3.Schema$File>;
    getSheetData(userId: string, spreadsheetId: string, range: string): Promise<import("googleapis").sheets_v4.Schema$ValueRange>;
    createSheet(userId: string, title: string): Promise<import("googleapis").sheets_v4.Schema$Spreadsheet>;
    getCalendarEvents(userId: string, calendarId?: string): Promise<import("googleapis").calendar_v3.Schema$Events>;
    createCalendarEvent(userId: string, eventData: {
        summary: string;
        description?: string;
        start: {
            dateTime: string;
            timeZone?: string;
        };
        end: {
            dateTime: string;
            timeZone?: string;
        };
        attendees?: {
            email: string;
        }[];
    }, calendarId?: string): Promise<import("googleapis").calendar_v3.Schema$Event>;
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
}
