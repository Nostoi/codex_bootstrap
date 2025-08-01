import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenManagerService } from './token-manager.service';
import { 
  SessionTokens, 
  AuthResult, 
  JWTPayload,
  UserWithProvider 
} from '../types/auth.types';

/**
 * SessionManager Service
 * Handles user session creation, refresh, and revocation
 * Implements secure session management with token rotation
 */
@Injectable()
export class SessionManagerService {
  private readonly logger = new Logger(SessionManagerService.name);
  private readonly maxSessionsPerUser: number;
  private readonly sessionTimeout: number;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => TokenManagerService))
    private readonly tokenManager: TokenManagerService,
    private readonly configService: ConfigService,
  ) {
    this.maxSessionsPerUser = this.configService.get<number>('MAX_SESSIONS_PER_USER') || 5;
    this.sessionTimeout = this.configService.get<number>('SESSION_TIMEOUT_HOURS') || 24;
  }

  /**
   * Create a new user session with JWT tokens
   */
  async createSession(
    user: UserWithProvider, 
    metadata?: { userAgent?: string; ipAddress?: string }
  ): Promise<SessionTokens> {
    try {
      // Cleanup old sessions if user has too many
      await this.enforceSessionLimit(user.id);

      // Generate tokens
      const accessToken = this.tokenManager.generateAccessToken({
        sub: user.id,
        email: user.email,
        name: user.name,
        scopes: this.extractUserScopes(user),
      });

      const refreshToken = this.tokenManager.generateRefreshToken();
      const expiresAt = new Date(Date.now() + (this.sessionTimeout * 60 * 60 * 1000));

      // Create session in database
      const session = await this.prisma.userSession.create({
        data: {
          userId: user.id,
          accessToken: this.tokenManager.encryptToken(accessToken),
          refreshToken: this.tokenManager.encryptToken(refreshToken),
          expiresAt,
          userAgent: metadata?.userAgent,
          ipAddress: metadata?.ipAddress,
          isActive: true,
        },
      });

      this.logger.debug(`Created session for user ${user.id}: ${session.sessionId}`);

      return {
        accessToken,
        refreshToken,
        expiresAt,
      };
    } catch (error) {
      this.logger.error(`Session creation failed for user ${user.id}: ${error.message}`);
      throw new Error('Session creation failed');
    }
  }

  /**
   * Refresh user session with token rotation
   */
  async refreshSession(refreshToken: string): Promise<SessionTokens> {
    try {
      // Verify refresh token and get session info
      const { userId, sessionId } = await this.tokenManager.verifyRefreshToken(refreshToken);

      // Get current session
      const session = await this.prisma.userSession.findFirst({
        where: {
          sessionId,
          isActive: true,
          refreshToken: this.tokenManager.encryptToken(refreshToken),
        },
        include: {
          user: {
            include: {
              oauthProviders: true,
            },
          },
        },
      });

      if (!session) {
        throw new Error('Invalid session for token refresh');
      }

      // Generate new tokens
      const newAccessToken = this.tokenManager.generateAccessToken({
        sub: session.user.id,
        email: session.user.email,
        name: session.user.name,
        scopes: this.extractUserScopes(session.user as UserWithProvider),
      });

      const newRefreshToken = this.tokenManager.generateRefreshToken();
      const newExpiresAt = new Date(Date.now() + (this.sessionTimeout * 60 * 60 * 1000));

      // Update session with new tokens (token rotation)
      await this.prisma.userSession.update({
        where: { id: session.id },
        data: {
          accessToken: this.tokenManager.encryptToken(newAccessToken),
          refreshToken: this.tokenManager.encryptToken(newRefreshToken),
          expiresAt: newExpiresAt,
          updatedAt: new Date(),
        },
      });

      // Blacklist old access token if it has a valid JTI
      try {
        const oldTokenPayload = this.tokenManager.verifyAccessToken(
          this.tokenManager.decryptToken(session.accessToken)
        );
        await this.tokenManager.blacklistToken(
          oldTokenPayload.jti, 
          new Date(oldTokenPayload.exp * 1000)
        );
      } catch (error) {
        // Log but don't fail - old token might already be expired
        this.logger.warn(`Could not blacklist old token during refresh: ${error.message}`);
      }

      this.logger.debug(`Refreshed session for user ${userId}: ${sessionId}`);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt: newExpiresAt,
      };
    } catch (error) {
      this.logger.error(`Session refresh failed: ${error.message}`);
      throw new Error('Session refresh failed');
    }
  }

  /**
   * Revoke a specific user session
   */
  async revokeSession(sessionId: string): Promise<void> {
    try {
      const session = await this.prisma.userSession.findUnique({
        where: { sessionId },
      });

      if (!session) {
        this.logger.warn(`Attempted to revoke non-existent session: ${sessionId}`);
        return;
      }

      // Mark session as inactive
      await this.prisma.userSession.update({
        where: { sessionId },
        data: { isActive: false },
      });

      // Blacklist the access token
      try {
        const decryptedToken = this.tokenManager.decryptToken(session.accessToken);
        const tokenPayload = this.tokenManager.verifyAccessToken(decryptedToken);
        await this.tokenManager.blacklistToken(
          tokenPayload.jti,
          new Date(tokenPayload.exp * 1000)
        );
      } catch (error) {
        this.logger.warn(`Could not blacklist token during revocation: ${error.message}`);
      }

      this.logger.debug(`Revoked session: ${sessionId}`);
    } catch (error) {
      this.logger.error(`Session revocation failed for ${sessionId}: ${error.message}`);
      throw new Error('Session revocation failed');
    }
  }

  /**
   * Revoke all sessions for a user
   */
  async revokeAllUserSessions(userId: string): Promise<void> {
    try {
      const sessions = await this.prisma.userSession.findMany({
        where: {
          userId,
          isActive: true,
        },
      });

      // Mark all sessions as inactive
      await this.prisma.userSession.updateMany({
        where: {
          userId,
          isActive: true,
        },
        data: { isActive: false },
      });

      // Blacklist all access tokens
      for (const session of sessions) {
        try {
          const decryptedToken = this.tokenManager.decryptToken(session.accessToken);
          const tokenPayload = this.tokenManager.verifyAccessToken(decryptedToken);
          await this.tokenManager.blacklistToken(
            tokenPayload.jti,
            new Date(tokenPayload.exp * 1000)
          );
        } catch (error) {
          this.logger.warn(`Could not blacklist token for session ${session.sessionId}: ${error.message}`);
        }
      }

      this.logger.debug(`Revoked ${sessions.length} sessions for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to revoke all sessions for user ${userId}: ${error.message}`);
      throw new Error('Session revocation failed');
    }
  }

  /**
   * Get active sessions for a user
   */
  async getUserSessions(userId: string): Promise<Array<{
    sessionId: string;
    createdAt: Date;
    updatedAt: Date;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }>> {
    try {
      const sessions = await this.prisma.userSession.findMany({
        where: {
          userId,
          isActive: true,
          expiresAt: {
            gt: new Date(),
          },
        },
        select: {
          sessionId: true,
          createdAt: true,
          updatedAt: true,
          expiresAt: true,
          userAgent: true,
          ipAddress: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      return sessions;
    } catch (error) {
      this.logger.error(`Failed to get sessions for user ${userId}: ${error.message}`);
      throw new Error('Failed to retrieve user sessions');
    }
  }

  /**
   * Cleanup expired sessions
   */
  async cleanupExpiredSessions(): Promise<void> {
    try {
      const result = await this.prisma.userSession.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            { isActive: false },
          ],
        },
      });

      if (result.count > 0) {
        this.logger.debug(`Cleaned up ${result.count} expired/inactive sessions`);
      }

      // Also cleanup expired blacklisted tokens
      await this.tokenManager.cleanupExpiredTokens();
    } catch (error) {
      this.logger.error(`Session cleanup failed: ${error.message}`);
    }
  }

  /**
   * Validate session and return user context
   */
  async validateSession(accessToken: string): Promise<{
    user: {
      id: string;
      email: string;
      name?: string;
      scopes: string[];
    };
    session: {
      id: string;
      sessionId: string;
      expiresAt: Date;
    };
  } | null> {
    try {
      // Verify token
      const payload = this.tokenManager.verifyAccessToken(accessToken);

      // Check if token is blacklisted
      if (await this.tokenManager.isTokenBlacklisted(payload.jti)) {
        return null;
      }

      // Find active session
      const session = await this.prisma.userSession.findFirst({
        where: {
          userId: payload.sub,
          isActive: true,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (!session) {
        return null;
      }

      return {
        user: {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          scopes: payload.scopes,
        },
        session: {
          id: session.id,
          sessionId: session.sessionId,
          expiresAt: session.expiresAt,
        },
      };
    } catch (error) {
      this.logger.warn(`Session validation failed: ${error.message}`);
      return null;
    }
  }

  // Private helper methods

  private async enforceSessionLimit(userId: string): Promise<void> {
    const activeSessions = await this.prisma.userSession.count({
      where: {
        userId,
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (activeSessions >= this.maxSessionsPerUser) {
      // Remove oldest sessions
      const sessionsToRemove = await this.prisma.userSession.findMany({
        where: {
          userId,
          isActive: true,
        },
        orderBy: {
          updatedAt: 'asc',
        },
        take: activeSessions - this.maxSessionsPerUser + 1,
      });

      for (const session of sessionsToRemove) {
        await this.revokeSession(session.sessionId);
      }

      this.logger.debug(`Enforced session limit for user ${userId}: removed ${sessionsToRemove.length} old sessions`);
    }
  }

  private extractUserScopes(user: UserWithProvider): string[] {
    const scopes: string[] = [];
    
    for (const provider of user.oauthProviders) {
      scopes.push(...provider.scopes);
    }

    // Remove duplicates and add default scopes
    const uniqueScopes = Array.from(new Set([...scopes, 'profile', 'email']));
    return uniqueScopes;
  }
}
