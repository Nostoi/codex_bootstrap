import { Injectable, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import * as crypto from 'crypto-js';
import { 
  OAuthProfile, 
  SessionTokens, 
  IAuthService,
  OAuthTokens,
  UserWithProvider,
  AuthResult
} from '../types/auth.types';

@Injectable()
export class GoogleAuthService implements IAuthService {
  private readonly logger = new Logger(GoogleAuthService.name);
  private oauth2Client: any;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.oauth2Client = new google.auth.OAuth2(
      this.configService.get('GOOGLE_CLIENT_ID'),
      this.configService.get('GOOGLE_CLIENT_SECRET'),
      this.configService.get('GOOGLE_CALLBACK_URL'),
    );
  }

  async authenticateUser(profile: OAuthProfile): Promise<SessionTokens> {
    try {
      this.logger.log(`Authenticating user with Google: ${profile.email}`);

      // Find or create user
      let user = await this.prisma.user.findUnique({
        where: { email: profile.email },
        include: { oauthProviders: true }
      });

      if (!user) {
        // Create new user
        user = await this.createUserWithProvider(profile);
      } else {
        // Update or create OAuth provider record
        await this.updateOrCreateProvider(user.id, profile);
      }

      // Generate session tokens
      const tokens = await this.generateSessionTokens(user.id);
      
      // Create session record
      await this.createUserSession(user.id, tokens.refreshToken);

      this.logger.log(`User authenticated successfully: ${user.email}`);
      return tokens;

    } catch (error) {
      this.logger.error(`Authentication failed: ${error.message}`, error.stack);
      throw new UnauthorizedException('Authentication failed');
    }
  }

  async refreshTokens(refreshToken: string): Promise<SessionTokens> {
    try {
      // Find session
      const session = await this.prisma.userSession.findUnique({
        where: { refreshToken },
        include: { user: true }
      });

      if (!session || session.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      // Generate new tokens
      const newTokens = await this.generateSessionTokens(session.userId);

      // Update session
      await this.prisma.userSession.update({
        where: { id: session.id },
        data: {
          refreshToken: newTokens.refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        }
      });

      // Blacklist old refresh token
      await this.prisma.blacklistedToken.create({
        data: {
          tokenId: refreshToken,
          reason: 'Token refreshed',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        }
      });

      return newTokens;

    } catch (error) {
      this.logger.error(`Token refresh failed: ${error.message}`, error.stack);
      throw new UnauthorizedException('Token refresh failed');
    }
  }

  async revokeTokens(userId: string): Promise<void> {
    try {
      // Get all user sessions
      const sessions = await this.prisma.userSession.findMany({
        where: { userId }
      });

      // Blacklist all refresh tokens
      for (const session of sessions) {
        await this.prisma.blacklistedToken.create({
          data: {
            tokenId: session.refreshToken,
            reason: 'User logout',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          }
        });
      }

      // Delete all sessions
      await this.prisma.userSession.deleteMany({
        where: { userId }
      });

      this.logger.log(`All tokens revoked for user: ${userId}`);

    } catch (error) {
      this.logger.error(`Token revocation failed: ${error.message}`, error.stack);
      throw new BadRequestException('Token revocation failed');
    }
  }

  async getOAuthTokens(userId: string): Promise<OAuthTokens | null> {
    try {
      const provider = await this.prisma.oAuthProvider.findFirst({
        where: { 
          userId,
          provider: 'google'
        }
      });

      if (!provider) {
        return null;
      }

      // Decrypt tokens
      const accessToken = this.decryptToken(provider.accessToken);
      const refreshToken = provider.refreshToken 
        ? this.decryptToken(provider.refreshToken)
        : null;

      return {
        accessToken,
        refreshToken,
        expiresAt: provider.tokenExpiry,
        scopes: provider.scopes
      };

    } catch (error) {
      this.logger.error(`Failed to get OAuth tokens: ${error.message}`, error.stack);
      return null;
    }
  }

  async refreshOAuthTokens(userId: string): Promise<OAuthTokens | null> {
    try {
      const provider = await this.prisma.oAuthProvider.findFirst({
        where: { 
          userId,
          provider: 'google'
        }
      });

      if (!provider || !provider.refreshToken) {
        throw new BadRequestException('No refresh token available');
      }

      const refreshToken = this.decryptToken(provider.refreshToken);
      
      // Set refresh token and get new access token
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();

      // Update provider with new tokens
      await this.prisma.oAuthProvider.update({
        where: { id: provider.id },
        data: {
          accessToken: this.encryptToken(credentials.access_token),
          tokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
          lastRefreshed: new Date(),
        }
      });

      return {
        accessToken: credentials.access_token,
        refreshToken: credentials.refresh_token || refreshToken,
        expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
        scopes: provider.scopes
      };

    } catch (error) {
      this.logger.error(`OAuth token refresh failed: ${error.message}`, error.stack);
      return null;
    }
  }

  private async createUserWithProvider(profile: OAuthProfile): Promise<UserWithProvider> {
    return await this.prisma.user.create({
      data: {
        email: profile.email,
        name: profile.name,
        firstName: profile.firstName,
        lastName: profile.lastName,
        picture: profile.picture,
        emailVerified: true, // Google emails are pre-verified
        oauthProviders: {
          create: {
            provider: profile.provider,
            providerId: profile.providerId,
            accessToken: this.encryptToken(profile.accessToken),
            refreshToken: profile.refreshToken 
              ? this.encryptToken(profile.refreshToken) 
              : null,
            scopes: profile.scopes,
            tokenExpiry: null, // Will be updated on first refresh
          }
        }
      },
      include: { oauthProviders: true }
    });
  }

  private async updateOrCreateProvider(userId: string, profile: OAuthProfile): Promise<void> {
    const existingProvider = await this.prisma.oAuthProvider.findFirst({
      where: {
        userId,
        provider: profile.provider
      }
    });

    if (existingProvider) {
      // Update existing provider
      await this.prisma.oAuthProvider.update({
        where: { id: existingProvider.id },
        data: {
          accessToken: this.encryptToken(profile.accessToken),
          refreshToken: profile.refreshToken 
            ? this.encryptToken(profile.refreshToken) 
            : null,
          scopes: profile.scopes,
          lastRefreshed: new Date(),
        }
      });
    } else {
      // Create new provider
      await this.prisma.oAuthProvider.create({
        data: {
          userId,
          provider: profile.provider,
          providerId: profile.providerId,
          accessToken: this.encryptToken(profile.accessToken),
          refreshToken: profile.refreshToken 
            ? this.encryptToken(profile.refreshToken) 
            : null,
          scopes: profile.scopes,
        }
      });
    }
  }

  private async generateSessionTokens(userId: string): Promise<SessionTokens> {
    const payload = { 
      sub: userId, 
      type: 'access',
      iat: Math.floor(Date.now() / 1000)
    };

    const accessToken = this.jwtService.sign(payload, { 
      expiresIn: '15m' 
    });

    const refreshPayload = { 
      sub: userId, 
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000)
    };

    const refreshToken = this.jwtService.sign(refreshPayload, { 
      expiresIn: '7d' 
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900 // 15 minutes
    };
  }

  private async createUserSession(userId: string, refreshToken: string): Promise<void> {
    await this.prisma.userSession.create({
      data: {
        userId,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        userAgent: 'OAuth2 Client',
        ipAddress: '0.0.0.0', // Will be updated by middleware
      }
    });
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
