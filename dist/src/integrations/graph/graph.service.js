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
var GraphService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphService = void 0;
const common_1 = require("@nestjs/common");
const microsoft_graph_client_1 = require("@microsoft/microsoft-graph-client");
const prisma_service_1 = require("../../prisma/prisma.service");
const calendar_types_1 = require("./types/calendar.types");
let GraphService = GraphService_1 = class GraphService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(GraphService_1.name);
    }
    createGraphClient(accessToken) {
        return microsoft_graph_client_1.Client.init({
            authProvider: {
                getAccessToken: async () => accessToken,
            },
        });
    }
    async getUserProfile(userId) {
        try {
            const config = await this.prisma.integrationConfig.findUnique({
                where: {
                    provider_userId: {
                        provider: "microsoft",
                        userId,
                    },
                },
            });
            if (!config?.accessToken) {
                throw new Error("Microsoft integration not configured for user");
            }
            const graphClient = this.createGraphClient(config.accessToken);
            const profile = await graphClient.api("/me").get();
            return profile;
        }
        catch (error) {
            this.logger.error("Error fetching Microsoft Graph profile:", error);
            throw error;
        }
    }
    async getOneDriveFiles(userId, folderId) {
        try {
            const config = await this.prisma.integrationConfig.findUnique({
                where: {
                    provider_userId: {
                        provider: "microsoft",
                        userId,
                    },
                },
            });
            if (!config?.accessToken) {
                throw new Error("Microsoft integration not configured for user");
            }
            const graphClient = this.createGraphClient(config.accessToken);
            const endpoint = folderId
                ? `/me/drive/items/${folderId}/children`
                : "/me/drive/root/children";
            const files = await graphClient.api(endpoint).get();
            return files;
        }
        catch (error) {
            this.logger.error("Error fetching OneDrive files:", error);
            throw error;
        }
    }
    async createOneDriveFile(userId, filename, content) {
        try {
            const config = await this.prisma.integrationConfig.findUnique({
                where: {
                    provider_userId: {
                        provider: "microsoft",
                        userId,
                    },
                },
            });
            if (!config?.accessToken) {
                throw new Error("Microsoft integration not configured for user");
            }
            const graphClient = this.createGraphClient(config.accessToken);
            const file = await graphClient
                .api(`/me/drive/root:/${filename}:/content`)
                .put(content);
            return file;
        }
        catch (error) {
            this.logger.error("Error creating OneDrive file:", error);
            throw error;
        }
    }
    async getTeams(userId) {
        try {
            const config = await this.prisma.integrationConfig.findUnique({
                where: {
                    provider_userId: {
                        provider: "microsoft",
                        userId,
                    },
                },
            });
            if (!config?.accessToken) {
                throw new Error("Microsoft integration not configured for user");
            }
            const graphClient = this.createGraphClient(config.accessToken);
            const teams = await graphClient.api("/me/joinedTeams").get();
            return teams;
        }
        catch (error) {
            this.logger.error("Error fetching Teams:", error);
            throw error;
        }
    }
    async saveIntegrationConfig(userId, accessToken, refreshToken, expiresAt, scopes) {
        return this.prisma.integrationConfig.upsert({
            where: {
                provider_userId: {
                    provider: "microsoft",
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
                provider: "microsoft",
                userId,
                accessToken,
                refreshToken,
                expiresAt,
                scopes: scopes || [],
            },
        });
    }
    async getCalendars(userId) {
        try {
            const config = await this.prisma.integrationConfig.findUnique({
                where: {
                    provider_userId: {
                        provider: "microsoft",
                        userId,
                    },
                },
            });
            if (!config?.accessToken) {
                throw new Error("Microsoft integration not configured for user");
            }
            const graphClient = this.createGraphClient(config.accessToken);
            const calendars = await graphClient.api(calendar_types_1.GRAPH_ENDPOINTS.CALENDARS).get();
            return calendars;
        }
        catch (error) {
            this.logger.error("Error fetching calendars:", error);
            throw error;
        }
    }
    async getCalendarEvents(userId, options = {}) {
        try {
            const config = await this.prisma.integrationConfig.findUnique({
                where: {
                    provider_userId: {
                        provider: "microsoft",
                        userId,
                    },
                },
            });
            if (!config?.accessToken) {
                throw new Error("Microsoft integration not configured for user");
            }
            const graphClient = this.createGraphClient(config.accessToken);
            const queryParams = [];
            if (options.startTime && options.endTime) {
                queryParams.push(`$filter=start/dateTime ge '${options.startTime}' and end/dateTime le '${options.endTime}'`);
            }
            if (options.orderBy) {
                queryParams.push(`$orderby=${options.orderBy === 'start' ? 'start/dateTime' : 'lastModifiedDateTime'}`);
            }
            if (options.maxResults) {
                queryParams.push(`$top=${options.maxResults}`);
            }
            const endpoint = queryParams.length > 0
                ? `${calendar_types_1.GRAPH_ENDPOINTS.EVENTS}?${queryParams.join('&')}`
                : calendar_types_1.GRAPH_ENDPOINTS.EVENTS;
            const events = await graphClient.api(endpoint).get();
            return events;
        }
        catch (error) {
            this.logger.error("Error fetching calendar events:", error);
            throw error;
        }
    }
    async getCalendarEvent(userId, eventId) {
        try {
            const config = await this.prisma.integrationConfig.findUnique({
                where: {
                    provider_userId: {
                        provider: "microsoft",
                        userId,
                    },
                },
            });
            if (!config?.accessToken) {
                throw new Error("Microsoft integration not configured for user");
            }
            const graphClient = this.createGraphClient(config.accessToken);
            const event = await graphClient.api(calendar_types_1.GRAPH_ENDPOINTS.EVENT(eventId)).get();
            return event;
        }
        catch (error) {
            this.logger.error("Error fetching calendar event:", error);
            throw error;
        }
    }
    async createCalendarEvent(userId, event) {
        try {
            const config = await this.prisma.integrationConfig.findUnique({
                where: {
                    provider_userId: {
                        provider: "microsoft",
                        userId,
                    },
                },
            });
            if (!config?.accessToken) {
                throw new Error("Microsoft integration not configured for user");
            }
            const graphClient = this.createGraphClient(config.accessToken);
            const eventData = {
                ...event,
                start: {
                    ...event.start,
                    timeZone: event.start.timeZone || calendar_types_1.DEFAULT_CONFIG.timeZone,
                },
                end: {
                    ...event.end,
                    timeZone: event.end.timeZone || calendar_types_1.DEFAULT_CONFIG.timeZone,
                },
            };
            const createdEvent = await graphClient
                .api(calendar_types_1.GRAPH_ENDPOINTS.EVENTS)
                .post(eventData);
            return createdEvent;
        }
        catch (error) {
            this.logger.error("Error creating calendar event:", error);
            throw error;
        }
    }
    async updateCalendarEvent(userId, eventId, updates) {
        try {
            const config = await this.prisma.integrationConfig.findUnique({
                where: {
                    provider_userId: {
                        provider: "microsoft",
                        userId,
                    },
                },
            });
            if (!config?.accessToken) {
                throw new Error("Microsoft integration not configured for user");
            }
            const graphClient = this.createGraphClient(config.accessToken);
            const updatedEvent = await graphClient
                .api(calendar_types_1.GRAPH_ENDPOINTS.EVENT(eventId))
                .patch(updates);
            return updatedEvent;
        }
        catch (error) {
            this.logger.error("Error updating calendar event:", error);
            throw error;
        }
    }
    async deleteCalendarEvent(userId, eventId) {
        try {
            const config = await this.prisma.integrationConfig.findUnique({
                where: {
                    provider_userId: {
                        provider: "microsoft",
                        userId,
                    },
                },
            });
            if (!config?.accessToken) {
                throw new Error("Microsoft integration not configured for user");
            }
            const graphClient = this.createGraphClient(config.accessToken);
            await graphClient.api(calendar_types_1.GRAPH_ENDPOINTS.EVENT(eventId)).delete();
            return { success: true, message: "Event deleted successfully" };
        }
        catch (error) {
            this.logger.error("Error deleting calendar event:", error);
            throw error;
        }
    }
    async getCalendarEventsByCalendarId(userId, calendarId, options = {}) {
        try {
            const config = await this.prisma.integrationConfig.findUnique({
                where: {
                    provider_userId: {
                        provider: "microsoft",
                        userId,
                    },
                },
            });
            if (!config?.accessToken) {
                throw new Error("Microsoft integration not configured for user");
            }
            const graphClient = this.createGraphClient(config.accessToken);
            const queryParams = [];
            if (options.startTime && options.endTime) {
                queryParams.push(`$filter=start/dateTime ge '${options.startTime}' and end/dateTime le '${options.endTime}'`);
            }
            if (options.orderBy) {
                queryParams.push(`$orderby=${options.orderBy === 'start' ? 'start/dateTime' : 'lastModifiedDateTime'}`);
            }
            if (options.maxResults) {
                queryParams.push(`$top=${options.maxResults}`);
            }
            const endpoint = queryParams.length > 0
                ? `${calendar_types_1.GRAPH_ENDPOINTS.CALENDAR_EVENTS(calendarId)}?${queryParams.join('&')}`
                : calendar_types_1.GRAPH_ENDPOINTS.CALENDAR_EVENTS(calendarId);
            const events = await graphClient.api(endpoint).get();
            return events;
        }
        catch (error) {
            this.logger.error("Error fetching calendar events by calendar ID:", error);
            throw error;
        }
    }
};
exports.GraphService = GraphService;
exports.GraphService = GraphService = GraphService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GraphService);
//# sourceMappingURL=graph.service.js.map