import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenManagerService } from './token-manager.service';
import { SessionManagerService } from './session-manager.service';
import { OAuthProfile } from '../strategies/google.strategy';
import { User, OAuthProvider } from '@prisma/client';

export interface LoginResult {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenManager: TokenManagerService,
    private readonly sessionManager: SessionManagerService
  ) {}

  /**
   * Validate OAuth login and find or create user
   */
  async validateOAuthLogin(oauthProfile: OAuthProfile): Promise<LoginResult> {
    try {
      this.logger.debug(
        `Validating OAuth login for ${oauthProfile.provider}: ${oauthProfile.email}`
      );

      // Find existing OAuth provider link
      let oauthProvider = await this.prisma.oAuthProvider.findUnique({
        where: {
          provider_providerId: {
            provider: oauthProfile.provider,
            providerId: oauthProfile.providerId,
          },
        },
        include: { user: true },
      });

      let user: User;

      if (oauthProvider) {
        // Update existing OAuth provider tokens
        user = oauthProvider.user;
        await this.updateOAuthProvider(oauthProvider.id, oauthProfile);
        this.logger.debug(`Existing user found: ${user.email}`);
      } else {
        // Try to find user by email (to link accounts)
        user = await this.prisma.user.findUnique({
          where: { email: oauthProfile.email },
        });

        if (!user) {
          // Create new user
          user = await this.createUserFromOAuth(oauthProfile);
          this.logger.log(`New user created: ${user.email}`);
        } else {
          this.logger.debug(`Linking OAuth provider to existing user: ${user.email}`);
        }

        // Create OAuth provider link
        await this.createOAuthProvider(user.id, oauthProfile);
      }

      // Generate tokens and create session
      const { accessToken, refreshToken, expiresAt } = await this.generateTokens(user);

      this.logger.log(`OAuth login successful for user: ${user.email}`);
      return { user, accessToken, refreshToken, expiresAt };
    } catch (error) {
      this.logger.error(`OAuth login failed: ${error.message}`, error.stack);
      throw new UnauthorizedException('Authentication failed');
    }
  }

  /**
   * Find user by ID (used by JWT strategy)
   */
  async findUserById(
    userId: string
  ): Promise<(User & { oauthProviders?: { provider: string; scopes: string[] }[] }) | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          oauthProviders: {
            select: { provider: true, scopes: true },
          },
        },
      });
    } catch (error) {
      this.logger.error(`Failed to find user by ID: ${userId}`, error.stack);
      return null;
    }
  }

  /**
   * Check if token is blacklisted
   */
  async isTokenBlacklisted(tokenId: string): Promise<boolean> {
    try {
      const blacklistedToken = await this.prisma.blacklistedToken.findUnique({
        where: { tokenId },
      });
      return !!blacklistedToken;
    } catch (error) {
      this.logger.error(`Failed to check blacklisted token: ${tokenId}`, error.stack);
      return false;
    }
  }

  /**
   * Check if user has active session
   */
  async hasActiveSession(userId: string, tokenId: string): Promise<boolean> {
    try {
      const session = await this.prisma.userSession.findFirst({
        where: {
          userId,
          isActive: true,
          expiresAt: { gt: new Date() },
        },
      });
      return !!session;
    } catch (error) {
      this.logger.error(`Failed to check active session for user: ${userId}`, error.stack);
      return false;
    }
  }

  /**
   * Generate access and refresh tokens
   */
  async generateTokens(
    user: User
  ): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
    const tokenPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
    };

    const accessToken = await this.tokenManager.generateAccessToken(tokenPayload);
    const refreshToken = await this.tokenManager.generateRefreshToken(tokenPayload);
    const expiresAt = await this.tokenManager.getTokenExpiration(accessToken);

    // Create user session
    await this.sessionManager.createSession({
      userId: user.id,
      refreshToken,
      expiresAt,
    });

    return { accessToken, refreshToken, expiresAt };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
    try {
      // Verify refresh token
      const payload = await this.tokenManager.verifyRefreshToken(refreshToken);

      // Find user
      const user = await this.findUserById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Verify session exists and is active
      const session = await this.sessionManager.findSessionByRefreshToken(refreshToken);
      if (!session || !session.isActive) {
        throw new UnauthorizedException('Session expired or invalid');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      // Invalidate old session and refresh token
      await this.sessionManager.invalidateSession(session.id);
      await this.tokenManager.blacklistToken(refreshToken);

      return tokens;
    } catch (error) {
      this.logger.error(`Token refresh failed: ${error.message}`, error.stack);
      throw new UnauthorizedException('Token refresh failed');
    }
  }

  /**
   * Logout user and blacklist tokens
   */
  async logout(userId: string, tokenId: string): Promise<void> {
    try {
      // Blacklist the access token
      await this.tokenManager.blacklistToken(tokenId);

      // Invalidate all active sessions for the user
      await this.sessionManager.invalidateUserSessions(userId);

      this.logger.log(`User logged out: ${userId}`);
    } catch (error) {
      this.logger.error(`Logout failed for user: ${userId}`, error.stack);
      throw error;
    }
  }

  /**
   * Create new user from OAuth profile
   */
  private async createUserFromOAuth(oauthProfile: OAuthProfile): Promise<User> {
    const displayName =
      [oauthProfile.firstName, oauthProfile.lastName].filter(Boolean).join(' ') || null;

    return await this.prisma.user.create({
      data: {
        email: oauthProfile.email,
        name: displayName,
        avatar: oauthProfile.avatar,
      },
    });
  }

  /**
   * Create OAuth provider link
   */
  private async createOAuthProvider(
    userId: string,
    oauthProfile: OAuthProfile
  ): Promise<OAuthProvider> {
    const scopes = this.getOAuthScopes(oauthProfile.provider);

    return await this.prisma.oAuthProvider.create({
      data: {
        provider: oauthProfile.provider,
        providerId: oauthProfile.providerId,
        email: oauthProfile.email,
        accessToken: oauthProfile.accessToken,
        refreshToken: oauthProfile.refreshToken,
        scopes,
        userId,
      },
    });
  }

  /**
   * Update existing OAuth provider tokens
   */
  private async updateOAuthProvider(providerId: string, oauthProfile: OAuthProfile): Promise<void> {
    await this.prisma.oAuthProvider.update({
      where: { id: providerId },
      data: {
        accessToken: oauthProfile.accessToken,
        refreshToken: oauthProfile.refreshToken,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Get OAuth scopes for provider
   */
  private getOAuthScopes(provider: string): string[] {
    switch (provider) {
      case 'google':
        return ['email', 'profile', 'https://www.googleapis.com/auth/calendar.readonly'];
      case 'microsoft':
        return ['user.read', 'calendars.read', 'offline_access'];
      default:
        return ['email', 'profile'];
    }
  }
}
