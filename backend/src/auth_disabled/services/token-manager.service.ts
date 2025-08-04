import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
import { JWTPayload, SessionTokens, ITokenManager } from '../types/auth.types';

/**
 * TokenManager Service
 * Handles JWT token generation, verification, encryption, and blacklisting
 * Implements secure token management with refresh rotation
 */
@Injectable()
export class TokenManagerService implements ITokenManager {
  private readonly logger = new Logger(TokenManagerService.name);
  private readonly encryptionKey: Buffer;
  private readonly algorithm = 'aes-256-gcm';

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {
    // Derive encryption key from environment variable
    const encryptionSecret =
      this.configService.get<string>('JWT_ENCRYPTION_KEY') || 'fallback-key-change-in-production';
    this.encryptionKey = Buffer.from(encryptionSecret.padEnd(32, '0').slice(0, 32));
  }

  /**
   * Generate JWT access token with user payload
   */
  generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp' | 'jti'>): string {
    const jti = this.generateTokenId();
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '15m';

    const fullPayload: JWTPayload = {
      ...payload,
      jti,
      iat: now,
      exp: this.calculateExpiration(expiresIn),
    };

    try {
      const token = this.jwtService.sign(fullPayload);
      this.logger.debug(`Generated access token for user ${payload.sub}`);
      return token;
    } catch (error) {
      this.logger.error(`Failed to generate access token: ${error.message}`);
      throw new Error('Token generation failed');
    }
  }

  /**
   * Generate secure refresh token
   */
  generateRefreshToken(): string {
    try {
      // Generate cryptographically secure random token
      const tokenBytes = randomBytes(32);
      return tokenBytes.toString('base64url');
    } catch (error) {
      this.logger.error(`Failed to generate refresh token: ${error.message}`);
      throw new Error('Refresh token generation failed');
    }
  }

  /**
   * Verify and decode JWT access token
   */
  verifyAccessToken(token: string): JWTPayload {
    try {
      const payload = this.jwtService.verify<JWTPayload>(token);

      // Validate required fields
      if (!payload.sub || !payload.email || !payload.jti) {
        throw new Error('Invalid token payload structure');
      }

      return payload;
    } catch (error) {
      this.logger.warn(`Token verification failed: ${error.message}`);
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Verify refresh token and extract session info
   * Note: Refresh tokens are stored in database, not as JWTs
   */
  async verifyRefreshToken(token: string): Promise<{ userId: string; sessionId: string }> {
    try {
      // Find the session with this refresh token
      const session = await this.prisma.userSession.findFirst({
        where: {
          refreshToken: token,
          isActive: true,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          user: true,
        },
      });

      if (!session) {
        throw new Error('Invalid or expired refresh token');
      }

      return {
        userId: session.userId,
        sessionId: session.sessionId,
      };
    } catch (error) {
      this.logger.warn(`Refresh token verification failed: ${error.message}`);
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Encrypt sensitive tokens for database storage
   */
  encryptToken(token: string): string {
    try {
      const iv = randomBytes(16);
      const cipher = createCipheriv(this.algorithm, this.encryptionKey, iv);

      let encrypted = cipher.update(token, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      // Combine IV, auth tag, and encrypted data
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      this.logger.error(`Token encryption failed: ${error.message}`);
      throw new Error('Token encryption failed');
    }
  }

  /**
   * Decrypt tokens from database
   */
  decryptToken(encryptedToken: string): string {
    try {
      const [ivHex, authTagHex, encrypted] = encryptedToken.split(':');

      if (!ivHex || !authTagHex || !encrypted) {
        throw new Error('Invalid encrypted token format');
      }

      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      const decipher = createDecipheriv(this.algorithm, this.encryptionKey, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      this.logger.error(`Token decryption failed: ${error.message}`);
      throw new Error('Token decryption failed');
    }
  }

  /**
   * Add token to blacklist for security
   */
  async blacklistToken(tokenId: string, expiresAt: Date): Promise<void> {
    try {
      await this.prisma.blacklistedToken.create({
        data: {
          tokenId,
          expiresAt,
        },
      });

      this.logger.debug(`Blacklisted token: ${tokenId}`);
    } catch (error) {
      this.logger.error(`Failed to blacklist token: ${error.message}`);
      throw new Error('Token blacklisting failed');
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
      this.logger.error(`Failed to check token blacklist: ${error.message}`);
      return false; // Fail open for availability
    }
  }

  /**
   * Cleanup expired blacklisted tokens
   */
  async cleanupExpiredTokens(): Promise<void> {
    try {
      const result = await this.prisma.blacklistedToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      if (result.count > 0) {
        this.logger.debug(`Cleaned up ${result.count} expired blacklisted tokens`);
      }
    } catch (error) {
      this.logger.error(`Token cleanup failed: ${error.message}`);
    }
  }

  // Private helper methods

  private generateTokenId(): string {
    return randomBytes(16).toString('base64url');
  }

  private calculateExpiration(expiresIn: string): number {
    const now = Math.floor(Date.now() / 1000);
    const duration = this.parseDuration(expiresIn);
    return now + duration;
  }

  private parseDuration(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid duration format: ${duration}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 60 * 60 * 24;
      default:
        throw new Error(`Unknown duration unit: ${unit}`);
    }
  }
}
