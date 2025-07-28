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
};
exports.GraphController = GraphController;
__decorate([
    (0, common_1.Get)('profile/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Microsoft Graph user profile' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User profile retrieved' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Integration not configured' }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GraphController.prototype, "getUserProfile", null);
__decorate([
    (0, common_1.Get)('onedrive/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get OneDrive files' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'OneDrive files retrieved' }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GraphController.prototype, "getOneDriveFiles", null);
__decorate([
    (0, common_1.Get)('teams/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user Teams' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Teams retrieved' }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GraphController.prototype, "getTeams", null);
__decorate([
    (0, common_1.Post)('configure/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Configure Microsoft integration' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Integration configured' }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GraphController.prototype, "configureIntegration", null);
__decorate([
    (0, common_1.Post)('onedrive/:userId/files'),
    (0, swagger_1.ApiOperation)({ summary: 'Create file in OneDrive' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'File created in OneDrive' }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GraphController.prototype, "createOneDriveFile", null);
exports.GraphController = GraphController = __decorate([
    (0, swagger_1.ApiTags)('integrations'),
    (0, common_1.Controller)('integrations/microsoft'),
    __metadata("design:paramtypes", [graph_service_1.GraphService])
], GraphController);
//# sourceMappingURL=graph.controller.js.map