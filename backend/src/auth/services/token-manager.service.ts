import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

export interface TokenPayload {
  sub: string; // User ID
  email: string;
  name?: string;
  iat?: number;
  exp?: number;
  jti?: string; // JWT ID for tracking
}

@Injectable()
export class TokenManagerService {
  private readonly logger = new Logger(TokenManagerService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Generate access token (short-lived)
   */
  async generateAccessToken(payload: Omit<TokenPayload, 'jti'>): Promise<string> {
    const jti = this.generateTokenId();
    const tokenPayload: TokenPayload = {
      ...payload,
      jti,
    };

    return this.jwtService.sign(tokenPayload, {
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
      issuer: this.configService.get<string>('JWT_ISSUER', 'helmsman-api'),
      audience: this.configService.get<string>('JWT_AUDIENCE', 'helmsman-app'),
    });
  }

  /**
   * Generate refresh token (long-lived)
   */
  async generateRefreshToken(payload: Omit<TokenPayload, 'jti'>): Promise<string> {
    const jti = this.generateTokenId();
    const tokenPayload: TokenPayload = {
      ...payload,
      jti,
    };

    return this.jwtService.sign(tokenPayload, {
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '30d'),
      issuer: this.configService.get<string>('JWT_ISSUER', 'helmsman-api'),
      audience: this.configService.get<string>('JWT_AUDIENCE', 'helmsman-app'),
    });
  }

  /**
   * Verify access token
   */
  async verifyToken(token: string): Promise<TokenPayload> {
    try {
      return this.jwtService.verify(token, {
        issuer: this.configService.get<string>('JWT_ISSUER', 'helmsman-api'),
        audience: this.configService.get<string>('JWT_AUDIENCE', 'helmsman-app'),
      });
    } catch (error) {
      this.logger.warn(`Token verification failed: ${error.message}`);
      throw new Error('Invalid token');
    }
  }

  /**
   * Verify refresh token
   */
  async verifyRefreshToken(refreshToken: string): Promise<TokenPayload> {
    try {
      return this.jwtService.verify(refreshToken, {
        issuer: this.configService.get<string>('JWT_ISSUER', 'helmsman-api'),
        audience: this.configService.get<string>('JWT_AUDIENCE', 'helmsman-app'),
      });
    } catch (error) {
      this.logger.warn(`Refresh token verification failed: ${error.message}`);
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Get token expiration date
   */
  async getTokenExpiration(token: string): Promise<Date> {
    try {
      const decoded = this.jwtService.decode(token) as TokenPayload;
      if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000); // Convert from seconds to milliseconds
      }
      throw new Error('Token does not contain expiration');
    } catch (error) {
      this.logger.error(`Failed to get token expiration: ${error.message}`);
      throw new Error('Invalid token format');
    }
  }

  /**
   * Blacklist a token (add to blacklist)
   */
  async blacklistToken(token: string): Promise<void> {
    try {
      const decoded = this.jwtService.decode(token) as TokenPayload;
      if (!decoded || !decoded.jti || !decoded.exp) {
        this.logger.warn('Cannot blacklist token: missing jti or expiration');
        return;
      }

      const expiresAt = new Date(decoded.exp * 1000);

      // Only store if token hasn't expired yet
      if (expiresAt > new Date()) {
        await this.prisma.blacklistedToken.create({
          data: {
            tokenId: decoded.jti,
            expiresAt,
          },
        });

        this.logger.debug(`Token blacklisted: ${decoded.jti}`);
      }
    } catch (error) {
      this.logger.error(`Failed to blacklist token: ${error.message}`, error.stack);
      // Don't throw - blacklisting failure shouldn't break logout
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

      return !!blacklistedToken && blacklistedToken.expiresAt > new Date();
    } catch (error) {
      this.logger.error(`Failed to check blacklisted token: ${tokenId}`, error.stack);
      return false;
    }
  }

  /**
   * Clean up expired blacklisted tokens (utility method for cleanup jobs)
   */
  async cleanupExpiredBlacklistedTokens(): Promise<number> {
    try {
      const result = await this.prisma.blacklistedToken.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      });

      this.logger.log(`Cleaned up ${result.count} expired blacklisted tokens`);
      return result.count;
    } catch (error) {
      this.logger.error('Failed to cleanup expired blacklisted tokens', error.stack);
      return 0;
    }
  }

  /**
   * Extract token payload without verification (for debugging)
   */
  decodeToken(token: string): TokenPayload | null {
    try {
      return this.jwtService.decode(token) as TokenPayload;
    } catch (error) {
      this.logger.error(`Failed to decode token: ${error.message}`);
      return null;
    }
  }

  /**
   * Generate unique token ID
   */
  private generateTokenId(): string {
    return crypto.randomUUID();
  }

  /**
   * Validate token structure and required claims
   */
  private validateTokenPayload(payload: any): payload is TokenPayload {
    return (
      payload &&
      typeof payload.sub === 'string' &&
      typeof payload.email === 'string' &&
      typeof payload.iat === 'number' &&
      typeof payload.exp === 'number' &&
      typeof payload.jti === 'string'
    );
  }
}
