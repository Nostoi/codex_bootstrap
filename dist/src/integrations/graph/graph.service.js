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
const graph_auth_service_1 = require("./auth/graph-auth.service");
const calendar_types_1 = require("./types/calendar.types");
let GraphService = GraphService_1 = class GraphService {
    constructor(prisma, graphAuthService) {
        this.prisma = prisma;
        this.graphAuthService = graphAuthService;
        this.logger = new common_1.Logger(GraphService_1.name);
    }
    async createGraphClient(userId) {
        try {
            const accessToken = await this.graphAuthService.getAccessToken(userId);
            return microsoft_graph_client_1.Client.init({
                authProvider: {
                    getAccessToken: async () => accessToken,
                },
            });
        }
        catch (error) {
            this.logger.error(`Failed to create Graph client for user ${userId}:`, error);
            throw error;
        }
    }
    async getUserProfile(userId) {
        try {
            const graphClient = await this.createGraphClient(userId);
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
            const graphClient = await this.createGraphClient(userId);
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
            const graphClient = await this.createGraphClient(userId);
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
            const graphClient = await this.createGraphClient(userId);
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
            const graphClient = await this.createGraphClient(userId);
            const calendars = await graphClient.api(calendar_types_1.GRAPH_ENDPOINTS.CALENDARS).get();
            return calendars;
        }
        catch (error) {
            this.logger.error("Error fetching calendars:", error);
            throw error;
        }
    }
    async getCalendarEvents(userId, calendarId = "primary", timeMin, timeMax, options = {}) {
        const startTime = performance.now();
        try {
            this.logger.debug(`Fetching calendar events for user ${userId}, calendar ${calendarId}`, {
                userId,
                calendarId,
                timeMin: timeMin?.toISOString(),
                timeMax: timeMax?.toISOString(),
                options,
            });
            const graphClient = await this.createGraphClient(userId);
            const queryParams = [];
            const startTimeFilter = timeMin || (options.startTime ? new Date(options.startTime) : new Date());
            const endTimeFilter = timeMax || (options.endTime ? new Date(options.endTime) : undefined);
            if (startTimeFilter) {
                queryParams.push(`start/dateTime ge '${startTimeFilter.toISOString()}'`);
            }
            if (endTimeFilter) {
                queryParams.push(`end/dateTime le '${endTimeFilter.toISOString()}'`);
            }
            if (queryParams.length > 0) {
                queryParams.unshift(`$filter=${queryParams.join(' and ')}`);
                queryParams.splice(1);
            }
            if (options.orderBy) {
                queryParams.push(`$orderby=${options.orderBy === 'start' ? 'start/dateTime' : 'lastModifiedDateTime'}`);
            }
            else {
                queryParams.push(`$orderby=start/dateTime`);
            }
            const maxResults = options.maxResults || calendar_types_1.DEFAULT_CONFIG.maxResults;
            queryParams.push(`$top=${maxResults}`);
            queryParams.push(`$select=id,subject,body,start,end,location,attendees,isAllDay,showAs,importance,sensitivity,categories,recurrence,organizer,responseStatus,webLink,lastModifiedDateTime`);
            const baseEndpoint = calendarId === "primary"
                ? calendar_types_1.GRAPH_ENDPOINTS.EVENTS
                : calendar_types_1.GRAPH_ENDPOINTS.CALENDAR_EVENTS(calendarId);
            const endpoint = `${baseEndpoint}?${queryParams.join('&')}`;
            const response = await graphClient.api(endpoint).get();
            const responseTime = performance.now() - startTime;
            const eventCount = response.value?.length || 0;
            this.logger.log(`Successfully fetched ${eventCount} calendar events for user ${userId} in ${responseTime.toFixed(2)}ms`, {
                userId,
                calendarId,
                eventCount,
                responseTimeMs: responseTime,
            });
            return {
                value: response.value || [],
                '@odata.nextLink': response['@odata.nextLink'],
                totalCount: eventCount,
            };
        }
        catch (error) {
            const responseTime = performance.now() - startTime;
            this.logger.error(`Error fetching Microsoft Graph calendar events for user ${userId}:`, {
                userId,
                calendarId,
                error: error.message,
                errorCode: error.code,
                responseTimeMs: responseTime,
            });
            if (error.code === 'Forbidden' || error.code === 'Unauthorized') {
                throw new Error(`Calendar access denied. Please check permissions for calendar: ${calendarId}`);
            }
            if (error.code === 'TooManyRequests' || error.code === 'ThrottledRequest') {
                throw new Error('Calendar API rate limit exceeded. Please try again later.');
            }
            if (error.code === 'NotFound') {
                throw new Error(`Calendar not found: ${calendarId}`);
            }
            throw error;
        }
    }
    async getCalendarEvent(userId, eventId) {
        try {
            const graphClient = await this.createGraphClient(userId);
            const event = await graphClient.api(calendar_types_1.GRAPH_ENDPOINTS.EVENT(eventId)).get();
            return event;
        }
        catch (error) {
            this.logger.error("Error fetching calendar event:", error);
            throw error;
        }
    }
    async createCalendarEvent(userId, eventData, calendarId = "primary") {
        const startTime = performance.now();
        try {
            this.logger.debug(`Creating calendar event for user ${userId}`, {
                userId,
                calendarId,
                subject: eventData.subject,
                startTime: eventData.start.dateTime,
                endTime: eventData.end.dateTime,
            });
            const graphClient = await this.createGraphClient(userId);
            const event = {
                subject: eventData.subject,
                body: {
                    contentType: eventData.body?.contentType || 'Text',
                    content: eventData.body?.content || '',
                },
                start: {
                    dateTime: eventData.start.dateTime,
                    timeZone: eventData.start.timeZone || calendar_types_1.DEFAULT_CONFIG.timeZone,
                },
                end: {
                    dateTime: eventData.end.dateTime,
                    timeZone: eventData.end.timeZone || calendar_types_1.DEFAULT_CONFIG.timeZone,
                },
                location: eventData.location,
                attendees: eventData.attendees?.map(attendee => ({
                    emailAddress: attendee.emailAddress,
                    type: attendee.type || 'required',
                })),
                isAllDay: eventData.isAllDay || false,
                showAs: eventData.showAs || 'busy',
                importance: eventData.importance || 'normal',
                sensitivity: eventData.sensitivity || 'normal',
                categories: eventData.categories || [],
                recurrence: eventData.recurrence,
            };
            const endpoint = calendarId === "primary"
                ? calendar_types_1.GRAPH_ENDPOINTS.EVENTS
                : calendar_types_1.GRAPH_ENDPOINTS.CALENDAR_EVENTS(calendarId);
            const createdEvent = await graphClient.api(endpoint).post(event);
            const responseTime = performance.now() - startTime;
            this.logger.log(`Successfully created calendar event for user ${userId} in ${responseTime.toFixed(2)}ms`, {
                userId,
                calendarId,
                eventId: createdEvent.id,
                subject: createdEvent.subject,
                responseTimeMs: responseTime,
            });
            return createdEvent;
        }
        catch (error) {
            const responseTime = performance.now() - startTime;
            this.logger.error(`Error creating calendar event for user ${userId}:`, {
                userId,
                calendarId,
                error: error.message,
                errorCode: error.code,
                responseTimeMs: responseTime,
            });
            if (error.code === 'Forbidden' || error.code === 'Unauthorized') {
                throw new Error('Calendar write access denied. Please check permissions.');
            }
            if (error.code === 'TooManyRequests' || error.code === 'ThrottledRequest') {
                throw new Error('Calendar API rate limit exceeded. Please try again later.');
            }
            if (error.code === 'BadRequest') {
                throw new Error(`Invalid event data: ${error.message}`);
            }
            throw error;
        }
    }
    async updateCalendarEvent(userId, eventId, updates) {
        try {
            const graphClient = await this.createGraphClient(userId);
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
            const graphClient = await this.createGraphClient(userId);
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
            const graphClient = await this.createGraphClient(userId);
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
    async batchCreateCalendarEvents(userId, events, calendarId = "primary") {
        const startTime = performance.now();
        try {
            this.logger.debug(`Batch creating ${events.length} calendar events for user ${userId}`, { userId, calendarId, eventCount: events.length });
            const graphClient = await this.createGraphClient(userId);
            const batchRequests = events.map((eventData, index) => {
                const event = {
                    subject: eventData.subject,
                    body: {
                        contentType: eventData.body?.contentType || 'Text',
                        content: eventData.body?.content || '',
                    },
                    start: {
                        dateTime: eventData.start.dateTime,
                        timeZone: eventData.start.timeZone || calendar_types_1.DEFAULT_CONFIG.timeZone,
                    },
                    end: {
                        dateTime: eventData.end.dateTime,
                        timeZone: eventData.end.timeZone || calendar_types_1.DEFAULT_CONFIG.timeZone,
                    },
                    location: eventData.location,
                    attendees: eventData.attendees?.map(attendee => ({
                        emailAddress: attendee.emailAddress,
                        type: attendee.type || 'required',
                    })),
                    isAllDay: eventData.isAllDay || false,
                    categories: eventData.categories || [],
                };
                return {
                    id: `${index + 1}`,
                    method: 'POST',
                    url: calendarId === "primary" ? '/me/events' : `/me/calendars/${calendarId}/events`,
                    body: event,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                };
            });
            const batchSize = 20;
            const results = [];
            for (let i = 0; i < batchRequests.length; i += batchSize) {
                const batch = batchRequests.slice(i, i + batchSize);
                const batchResponse = await graphClient.api('/$batch').post({
                    requests: batch,
                });
                results.push(...batchResponse.responses);
            }
            const responseTime = performance.now() - startTime;
            const successCount = results.filter(r => r.status >= 200 && r.status < 300).length;
            this.logger.log(`Batch created ${successCount}/${events.length} calendar events for user ${userId} in ${responseTime.toFixed(2)}ms`, {
                userId,
                calendarId,
                totalEvents: events.length,
                successCount,
                responseTimeMs: responseTime,
            });
            return {
                responses: results,
                successCount,
                totalCount: events.length,
            };
        }
        catch (error) {
            const responseTime = performance.now() - startTime;
            this.logger.error(`Error batch creating calendar events for user ${userId}:`, {
                userId,
                calendarId,
                eventCount: events.length,
                error: error.message,
                responseTimeMs: responseTime,
            });
            throw error;
        }
    }
    async sendMeetingInvitation(userId, eventId, message, calendarId = "primary") {
        try {
            this.logger.debug(`Sending meeting invitation for event ${eventId}`, { userId, eventId, calendarId });
            const graphClient = await this.createGraphClient(userId);
            const eventEndpoint = calendarId === "primary"
                ? calendar_types_1.GRAPH_ENDPOINTS.EVENT(eventId)
                : calendar_types_1.GRAPH_ENDPOINTS.CALENDAR_EVENT(calendarId, eventId);
            const event = await graphClient.api(eventEndpoint).get();
            if (!event.attendees || event.attendees.length === 0) {
                throw new Error('Cannot send invitation: no attendees specified');
            }
            const response = await graphClient
                .api(`${eventEndpoint}/forward`)
                .post({
                comment: message || 'Meeting invitation',
                toRecipients: event.attendees.map(attendee => ({
                    emailAddress: attendee.emailAddress,
                })),
            });
            this.logger.log(`Successfully sent meeting invitation for event ${eventId}`, { userId, eventId, calendarId, attendeeCount: event.attendees.length });
            return response;
        }
        catch (error) {
            this.logger.error(`Error sending meeting invitation for event ${eventId}:`, { userId, eventId, calendarId, error: error.message });
            throw error;
        }
    }
    async getCalendarPermissions(userId, calendarId = "primary") {
        try {
            this.logger.debug(`Getting calendar permissions for calendar ${calendarId}`, { userId, calendarId });
            const graphClient = await this.createGraphClient(userId);
            const endpoint = calendarId === "primary"
                ? '/me/calendar/calendarPermissions'
                : `/me/calendars/${calendarId}/calendarPermissions`;
            const permissions = await graphClient.api(endpoint).get();
            return permissions;
        }
        catch (error) {
            this.logger.error(`Error getting calendar permissions for calendar ${calendarId}:`, { userId, calendarId, error: error.message });
            if (error.code === 'NotFound' || error.code === 'BadRequest') {
                this.logger.warn('Calendar permissions endpoint not available, returning empty permissions');
                return { value: [] };
            }
            throw error;
        }
    }
    async shareCalendar(userId, recipientEmail, permission = 'read', calendarId = "primary") {
        try {
            this.logger.debug(`Sharing calendar ${calendarId} with ${recipientEmail}`, { userId, calendarId, recipientEmail, permission });
            const graphClient = await this.createGraphClient(userId);
            const endpoint = calendarId === "primary"
                ? '/me/calendar/calendarPermissions'
                : `/me/calendars/${calendarId}/calendarPermissions`;
            const permissionData = {
                emailAddress: {
                    address: recipientEmail,
                },
                isRemovable: true,
                isInsideOrganization: false,
                role: permission === 'read' ? 'limitedDetails' : permission === 'write' ? 'readWrite' : 'owner',
            };
            const result = await graphClient.api(endpoint).post(permissionData);
            this.logger.log(`Successfully shared calendar ${calendarId} with ${recipientEmail}`, { userId, calendarId, recipientEmail, permission });
            return result;
        }
        catch (error) {
            this.logger.error(`Error sharing calendar ${calendarId} with ${recipientEmail}:`, { userId, calendarId, recipientEmail, permission, error: error.message });
            throw error;
        }
    }
    async getEventAttendeeResponses(userId, eventId, calendarId = "primary") {
        try {
            this.logger.debug(`Getting attendee responses for event ${eventId}`, { userId, eventId, calendarId });
            const graphClient = await this.createGraphClient(userId);
            const eventEndpoint = calendarId === "primary"
                ? calendar_types_1.GRAPH_ENDPOINTS.EVENT(eventId)
                : calendar_types_1.GRAPH_ENDPOINTS.CALENDAR_EVENT(calendarId, eventId);
            const event = await graphClient
                .api(eventEndpoint)
                .select('attendees,organizer,subject')
                .get();
            const responseStats = {
                total: event.attendees?.length || 0,
                accepted: 0,
                declined: 0,
                tentative: 0,
                noResponse: 0,
                attendees: event.attendees?.map(attendee => ({
                    email: attendee.emailAddress.address,
                    name: attendee.emailAddress.name,
                    response: attendee.status?.response || 'none',
                    responseTime: attendee.status?.time,
                })) || [],
            };
            responseStats.attendees.forEach(attendee => {
                switch (attendee.response) {
                    case 'accepted':
                        responseStats.accepted++;
                        break;
                    case 'declined':
                        responseStats.declined++;
                        break;
                    case 'tentativelyAccepted':
                        responseStats.tentative++;
                        break;
                    default:
                        responseStats.noResponse++;
                }
            });
            return responseStats;
        }
        catch (error) {
            this.logger.error(`Error getting attendee responses for event ${eventId}:`, { userId, eventId, calendarId, error: error.message });
            throw error;
        }
    }
    async findMeetingTimes(userId, attendees, duration, timeConstraints) {
        try {
            this.logger.debug(`Finding meeting times for ${attendees.length} attendees`, { userId, attendees: attendees.length, duration });
            const graphClient = await this.createGraphClient(userId);
            const requestBody = {
                attendees: attendees.map(email => ({
                    emailAddress: { address: email }
                })),
                timeConstraint: {
                    timeslots: [{
                            start: {
                                dateTime: timeConstraints?.startTime || new Date().toISOString(),
                                timeZone: calendar_types_1.DEFAULT_CONFIG.timeZone,
                            },
                            end: {
                                dateTime: timeConstraints?.endTime || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                                timeZone: calendar_types_1.DEFAULT_CONFIG.timeZone,
                            }
                        }]
                },
                meetingDuration: `PT${duration}M`,
                maxCandidates: timeConstraints?.maxCandidates || 20,
            };
            const response = await graphClient
                .api(calendar_types_1.GRAPH_ENDPOINTS.FIND_MEETING_TIMES)
                .post(requestBody);
            this.logger.log(`Found ${response.meetingTimeSuggestions?.length || 0} meeting time suggestions`, { userId, attendees: attendees.length, duration });
            return response;
        }
        catch (error) {
            this.logger.error(`Error finding meeting times:`, { userId, attendees: attendees.length, duration, error: error.message });
            throw error;
        }
    }
    async getFreeBusyInfo(userId, attendees, startTime, endTime, intervalInMinutes = 30) {
        try {
            this.logger.debug(`Getting free/busy info for ${attendees.length} attendees`, { userId, attendees: attendees.length, startTime, endTime });
            const graphClient = await this.createGraphClient(userId);
            const requestBody = {
                schedules: attendees,
                startTime: {
                    dateTime: startTime,
                    timeZone: calendar_types_1.DEFAULT_CONFIG.timeZone,
                },
                endTime: {
                    dateTime: endTime,
                    timeZone: calendar_types_1.DEFAULT_CONFIG.timeZone,
                },
                availabilityViewInterval: intervalInMinutes,
            };
            const response = await graphClient
                .api(calendar_types_1.GRAPH_ENDPOINTS.GET_SCHEDULE)
                .post(requestBody);
            this.logger.log(`Retrieved free/busy info for ${response.value?.length || 0} attendees`, { userId, attendees: attendees.length });
            return response;
        }
        catch (error) {
            this.logger.error(`Error getting free/busy info:`, { userId, attendees: attendees.length, error: error.message });
            throw error;
        }
    }
    async getCalendarView(userId, startTime, endTime, options = {}) {
        try {
            this.logger.debug(`Getting calendar view from ${startTime} to ${endTime}`, { userId, startTime, endTime, options });
            const graphClient = await this.createGraphClient(userId);
            const queryParams = [];
            queryParams.push(`startDateTime=${encodeURIComponent(startTime)}`);
            queryParams.push(`endDateTime=${encodeURIComponent(endTime)}`);
            if (options.maxResults) {
                queryParams.push(`$top=${options.maxResults}`);
            }
            if (options.orderBy) {
                queryParams.push(`$orderby=${options.orderBy === 'start' ? 'start/dateTime' : 'lastModifiedDateTime'}`);
            }
            const selectFields = [
                'id', 'subject', 'start', 'end', 'location', 'isAllDay', 'showAs',
                'importance', 'sensitivity', 'categories', 'organizer'
            ];
            if (options.includeAttendees) {
                selectFields.push('attendees');
            }
            if (options.includeRecurrence) {
                selectFields.push('recurrence');
            }
            queryParams.push(`$select=${selectFields.join(',')}`);
            const endpoint = `${calendar_types_1.GRAPH_ENDPOINTS.CALENDAR_VIEW}?${queryParams.join('&')}`;
            const response = await graphClient.api(endpoint).get();
            this.logger.log(`Retrieved ${response.value?.length || 0} events from calendar view`, { userId, startTime, endTime, eventCount: response.value?.length || 0 });
            return response;
        }
        catch (error) {
            this.logger.error(`Error getting calendar view:`, { userId, startTime, endTime, error: error.message });
            throw error;
        }
    }
};
exports.GraphService = GraphService;
exports.GraphService = GraphService = GraphService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        graph_auth_service_1.GraphAuthService])
], GraphService);
//# sourceMappingURL=graph.service.js.map