import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AnalyticsService, FocusSessionData } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  async getDashboardAnalytics(@Request() req: any) {
    // For testing, use a mock user ID
    const userId = 'test-user-123';
    return this.analyticsService.getDashboardAnalytics(userId);
  }

  @Post('focus-session')
  async recordFocusSession(@Body() sessionData: FocusSessionData, @Request() req: any) {
    // For testing, use a mock user ID
    const userId = 'test-user-123';
    return this.analyticsService.recordFocusSession({
      ...sessionData,
      userId,
    });
  }

  @Get('productivity/:days')
  async getProductivityMetrics(@Param('days') days: string, @Request() req: any) {
    // For testing, use a mock user ID
    const userId = 'test-user-123';
    const dayCount = parseInt(days, 10) || 7;
    return this.analyticsService.getProductivityMetrics(userId, dayCount);
  }

  @Get('adhd-insights')
  async getADHDInsights(@Request() req: any) {
    // For testing, use a mock user ID
    const userId = 'test-user-123';
    return this.analyticsService.getADHDInsights(userId);
  }

  @Get('focus-sessions')
  async getFocusSessionAnalytics(@Request() req: any) {
    // For testing, use a mock user ID
    const userId = 'test-user-123';
    return this.analyticsService.getFocusSessionAnalytics(userId);
  }

  @Get('notifications')
  async getNotificationAnalytics(@Request() req: any) {
    // For testing, use a mock user ID
    const userId = 'test-user-123';
    return this.analyticsService.getNotificationAnalytics(userId);
  }

  @Get('calendar')
  async getCalendarAnalytics(@Request() req: any) {
    // For testing, use a mock user ID
    const userId = 'test-user-123';
    return this.analyticsService.getCalendarAnalytics(userId);
  }

  @Get('tasks')
  async getTaskAnalytics(@Request() req: any) {
    // For testing, use a mock user ID
    const userId = 'test-user-123';
    return this.analyticsService.getTaskAnalytics(userId);
  }
}
