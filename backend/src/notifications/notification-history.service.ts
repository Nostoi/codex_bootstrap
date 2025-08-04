import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Notification } from '@prisma/client';

export interface NotificationHistoryFilter {
  type?: string;
  read?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface CreateNotificationData {
  message: string;
  userId: string;
  taskId?: string;
  notificationType: string;
  metadata?: any;
}

@Injectable()
export class NotificationHistoryService {
  private readonly logger = new Logger(NotificationHistoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Save notification to database with delivery tracking
   */
  async saveNotificationToDatabase(
    notificationData: CreateNotificationData
  ): Promise<Notification> {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          message: notificationData.message,
          userId: notificationData.userId,
          taskId: notificationData.taskId,
          notificationType: notificationData.notificationType,
          metadata: notificationData.metadata,
          deliveryStatus: 'pending',
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          task: {
            select: { id: true, title: true, priority: true },
          },
        },
      });

      this.logger.log(
        `Notification saved to database: ${notification.id} for user ${notificationData.userId}`
      );
      return notification;
    } catch (error) {
      this.logger.error('Failed to save notification to database:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read with timestamp
   */
  async markNotificationAsRead(
    notificationId: string,
    userId: string
  ): Promise<Notification | null> {
    try {
      const notification = await this.prisma.notification.findFirst({
        where: { id: notificationId, userId },
      });

      if (!notification) {
        this.logger.warn(
          `Notification not found or access denied: ${notificationId} for user ${userId}`
        );
        return null;
      }

      const updatedNotification = await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          read: true,
          readAt: new Date(),
        },
        include: {
          user: { select: { id: true, name: true } },
          task: { select: { id: true, title: true } },
        },
      });

      this.logger.log(`Notification marked as read: ${notificationId}`);
      return updatedNotification;
    } catch (error) {
      this.logger.error(`Failed to mark notification as read: ${notificationId}`, error);
      throw error;
    }
  }

  /**
   * Get paginated notification history for user
   */
  async getNotificationHistory(
    userId: string,
    filters: NotificationHistoryFilter = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ notifications: Notification[]; total: number; hasMore: boolean }> {
    try {
      const offset = (page - 1) * limit;

      const whereClause: any = { userId };

      if (filters.type) {
        whereClause.notificationType = filters.type;
      }

      if (filters.read !== undefined) {
        whereClause.read = filters.read;
      }

      if (filters.startDate || filters.endDate) {
        whereClause.createdAt = {};
        if (filters.startDate) {
          whereClause.createdAt.gte = filters.startDate;
        }
        if (filters.endDate) {
          whereClause.createdAt.lte = filters.endDate;
        }
      }

      const [notifications, total] = await Promise.all([
        this.prisma.notification.findMany({
          where: whereClause,
          include: {
            user: { select: { id: true, name: true } },
            task: { select: { id: true, title: true, priority: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
        }),
        this.prisma.notification.count({ where: whereClause }),
      ]);

      const hasMore = offset + notifications.length < total;

      this.logger.log(
        `Retrieved ${notifications.length} notifications for user ${userId} (page ${page})`
      );
      return { notifications, total, hasMore };
    } catch (error) {
      this.logger.error(`Failed to get notification history for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get unread notification count for user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const count = await this.prisma.notification.count({
        where: { userId, read: false },
      });

      this.logger.debug(`Unread count for user ${userId}: ${count}`);
      return count;
    } catch (error) {
      this.logger.error(`Failed to get unread count for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Update delivery status of notification
   */
  async updateDeliveryStatus(
    notificationId: string,
    status: 'pending' | 'delivered' | 'failed' | 'acknowledged',
    retryCount?: number
  ): Promise<Notification | null> {
    try {
      const updateData: any = { deliveryStatus: status };

      if (status === 'failed' && retryCount !== undefined) {
        updateData.retryCount = retryCount;
        updateData.lastRetryAt = new Date();
      }

      const notification = await this.prisma.notification.update({
        where: { id: notificationId },
        data: updateData,
      });

      this.logger.debug(`Updated notification ${notificationId} delivery status to ${status}`);
      return notification;
    } catch (error) {
      this.logger.error(
        `Failed to update delivery status for notification ${notificationId}:`,
        error
      );
      return null;
    }
  }

  /**
   * Get delivery status of notification
   */
  async getDeliveryStatus(notificationId: string): Promise<string | null> {
    try {
      const notification = await this.prisma.notification.findUnique({
        where: { id: notificationId },
        select: { deliveryStatus: true },
      });

      return notification?.deliveryStatus || null;
    } catch (error) {
      this.logger.error(`Failed to get delivery status for notification ${notificationId}:`, error);
      return null;
    }
  }

  /**
   * Delete old notifications (cleanup service)
   */
  async deleteOldNotifications(daysToKeep: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await this.prisma.notification.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
          read: true, // Only delete read notifications
        },
      });

      this.logger.log(`Deleted ${result.count} old notifications older than ${daysToKeep} days`);
      return result.count;
    } catch (error) {
      this.logger.error('Failed to delete old notifications:', error);
      throw error;
    }
  }

  /**
   * Mark multiple notifications as read in bulk
   */
  async markMultipleAsRead(notificationIds: string[], userId: string): Promise<number> {
    try {
      const result = await this.prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId,
          read: false,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      });

      this.logger.log(`Marked ${result.count} notifications as read for user ${userId}`);
      return result.count;
    } catch (error) {
      this.logger.error(`Failed to mark multiple notifications as read for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Delete notification by ID
   */
  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    try {
      const result = await this.prisma.notification.deleteMany({
        where: { id: notificationId, userId },
      });

      if (result.count > 0) {
        this.logger.log(`Deleted notification ${notificationId} for user ${userId}`);
        return true;
      } else {
        this.logger.warn(
          `Notification not found or access denied: ${notificationId} for user ${userId}`
        );
        return false;
      }
    } catch (error) {
      this.logger.error(`Failed to delete notification ${notificationId}:`, error);
      return false;
    }
  }
}
