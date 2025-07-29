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
var GraphConfigService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphConfigService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const calendar_types_1 = require("../types/calendar.types");
let GraphConfigService = GraphConfigService_1 = class GraphConfigService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(GraphConfigService_1.name);
    }
    getMicrosoftGraphConfig() {
        const clientId = this.configService.get('MICROSOFT_CLIENT_ID');
        const clientSecret = this.configService.get('MICROSOFT_CLIENT_SECRET');
        const redirectUri = this.configService.get('MICROSOFT_REDIRECT_URI');
        const tenantId = this.configService.get('MICROSOFT_TENANT_ID');
        if (!clientId || !clientSecret || !redirectUri) {
            const missing = [];
            if (!clientId)
                missing.push('MICROSOFT_CLIENT_ID');
            if (!clientSecret)
                missing.push('MICROSOFT_CLIENT_SECRET');
            if (!redirectUri)
                missing.push('MICROSOFT_REDIRECT_URI');
            throw new Error(`Missing required Microsoft Graph configuration: ${missing.join(', ')}`);
        }
        return {
            clientId,
            clientSecret,
            redirectUri,
            tenantId,
            scopes: [...calendar_types_1.ALL_CALENDAR_SCOPES],
        };
    }
    getAuthorizationUrl(state) {
        const config = this.getMicrosoftGraphConfig();
        const params = new URLSearchParams({
            client_id: config.clientId,
            response_type: 'code',
            redirect_uri: config.redirectUri,
            scope: config.scopes.join(' '),
            response_mode: 'query',
        });
        if (state) {
            params.append('state', state);
        }
        if (config.tenantId) {
            params.append('tenant', config.tenantId);
        }
        const baseUrl = config.tenantId
            ? `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/authorize`
            : 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
        return `${baseUrl}?${params.toString()}`;
    }
    getTokenEndpoint() {
        const config = this.getMicrosoftGraphConfig();
        return config.tenantId
            ? `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`
            : 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
    }
    validateConfiguration() {
        const errors = [];
        try {
            this.getMicrosoftGraphConfig();
        }
        catch (error) {
            errors.push(error.message);
        }
        const tenantId = this.configService.get('MICROSOFT_TENANT_ID');
        if (!tenantId) {
            this.logger.warn('MICROSOFT_TENANT_ID not set. Using multi-tenant configuration. ' +
                'Consider setting a specific tenant for enhanced security.');
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
    getConfigSummary() {
        try {
            const config = this.getMicrosoftGraphConfig();
            return {
                hasClientId: !!config.clientId,
                hasClientSecret: !!config.clientSecret,
                redirectUri: config.redirectUri,
                tenantId: config.tenantId || 'common',
                scopesCount: config.scopes.length,
                scopes: config.scopes,
            };
        }
        catch (error) {
            return {
                error: error.message,
            };
        }
    }
};
exports.GraphConfigService = GraphConfigService;
exports.GraphConfigService = GraphConfigService = GraphConfigService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GraphConfigService);
//# sourceMappingURL=graph-config.service.js.map