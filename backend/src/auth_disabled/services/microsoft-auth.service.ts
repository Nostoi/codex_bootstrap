import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { GraphAuthService } from '../../integrations/graph/auth/graph-auth.service';
import { SessionManagerService } from './session-manager.service';
import * as crypto from 'crypto-js';
import {
  OAuthProfile,
  SessionTokens,
  IAuthService,
  OAuthTokens,
  UserWithProvider,
  AuthResult,
  OAuthState,
  CalendarPermissions,
} from '../types/auth.types';

@Injectable()
export class MicrosoftAuthService implements IAuthService {
  private readonly logger = new Logger(MicrosoftAuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private graphAuthService: GraphAuthService,
    @Inject(forwardRef(() => SessionManagerService))
    private sessionManager: SessionManagerService
  ) {}

  async initiateOAuth(
    provider: 'google' | 'microsoft',
    options?: { redirectUri?: string; scopes?: string[]; userId?: string }
  ): Promise<{ authUrl: string; state: string }> {
    if (provider !== 'microsoft') {
      throw new BadRequestException('This service only handles Microsoft OAuth');
    }

    try {
      // Generate state for CSRF protection
      const state = crypto.lib.WordArray.random(16).toString();
      const stateData: OAuthState = {
        provider: 'microsoft',
        redirectUri: options?.redirectUri,
        userId: options?.userId,
        timestamp: Date.now(),
      };

      // Store state in cache/database for validation
      // For now, we'll use the userId directly as state
      const userId = options?.userId || 'anonymous_' + Date.now();

      const authUrl = await this.graphAuthService.getAuthorizationUrl(userId, state);

      return {
        authUrl,
        state,
      };
    } catch (error) {
      this.logger.error(`Failed to initiate Microsoft OAuth: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to initiate OAuth flow');
    }
  }

  async handleCallback(
    provider: 'google' | 'microsoft',
    code: string,
    state: string
  ): Promise<AuthResult> {
    if (provider !== 'microsoft') {
      throw new BadRequestException('This service only handles Microsoft OAuth');
    }

    try {
      // For now, use state as userId (this should be improved with proper state management)
      const userId = state;

      // Exchange code for tokens using GraphAuthService
      const authResult = await this.graphAuthService.exchangeCodeForTokens(code, userId, state);

      if (!authResult || !authResult.account) {
        throw new UnauthorizedException('Failed to authenticate with Microsoft');
      }

      // Create OAuth profile
      const oauthProfile: OAuthProfile = {
        providerId: authResult.account.homeAccountId,
        provider: 'microsoft',
        email: authResult.account.username,
        name: authResult.account.name || authResult.account.username,
        firstName: authResult.account.name?.split(' ')[0],
        lastName: authResult.account.name?.split(' ').slice(1).join(' '),
        picture: undefined,
        accessToken: authResult.accessToken,
        refreshToken: undefined, // MSAL handles refresh internally
        scopes: authResult.scopes || [],
      };

      // Find or create user
      const user = await this.findOrCreateUser(oauthProfile);

      // Create session
      const tokens = await this.createSession(user);

      // Check if user was created recently (within 1 minute)
      const isNewUser = user.oauthProviders.some(
        provider => Date.now() - provider.createdAt.getTime() < 60000
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
        },
        tokens,
        isNewUser,
      };
    } catch (error) {
      this.logger.error(`Microsoft OAuth callback failed: ${error.message}`, error.stack);
      throw new UnauthorizedException('OAuth callback failed');
    }
  }

  async createSession(
    user: any,
    metadata?: { userAgent?: string; ipAddress?: string }
  ): Promise<SessionTokens> {
    try {
      // Use the centralized SessionManagerService
      return await this.sessionManager.createSession(user, metadata);
    } catch (error) {
      this.logger.error(`Session creation failed: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create session');
    }
  }

  async refreshSession(refreshToken: string): Promise<SessionTokens> {
    try {
      // Use the centralized SessionManagerService
      return await this.sessionManager.refreshSession(refreshToken);
    } catch (error) {
      this.logger.error(`Token refresh failed: ${error.message}`, error.stack);
      throw new UnauthorizedException('Token refresh failed');
    }
  }

  async revokeSession(sessionId: string): Promise<void> {
    try {
      // Use the centralized SessionManagerService
      await this.sessionManager.revokeSession(sessionId);
    } catch (error) {
      this.logger.error(`Session revocation failed: ${error.message}`, error.stack);
      throw new BadRequestException('Session revocation failed');
    }
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    try {
      // Use the centralized SessionManagerService
      await this.sessionManager.revokeAllUserSessions(userId);
    } catch (error) {
      this.logger.error(`Session revocation failed: ${error.message}`, error.stack);
      throw new BadRequestException('Session revocation failed');
    }
  }

  async findOrCreateUser(oauthProfile: OAuthProfile): Promise<UserWithProvider> {
    try {
      // Try to find existing user
      let user = await this.prisma.user.findUnique({
        where: { email: oauthProfile.email },
        include: { oauthProviders: true },
      });

      if (!user) {
        // Create new user
        user = await this.prisma.user.create({
          data: {
            email: oauthProfile.email,
            name: oauthProfile.name,
            avatar: oauthProfile.picture,
            oauthProviders: {
              create: {
                provider: oauthProfile.provider,
                providerId: oauthProfile.providerId,
                email: oauthProfile.email,
                accessToken: this.encryptToken(oauthProfile.accessToken),
                refreshToken: oauthProfile.refreshToken
                  ? this.encryptToken(oauthProfile.refreshToken)
                  : null,
                scopes: oauthProfile.scopes,
              },
            },
          },
          include: { oauthProviders: true },
        });

        this.logger.log(`Created new user: ${user.email}`);
      } else {
        // Update or create OAuth provider
        await this.updateOrCreateProvider(user.id, oauthProfile);
        this.logger.log(`Updated existing user: ${user.email}`);
      }

      return user;
    } catch (error) {
      this.logger.error(`User creation/update failed: ${error.message}`, error.stack);
      throw new BadRequestException('User management failed');
    }
  }

  async linkProvider(userId: string, provider: OAuthProfile, tokens: OAuthTokens): Promise<void> {
    try {
      await this.updateOrCreateProvider(userId, provider);
      this.logger.log(`Linked Microsoft provider for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Provider linking failed: ${error.message}`, error.stack);
      throw new BadRequestException('Provider linking failed');
    }
  }

  async unlinkProvider(userId: string, provider: 'google' | 'microsoft'): Promise<void> {
    if (provider !== 'microsoft') {
      throw new BadRequestException('This service only handles Microsoft OAuth');
    }

    try {
      await this.prisma.oAuthProvider.deleteMany({
        where: {
          userId,
          provider: 'microsoft',
        },
      });

      this.logger.log(`Unlinked Microsoft provider for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Provider unlinking failed: ${error.message}`, error.stack);
      throw new BadRequestException('Provider unlinking failed');
    }
  }

  async requestCalendarPermissions(
    userId: string,
    provider: 'google' | 'microsoft'
  ): Promise<{ authUrl: string; state: string }> {
    if (provider !== 'microsoft') {
      throw new BadRequestException('This service only handles Microsoft OAuth');
    }

    return this.initiateOAuth('microsoft', {
      userId,
      scopes: [
        'https://graph.microsoft.com/Calendars.ReadWrite',
        'https://graph.microsoft.com/Calendars.Read',
      ],
    });
  }

  async getCalendarPermissions(userId: string): Promise<CalendarPermissions[]> {
    try {
      const oauthProvider = await this.prisma.oAuthProvider.findFirst({
        where: {
          userId,
          provider: 'microsoft',
        },
      });

      if (!oauthProvider) {
        return [];
      }

      const hasCalendarAccess = oauthProvider.scopes.some(
        scopes => scopes.includes('Calendars.Read') || scopes.includes('Calendars.ReadWrite')
      );

      return [
        {
          hasCalendarAccess,
          scopes: oauthProvider.scopes,
          provider: 'microsoft',
          lastSyncAt: oauthProvider.updatedAt,
        },
      ];
    } catch (error) {
      this.logger.error(`Failed to get calendar permissions: ${error.message}`, error.stack);
      return [];
    }
  }

  // Helper methods
  private async updateOrCreateProvider(userId: string, profile: OAuthProfile): Promise<void> {
    const existingProvider = await this.prisma.oAuthProvider.findFirst({
      where: {
        userId,
        provider: profile.provider,
      },
    });

    if (existingProvider) {
      // Update existing provider
      await this.prisma.oAuthProvider.update({
        where: { id: existingProvider.id },
        data: {
          accessToken: this.encryptToken(profile.accessToken),
          refreshToken: profile.refreshToken ? this.encryptToken(profile.refreshToken) : null,
          scopes: profile.scopes,
        },
      });
    } else {
      // Create new provider
      await this.prisma.oAuthProvider.create({
        data: {
          userId,
          provider: profile.provider,
          providerId: profile.providerId,
          email: profile.email,
          accessToken: this.encryptToken(profile.accessToken),
          refreshToken: profile.refreshToken ? this.encryptToken(profile.refreshToken) : null,
          scopes: profile.scopes,
        },
      });
    }
  }

  private encryptToken(token: string): string {
    const encryptionKey = this.configService.get('OAUTH_ENCRYPTION_KEY');
    return crypto.AES.encrypt(token, encryptionKey).toString();
  }

  private decryptToken(encryptedToken: string): string {
    const encryptionKey = this.configService.get('OAUTH_ENCRYPTION_KEY');
    const bytes = crypto.AES.decrypt(encryptedToken, encryptionKey);
    return bytes.toString(crypto.enc.Utf8);
  }
}
