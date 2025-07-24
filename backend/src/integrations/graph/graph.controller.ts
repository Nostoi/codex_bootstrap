import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { GraphService } from './graph.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('integrations')
@Controller('integrations/microsoft')
export class GraphController {
  constructor(private readonly graphService: GraphService) {}

  @Get('profile/:userId')
  @ApiOperation({ summary: 'Get Microsoft Graph user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  @ApiResponse({ status: 404, description: 'Integration not configured' })
  getUserProfile(@Param('userId') userId: string) {
    return this.graphService.getUserProfile(userId);
  }

  @Get('onedrive/:userId')
  @ApiOperation({ summary: 'Get OneDrive files' })
  @ApiResponse({ status: 200, description: 'OneDrive files retrieved' })
  getOneDriveFiles(@Param('userId') userId: string) {
    return this.graphService.getOneDriveFiles(userId);
  }

  @Get('teams/:userId')
  @ApiOperation({ summary: 'Get user Teams' })
  @ApiResponse({ status: 200, description: 'Teams retrieved' })
  getTeams(@Param('userId') userId: string) {
    return this.graphService.getTeams(userId);
  }

  @Post('configure/:userId')
  @ApiOperation({ summary: 'Configure Microsoft integration' })
  @ApiResponse({ status: 201, description: 'Integration configured' })
  configureIntegration(
    @Param('userId') userId: string,
    @Body() config: {
      accessToken: string;
      refreshToken?: string;
      expiresAt?: string;
      scopes?: string[];
    },
  ) {
    const expiresAt = config.expiresAt ? new Date(config.expiresAt) : undefined;
    
    return this.graphService.saveIntegrationConfig(
      userId,
      config.accessToken,
      config.refreshToken,
      expiresAt,
      config.scopes,
    );
  }

  @Post('onedrive/:userId/files')
  @ApiOperation({ summary: 'Create file in OneDrive' })
  @ApiResponse({ status: 201, description: 'File created in OneDrive' })
  createOneDriveFile(
    @Param('userId') userId: string,
    @Body() fileData: { filename: string; content: string },
  ) {
    return this.graphService.createOneDriveFile(
      userId,
      fileData.filename,
      fileData.content,
    );
  }
}
