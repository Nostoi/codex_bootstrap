import {
  Controller,
  Get,
  Post,
  Patch,
  Req,
  Res,
  Body,
  Query,
  Param,
  UseGuards,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { SessionManagerService } from './services/session-manager.service';
import { TokenManagerService } from './services/token-manager.service';
import { MicrosoftAuthService } from './services/microsoft-auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User } from './decorators/user.decorator';
import { UserWithProvider } from './types/auth.types';

interface RefreshTokenRequest {
  refreshToken: string;
}

interface UpdateProfileRequest {
  name?: string;
  avatar?: string;
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private sessionManager: SessionManagerService,
    private tokenManager: TokenManagerService,
    private microsoftAuthService: MicrosoftAuthService,
    private configService: ConfigService,
  ) {}

  /**
   * Initiate OAuth login for supported providers
   * GET /auth/{provider}/login
   */
  @Get(':provider/login')
  @ApiOperation({ 
    summary: 'Initiate OAuth login',
    description: 'Redirects user to OAuth provider for authentication'
  })
  @ApiResponse({ status: 302, description: 'Redirect to OAuth provider' })
  async initiateLogin(
    @Param('provider') provider: string,
    @Query('redirect_uri') redirectUri?: string,
    @Query('scopes') scopes?: string,
    @Res() res?: Response
  ) {
    try {
      this.logger.log(`Initiating OAuth login for provider: ${provider}`);

      // Validate provider
      if (!['microsoft', 'google'].includes(provider)) {
        throw new HttpException('Unsupported OAuth provider', HttpStatus.BAD_REQUEST);
      }

      // Parse additional scopes if provided
      const additionalScopes = scopes ? scopes.split(',').map(s => s.trim()) : [];

      let authUrl: string;
      let state: string;

      if (provider === 'microsoft') {
        const result = await this.microsoftAuthService.initiateOAuth('microsoft', {
          redirectUri,
          scopes: [
            'openid',
            'profile', 
            'email',
            'https://graph.microsoft.com/Calendars.ReadWrite',
            'https://graph.microsoft.com/Calendars.Read',
            ...additionalScopes
          ]
        });
        authUrl = result.authUrl;
        state = result.state;
      } else {
        // TODO: Implement Google OAuth when GoogleAuthService is ready
        throw new HttpException('Google OAuth not yet implemented', HttpStatus.NOT_IMPLEMENTED);
      }

      // Store state in secure cookie for CSRF protection
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
      this.logger.error(`OAuth initiation failed for ${provider}:`, error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Failed to initiate OAuth login',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Handle OAuth callback and create user session
   * GET /auth/{provider}/callback
   */
  @Get(':provider/callback')
  @ApiOperation({
    summary: 'OAuth callback handler',
    description: 'Handles OAuth provider callback and creates user session'
  })
  @ApiResponse({ status: 302, description: 'Redirect to frontend with session token' })
  async handleCallback(
    @Param('provider') provider: string,
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Query('error') error?: string,
    @Req() req?: Request,
    @Res() res?: Response
  ) {
    try {
      this.logger.log(`Handling OAuth callback for provider: ${provider}`);

      // Check for OAuth errors
      if (error) {
        this.logger.error(`OAuth error: ${error}`);
        const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
        return res?.redirect(`${frontendUrl}/login?error=${error}`);
      }

      // Validate required parameters
      if (!code || !state) {
        throw new HttpException('Missing required OAuth parameters', HttpStatus.BAD_REQUEST);
      }

      // Validate state parameter for CSRF protection
      const storedState = req?.cookies?.oauth_state;
      if (!storedState || storedState !== state) {
        throw new HttpException('Invalid state parameter', HttpStatus.BAD_REQUEST);
      }

      // Exchange authorization code for tokens and user profile
      let authResult: AuthResult;
      
      if (provider === 'microsoft') {
        authResult = await this.microsoftAuthService.handleCallback('microsoft', code, state);
      } else {
        throw new HttpException('Unsupported provider', HttpStatus.BAD_REQUEST);
      }

      // The tokens are already created by the Microsoft auth service
      const sessionTokens = authResult.tokens;

      // Clear OAuth state cookie
      res?.clearCookie('oauth_state');

      // Redirect to frontend with tokens
      const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
      const redirectUrl = `${frontendUrl}?token=${sessionTokens.accessToken}&refresh=${sessionTokens.refreshToken}`;
      
      return res?.redirect(redirectUrl);

    } catch (error) {
      this.logger.error(`OAuth callback failed for ${provider}:`, error);
      
      const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
      return res?.redirect(`${frontendUrl}/login?error=auth_failed`);
    }
  }

  /**
   * Refresh access token using refresh token
   * POST /auth/refresh
   */
  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Exchanges refresh token for new access token'
  })
  @ApiResponse({ status: 200, description: 'New access token issued' })
  async refreshToken(@Body() body: RefreshTokenRequest) {
    try {
      this.logger.log('Processing token refresh request');

      if (!body.refreshToken) {
        throw new HttpException('Refresh token is required', HttpStatus.BAD_REQUEST);
      }

      const newTokens = await this.sessionManager.refreshSession(body.refreshToken);
      
      return {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        expiresAt: newTokens.expiresAt,
      };
    } catch (error) {
      this.logger.error('Token refresh failed:', error);
      
      throw new HttpException(
        {
          error: {
            code: 'auth/token-invalid',
            message: 'Refresh token is invalid or expired'
          }
        },
        HttpStatus.UNAUTHORIZED
      );
    }
  }

  /**
   * Logout current session
   * POST /auth/logout
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout current session',
    description: 'Revokes current session and invalidates tokens'
  })
  @ApiResponse({ status: 200, description: 'Successfully logged out' })
  async logout(@Req() req: Request) {
    try {
      this.logger.log('Processing logout request');

      // Extract refresh token from session or cookies
      const refreshToken = req.cookies?.refresh_token || req.headers['x-refresh-token'];
      
      if (refreshToken) {
        await this.sessionManager.terminateSession(refreshToken as string);
      }

      return {
        success: true,
        message: 'Successfully logged out'
      };
    } catch (error) {
      this.logger.error('Logout failed:', error);
      
      throw new HttpException(
        'Failed to logout',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Logout all sessions
   * POST /auth/logout-all
   */
  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout all sessions',
    description: 'Revokes all user sessions across all devices'
  })
  @ApiResponse({ status: 200, description: 'All sessions revoked' })
  async logoutAll(@User() user: UserWithProvider) {
    try {
      this.logger.log(`Processing logout-all request for user: ${user.id}`);

      const revokedCount = await this.sessionManager.terminateAllSessions(user.id);

      return {
        success: true,
        message: 'All sessions revoked',
        revokedSessions: revokedCount
      };
    } catch (error) {
      this.logger.error('Logout-all failed:', error);
      
      throw new HttpException(
        'Failed to revoke all sessions',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get authenticated user profile
   * GET /auth/profile
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user profile',
    description: 'Returns authenticated user profile information'
  })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  async getProfile(@User() user: UserWithProvider) {
    try {
      this.logger.log(`Retrieving profile for user: ${user.id}`);

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        providers: user.oauthProviders?.map(provider => ({
          provider: provider.provider,
          email: provider.email,
          hasCalendarAccess: provider.scopes?.includes('calendar') || false,
          scopes: provider.scopes || [],
        })) || [],
        createdAt: user.createdAt,
        lastLoginAt: user.updatedAt,
      };
    } catch (error) {
      this.logger.error('Failed to retrieve user profile:', error);
      
      throw new HttpException(
        'Failed to retrieve profile',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Update user profile
   * PATCH /auth/profile
   */
  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update user profile',
    description: 'Updates user profile information'
  })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(
    @User() user: UserWithProvider,
    @Body() updateData: UpdateProfileRequest
  ) {
    try {
      this.logger.log(`Updating profile for user: ${user.id}`);

      // TODO: Implement user profile update in UserService
      // For now, return the current profile with updates
      return {
        id: user.id,
        email: user.email,
        name: updateData.name || user.name,
        avatar: updateData.avatar || user.avatar,
        updatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to update user profile:', error);
      
      throw new HttpException(
        'Failed to update profile',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
