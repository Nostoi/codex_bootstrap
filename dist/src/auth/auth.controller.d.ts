import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { SessionManagerService } from './services/session-manager.service';
import { TokenManagerService } from './services/token-manager.service';
import { MicrosoftAuthService } from './services/microsoft-auth.service';
import { UserWithProvider } from './types/auth.types';
interface RefreshTokenRequest {
    refreshToken: string;
}
interface UpdateProfileRequest {
    name?: string;
    avatar?: string;
}
export declare class AuthController {
    private sessionManager;
    private tokenManager;
    private microsoftAuthService;
    private configService;
    private readonly logger;
    constructor(sessionManager: SessionManagerService, tokenManager: TokenManagerService, microsoftAuthService: MicrosoftAuthService, configService: ConfigService);
    initiateLogin(provider: string, redirectUri?: string, scopes?: string, res?: Response): Promise<void | {
        authUrl: string;
        state: string;
    }>;
    handleCallback(provider: string, code?: string, state?: string, error?: string, req?: Request, res?: Response): Promise<void>;
    refreshToken(body: RefreshTokenRequest): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresAt: Date;
    }>;
    logout(req: Request): Promise<{
        success: boolean;
        message: string;
    }>;
    logoutAll(user: UserWithProvider): Promise<{
        success: boolean;
        message: string;
        revokedSessions: any;
    }>;
    getProfile(user: UserWithProvider): Promise<{
        id: string;
        email: string;
        name: string;
        avatar: string;
        providers: {
            provider: string;
            email: string;
            hasCalendarAccess: boolean;
            scopes: string[];
        }[];
        createdAt: Date;
        lastLoginAt: Date;
    }>;
    updateProfile(user: UserWithProvider, updateData: UpdateProfileRequest): Promise<{
        id: string;
        email: string;
        name: string;
        avatar: string;
        updatedAt: Date;
    }>;
}
export {};
