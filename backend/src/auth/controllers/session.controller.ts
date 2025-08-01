import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  Request,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SessionManagerService } from '../services/session-manager.service';
import { JwtAuthGuard } from '../guards/auth.guards';
import { CurrentUser, CurrentSession } from '../decorators/auth.decorators';
import { RefreshTokenRequest, RefreshTokenResponse, AuthRequest } from '../types/auth.types';

@ApiTags('session')
@Controller('auth/session')
export class SessionController {
  private readonly logger = new Logger(SessionController.name);

  constructor(private readonly sessionManager: SessionManagerService) {}

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Exchange refresh token for new access and refresh tokens with rotation',
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: RefreshTokenResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
  })
  async refreshToken(@Body() body: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    try {
      if (!body.refreshToken) {
        throw new BadRequestException('Refresh token is required');
      }

      const tokens = await this.sessionManager.refreshSession(body.refreshToken);

      this.logger.debug('Token refresh successful');

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt.toISOString(),
      };
    } catch (error) {
      this.logger.warn(`Token refresh failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  @Delete('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout current session',
    description: 'Revoke the current session and blacklist tokens',
  })
  @ApiResponse({
    status: 204,
    description: 'Logged out successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
  })
  async logout(@CurrentSession('sessionId') sessionId: string): Promise<void> {
    try {
      if (!sessionId) {
        throw new UnauthorizedException('Session context not found');
      }

      await this.sessionManager.revokeSession(sessionId);
      this.logger.debug(`User logged out: session ${sessionId}`);
    } catch (error) {
      this.logger.error(`Logout failed: ${error.message}`);
      throw new UnauthorizedException('Logout failed');
    }
  }

  @Delete('logout-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout all sessions',
    description: 'Revoke all active sessions for the current user',
  })
  @ApiResponse({
    status: 204,
    description: 'All sessions logged out successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
  })
  async logoutAll(@CurrentUser('id') userId: string): Promise<void> {
    try {
      if (!userId) {
        throw new UnauthorizedException('User context not found');
      }

      await this.sessionManager.revokeAllUserSessions(userId);
      this.logger.debug(`All sessions logged out for user ${userId}`);
    } catch (error) {
      this.logger.error(`Logout all failed: ${error.message}`);
      throw new UnauthorizedException('Logout all failed');
    }
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user sessions',
    description: 'List all active sessions for the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Active sessions retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
  })
  async getUserSessions(@CurrentUser('id') userId: string) {
    try {
      if (!userId) {
        throw new UnauthorizedException('User context not found');
      }

      const sessions = await this.sessionManager.getUserSessions(userId);
      
      return {
        sessions: sessions.map(session => ({
          sessionId: session.sessionId,
          createdAt: session.createdAt.toISOString(),
          updatedAt: session.updatedAt.toISOString(),
          expiresAt: session.expiresAt.toISOString(),
          userAgent: session.userAgent,
          ipAddress: session.ipAddress ? this.maskIpAddress(session.ipAddress) : undefined,
        })),
        count: sessions.length,
      };
    } catch (error) {
      this.logger.error(`Failed to get user sessions: ${error.message}`);
      throw new UnauthorizedException('Failed to retrieve sessions');
    }
  }

  @Delete('sessions/:sessionId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Revoke specific session',
    description: 'Revoke a specific session by session ID',
  })
  @ApiResponse({
    status: 204,
    description: 'Session revoked successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found',
  })
  async revokeSession(
    @Param('sessionId') sessionId: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    try {
      if (!userId) {
        throw new UnauthorizedException('User context not found');
      }

      // Verify session belongs to user before revoking
      const userSessions = await this.sessionManager.getUserSessions(userId);
      const sessionExists = userSessions.some(session => session.sessionId === sessionId);

      if (!sessionExists) {
        throw new BadRequestException('Session not found or access denied');
      }

      await this.sessionManager.revokeSession(sessionId);
      this.logger.debug(`Session revoked: ${sessionId} by user ${userId}`);
    } catch (error) {
      this.logger.error(`Session revocation failed: ${error.message}`);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new UnauthorizedException('Session revocation failed');
    }
  }

  @Get('validate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Validate current session',
    description: 'Check if the current session is valid and return user info',
  })
  @ApiResponse({
    status: 200,
    description: 'Session is valid',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired session',
  })
  async validateSession(
    @CurrentUser() user: AuthRequest['user'],
    @CurrentSession() session: AuthRequest['session'],
  ) {
    return {
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        scopes: user.scopes,
      },
      session: {
        sessionId: session.sessionId,
        expiresAt: session.expiresAt.toISOString(),
      },
    };
  }

  // Private helper methods

  private maskIpAddress(ipAddress: string): string {
    // Mask IP address for privacy (show only first two octets)
    const parts = ipAddress.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.*.* `;
    }
    
    // For IPv6 or other formats, mask everything after first segment
    const colonIndex = ipAddress.indexOf(':');
    if (colonIndex > 0) {
      return `${ipAddress.substring(0, colonIndex)}:*:*:*`;
    }
    
    return '*.*.*.*';
  }
}
