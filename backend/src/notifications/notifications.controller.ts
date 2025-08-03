import { 
  Controller, 
  Get, 
  Put, 
  Delete,
  Param, 
  Query, 
  Body,
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
  HttpStatus,
  HttpException
} from '@nestjs/common';
import { NotificationHistoryService, NotificationHistoryFilter } from './notification-history.service';
import { NotificationPreferencesService, NotificationPreferences } from './notification-preferences.service';

@Controller('api/notifications')
// @UseGuards(AuthGuard) // TODO: Re-enable when auth system is implemented
export class NotificationsController {
  constructor(
    private readonly notificationHistoryService: NotificationHistoryService,
    private readonly notificationPreferencesService: NotificationPreferencesService
  ) {}

  /**
   * Get notification history with pagination and filtering
   * GET /api/notifications/history?page=1&limit=20&type=task-update&read=false
   */
  @Get('history')
  async getNotificationHistory(
    @Request() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('type') type?: string,
    @Query('read') read?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const userId = req.user?.id || 'test-user'; // TODO: Remove fallback when auth is implemented
    
    // Validate pagination
    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 20;

    const filters: NotificationHistoryFilter = {};
    
    if (type) filters.type = type;
    if (read !== undefined) filters.read = read === 'true';
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    try {
      const result = await this.notificationHistoryService.getNotificationHistory(
        userId,
        filters,
        page,
        limit
      );

      return {
        notifications: result.notifications,
        pagination: {
          page,
          limit,
          total: result.total,
          hasMore: result.hasMore,
          totalPages: Math.ceil(result.total / limit),
        }
      };
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve notification history',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get unread notification count
   * GET /api/notifications/unread-count
   */
  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    const userId = req.user?.id || 'test-user'; // TODO: Remove fallback when auth is implemented
    
    try {
      const count = await this.notificationHistoryService.getUnreadCount(userId);
      return { unreadCount: count };
    } catch (error) {
      throw new HttpException(
        'Failed to get unread count',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Mark single notification as read
   * PUT /api/notifications/:id/read
   */
  @Put(':id/read')
  async markNotificationAsRead(
    @Request() req: any,
    @Param('id') notificationId: string
  ) {
    const userId = req.user?.id || 'test-user'; // TODO: Remove fallback when auth is implemented
    
    try {
      const notification = await this.notificationHistoryService.markNotificationAsRead(
        notificationId,
        userId
      );

      if (!notification) {
        throw new HttpException(
          'Notification not found or access denied',
          HttpStatus.NOT_FOUND
        );
      }

      return { 
        success: true, 
        notification: {
          id: notification.id,
          read: notification.read,
          readAt: notification.readAt,
        }
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to mark notification as read',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Mark multiple notifications as read in bulk
   * PUT /api/notifications/mark-read-bulk
   */
  @Put('mark-read-bulk')
  async markMultipleAsRead(
    @Request() req: any,
    @Body() body: { notificationIds: string[] }
  ) {
    const userId = req.user.id;
    const { notificationIds } = body;

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      throw new HttpException(
        'notificationIds must be a non-empty array',
        HttpStatus.BAD_REQUEST
      );
    }

    if (notificationIds.length > 100) {
      throw new HttpException(
        'Cannot mark more than 100 notifications at once',
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      const count = await this.notificationHistoryService.markMultipleAsRead(
        notificationIds,
        userId
      );

      return { 
        success: true, 
        markedCount: count,
        requestedCount: notificationIds.length,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to mark notifications as read',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Delete single notification
   * DELETE /api/notifications/:id
   */
  @Delete(':id')
  async deleteNotification(
    @Request() req: any,
    @Param('id') notificationId: string
  ) {
    const userId = req.user.id;
    
    try {
      const success = await this.notificationHistoryService.deleteNotification(
        notificationId,
        userId
      );

      if (!success) {
        throw new HttpException(
          'Notification not found or access denied',
          HttpStatus.NOT_FOUND
        );
      }

      return { success: true };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to delete notification',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get delivery status of notification
   * GET /api/notifications/:id/delivery-status
   */
  @Get(':id/delivery-status')
  async getDeliveryStatus(
    @Request() req: any,
    @Param('id') notificationId: string
  ) {
    try {
      const status = await this.notificationHistoryService.getDeliveryStatus(notificationId);
      
      if (!status) {
        throw new HttpException(
          'Notification not found',
          HttpStatus.NOT_FOUND
        );
      }

      return { deliveryStatus: status };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to get delivery status',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get user notification preferences
   * GET /api/notifications/preferences
   */
  @Get('preferences')
  async getNotificationPreferences(@Request() req: any) {
    const userId = req.user?.id || 'test-user'; // TODO: Remove fallback when auth is implemented
    
    try {
      const preferences = await this.notificationPreferencesService.getPreferences(userId);
      return { preferences };
    } catch (error) {
      throw new HttpException(
        'Failed to get notification preferences',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Update user notification preferences
   * PUT /api/notifications/preferences
   */
  @Put('preferences')
  async updateNotificationPreferences(
    @Request() req: any,
    @Body() preferences: Partial<NotificationPreferences>
  ) {
    const userId = req.user?.id || 'test-user'; // TODO: Remove fallback when auth is implemented
    
    try {
      const updatedPreferences = await this.notificationPreferencesService.updatePreferences(
        userId, 
        preferences
      );
      return { preferences: updatedPreferences };
    } catch (error) {
      throw new HttpException(
        'Failed to update notification preferences',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get notification preferences summary
   * GET /api/notifications/preferences/summary
   */
  @Get('preferences/summary')
  async getPreferencesSummary(@Request() req: any) {
    const userId = req.user?.id || 'test-user'; // TODO: Remove fallback when auth is implemented
    
    try {
      const summary = await this.notificationPreferencesService.getPreferenceSummary(userId);
      return { summary };
    } catch (error) {
      throw new HttpException(
        'Failed to get preferences summary',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Reset notification preferences to defaults
   * POST /api/notifications/preferences/reset
   */
  @Put('preferences/reset')
  async resetPreferencesToDefaults(@Request() req: any) {
    const userId = req.user?.id || 'test-user'; // TODO: Remove fallback when auth is implemented
    
    try {
      const preferences = await this.notificationPreferencesService.resetToDefaults(userId);
      return { preferences, message: 'Preferences reset to defaults' };
    } catch (error) {
      throw new HttpException(
        'Failed to reset preferences',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Admin endpoint: cleanup old notifications
   * DELETE /api/notifications/cleanup?days=30
   */
  @Delete('cleanup')
  async cleanupOldNotifications(
    @Request() req: any,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number
  ) {
    // TODO: Add admin role check when user roles are implemented
    const userId = req.user?.id || 'test-user';
    
    if (days < 1 || days > 365) {
      throw new HttpException(
        'Days must be between 1 and 365',
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      const deletedCount = await this.notificationHistoryService.deleteOldNotifications(days);
      return { 
        success: true, 
        deletedCount,
        message: `Deleted ${deletedCount} notifications older than ${days} days`
      };
    } catch (error) {
      throw new HttpException(
        'Failed to cleanup old notifications',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
