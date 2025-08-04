import { 
  Controller, 
  Get, 
  Post, 
  Query, 
  Param, 
  Redirect, 
  BadRequestException,
  UnauthorizedException,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { GraphAuthService } from './graph-auth.service';

/**
 * Microsoft Graph Authentication Controller
 * Handles OAuth 2.0 authorization flows
 */
@ApiTags('auth')
@Controller('auth/microsoft')
export class GraphAuthController {
  constructor(private readonly graphAuthService: GraphAuthService) {}

  /**
   * Initiate Microsoft Graph OAuth 2.0 authorization flow
   */
  @Get('authorize/:userId')
  @ApiOperation({ 
    summary: 'Start Microsoft Graph authorization flow',
    description: 'Redirects user to Microsoft consent page for calendar permissions'
  })
  @ApiResponse({ 
    status: 302, 
    description: 'Redirects to Microsoft authorization URL' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid request parameters' 
  })
  @Redirect()
  async authorize(
    @Param('userId') userId: string,
    @Query('state') state?: string,
  ) {
    try {
      const authUrl = await this.graphAuthService.getAuthorizationUrl(userId, state);
      
      return {
        url: authUrl,
        statusCode: 302,
      };
    } catch (error) {
      throw new BadRequestException('Failed to generate authorization URL');
    }
  }

  /**
   * Handle OAuth 2.0 callback from Microsoft
   */
  @Get('callback')
  @ApiOperation({ 
    summary: 'Handle Microsoft OAuth callback',
    description: 'Processes authorization code and exchanges it for access tokens'
  })
  @ApiQuery({ name: 'code', description: 'Authorization code from Microsoft' })
  @ApiQuery({ name: 'state', description: 'State parameter containing user ID' })
  @ApiQuery({ name: 'error', required: false, description: 'Error code if authorization failed' })
  @ApiResponse({ 
    status: 200, 
    description: 'Authentication successful',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        userId: { type: 'string' },
        userInfo: { type: 'object' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Authorization failed or invalid parameters' 
  })
  async callback(
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Query('error') error?: string,
    @Query('error_description') errorDescription?: string,
  ) {
    // Handle authorization errors
    if (error) {
      throw new BadRequestException(`Authorization failed: ${error} - ${errorDescription || 'Unknown error'}`);
    }

    // Validate required parameters
    if (!code || !state) {
      throw new BadRequestException('Missing required parameters: code and state');
    }

    try {
      // Exchange code for tokens
      const authResult = await this.graphAuthService.exchangeCodeForTokens(code, state, state);
      
      // Get user information
      const userInfo = await this.graphAuthService.getUserInfo(state);
      
      return {
        success: true,
        message: 'Microsoft Graph authentication successful',
        userId: state,
        userInfo: {
          id: userInfo.id,
          displayName: userInfo.displayName,
          userPrincipalName: userInfo.userPrincipalName,
          mail: userInfo.mail,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Failed to complete authentication');
    }
  }

  /**
   * Check authentication status for a user
   */
  @Get('status/:userId')
  @ApiOperation({ 
    summary: 'Check Microsoft Graph authentication status',
    description: 'Returns whether user has valid Microsoft Graph authentication'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Authentication status retrieved',
    schema: {
      type: 'object',
      properties: {
        authenticated: { type: 'boolean' },
        userId: { type: 'string' },
        userInfo: { type: 'object', nullable: true }
      }
    }
  })
  async getAuthStatus(@Param('userId') userId: string) {
    try {
      const isUserAuthenticated = await this.graphAuthService.isUserAuthenticated(userId);
      
      let userInfo = null;
      if (isUserAuthenticated) {
        try {
          userInfo = await this.graphAuthService.getUserInfo(userId);
        } catch (error) {
          // If we can't get user info, the authentication might be invalid
          return {
            authenticated: false,
            userId,
            userInfo: null,
          };
        }
      }

      return {
        authenticated: isUserAuthenticated,
        userId,
        userInfo: userInfo ? {
          id: userInfo.id,
          displayName: userInfo.displayName,
          userPrincipalName: userInfo.userPrincipalName,
          mail: userInfo.mail,
        } : null,
      };
    } catch (error) {
      return {
        authenticated: false,
        userId,
        userInfo: null,
      };
    }
  }

  /**
   * Refresh access token for a user
   */
  @Post('refresh/:userId')
  @ApiOperation({ 
    summary: 'Refresh Microsoft Graph access token',
    description: 'Manually refresh the access token using refresh token'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Token refreshed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        userId: { type: 'string' }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Refresh failed, re-authentication required' 
  })
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Param('userId') userId: string) {
    try {
      await this.graphAuthService.getAccessToken(userId); // This will trigger refresh if needed
      
      return {
        success: true,
        message: 'Token refreshed successfully',
        userId,
      };
    } catch (error) {
      throw new UnauthorizedException('Token refresh failed, re-authentication required');
    }
  }

  /**
   * Revoke authentication and clear tokens
   */
  @Post('revoke/:userId')
  @ApiOperation({ 
    summary: 'Revoke Microsoft Graph authentication',
    description: 'Clears stored tokens and revokes access'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Authentication revoked successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        userId: { type: 'string' }
      }
    }
  })
  @HttpCode(HttpStatus.OK)
  async revokeAuth(@Param('userId') userId: string) {
    try {
      await this.graphAuthService.revokeAuthentication(userId);
      
      return {
        success: true,
        message: 'Authentication revoked successfully',
        userId,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to revoke authentication',
        userId,
      };
    }
  }

  /**
   * Get user's Microsoft Graph profile
   */
  @Get('profile/:userId')
  @ApiOperation({ 
    summary: 'Get Microsoft Graph user profile',
    description: 'Retrieves user profile information from Microsoft Graph'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User profile retrieved successfully'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'User not authenticated with Microsoft Graph' 
  })
  async getUserProfile(@Param('userId') userId: string) {
    try {
      const userInfo = await this.graphAuthService.getUserInfo(userId);
      
      return {
        success: true,
        userInfo,
      };
    } catch (error) {
      throw new UnauthorizedException('Failed to retrieve user profile');
    }
  }

  /**
   * Get authentication status
   */
  @Get('status/:userId')
  @ApiOperation({ summary: 'Check authentication status' })
  async status(@Param('userId') userId: string) {
    const authenticated = await this.graphAuthService.isUserAuthenticated(userId);
    return { authenticated };
  }

  /**
   * Refresh tokens
   */
  @Post('refresh/:userId')
  @ApiOperation({ summary: 'Refresh access tokens' })
  async refresh(@Param('userId') userId: string) {
    const tokens = await this.graphAuthService.refreshTokens(userId);
    return { success: true, tokens };
  }

  /**
   * Revoke access
   */
  @Post('revoke/:userId')
  @ApiOperation({ summary: 'Revoke user access' })
  async revoke(@Param('userId') userId: string) {
    await this.graphAuthService.revokeAccess(userId);
    return { success: true };
  }

  /**
   * Get user profile
   */
  @Get('profile/:userId')
  @ApiOperation({ summary: 'Get user profile' })
  async profile(@Param('userId') userId: string) {
    const profile = await this.graphAuthService.getUserProfile(userId);
    return { success: true, profile };
  }
}
