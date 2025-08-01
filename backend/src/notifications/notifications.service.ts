import { Injectable, Logger } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';

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

  constructor(private readonly notificationsGateway: NotificationsGateway) {}

  // Task notification methods
  async notifyTaskUpdate(userId: string, taskData: TaskUpdateData) {
    this.logger.log(`Notifying task update for user ${userId}: ${taskData.title}`);
    this.notificationsGateway.notifyTaskUpdate(userId, taskData);
  }

  async notifyTaskCreated(userId: string, taskData: TaskUpdateData) {
    this.logger.log(`Notifying task creation for user ${userId}: ${taskData.title}`);
    this.notificationsGateway.notifyTaskCreated(userId, taskData);
  }

  async notifyTaskDeleted(userId: string, taskId: string, taskTitle: string) {
    this.logger.log(`Notifying task deletion for user ${userId}: ${taskTitle}`);
    this.notificationsGateway.notifyTaskDeleted(userId, taskId);
  }

  // Calendar notification methods
  async notifyCalendarSync(userId: string, syncData: CalendarSyncData) {
    this.logger.log(`Notifying calendar sync for user ${userId}: ${syncData.events.length} events`);
    this.notificationsGateway.notifyCalendarSync(userId, syncData);

    // If there are conflicts, send separate conflict notification
    if (syncData.conflicts.length > 0) {
      await this.notifyCalendarConflicts(userId, syncData.conflicts);
    }
  }

  async notifyCalendarConflicts(userId: string, conflicts: any[]) {
    this.logger.log(`Notifying calendar conflicts for user ${userId}: ${conflicts.length} conflicts`);
    
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

  private determineUrgencyLevel(millisecondsUntilDeadline: number): 'low' | 'medium' | 'high' | 'critical' {
    const hoursUntilDeadline = millisecondsUntilDeadline / (1000 * 60 * 60);
    
    if (hoursUntilDeadline < 2) return 'critical';
    if (hoursUntilDeadline < 24) return 'high';
    if (hoursUntilDeadline < 72) return 'medium';
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
        return hoursSinceLastReminder >= 12; // Every 12 hours
      case 'low':
        return hoursSinceLastReminder >= 24; // Once per day
      default:
        return false;
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
