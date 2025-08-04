import { Injectable, Logger } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationHistoryService } from './notification-history.service';
import { NotificationPreferencesService } from './notification-preferences.service';
import {
  NotificationTemplatesService,
  TemplateContext,
  UserContext,
  TaskContext,
} from './notification-templates.service';
import { PrismaService } from '../prisma/prisma.service';

export interface TaskUpdateData {
  id: string;
  title: string;
  status: string;
  priority: number;
  dueDate?: Date;
  updatedBy: string;
}

export interface CalendarSyncData {
  events: any[];
  conflicts: any[];
  lastSyncTime: Date;
  source: 'google' | 'outlook';
}

export interface DeadlineReminderData {
  task: {
    id: string;
    title: string;
    dueDate: Date;
    priority: number;
  };
  timeUntilDeadline: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly notificationsGateway: NotificationsGateway,
    private readonly notificationHistoryService: NotificationHistoryService,
    private readonly notificationPreferencesService: NotificationPreferencesService,
    private readonly notificationTemplatesService: NotificationTemplatesService,
    private readonly prisma: PrismaService
  ) {}

  // Task notification methods
  async notifyTaskUpdate(userId: string, taskData: TaskUpdateData) {
    this.logger.log(`Notifying task update for user ${userId}: ${taskData.title}`);

    // Check user preferences before sending notification
    const shouldSend = await this.notificationPreferencesService.shouldSendNotification(
      userId,
      'task-update',
      this.getTaskUrgency(taskData.priority)
    );

    if (!shouldSend) {
      this.logger.log(`Notification suppressed by user preferences for user ${userId}`);
      return;
    }

    // Get user context for personalization
    const userContext = await this.getUserContext(userId);
    const taskContext: TaskContext = {
      id: taskData.id,
      title: taskData.title,
      status: taskData.status as any,
      priority: taskData.priority,
      dueDate: taskData.dueDate,
      updatedBy: taskData.updatedBy,
    };

    const templateContext: TemplateContext = {
      user: userContext,
      task: taskContext,
      currentTime: new Date(),
      timeOfDay: this.getTimeOfDay(),
      urgencyLevel: this.getTaskUrgency(taskData.priority),
    };

    // Generate personalized message using templates
    const message = await this.notificationTemplatesService.generateMessage(
      'task-update',
      templateContext,
      'body'
    );

    // Save to database first
    await this.notificationHistoryService.saveNotificationToDatabase({
      message,
      userId,
      taskId: taskData.id,
      notificationType: 'task-update',
      metadata: {
        status: taskData.status,
        priority: taskData.priority,
        dueDate: taskData.dueDate,
        updatedBy: taskData.updatedBy,
        personalizedMessage: true,
      },
    });

    // Send real-time notification
    this.notificationsGateway.notifyTaskUpdate(userId, taskData);
  }

  async notifyTaskCreated(userId: string, taskData: TaskUpdateData) {
    this.logger.log(`Notifying task creation for user ${userId}: ${taskData.title}`);

    // Check user preferences before sending notification
    const shouldSend = await this.notificationPreferencesService.shouldSendNotification(
      userId,
      'task-update',
      this.getTaskUrgency(taskData.priority)
    );

    if (!shouldSend) {
      this.logger.log(
        `Task creation notification suppressed by user preferences for user ${userId}`
      );
      return;
    }

    // Get user context for personalization
    const userContext = await this.getUserContext(userId);
    const taskContext: TaskContext = {
      id: taskData.id,
      title: taskData.title,
      status: taskData.status as any,
      priority: taskData.priority,
      dueDate: taskData.dueDate,
      updatedBy: taskData.updatedBy,
    };

    const templateContext: TemplateContext = {
      user: userContext,
      task: taskContext,
      currentTime: new Date(),
      timeOfDay: this.getTimeOfDay(),
      urgencyLevel: this.getTaskUrgency(taskData.priority),
    };

    // Generate personalized message using templates
    const message = await this.notificationTemplatesService.generateMessage(
      'task-created',
      templateContext,
      'body'
    );

    // Save to database first
    await this.notificationHistoryService.saveNotificationToDatabase({
      message,
      userId,
      taskId: taskData.id,
      notificationType: 'task-created',
      metadata: {
        status: taskData.status,
        priority: taskData.priority,
        dueDate: taskData.dueDate,
        updatedBy: taskData.updatedBy,
        personalizedMessage: true,
      },
    });

    this.notificationsGateway.notifyTaskCreated(userId, taskData);
  }

  async notifyTaskDeleted(userId: string, taskId: string, taskTitle: string) {
    this.logger.log(`Notifying task deletion for user ${userId}: ${taskTitle}`);

    // Check user preferences before sending notification
    const shouldSend = await this.notificationPreferencesService.shouldSendNotification(
      userId,
      'task-update',
      'low' // Deletions are typically low urgency
    );

    if (!shouldSend) {
      this.logger.log(
        `Task deletion notification suppressed by user preferences for user ${userId}`
      );
      return;
    }

    // Save to database first
    const message = `Task "${taskTitle}" was deleted`;
    await this.notificationHistoryService.saveNotificationToDatabase({
      message,
      userId,
      taskId,
      notificationType: 'task-deleted',
      metadata: { taskTitle },
    });

    this.notificationsGateway.notifyTaskDeleted(userId, taskId);
  }

  // Calendar notification methods
  async notifyCalendarSync(userId: string, syncData: CalendarSyncData) {
    this.logger.log(`Notifying calendar sync for user ${userId}: ${syncData.events.length} events`);

    // Check user preferences before sending notification
    const shouldSend = await this.notificationPreferencesService.shouldSendNotification(
      userId,
      'calendar-sync',
      syncData.conflicts.length > 0 ? 'medium' : 'low'
    );

    if (!shouldSend) {
      this.logger.log(
        `Calendar sync notification suppressed by user preferences for user ${userId}`
      );
      return;
    }

    // Save to database first
    const message = `Calendar sync completed: ${syncData.events.length} events from ${syncData.source}`;
    await this.notificationHistoryService.saveNotificationToDatabase({
      message,
      userId,
      notificationType: 'calendar-sync',
      metadata: {
        eventCount: syncData.events.length,
        conflictCount: syncData.conflicts.length,
        source: syncData.source,
        lastSyncTime: syncData.lastSyncTime,
      },
    });

    this.notificationsGateway.notifyCalendarSync(userId, syncData);

    // If there are conflicts, send separate conflict notification
    if (syncData.conflicts.length > 0) {
      await this.notifyCalendarConflicts(userId, syncData.conflicts);
    }
  }

  async notifyCalendarConflicts(userId: string, conflicts: any[]) {
    this.logger.log(
      `Notifying calendar conflicts for user ${userId}: ${conflicts.length} conflicts`
    );

    // Check user preferences before sending notification
    const shouldSend = await this.notificationPreferencesService.shouldSendNotification(
      userId,
      'conflict-alert',
      'high' // Conflicts are high urgency
    );

    if (!shouldSend) {
      this.logger.log(
        `Calendar conflict notification suppressed by user preferences for user ${userId}`
      );
      return;
    }

    const conflictData = {
      conflicts: conflicts.map(conflict => ({
        eventId: conflict.eventId,
        taskId: conflict.taskId,
        timeSlot: conflict.timeSlot,
        severity: conflict.severity,
      })),
      affectedTasks: conflicts.map(c => c.taskId).filter(Boolean),
    };

    this.notificationsGateway.notifyCalendarConflict(userId, conflictData);
  }

  // Daily plan regeneration notifications
  async notifyDailyPlanRegeneration(userId: string, planData: any) {
    this.logger.log(`Notifying plan regeneration for user ${userId}`);

    const optimizedPlanData = {
      scheduledTasks: planData.scheduledTasks || [],
      unscheduledTasks: planData.unscheduledTasks || [],
      optimizationScore: {
        energy: planData.energyOptimization || 0,
        focus: planData.focusOptimization || 0,
        overall: planData.overallScore || 0,
      },
      generatedAt: new Date(),
    };

    this.notificationsGateway.notifyPlanRegeneration(userId, optimizedPlanData);
  }

  // Deadline reminder system
  async sendDeadlineReminder(userId: string, reminderData: DeadlineReminderData) {
    this.logger.log(`Sending deadline reminder for user ${userId}: ${reminderData.task.title}`);

    // Check user preferences before sending notification
    const shouldSend = await this.notificationPreferencesService.shouldSendNotification(
      userId,
      'deadline-reminder',
      reminderData.urgencyLevel
    );

    if (!shouldSend) {
      this.logger.log(
        `Deadline reminder notification suppressed by user preferences for user ${userId}`
      );
      return;
    }

    // Save to database first
    const message = `Deadline reminder: "${reminderData.task.title}" is due ${reminderData.timeUntilDeadline}`;
    await this.notificationHistoryService.saveNotificationToDatabase({
      message,
      userId,
      taskId: reminderData.task.id,
      notificationType: 'deadline-reminder',
      metadata: {
        urgencyLevel: reminderData.urgencyLevel,
        timeUntilDeadline: reminderData.timeUntilDeadline,
        priority: reminderData.task.priority,
        dueDate: reminderData.task.dueDate,
      },
    });

    this.notificationsGateway.notifyDeadlineReminder(userId, reminderData);
  }

  // Method for checking upcoming deadlines (can be called periodically)
  async checkUpcomingDeadlines() {
    this.logger.log('Checking for upcoming deadlines...');

    try {
      // Note: This would need to integrate with your task service to get actual tasks
      // For now, this is a placeholder structure

      const upcomingTasks = await this.getTasksWithUpcomingDeadlines();

      for (const task of upcomingTasks) {
        const timeUntilDeadline = this.calculateTimeUntilDeadline(task.dueDate);
        const urgencyLevel = this.determineUrgencyLevel(timeUntilDeadline);

        if (this.shouldSendReminder(urgencyLevel, task.lastReminderSent)) {
          await this.sendDeadlineReminder(task.userId, {
            task: {
              id: task.id,
              title: task.title,
              dueDate: task.dueDate,
              priority: task.priority,
            },
            timeUntilDeadline: this.formatTimeUntilDeadline(timeUntilDeadline),
            urgencyLevel,
          });

          // Update last reminder sent timestamp
          await this.updateLastReminderSent(task.id);
        }
      }
    } catch (error) {
      this.logger.error('Error checking upcoming deadlines:', error);
    }
  }

  // Broadcast system messages
  async broadcastSystemNotification(message: string, type: 'info' | 'warning' | 'error' = 'info') {
    this.logger.log(`Broadcasting system notification: ${message}`);

    this.notificationsGateway.broadcast({
      type: 'deadline-reminder', // Reusing existing type for system messages
      data: {
        systemMessage: message,
        messageType: type,
        timestamp: new Date(),
      },
    });
  }

  // Connection statistics
  getConnectionStats() {
    return this.notificationsGateway.getConnectionStats();
  }

  // Private helper methods
  private async getTasksWithUpcomingDeadlines(): Promise<any[]> {
    // Placeholder - this would integrate with your actual task service
    // return await this.taskService.getTasksWithUpcomingDeadlines();
    return [];
  }

  private calculateTimeUntilDeadline(dueDate: Date): number {
    return dueDate.getTime() - Date.now();
  }

  private determineUrgencyLevel(
    millisecondsUntilDeadline: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    const hoursUntilDeadline = millisecondsUntilDeadline / (1000 * 60 * 60);

    if (hoursUntilDeadline < 2) return 'critical';
    if (hoursUntilDeadline < 24) return 'high';
    if (hoursUntilDeadline < 72) return 'medium';
    return 'low';
  }

  /**
   * Convert task priority (1-5) to urgency level for notification preferences
   */
  private getTaskUrgency(priority: number): 'low' | 'medium' | 'high' | 'critical' {
    if (priority >= 5) return 'critical';
    if (priority >= 4) return 'high';
    if (priority >= 3) return 'medium';
    return 'low';
  }

  private shouldSendReminder(urgencyLevel: string, lastReminderSent?: Date): boolean {
    if (!lastReminderSent) return true;

    const hoursSinceLastReminder = (Date.now() - lastReminderSent.getTime()) / (1000 * 60 * 60);

    switch (urgencyLevel) {
      case 'critical':
        return hoursSinceLastReminder >= 0.5; // Every 30 minutes
      case 'high':
        return hoursSinceLastReminder >= 2; // Every 2 hours
      case 'medium':
        return hoursSinceLastReminder >= 24; // Daily
      case 'low':
        return hoursSinceLastReminder >= 72; // Every 3 days
      default:
        return hoursSinceLastReminder >= 24;
    }
  }

  /**
   * Get user context for template personalization
   */
  private async getUserContext(userId: string): Promise<UserContext> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          settings: true,
        },
      });

      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Get current energy level based on time of day and user settings
      const currentEnergyLevel = this.getCurrentEnergyLevel(user.settings);

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        currentEnergyLevel,
        morningEnergyLevel: user.settings?.morningEnergyLevel,
        afternoonEnergyLevel: user.settings?.afternoonEnergyLevel,
        workStartTime: user.settings?.workStartTime,
        workEndTime: user.settings?.workEndTime,
        preferredFocusTypes: user.settings?.preferredFocusTypes as any[],
      };
    } catch (error) {
      this.logger.error(`Error getting user context for ${userId}:`, error);
      // Return minimal context to prevent template failures
      return {
        id: userId,
        email: 'user@example.com',
        name: 'User',
      };
    }
  }

  /**
   * Get time of day classification
   */
  private getTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }

  /**
   * Get current energy level based on user settings and time of day
   */
  private getCurrentEnergyLevel(settings: any): any {
    if (!settings) return 'MEDIUM';

    const timeOfDay = this.getTimeOfDay();

    if (timeOfDay === 'morning') {
      return settings.morningEnergyLevel || 'HIGH';
    } else if (timeOfDay === 'afternoon') {
      return settings.afternoonEnergyLevel || 'MEDIUM';
    } else {
      // Evening - typically lower energy
      return 'LOW';
    }
  }

  private formatTimeUntilDeadline(milliseconds: number): string {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  }

  private async updateLastReminderSent(taskId: string): Promise<void> {
    // Placeholder - this would update the task's lastReminderSent timestamp
    // await this.taskService.updateLastReminderSent(taskId, new Date());
  }
}
