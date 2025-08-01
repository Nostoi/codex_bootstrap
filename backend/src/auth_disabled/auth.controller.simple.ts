import { Controller, Get, Post, Body, Query, Req, Res, UseGuards, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AuthService } from '../auth.service';
import { SessionManagerService } from '../services/session-manager.service';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly sessionManager: SessionManagerService,
  ) {}

  @Get('google/login')
  async googleLogin(@Query('redirect_uri') redirectUri?: string) {
    try {
      const result = await this.authService.initiateGoogleAuth(redirectUri);
      return result;
    } catch (error) {
      this.logger.error('Google login initiation failed:', error);
      throw error;
    }
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      const result = await this.authService.handleGoogleCallback(code, state);
      
      // Set secure HTTP-only cookie for session
      res.cookie('session_token', result.tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      res.cookie('refresh_token', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      // Redirect to frontend with success
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/success?user=${encodeURIComponent(JSON.stringify(result.user))}`);
    } catch (error) {
      this.logger.error('Google callback failed:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent(error.message)}`);
    }
  }

  @Get('microsoft/login')
  async microsoftLogin(@Query('redirect_uri') redirectUri?: string) {
    try {
      const result = await this.authService.initiateMicrosoftAuth(redirectUri);
      return result;
    } catch (error) {
      this.logger.error('Microsoft login initiation failed:', error);
      throw error;
    }
  }

  @Get('microsoft/callback')
  async microsoftCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      const result = await this.authService.handleMicrosoftCallback(code, state);
      
      // Set secure HTTP-only cookie for session
      res.cookie('session_token', result.tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      res.cookie('refresh_token', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      // Redirect to frontend with success
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/success?user=${encodeURIComponent(JSON.stringify(result.user))}`);
    } catch (error) {
      this.logger.error('Microsoft callback failed:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent(error.message)}`);
    }
  }

  @Post('refresh')
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    try {
      const tokens = await this.sessionManager.refreshSession(refreshToken);
      return { success: true, tokens };
    } catch (error) {
      this.logger.error('Token refresh failed:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getCurrentUser(@Req() req: Request) {
    try {
      const user = await this.authService.getCurrentUser(req.user['sub']);
      return { success: true, user };
    } catch (error) {
      this.logger.error('Get current user failed:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    try {
      const sessionId = req.user['sessionId'];
      await this.sessionManager.revokeSession(sessionId);
      
      // Clear cookies
      res.clearCookie('session_token');
      res.clearCookie('refresh_token');
      
      return res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      this.logger.error('Logout failed:', error);
      throw error;
    }
  }
}
