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
exports.FeatureFlagsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const feature_flags_service_1 = require("./feature-flags.service");
const feature_flags_types_1 = require("./feature-flags.types");
let FeatureFlagsController = class FeatureFlagsController {
    constructor(featureFlagsService) {
        this.featureFlagsService = featureFlagsService;
    }
    async getAllFlags(userId) {
        const userHash = userId
            ? feature_flags_service_1.FeatureFlagsService.createUserHash(userId)
            : undefined;
        const flags = await this.featureFlagsService.getAllFlags(userId, userHash);
        return {
            flags,
            userId,
            userHash,
        };
    }
    getAllConfigs() {
        return {
            configs: this.featureFlagsService.getAllConfigs(),
        };
    }
    async getHealth() {
        return await this.featureFlagsService.healthCheck();
    }
    async isEnabled(flag, userId) {
        const userHash = userId
            ? feature_flags_service_1.FeatureFlagsService.createUserHash(userId)
            : undefined;
        const enabled = await this.featureFlagsService.isEnabled(flag, userId, userHash);
        return {
            flag,
            enabled,
            userId,
            userHash,
        };
    }
    async setUserOverride(flag, userId, body) {
        const expiresAt = body.expiresAt ? new Date(body.expiresAt) : undefined;
        await this.featureFlagsService.setUserOverride(flag, userId, body.enabled, expiresAt);
        return {
            message: "User override set successfully",
            flag,
            userId,
            enabled: body.enabled,
            expiresAt,
        };
    }
};
exports.FeatureFlagsController = FeatureFlagsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: "Get all feature flags status for current user" }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "Feature flags retrieved successfully",
    }),
    __param(0, (0, common_1.Query)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FeatureFlagsController.prototype, "getAllFlags", null);
__decorate([
    (0, common_1.Get)("configs"),
    (0, swagger_1.ApiOperation)({ summary: "Get all feature flag configurations" }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "Feature flag configurations retrieved successfully",
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FeatureFlagsController.prototype, "getAllConfigs", null);
__decorate([
    (0, common_1.Get)("health"),
    (0, swagger_1.ApiOperation)({ summary: "Get feature flags service health status" }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "Health status retrieved successfully",
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FeatureFlagsController.prototype, "getHealth", null);
__decorate([
    (0, common_1.Get)(":flag"),
    (0, swagger_1.ApiOperation)({ summary: "Check if a specific feature flag is enabled" }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "Feature flag status retrieved successfully",
    }),
    __param(0, (0, common_1.Param)("flag")),
    __param(1, (0, common_1.Query)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], FeatureFlagsController.prototype, "isEnabled", null);
__decorate([
    (0, common_1.Post)(":flag/user/:userId"),
    (0, swagger_1.ApiOperation)({ summary: "Set user-specific feature flag override" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "User override set successfully" }),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Param)("flag")),
    __param(1, (0, common_1.Param)("userId")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], FeatureFlagsController.prototype, "setUserOverride", null);
exports.FeatureFlagsController = FeatureFlagsController = __decorate([
    (0, swagger_1.ApiTags)("feature-flags"),
    (0, common_1.Controller)("feature-flags"),
    __metadata("design:paramtypes", [feature_flags_service_1.FeatureFlagsService])
], FeatureFlagsController);
//# sourceMappingURL=feature-flags.controller.js.map