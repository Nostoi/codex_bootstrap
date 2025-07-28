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
exports.GoogleController = void 0;
const common_1 = require("@nestjs/common");
const google_service_1 = require("./google.service");
const swagger_1 = require("@nestjs/swagger");
let GoogleController = class GoogleController {
    constructor(googleService) {
        this.googleService = googleService;
    }
    getDriveFiles(userId, folderId) {
        return this.googleService.getDriveFiles(userId, folderId);
    }
    createDriveFile(userId, fileData) {
        return this.googleService.createDriveFile(userId, fileData.filename, fileData.content, fileData.mimeType);
    }
    getSheetData(userId, spreadsheetId, range) {
        return this.googleService.getSheetData(userId, spreadsheetId, range);
    }
    createSheet(userId, sheetData) {
        return this.googleService.createSheet(userId, sheetData.title);
    }
    getCalendarEvents(userId, calendarId) {
        return this.googleService.getCalendarEvents(userId, calendarId);
    }
    createCalendarEvent(userId, eventData) {
        const { calendarId, ...event } = eventData;
        return this.googleService.createCalendarEvent(userId, event, calendarId);
    }
    configureIntegration(userId, config) {
        const expiresAt = config.expiresAt ? new Date(config.expiresAt) : undefined;
        return this.googleService.saveIntegrationConfig(userId, config.accessToken, config.refreshToken, expiresAt, config.scopes);
    }
};
exports.GoogleController = GoogleController;
__decorate([
    (0, common_1.Get)('drive/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Google Drive files' }),
    (0, swagger_1.ApiQuery)({ name: 'folderId', required: false, description: 'Folder ID to list files from' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Google Drive files retrieved' }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Query)('folderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], GoogleController.prototype, "getDriveFiles", null);
__decorate([
    (0, common_1.Post)('drive/:userId/files'),
    (0, swagger_1.ApiOperation)({ summary: 'Create file in Google Drive' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'File created in Google Drive' }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GoogleController.prototype, "createDriveFile", null);
__decorate([
    (0, common_1.Get)('sheets/:userId/:spreadsheetId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Google Sheets data' }),
    (0, swagger_1.ApiQuery)({ name: 'range', required: true, description: 'Sheet range (e.g., A1:Z100)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Google Sheets data retrieved' }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Param)('spreadsheetId')),
    __param(2, (0, common_1.Query)('range')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], GoogleController.prototype, "getSheetData", null);
__decorate([
    (0, common_1.Post)('sheets/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Create Google Sheet' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Google Sheet created' }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GoogleController.prototype, "createSheet", null);
__decorate([
    (0, common_1.Get)('calendar/:userId/events'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Google Calendar events' }),
    (0, swagger_1.ApiQuery)({ name: 'calendarId', required: false, description: 'Calendar ID (default: primary)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Google Calendar events retrieved' }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Query)('calendarId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], GoogleController.prototype, "getCalendarEvents", null);
__decorate([
    (0, common_1.Post)('calendar/:userId/events'),
    (0, swagger_1.ApiOperation)({ summary: 'Create Google Calendar event' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Calendar event created' }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GoogleController.prototype, "createCalendarEvent", null);
__decorate([
    (0, common_1.Post)('configure/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Configure Google integration' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Integration configured' }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GoogleController.prototype, "configureIntegration", null);
exports.GoogleController = GoogleController = __decorate([
    (0, swagger_1.ApiTags)('integrations'),
    (0, common_1.Controller)('integrations/google'),
    __metadata("design:paramtypes", [google_service_1.GoogleService])
], GoogleController);
//# sourceMappingURL=google.controller.js.map