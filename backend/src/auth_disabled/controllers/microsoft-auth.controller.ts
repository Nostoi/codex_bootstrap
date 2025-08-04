import { Controller, Get, Req, Res, UseGuards, Logger, HttpStatus, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { MicrosoftAuthService } from '../services/microsoft-auth.service';
import { ConfigService } from '@nestjs/config';
import { OAuthProfile } from '../types/auth.types';
import '../types/express'; // Import type extensions

@Controller('auth/microsoft')
export class MicrosoftAuthController {
  private readonly logger = new Logger(MicrosoftAuthController.name);

  constructor(
    private microsoftAuthService: MicrosoftAuthService,
    private configService: ConfigService
  ) {}

  @Get('login')
  async microsoftLogin(
    @Query('redirect_uri') redirectUri?: string,
    @Query('user_id') userId?: string,
    @Res() res?: Response
  ) {
    try {
      this.logger.log('Initiating Microsoft OAuth login');

      const { authUrl, state } = await this.microsoftAuthService.initiateOAuth('microsoft', {
        redirectUri,
        userId,
        scopes: [
          'openid',
          'profile',
          'email',
          'https://graph.microsoft.com/Calendars.ReadWrite',
          'https://graph.microsoft.com/Calendars.Read',
        ],
      });

      // Store state in session or cookie for validation
      if (res) {
        res.cookie('oauth_state', state, {
          httpOnly: true,
          secure: this.configService.get('NODE_ENV') === 'production',
          sameSite: 'lax',
          maxAge: 10 * 60 * 1000, // 10 minutes
        });

        return res.redirect(authUrl);
      }

      return { authUrl, state };
    } catch (error) {
      this.logger.error(`Microsoft OAuth initiation failed: ${error.message}`, error.stack);

      if (res) {
        const errorUrl = `${this.configService.get('FRONTEND_URL')}/login?error=auth_init_failed`;
        return res.redirect(errorUrl);
      }

      throw error;
    }
  }

  @Get('callback')
  async microsoftLoginCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error?: string,
    @Req() req?: Request,
    @Res() res?: Response
  ) {
    try {
      this.logger.log('Processing Microsoft OAuth callback');

      // Check for OAuth errors
      if (error) {
        this.logger.error(`Microsoft OAuth error: ${error}`);
        const errorUrl = `${this.configService.get('FRONTEND_URL')}/login?error=oauth_error`;
        return res?.redirect(errorUrl);
      }

      if (!code || !state) {
        this.logger.error('Missing authorization code or state parameter');
        const errorUrl = `${this.configService.get('FRONTEND_URL')}/login?error=missing_params`;
        return res?.redirect(errorUrl);
      }

      // Validate state (CSRF protection)
      const storedState = req?.cookies?.oauth_state;
      if (storedState !== state) {
        this.logger.error('OAuth state mismatch - possible CSRF attack');
        const errorUrl = `${this.configService.get('FRONTEND_URL')}/login?error=state_mismatch`;
        return res?.redirect(errorUrl);
      }

      // Handle OAuth callback
      const authResult = await this.microsoftAuthService.handleCallback('microsoft', code, state);

      if (!authResult) {
        this.logger.error('No auth result received from Microsoft OAuth');
        const errorUrl = `${this.configService.get('FRONTEND_URL')}/login?error=auth_failed`;
        return res?.redirect(errorUrl);
      }

      // Set secure HTTP-only cookies
      if (res) {
        this.setAuthCookies(res, authResult.tokens);

        // Clear the OAuth state cookie
        res.clearCookie('oauth_state');

        // Redirect to frontend dashboard
        const redirectParams = authResult.isNewUser ? '?welcome=true' : '?auth=success';
        const redirectUrl = `${this.configService.get('FRONTEND_URL')}/dashboard${redirectParams}`;

        this.logger.log(`Redirecting authenticated user to: ${redirectUrl}`);
        return res.redirect(redirectUrl);
      }

      return authResult;
    } catch (error) {
      this.logger.error(`Microsoft OAuth callback failed: ${error.message}`, error.stack);

      if (res) {
        // Clear the OAuth state cookie
        res.clearCookie('oauth_state');

        const errorUrl = `${this.configService.get('FRONTEND_URL')}/login?error=auth_failed`;
        return res.redirect(errorUrl);
      }

      throw error;
    }
  }

  @Get('refresh')
  async refreshToken(@Req() req: Request, @Res() res: Response) {
    try {
      const refreshToken = req.cookies?.refresh_token;

      if (!refreshToken) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          error: 'MISSING_REFRESH_TOKEN',
          message: 'Refresh token not found',
        });
      }

      const tokens = await this.microsoftAuthService.refreshSession(refreshToken);

      // Set new cookies
      this.setAuthCookies(res, tokens);

      return res.json({
        message: 'Tokens refreshed successfully',
        expiresAt: tokens.expiresAt,
      });
    } catch (error) {
      this.logger.error(`Token refresh failed: ${error.message}`, error.stack);

      // Clear potentially invalid cookies
      this.clearAuthCookies(res);

      return res.status(HttpStatus.UNAUTHORIZED).json({
        error: 'TOKEN_REFRESH_FAILED',
        message: 'Failed to refresh authentication tokens',
      });
    }
  }

  @Get('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    try {
      const refreshToken = req.cookies?.refresh_token;

      if (refreshToken) {
        // Extract user ID from refresh token to revoke all sessions
        try {
          const decoded = req.user as any; // This would come from a JWT guard
          if (decoded?.sub) {
            await this.microsoftAuthService.revokeAllUserSessions(decoded.sub);
          }
        } catch (decodeError) {
          this.logger.warn(`Could not decode refresh token for logout: ${decodeError.message}`);
        }
      }

      // Clear authentication cookies
      this.clearAuthCookies(res);

      const logoutUrl = `${this.configService.get('FRONTEND_URL')}/login?logout=success`;
      return res.redirect(logoutUrl);
    } catch (error) {
      this.logger.error(`Logout failed: ${error.message}`, error.stack);

      // Still clear cookies even if logout fails
      this.clearAuthCookies(res);

      const errorUrl = `${this.configService.get('FRONTEND_URL')}/login?error=logout_failed`;
      return res.redirect(errorUrl);
    }
  }

  @Get('permissions/calendar')
  async requestCalendarPermissions(@Query('user_id') userId: string, @Res() res?: Response) {
    try {
      if (!userId) {
        const error = { error: 'MISSING_USER_ID', message: 'User ID is required' };
        return res ? res.status(HttpStatus.BAD_REQUEST).json(error) : error;
      }

      const { authUrl, state } = await this.microsoftAuthService.requestCalendarPermissions(
        userId,
        'microsoft'
      );

      if (res) {
        // Store state for validation
        res.cookie('calendar_oauth_state', state, {
          httpOnly: true,
          secure: this.configService.get('NODE_ENV') === 'production',
          sameSite: 'lax',
          maxAge: 10 * 60 * 1000, // 10 minutes
        });

        return res.redirect(authUrl);
      }

      return { authUrl, state };
    } catch (error) {
      this.logger.error(`Calendar permissions request failed: ${error.message}`, error.stack);

      if (res) {
        const errorUrl = `${this.configService.get('FRONTEND_URL')}/settings?error=calendar_auth_failed`;
        return res.redirect(errorUrl);
      }

      throw error;
    }
  }

  @Get('permissions/calendar/status')
  async getCalendarPermissions(@Query('user_id') userId: string) {
    try {
      if (!userId) {
        return { error: 'MISSING_USER_ID', message: 'User ID is required' };
      }

      const permissions = await this.microsoftAuthService.getCalendarPermissions(userId);
      return { permissions };
    } catch (error) {
      this.logger.error(`Get calendar permissions failed: ${error.message}`, error.stack);
      return { error: 'PERMISSION_CHECK_FAILED', message: 'Failed to check calendar permissions' };
    }
  }

  private setAuthCookies(res: Response, tokens: any) {
    const isProduction = this.configService.get('NODE_ENV') === 'production';

    // Calculate expiry time for access token (default 15 minutes if not provided)
    const accessTokenExpiry = tokens.expiresAt
      ? tokens.expiresAt.getTime() - Date.now()
      : 15 * 60 * 1000; // 15 minutes default

    // Set access token cookie
    res.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: accessTokenExpiry,
      path: '/',
    });

    // Set refresh token cookie (7 days)
    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });
  }

  private clearAuthCookies(res: Response) {
    const cookieOptions = {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite:
        this.configService.get('NODE_ENV') === 'production' ? ('none' as const) : ('lax' as const),
      path: '/',
    };

    res.clearCookie('access_token', cookieOptions);
    res.clearCookie('refresh_token', cookieOptions);
    res.clearCookie('oauth_state', cookieOptions);
    res.clearCookie('calendar_oauth_state', cookieOptions);
  }
}
