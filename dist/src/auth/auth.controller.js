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
var AuthController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const session_manager_service_1 = require("./services/session-manager.service");
const token_manager_service_1 = require("./services/token-manager.service");
const microsoft_auth_service_1 = require("./services/microsoft-auth.service");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const user_decorator_1 = require("./decorators/user.decorator");
let AuthController = AuthController_1 = class AuthController {
    constructor(sessionManager, tokenManager, microsoftAuthService, configService) {
        this.sessionManager = sessionManager;
        this.tokenManager = tokenManager;
        this.microsoftAuthService = microsoftAuthService;
        this.configService = configService;
        this.logger = new common_1.Logger(AuthController_1.name);
    }
    async initiateLogin(provider, redirectUri, scopes, res) {
        try {
            this.logger.log(`Initiating OAuth login for provider: ${provider}`);
            if (!['microsoft', 'google'].includes(provider)) {
                throw new common_1.HttpException('Unsupported OAuth provider', common_1.HttpStatus.BAD_REQUEST);
            }
            const additionalScopes = scopes ? scopes.split(',').map(s => s.trim()) : [];
            let authUrl;
            let state;
            if (provider === 'microsoft') {
                const result = await this.microsoftAuthService.initiateOAuth('microsoft', {
                    redirectUri,
                    scopes: [
                        'openid',
                        'profile',
                        'email',
                        'https://graph.microsoft.com/Calendars.ReadWrite',
                        'https://graph.microsoft.com/Calendars.Read',
                        ...additionalScopes
                    ]
                });
                authUrl = result.authUrl;
                state = result.state;
            }
            else {
                throw new common_1.HttpException('Google OAuth not yet implemented', common_1.HttpStatus.NOT_IMPLEMENTED);
            }
            if (res) {
                res.cookie('oauth_state', state, {
                    httpOnly: true,
                    secure: this.configService.get('NODE_ENV') === 'production',
                    sameSite: 'lax',
                    maxAge: 10 * 60 * 1000,
                });
                return res.redirect(authUrl);
            }
            return { authUrl, state };
        }
        catch (error) {
            this.logger.error(`OAuth initiation failed for ${provider}:`, error);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException('Failed to initiate OAuth login', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async handleCallback(provider, code, state, error, req, res) {
        try {
            this.logger.log(`Handling OAuth callback for provider: ${provider}`);
            if (error) {
                this.logger.error(`OAuth error: ${error}`);
                const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
                return res?.redirect(`${frontendUrl}/login?error=${error}`);
            }
            if (!code || !state) {
                throw new common_1.HttpException('Missing required OAuth parameters', common_1.HttpStatus.BAD_REQUEST);
            }
            const storedState = req?.cookies?.oauth_state;
            if (!storedState || storedState !== state) {
                throw new common_1.HttpException('Invalid state parameter', common_1.HttpStatus.BAD_REQUEST);
            }
            let userProfile;
            if (provider === 'microsoft') {
                const authResult = await this.microsoftAuthService.handleCallback('microsoft', code, state);
                userProfile = authResult.user;
            }
            else {
                throw new common_1.HttpException('Unsupported provider', common_1.HttpStatus.BAD_REQUEST);
            }
            const sessionTokens = await this.sessionManager.createSession(userProfile, {
                userAgent: req?.headers['user-agent'],
                ipAddress: req?.ip || req?.connection?.remoteAddress,
            });
            res?.clearCookie('oauth_state');
            const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
            const redirectUrl = `${frontendUrl}?token=${sessionTokens.accessToken}&refresh=${sessionTokens.refreshToken}`;
            return res?.redirect(redirectUrl);
        }
        catch (error) {
            this.logger.error(`OAuth callback failed for ${provider}:`, error);
            const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
            return res?.redirect(`${frontendUrl}/login?error=auth_failed`);
        }
    }
    async refreshToken(body) {
        try {
            this.logger.log('Processing token refresh request');
            if (!body.refreshToken) {
                throw new common_1.HttpException('Refresh token is required', common_1.HttpStatus.BAD_REQUEST);
            }
            const newTokens = await this.sessionManager.refreshSession(body.refreshToken);
            return {
                accessToken: newTokens.accessToken,
                refreshToken: newTokens.refreshToken,
                expiresAt: newTokens.expiresAt,
            };
        }
        catch (error) {
            this.logger.error('Token refresh failed:', error);
            throw new common_1.HttpException({
                error: {
                    code: 'auth/token-invalid',
                    message: 'Refresh token is invalid or expired'
                }
            }, common_1.HttpStatus.UNAUTHORIZED);
        }
    }
    async logout(req) {
        try {
            this.logger.log('Processing logout request');
            const refreshToken = req.cookies?.refresh_token || req.headers['x-refresh-token'];
            if (refreshToken) {
                await this.sessionManager.terminateSession(refreshToken);
            }
            return {
                success: true,
                message: 'Successfully logged out'
            };
        }
        catch (error) {
            this.logger.error('Logout failed:', error);
            throw new common_1.HttpException('Failed to logout', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async logoutAll(user) {
        try {
            this.logger.log(`Processing logout-all request for user: ${user.id}`);
            const revokedCount = await this.sessionManager.terminateAllSessions(user.id);
            return {
                success: true,
                message: 'All sessions revoked',
                revokedSessions: revokedCount
            };
        }
        catch (error) {
            this.logger.error('Logout-all failed:', error);
            throw new common_1.HttpException('Failed to revoke all sessions', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getProfile(user) {
        try {
            this.logger.log(`Retrieving profile for user: ${user.id}`);
            return {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar: user.avatar,
                providers: user.oauthProviders?.map(provider => ({
                    provider: provider.provider,
                    email: provider.email,
                    hasCalendarAccess: provider.scopes?.includes('calendar') || false,
                    scopes: provider.scopes || [],
                })) || [],
                createdAt: user.createdAt,
                lastLoginAt: user.updatedAt,
            };
        }
        catch (error) {
            this.logger.error('Failed to retrieve user profile:', error);
            throw new common_1.HttpException('Failed to retrieve profile', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async updateProfile(user, updateData) {
        try {
            this.logger.log(`Updating profile for user: ${user.id}`);
            return {
                id: user.id,
                email: user.email,
                name: updateData.name || user.name,
                avatar: updateData.avatar || user.avatar,
                updatedAt: new Date(),
            };
        }
        catch (error) {
            this.logger.error('Failed to update user profile:', error);
            throw new common_1.HttpException('Failed to update profile', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Get)(':provider/login'),
    (0, swagger_1.ApiOperation)({
        summary: 'Initiate OAuth login',
        description: 'Redirects user to OAuth provider for authentication'
    }),
    (0, swagger_1.ApiResponse)({ status: 302, description: 'Redirect to OAuth provider' }),
    __param(0, (0, common_1.Param)('provider')),
    __param(1, (0, common_1.Query)('redirect_uri')),
    __param(2, (0, common_1.Query)('scopes')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "initiateLogin", null);
__decorate([
    (0, common_1.Get)(':provider/callback'),
    (0, swagger_1.ApiOperation)({
        summary: 'OAuth callback handler',
        description: 'Handles OAuth provider callback and creates user session'
    }),
    (0, swagger_1.ApiResponse)({ status: 302, description: 'Redirect to frontend with session token' }),
    __param(0, (0, common_1.Param)('provider')),
    __param(1, (0, common_1.Query)('code')),
    __param(2, (0, common_1.Query)('state')),
    __param(3, (0, common_1.Query)('error')),
    __param(4, (0, common_1.Req)()),
    __param(5, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "handleCallback", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, swagger_1.ApiOperation)({
        summary: 'Refresh access token',
        description: 'Exchanges refresh token for new access token'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'New access token issued' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refreshToken", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Logout current session',
        description: 'Revokes current session and invalidates tokens'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Successfully logged out' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Post)('logout-all'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Logout all sessions',
        description: 'Revokes all user sessions across all devices'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'All sessions revoked' }),
    __param(0, (0, user_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logoutAll", null);
__decorate([
    (0, common_1.Get)('profile'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get user profile',
        description: 'Returns authenticated user profile information'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User profile retrieved' }),
    __param(0, (0, user_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Patch)('profile'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Update user profile',
        description: 'Updates user profile information'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Profile updated successfully' }),
    __param(0, (0, user_decorator_1.User)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "updateProfile", null);
exports.AuthController = AuthController = AuthController_1 = __decorate([
    (0, swagger_1.ApiTags)('Authentication'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [session_manager_service_1.SessionManagerService,
        token_manager_service_1.TokenManagerService,
        microsoft_auth_service_1.MicrosoftAuthService,
        config_1.ConfigService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map