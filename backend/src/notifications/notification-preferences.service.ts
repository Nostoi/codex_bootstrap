import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// TypeScript interfaces for notification preferences
export interface NotificationTypePreference {
  enabled: boolean;
  urgencyThreshold: 'low' | 'medium' | 'high' | 'critical';
}

export interface QuietHours {
  start: string; // 24-hour format "HH:MM"
  end: string; // 24-hour format "HH:MM"
  enabled: boolean;
}

export interface NotificationPreferences {
  globalEnabled: boolean;
  types: {
    'task-update': NotificationTypePreference;
    'calendar-sync': NotificationTypePreference;
    'deadline-reminder': NotificationTypePreference;
    'conflict-alert': NotificationTypePreference;
    'plan-regeneration': NotificationTypePreference;
  };
  quietHours: QuietHours;
  audioEnabled: boolean;
  batchingEnabled: boolean;
  batchInterval: number; // milliseconds
  maxNotificationsPerBatch: number;
  adhd: {
    focusModeEnabled: boolean;
    gentleAlertsOnly: boolean;
    progressCelebration: boolean;
  };
}

// Default notification preferences optimized for ADHD users
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  globalEnabled: true,
  types: {
    'task-update': {
      enabled: true,
      urgencyThreshold: 'medium',
    },
    'calendar-sync': {
      enabled: true,
      urgencyThreshold: 'low',
    },
    'deadline-reminder': {
      enabled: true,
      urgencyThreshold: 'high',
    },
    'conflict-alert': {
      enabled: true,
      urgencyThreshold: 'high',
    },
    'plan-regeneration': {
      enabled: true,
      urgencyThreshold: 'medium',
    },
  },
  quietHours: {
    start: '22:00',
    end: '08:00',
    enabled: true,
  },
  audioEnabled: false, // ADHD-friendly default: visual only
  batchingEnabled: true,
  batchInterval: 30000, // 30 seconds
  maxNotificationsPerBatch: 3,
  adhd: {
    focusModeEnabled: false,
    gentleAlertsOnly: true,
    progressCelebration: true,
  },
};

@Injectable()
export class NotificationPreferencesService {
  private readonly logger = new Logger(NotificationPreferencesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get notification preferences for a user
   */
  async getPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const userSettings = await this.prisma.userSettings.findUnique({
        where: { userId },
      });

      if (!userSettings) {
        // Create default user settings with notification preferences
        const newSettings = await this.prisma.userSettings.create({
          data: {
            userId,
            notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES as any,
          },
        });
        return DEFAULT_NOTIFICATION_PREFERENCES;
      }

      // Return stored preferences or defaults if null
      const preferences =
        userSettings.notificationPreferences as any as NotificationPreferences | null;
      return preferences
        ? this.validateAndMergePreferences(preferences)
        : DEFAULT_NOTIFICATION_PREFERENCES;
    } catch (error) {
      this.logger.error(`Failed to get notification preferences for user ${userId}:`, error);
      return DEFAULT_NOTIFICATION_PREFERENCES;
    }
  }

  /**
   * Update notification preferences for a user
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    try {
      // Get current preferences
      const currentPreferences = await this.getPreferences(userId);

      // Merge with new preferences
      const updatedPreferences = this.mergePreferences(currentPreferences, preferences);

      // Validate merged preferences
      const validatedPreferences = this.validatePreferences(updatedPreferences);

      // Update in database
      await this.prisma.userSettings.upsert({
        where: { userId },
        update: {
          notificationPreferences: validatedPreferences as any,
          updatedAt: new Date(),
        },
        create: {
          userId,
          notificationPreferences: validatedPreferences as any,
        },
      });

      this.logger.log(`Updated notification preferences for user ${userId}`);
      return validatedPreferences;
    } catch (error) {
      this.logger.error(`Failed to update notification preferences for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Check if notifications are allowed for a user and notification type
   */
  async shouldSendNotification(
    userId: string,
    notificationType: keyof NotificationPreferences['types'],
    urgency: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<boolean> {
    try {
      const preferences = await this.getPreferences(userId);

      // Check global enabled
      if (!preferences.globalEnabled) {
        return false;
      }

      // Check type-specific enabled
      const typePreference = preferences.types[notificationType];
      if (!typePreference?.enabled) {
        return false;
      }

      // Check urgency threshold
      if (!this.meetsUrgencyThreshold(urgency, typePreference.urgencyThreshold)) {
        return false;
      }

      // Check quiet hours
      if (preferences.quietHours.enabled && this.isInQuietHours(preferences.quietHours)) {
        // Allow critical notifications during quiet hours
        return urgency === 'critical';
      }

      return true;
    } catch (error) {
      this.logger.error(`Failed to check notification permissions for user ${userId}:`, error);
      // Fail safely by allowing notifications
      return true;
    }
  }

  /**
   * Check if current time is within quiet hours
   */
  private isInQuietHours(quietHours: QuietHours): boolean {
    if (!quietHours.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight

    const startTime = this.parseTimeString(quietHours.start);
    const endTime = this.parseTimeString(quietHours.end);

    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    } else {
      return currentTime >= startTime && currentTime <= endTime;
    }
  }

  /**
   * Parse time string "HH:MM" to minutes since midnight
   */
  private parseTimeString(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Check if urgency meets the threshold
   */
  private meetsUrgencyThreshold(
    urgency: 'low' | 'medium' | 'high' | 'critical',
    threshold: 'low' | 'medium' | 'high' | 'critical'
  ): boolean {
    const urgencyLevels = { low: 1, medium: 2, high: 3, critical: 4 };
    return urgencyLevels[urgency] >= urgencyLevels[threshold];
  }

  /**
   * Validate and merge preferences with defaults
   */
  private validateAndMergePreferences(
    preferences: Partial<NotificationPreferences>
  ): NotificationPreferences {
    const merged = this.mergePreferences(DEFAULT_NOTIFICATION_PREFERENCES, preferences);
    return this.validatePreferences(merged);
  }

  /**
   * Deep merge preferences objects
   */
  private mergePreferences(
    base: NotificationPreferences,
    updates: Partial<NotificationPreferences>
  ): NotificationPreferences {
    return {
      ...base,
      ...updates,
      types: {
        ...base.types,
        ...(updates.types || {}),
      },
      quietHours: {
        ...base.quietHours,
        ...(updates.quietHours || {}),
      },
      adhd: {
        ...base.adhd,
        ...(updates.adhd || {}),
      },
    };
  }

  /**
   * Validate notification preferences
   */
  private validatePreferences(preferences: NotificationPreferences): NotificationPreferences {
    // Validate batch interval (minimum 5 seconds, maximum 5 minutes)
    if (preferences.batchInterval < 5000) {
      preferences.batchInterval = 5000;
    }
    if (preferences.batchInterval > 300000) {
      preferences.batchInterval = 300000;
    }

    // Validate max notifications per batch (1-10)
    if (preferences.maxNotificationsPerBatch < 1) {
      preferences.maxNotificationsPerBatch = 1;
    }
    if (preferences.maxNotificationsPerBatch > 10) {
      preferences.maxNotificationsPerBatch = 10;
    }

    // Validate quiet hours format
    if (!this.isValidTimeString(preferences.quietHours.start)) {
      preferences.quietHours.start = '22:00';
    }
    if (!this.isValidTimeString(preferences.quietHours.end)) {
      preferences.quietHours.end = '08:00';
    }

    return preferences;
  }

  /**
   * Validate time string format "HH:MM"
   */
  private isValidTimeString(timeString: string): boolean {
    const timeRegex = /^([01]?\d|2[0-3]):([0-5]?\d)$/;
    return timeRegex.test(timeString);
  }

  /**
   * Reset preferences to defaults for a user
   */
  async resetToDefaults(userId: string): Promise<NotificationPreferences> {
    return this.updatePreferences(userId, DEFAULT_NOTIFICATION_PREFERENCES);
  }

  /**
   * Get preference summary for display purposes
   */
  async getPreferenceSummary(userId: string): Promise<{
    totalEnabled: number;
    totalTypes: number;
    quietHoursEnabled: boolean;
    batchingEnabled: boolean;
    adhdOptimized: boolean;
  }> {
    const preferences = await this.getPreferences(userId);
    const enabledTypes = Object.values(preferences.types).filter(type => type.enabled).length;

    return {
      totalEnabled: enabledTypes,
      totalTypes: Object.keys(preferences.types).length,
      quietHoursEnabled: preferences.quietHours.enabled,
      batchingEnabled: preferences.batchingEnabled,
      adhdOptimized: preferences.adhd.focusModeEnabled || preferences.adhd.gentleAlertsOnly,
    };
  }
}
