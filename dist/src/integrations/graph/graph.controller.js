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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphController = void 0;
const common_1 = require("@nestjs/common");
const graph_service_1 = require("./graph.service");
const swagger_1 = require("@nestjs/swagger");
let GraphController = class GraphController {
    constructor(graphService) {
        this.graphService = graphService;
    }
    getUserProfile(userId) {
        return this.graphService.getUserProfile(userId);
    }
    getOneDriveFiles(userId) {
        return this.graphService.getOneDriveFiles(userId);
    }
    getTeams(userId) {
        return this.graphService.getTeams(userId);
    }
    configureIntegration(userId, config) {
        const expiresAt = config.expiresAt ? new Date(config.expiresAt) : undefined;
        return this.graphService.saveIntegrationConfig(userId, config.accessToken, config.refreshToken, expiresAt, config.scopes);
    }
    createOneDriveFile(userId, fileData) {
        return this.graphService.createOneDriveFile(userId, fileData.filename, fileData.content);
    }
    getCalendars(userId) {
        return this.graphService.getCalendars(userId);
    }
    getCalendarEvents(userId, startTime, endTime, timeZone, maxResults, orderBy) {
        const options = {
            startTime,
            endTime,
            timeZone,
            maxResults: maxResults ? parseInt(maxResults, 10) : undefined,
            orderBy,
        };
        return this.graphService.getCalendarEvents(userId, options);
    }
    getCalendarEvent(userId, eventId) {
        return this.graphService.getCalendarEvent(userId, eventId);
    }
    createCalendarEvent(userId, event) {
        return this.graphService.createCalendarEvent(userId, event);
    }
    updateCalendarEvent(userId, eventId, updates) {
        return this.graphService.updateCalendarEvent(userId, eventId, updates);
    }
    deleteCalendarEvent(userId, eventId) {
        return this.graphService.deleteCalendarEvent(userId, eventId);
    }
    getCalendarEventsByCalendarId(userId, calendarId, startTime, endTime, timeZone, maxResults, orderBy) {
        const options = {
            startTime,
            endTime,
            timeZone,
            maxResults: maxResults ? parseInt(maxResults, 10) : undefined,
            orderBy,
        };
        return this.graphService.getCalendarEventsByCalendarId(userId, calendarId, options);
    }
};
exports.GraphController = GraphController;
__decorate([
    (0, common_1.Get)("profile/:userId"),
    (0, swagger_1.ApiOperation)({ summary: "Get Microsoft Graph user profile" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "User profile retrieved" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Integration not configured" }),
    __param(0, (0, common_1.Param)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GraphController.prototype, "getUserProfile", null);
__decorate([
    (0, common_1.Get)("onedrive/:userId"),
    (0, swagger_1.ApiOperation)({ summary: "Get OneDrive files" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "OneDrive files retrieved" }),
    __param(0, (0, common_1.Param)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GraphController.prototype, "getOneDriveFiles", null);
__decorate([
    (0, common_1.Get)("teams/:userId"),
    (0, swagger_1.ApiOperation)({ summary: "Get user Teams" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Teams retrieved" }),
    __param(0, (0, common_1.Param)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GraphController.prototype, "getTeams", null);
__decorate([
    (0, common_1.Post)("configure/:userId"),
    (0, swagger_1.ApiOperation)({ summary: "Configure Microsoft integration" }),
    (0, swagger_1.ApiResponse)({ status: 201, description: "Integration configured" }),
    __param(0, (0, common_1.Param)("userId")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GraphController.prototype, "configureIntegration", null);
__decorate([
    (0, common_1.Post)("onedrive/:userId/files"),
    (0, swagger_1.ApiOperation)({ summary: "Create file in OneDrive" }),
    (0, swagger_1.ApiResponse)({ status: 201, description: "File created in OneDrive" }),
    __param(0, (0, common_1.Param)("userId")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GraphController.prototype, "createOneDriveFile", null);
__decorate([
    (0, common_1.Get)("calendars/:userId"),
    (0, swagger_1.ApiOperation)({ summary: "Get user's calendars" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Calendars retrieved successfully" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Integration not configured" }),
    __param(0, (0, common_1.Param)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GraphController.prototype, "getCalendars", null);
__decorate([
    (0, common_1.Get)("calendar/:userId/events"),
    (0, swagger_1.ApiOperation)({ summary: "Get calendar events with optional filtering" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Calendar events retrieved successfully" }),
    (0, swagger_1.ApiQuery)({ name: "startTime", required: false, description: "Start time filter (ISO 8601)" }),
    (0, swagger_1.ApiQuery)({ name: "endTime", required: false, description: "End time filter (ISO 8601)" }),
    (0, swagger_1.ApiQuery)({ name: "timeZone", required: false, description: "Time zone for the query" }),
    (0, swagger_1.ApiQuery)({ name: "maxResults", required: false, description: "Maximum number of results" }),
    (0, swagger_1.ApiQuery)({ name: "orderBy", required: false, description: "Order by: start or lastModified" }),
    __param(0, (0, common_1.Param)("userId")),
    __param(1, (0, common_1.Query)("startTime")),
    __param(2, (0, common_1.Query)("endTime")),
    __param(3, (0, common_1.Query)("timeZone")),
    __param(4, (0, common_1.Query)("maxResults")),
    __param(5, (0, common_1.Query)("orderBy")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], GraphController.prototype, "getCalendarEvents", null);
__decorate([
    (0, common_1.Get)("calendar/:userId/events/:eventId"),
    (0, swagger_1.ApiOperation)({ summary: "Get a specific calendar event" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Calendar event retrieved successfully" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Event not found" }),
    __param(0, (0, common_1.Param)("userId")),
    __param(1, (0, common_1.Param)("eventId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], GraphController.prototype, "getCalendarEvent", null);
__decorate([
    (0, common_1.Post)("calendar/:userId/events"),
    (0, swagger_1.ApiOperation)({ summary: "Create a new calendar event" }),
    (0, swagger_1.ApiResponse)({ status: 201, description: "Calendar event created successfully" }),
    (0, swagger_1.ApiResponse)({ status: 400, description: "Invalid event data" }),
    __param(0, (0, common_1.Param)("userId")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GraphController.prototype, "createCalendarEvent", null);
__decorate([
    (0, common_1.Put)("calendar/:userId/events/:eventId"),
    (0, swagger_1.ApiOperation)({ summary: "Update an existing calendar event" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Calendar event updated successfully" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Event not found" }),
    __param(0, (0, common_1.Param)("userId")),
    __param(1, (0, common_1.Param)("eventId")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], GraphController.prototype, "updateCalendarEvent", null);
__decorate([
    (0, common_1.Delete)("calendar/:userId/events/:eventId"),
    (0, swagger_1.ApiOperation)({ summary: "Delete a calendar event" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Calendar event deleted successfully" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Event not found" }),
    __param(0, (0, common_1.Param)("userId")),
    __param(1, (0, common_1.Param)("eventId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], GraphController.prototype, "deleteCalendarEvent", null);
__decorate([
    (0, common_1.Get)("calendar/:userId/calendars/:calendarId/events"),
    (0, swagger_1.ApiOperation)({ summary: "Get events from a specific calendar" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Calendar events retrieved successfully" }),
    (0, swagger_1.ApiQuery)({ name: "startTime", required: false, description: "Start time filter (ISO 8601)" }),
    (0, swagger_1.ApiQuery)({ name: "endTime", required: false, description: "End time filter (ISO 8601)" }),
    (0, swagger_1.ApiQuery)({ name: "timeZone", required: false, description: "Time zone for the query" }),
    (0, swagger_1.ApiQuery)({ name: "maxResults", required: false, description: "Maximum number of results" }),
    (0, swagger_1.ApiQuery)({ name: "orderBy", required: false, description: "Order by: start or lastModified" }),
    __param(0, (0, common_1.Param)("userId")),
    __param(1, (0, common_1.Param)("calendarId")),
    __param(2, (0, common_1.Query)("startTime")),
    __param(3, (0, common_1.Query)("endTime")),
    __param(4, (0, common_1.Query)("timeZone")),
    __param(5, (0, common_1.Query)("maxResults")),
    __param(6, (0, common_1.Query)("orderBy")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], GraphController.prototype, "getCalendarEventsByCalendarId", null);
exports.GraphController = GraphController = __decorate([
    (0, swagger_1.ApiTags)("integrations"),
    (0, common_1.Controller)("integrations/microsoft"),
    __metadata("design:paramtypes", [graph_service_1.GraphService])
], GraphController);
//# sourceMappingURL=graph.controller.js.map