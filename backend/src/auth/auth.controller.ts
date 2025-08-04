import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService, LoginResult } from './services/auth.service';
import { SessionManagerService } from './services/session-manager.service';
import { Request, Response } from 'express';

interface AuthenticatedRequest extends Request {
  user: LoginResult;
}

interface JwtAuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    name?: string;
    tokenId: string;
  };
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly sessionManager: SessionManagerService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Initiate Google OAuth login
   * GET /auth/google
   */
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth(@Req() req: Request) {
    // Store redirect URL in session if provided
    const redirectUrl = req.query.redirect_uri as string;
    if (redirectUrl) {
      // You could store this in session/state for after callback
      this.logger.debug(`Google auth initiated with redirect: ${redirectUrl}`);
    }
    // Passport will redirect to Google OAuth consent page
  }

  /**
   * Google OAuth callback handler
   * GET /auth/google/callback
   */
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    try {
      this.logger.log(`Google OAuth callback successful for user: ${req.user.user.email}`);

      const { accessToken, refreshToken } = req.user;
      const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');

      // Extract request metadata for session tracking
      const userAgent = req.get('User-Agent');
      const ipAddress = req.ip || req.connection.remoteAddress;

      // Redirect to frontend with tokens
      const redirectUrl = `${frontendUrl}/auth/success?token=${accessToken}&refresh=${refreshToken}`;

      this.logger.debug(`Redirecting to frontend: ${frontendUrl}/auth/success`);
      return res.redirect(redirectUrl);
    } catch (error) {
      this.logger.error(`Google OAuth callback failed: ${error.message}`, error.stack);
      const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
      return res.redirect(`${frontendUrl}/auth/error?error=oauth_failed`);
    }
  }

  /**
   * Initiate Microsoft OAuth login
   * GET /auth/microsoft
   */
  @Get('microsoft')
  @UseGuards(AuthGuard('microsoft'))
  microsoftAuth(@Req() req: Request) {
    const redirectUrl = req.query.redirect_uri as string;
    if (redirectUrl) {
      this.logger.debug(`Microsoft auth initiated with redirect: ${redirectUrl}`);
    }
    // Passport will redirect to Microsoft OAuth consent page
  }

  /**
   * Microsoft OAuth callback handler
   * GET /auth/microsoft/callback
   */
  @Get('microsoft/callback')
  @UseGuards(AuthGuard('microsoft'))
  async microsoftAuthCallback(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    try {
      this.logger.log(`Microsoft OAuth callback successful for user: ${req.user.user.email}`);

      const { accessToken, refreshToken } = req.user;
      const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');

      // Redirect to frontend with tokens
      const redirectUrl = `${frontendUrl}/auth/success?token=${accessToken}&refresh=${refreshToken}`;

      this.logger.debug(`Redirecting to frontend: ${frontendUrl}/auth/success`);
      return res.redirect(redirectUrl);
    } catch (error) {
      this.logger.error(`Microsoft OAuth callback failed: ${error.message}`, error.stack);
      const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
      return res.redirect(`${frontendUrl}/auth/error?error=oauth_failed`);
    }
  }

  /**
   * Refresh access token
   * POST /auth/refresh
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(@Body() body: { refreshToken: string }) {
    try {
      const { refreshToken } = body;

      if (!refreshToken) {
        throw new BadRequestException('Refresh token is required');
      }

      this.logger.debug('Token refresh requested');
      const tokens = await this.authService.refreshAccessToken(refreshToken);

      this.logger.log('Token refresh successful');
      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
      };
    } catch (error) {
      this.logger.error(`Token refresh failed: ${error.message}`, error.stack);
      throw new UnauthorizedException('Token refresh failed');
    }
  }

  /**
   * Logout user
   * POST /auth/logout
   */
  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: JwtAuthenticatedRequest, @Body() body: { refreshToken?: string }) {
    try {
      const { refreshToken } = body;
      const user = req.user;

      this.logger.debug(`Logout requested for user: ${user.email}`);

      // Invalidate refresh token if provided
      if (refreshToken) {
        await this.sessionManager.invalidateSessionByRefreshToken(refreshToken);
      }

      // Blacklist current access token and invalidate sessions
      await this.authService.logout(user.id, user.tokenId);

      this.logger.log(`User logged out successfully: ${user.email}`);
      return { message: 'Logout successful' };
    } catch (error) {
      this.logger.error(`Logout failed: ${error.message}`, error.stack);
      // Don't throw error for logout - return success even if cleanup fails
      return { message: 'Logout completed' };
    }
  }

  /**
   * Get current user profile
   * GET /auth/profile
   */
  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Req() req: JwtAuthenticatedRequest) {
    try {
      const user = await this.authService.findUserById(req.user.id);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      this.logger.debug(`Profile requested for user: ${user.email}`);

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        createdAt: user.createdAt,
        oauthProviders:
          user.oauthProviders?.map(provider => ({
            provider: provider.provider,
            scopes: provider.scopes,
          })) || [],
      };
    } catch (error) {
      this.logger.error(`Get profile failed: ${error.message}`, error.stack);
      throw new UnauthorizedException('Unable to retrieve profile');
    }
  }

  /**
   * Get user sessions
   * GET /auth/sessions
   */
  @Get('sessions')
  @UseGuards(AuthGuard('jwt'))
  async getSessions(@Req() req: JwtAuthenticatedRequest) {
    try {
      const sessions = await this.sessionManager.getUserActiveSessions(req.user.id);
      const stats = await this.sessionManager.getUserSessionStats(req.user.id);

      return {
        sessions: sessions.map(session => ({
          id: session.sessionId,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          userAgent: session.userAgent,
          ipAddress: session.ipAddress,
          expiresAt: session.expiresAt,
        })),
        stats,
      };
    } catch (error) {
      this.logger.error(`Get sessions failed: ${error.message}`, error.stack);
      throw new UnauthorizedException('Unable to retrieve sessions');
    }
  }

  /**
   * Revoke a specific session
   * DELETE /auth/sessions/:sessionId
   */
  @Post('sessions/revoke')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async revokeSession(@Req() req: JwtAuthenticatedRequest, @Body() body: { sessionId: string }) {
    try {
      const { sessionId } = body;

      if (!sessionId) {
        throw new BadRequestException('Session ID is required');
      }

      const success = await this.sessionManager.invalidateSession(sessionId);

      if (success) {
        this.logger.log(`Session revoked: ${sessionId} by user: ${req.user.email}`);
        return { message: 'Session revoked successfully' };
      } else {
        throw new BadRequestException('Session not found or already revoked');
      }
    } catch (error) {
      this.logger.error(`Session revocation failed: ${error.message}`, error.stack);
      throw new BadRequestException('Session revocation failed');
    }
  }
}
