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
                    provider: 'google',
                    userId,
                },
            },
        });
        if (!config?.accessToken) {
            throw new Error('Google integration not configured for user');
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
            const drive = googleapis_1.google.drive({ version: 'v3', auth });
            const params = {
                pageSize: 50,
                fields: 'nextPageToken, files(id, name, mimeType, createdTime, modifiedTime, size)',
            };
            if (folderId) {
                params.q = `'${folderId}' in parents`;
            }
            const response = await drive.files.list(params);
            return response.data;
        }
        catch (error) {
            this.logger.error('Error fetching Google Drive files:', error);
            throw error;
        }
    }
    async createDriveFile(userId, filename, content, mimeType = 'text/plain') {
        try {
            const auth = await this.createOAuth2Client(userId);
            const drive = googleapis_1.google.drive({ version: 'v3', auth });
            const response = await drive.files.create({
                requestBody: {
                    name: filename,
                },
                media: {
                    mimeType,
                    body: content,
                },
                fields: 'id, name, mimeType, createdTime',
            });
            return response.data;
        }
        catch (error) {
            this.logger.error('Error creating Google Drive file:', error);
            throw error;
        }
    }
    async getSheetData(userId, spreadsheetId, range) {
        try {
            const auth = await this.createOAuth2Client(userId);
            const sheets = googleapis_1.google.sheets({ version: 'v4', auth });
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range,
            });
            return response.data;
        }
        catch (error) {
            this.logger.error('Error fetching Google Sheets data:', error);
            throw error;
        }
    }
    async createSheet(userId, title) {
        try {
            const auth = await this.createOAuth2Client(userId);
            const sheets = googleapis_1.google.sheets({ version: 'v4', auth });
            const response = await sheets.spreadsheets.create({
                requestBody: {
                    properties: {
                        title,
                    },
                },
                fields: 'spreadsheetId, properties(title)',
            });
            return response.data;
        }
        catch (error) {
            this.logger.error('Error creating Google Sheet:', error);
            throw error;
        }
    }
    async getCalendarEvents(userId, calendarId = 'primary') {
        try {
            const auth = await this.createOAuth2Client(userId);
            const calendar = googleapis_1.google.calendar({ version: 'v3', auth });
            const response = await calendar.events.list({
                calendarId,
                timeMin: new Date().toISOString(),
                maxResults: 50,
                singleEvents: true,
                orderBy: 'startTime',
            });
            return response.data;
        }
        catch (error) {
            this.logger.error('Error fetching Google Calendar events:', error);
            throw error;
        }
    }
    async createCalendarEvent(userId, eventData, calendarId = 'primary') {
        try {
            const auth = await this.createOAuth2Client(userId);
            const calendar = googleapis_1.google.calendar({ version: 'v3', auth });
            const response = await calendar.events.insert({
                calendarId,
                requestBody: eventData,
            });
            return response.data;
        }
        catch (error) {
            this.logger.error('Error creating Google Calendar event:', error);
            throw error;
        }
    }
    async saveIntegrationConfig(userId, accessToken, refreshToken, expiresAt, scopes) {
        return this.prisma.integrationConfig.upsert({
            where: {
                provider_userId: {
                    provider: 'google',
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
                provider: 'google',
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