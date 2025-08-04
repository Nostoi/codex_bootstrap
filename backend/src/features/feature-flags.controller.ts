import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FeatureFlagsService } from './feature-flags.service';
import { FeatureFlags } from './feature-flags.types';

@ApiTags('feature-flags')
@Controller('feature-flags')
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all feature flags status for current user' })
  @ApiResponse({
    status: 200,
    description: 'Feature flags retrieved successfully',
  })
  async getAllFlags(@Query('userId') userId?: string) {
    const userHash = userId ? FeatureFlagsService.createUserHash(userId) : undefined;
    const flags = await this.featureFlagsService.getAllFlags(userId, userHash);

    return {
      flags,
      userId,
      userHash,
    };
  }

  @Get('configs')
  @ApiOperation({ summary: 'Get all feature flag configurations' })
  @ApiResponse({
    status: 200,
    description: 'Feature flag configurations retrieved successfully',
  })
  getAllConfigs() {
    return {
      configs: this.featureFlagsService.getAllConfigs(),
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Get feature flags service health status' })
  @ApiResponse({
    status: 200,
    description: 'Health status retrieved successfully',
  })
  async getHealth() {
    return await this.featureFlagsService.healthCheck();
  }

  @Get(':flag')
  @ApiOperation({ summary: 'Check if a specific feature flag is enabled' })
  @ApiResponse({
    status: 200,
    description: 'Feature flag status retrieved successfully',
  })
  async isEnabled(@Param('flag') flag: FeatureFlags, @Query('userId') userId?: string) {
    const userHash = userId ? FeatureFlagsService.createUserHash(userId) : undefined;
    const enabled = await this.featureFlagsService.isEnabled(flag, userId, userHash);

    return {
      flag,
      enabled,
      userId,
      userHash,
    };
  }

  @Post(':flag/user/:userId')
  @ApiOperation({ summary: 'Set user-specific feature flag override' })
  @ApiResponse({ status: 200, description: 'User override set successfully' })
  @ApiBearerAuth()
  async setUserOverride(
    @Param('flag') flag: FeatureFlags,
    @Param('userId') userId: string,
    @Body() body: { enabled: boolean; expiresAt?: string }
  ) {
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : undefined;

    await this.featureFlagsService.setUserOverride(flag, userId, body.enabled, expiresAt);

    return {
      message: 'User override set successfully',
      flag,
      userId,
      enabled: body.enabled,
      expiresAt,
    };
  }
}
