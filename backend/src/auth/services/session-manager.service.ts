import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserSession } from '@prisma/client';

export interface CreateSessionData {
  userId: string;
  refreshToken: string;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

export interface SessionInfo {
  id: string;
  sessionId: string;
  userId: string;
  refreshToken: string;
  expiresAt: Date;
  isActive: boolean;
  userAgent?: string;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class SessionManagerService {
  private readonly logger = new Logger(SessionManagerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new user session
   */
  async createSession(sessionData: CreateSessionData): Promise<UserSession> {
    try {
      // First, invalidate old sessions if user has too many active sessions
      await this.enforceSessionLimit(sessionData.userId);

      const session = await this.prisma.userSession.create({
        data: {
          userId: sessionData.userId,
          accessToken: sessionData.refreshToken, // Store refresh token as access token for now
          refreshToken: sessionData.refreshToken,
          expiresAt: sessionData.expiresAt,
          userAgent: sessionData.userAgent,
          ipAddress: sessionData.ipAddress,
          isActive: true,
        },
      });

      this.logger.debug(
        `Session created for user: ${sessionData.userId}, session: ${session.sessionId}`
      );
      return session;
    } catch (error) {
      this.logger.error(`Failed to create session for user: ${sessionData.userId}`, error.stack);
      throw error;
    }
  }

  /**
   * Find session by refresh token
   */
  async findSessionByRefreshToken(refreshToken: string): Promise<UserSession | null> {
    try {
      return await this.prisma.userSession.findFirst({
        where: {
          refreshToken,
          isActive: true,
          expiresAt: { gt: new Date() },
        },
      });
    } catch (error) {
      this.logger.error('Failed to find session by refresh token', error.stack);
      return null;
    }
  }

  /**
   * Find session by session ID
   */
  async findSessionById(sessionId: string): Promise<UserSession | null> {
    try {
      return await this.prisma.userSession.findUnique({
        where: { sessionId },
      });
    } catch (error) {
      this.logger.error(`Failed to find session by ID: ${sessionId}`, error.stack);
      return null;
    }
  }

  /**
   * Get all active sessions for a user
   */
  async getUserActiveSessions(userId: string): Promise<UserSession[]> {
    try {
      return await this.prisma.userSession.findMany({
        where: {
          userId,
          isActive: true,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Failed to get active sessions for user: ${userId}`, error.stack);
      return [];
    }
  }

  /**
   * Update session activity (touch session)
   */
  async touchSession(sessionId: string): Promise<boolean> {
    try {
      await this.prisma.userSession.update({
        where: { sessionId },
        data: { updatedAt: new Date() },
      });
      return true;
    } catch (error) {
      this.logger.error(`Failed to touch session: ${sessionId}`, error.stack);
      return false;
    }
  }

  /**
   * Invalidate a specific session
   */
  async invalidateSession(sessionId: string): Promise<boolean> {
    try {
      await this.prisma.userSession.update({
        where: { id: sessionId },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });

      this.logger.debug(`Session invalidated: ${sessionId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to invalidate session: ${sessionId}`, error.stack);
      return false;
    }
  }

  /**
   * Invalidate all sessions for a user
   */
  async invalidateUserSessions(userId: string): Promise<number> {
    try {
      const result = await this.prisma.userSession.updateMany({
        where: {
          userId,
          isActive: true,
        },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });

      this.logger.log(`Invalidated ${result.count} sessions for user: ${userId}`);
      return result.count;
    } catch (error) {
      this.logger.error(`Failed to invalidate sessions for user: ${userId}`, error.stack);
      return 0;
    }
  }

  /**
   * Invalidate sessions by refresh token
   */
  async invalidateSessionByRefreshToken(refreshToken: string): Promise<boolean> {
    try {
      const result = await this.prisma.userSession.updateMany({
        where: { refreshToken },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });

      this.logger.debug(`Sessions invalidated by refresh token: ${result.count}`);
      return result.count > 0;
    } catch (error) {
      this.logger.error('Failed to invalidate session by refresh token', error.stack);
      return false;
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const result = await this.prisma.userSession.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            {
              isActive: false,
              updatedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // 7 days old
            },
          ],
        },
      });

      this.logger.log(`Cleaned up ${result.count} expired sessions`);
      return result.count;
    } catch (error) {
      this.logger.error('Failed to cleanup expired sessions', error.stack);
      return 0;
    }
  }

  /**
   * Get session statistics for a user
   */
  async getUserSessionStats(userId: string): Promise<{
    totalSessions: number;
    activeSessions: number;
    expiredSessions: number;
  }> {
    try {
      const [total, active, expired] = await Promise.all([
        this.prisma.userSession.count({ where: { userId } }),
        this.prisma.userSession.count({
          where: {
            userId,
            isActive: true,
            expiresAt: { gt: new Date() },
          },
        }),
        this.prisma.userSession.count({
          where: {
            userId,
            OR: [{ isActive: false }, { expiresAt: { lt: new Date() } }],
          },
        }),
      ]);

      return {
        totalSessions: total,
        activeSessions: active,
        expiredSessions: expired,
      };
    } catch (error) {
      this.logger.error(`Failed to get session stats for user: ${userId}`, error.stack);
      return { totalSessions: 0, activeSessions: 0, expiredSessions: 0 };
    }
  }

  /**
   * Enforce session limit per user (security measure)
   */
  private async enforceSessionLimit(userId: string, maxSessions: number = 5): Promise<void> {
    try {
      const activeSessions = await this.getUserActiveSessions(userId);

      if (activeSessions.length >= maxSessions) {
        // Invalidate oldest sessions
        const sessionsToInvalidate = activeSessions
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
          .slice(0, activeSessions.length - maxSessions + 1);

        for (const session of sessionsToInvalidate) {
          await this.invalidateSession(session.id);
        }

        this.logger.log(
          `Enforced session limit for user ${userId}: invalidated ${sessionsToInvalidate.length} old sessions`
        );
      }
    } catch (error) {
      this.logger.error(`Failed to enforce session limit for user: ${userId}`, error.stack);
      // Don't throw - session limit enforcement failure shouldn't break login
    }
  }
}
