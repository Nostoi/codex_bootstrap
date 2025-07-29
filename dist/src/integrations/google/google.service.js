"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var GoogleService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleService = void 0;
const common_1 = require("@nestjs/common");
const googleapis_1 = require("googleapis");
const prisma_service_1 = require("../../prisma/prisma.service");
let GoogleService = GoogleService_1 = class GoogleService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(GoogleService_1.name);
    }
    async createOAuth2Client(userId) {
        const config = await this.prisma.integrationConfig.findUnique({
            where: {
                provider_userId: {
                    provider: "google",
                    userId,
                },
            },
        });
        if (!config?.accessToken) {
            throw new Error("Google integration not configured for user");
        }
        const oauth2Client = new googleapis_1.google.auth.OAuth2();
        oauth2Client.setCredentials({
            access_token: config.accessToken,
            refresh_token: config.refreshToken,
        });
        return oauth2Client;
    }
    async getDriveFiles(userId, folderId) {
        try {
            const auth = await this.createOAuth2Client(userId);
            const drive = googleapis_1.google.drive({ version: "v3", auth });
            const params = {
                pageSize: 50,
                fields: "nextPageToken, files(id, name, mimeType, createdTime, modifiedTime, size)",
            };
            if (folderId) {
                params.q = `'${folderId}' in parents`;
            }
            const response = await drive.files.list(params);
            return response.data;
        }
        catch (error) {
            this.logger.error("Error fetching Google Drive files:", error);
            throw error;
        }
    }
    async createDriveFile(userId, filename, content, mimeType = "text/plain") {
        try {
            const auth = await this.createOAuth2Client(userId);
            const drive = googleapis_1.google.drive({ version: "v3", auth });
            const response = await drive.files.create({
                requestBody: {
                    name: filename,
                },
                media: {
                    mimeType,
                    body: content,
                },
                fields: "id, name, mimeType, createdTime",
            });
            return response.data;
        }
        catch (error) {
            this.logger.error("Error creating Google Drive file:", error);
            throw error;
        }
    }
    async getSheetData(userId, spreadsheetId, range) {
        try {
            const auth = await this.createOAuth2Client(userId);
            const sheets = googleapis_1.google.sheets({ version: "v4", auth });
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range,
            });
            return response.data;
        }
        catch (error) {
            this.logger.error("Error fetching Google Sheets data:", error);
            throw error;
        }
    }
    async createSheet(userId, title) {
        try {
            const auth = await this.createOAuth2Client(userId);
            const sheets = googleapis_1.google.sheets({ version: "v4", auth });
            const response = await sheets.spreadsheets.create({
                requestBody: {
                    properties: {
                        title,
                    },
                },
                fields: "spreadsheetId, properties(title)",
            });
            return response.data;
        }
        catch (error) {
            this.logger.error("Error creating Google Sheet:", error);
            throw error;
        }
    }
    async getCalendarEvents(userId, calendarId = "primary", timeMin, timeMax) {
        const startTime = performance.now();
        try {
            this.logger.debug(`Fetching calendar events for user ${userId}, calendar ${calendarId}`, {
                userId,
                calendarId,
                timeMin: timeMin?.toISOString(),
                timeMax: timeMax?.toISOString(),
            });
            const auth = await this.createOAuth2Client(userId);
            const calendar = googleapis_1.google.calendar({ version: "v3", auth });
            const response = await calendar.events.list({
                calendarId,
                timeMin: (timeMin || new Date()).toISOString(),
                timeMax: timeMax?.toISOString(),
                maxResults: 50,
                singleEvents: true,
                orderBy: "startTime",
            });
            const responseTime = performance.now() - startTime;
            const eventCount = response.data.items?.length || 0;
            this.logger.log(`Successfully fetched ${eventCount} calendar events for user ${userId} in ${responseTime.toFixed(2)}ms`, {
                userId,
                calendarId,
                eventCount,
                responseTimeMs: responseTime,
            });
            return response.data;
        }
        catch (error) {
            const responseTime = performance.now() - startTime;
            this.logger.error(`Error fetching Google Calendar events for user ${userId}:`, {
                userId,
                calendarId,
                error: error.message,
                errorCode: error.response?.status,
                responseTimeMs: responseTime,
            });
            if (error.response?.status === 401) {
                this.logger.warn(`Authentication token expired for user ${userId}, attempting refresh`, { userId });
                try {
                    await this.refreshAccessToken(userId);
                    this.logger.log(`Token refresh successful for user ${userId}, retrying calendar request`, { userId });
                    return this.getCalendarEvents(userId, calendarId, timeMin, timeMax);
                }
                catch (refreshError) {
                    this.logger.error(`Token refresh failed for user ${userId}:`, {
                        userId,
                        refreshError: refreshError.message,
                    });
                    throw new Error(`Google Calendar authentication failed: ${refreshError.message}`);
                }
            }
            if (error.response?.status === 403) {
                throw new Error('Insufficient permissions to access Google Calendar. Please re-authorize the application.');
            }
            if (error.response?.status === 429) {
                throw new Error('Google Calendar API rate limit exceeded. Please try again later.');
            }
            throw error;
        }
    }
    async refreshAccessToken(userId) {
        try {
            const config = await this.prisma.integrationConfig.findUnique({
                where: {
                    provider_userId: {
                        provider: "google",
                        userId,
                    },
                },
            });
            if (!config?.refreshToken) {
                throw new Error("No refresh token available for user");
            }
            const oauth2Client = new googleapis_1.google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
            oauth2Client.setCredentials({
                refresh_token: config.refreshToken,
            });
            const { credentials } = await oauth2Client.refreshAccessToken();
            if (!credentials.access_token) {
                throw new Error("Failed to obtain new access token");
            }
            await this.prisma.integrationConfig.update({
                where: {
                    provider_userId: {
                        provider: "google",
                        userId,
                    },
                },
                data: {
                    accessToken: credentials.access_token,
                    updatedAt: new Date(),
                },
            });
            this.logger.log(`Access token refreshed successfully for user ${userId}`, { userId });
        }
        catch (error) {
            this.logger.error(`Failed to refresh access token for user ${userId}: ${error.message}`, { userId, error: error.message });
            throw error;
        }
    }
    async createCalendarEvent(userId, eventData, calendarId = "primary") {
        try {
            const auth = await this.createOAuth2Client(userId);
            const calendar = googleapis_1.google.calendar({ version: "v3", auth });
            const response = await calendar.events.insert({
                calendarId,
                requestBody: eventData,
            });
            return response.data;
        }
        catch (error) {
            this.logger.error("Error creating Google Calendar event:", error);
            throw error;
        }
    }
    async saveIntegrationConfig(userId, accessToken, refreshToken, expiresAt, scopes) {
        return this.prisma.integrationConfig.upsert({
            where: {
                provider_userId: {
                    provider: "google",
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
                provider: "google",
                userId,
                accessToken,
                refreshToken,
                expiresAt,
                scopes: scopes || [],
            },
        });
    }
};
exports.GoogleService = GoogleService;
exports.GoogleService = GoogleService = GoogleService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GoogleService);
//# sourceMappingURL=google.service.js.map