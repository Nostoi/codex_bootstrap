import { NotificationData } from '../contexts/WebSocketContext';

export interface EnergyAwareNotificationOptions {
  energyLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  focusType?: 'CREATIVE' | 'TECHNICAL' | 'ADMINISTRATIVE' | 'SOCIAL';
  respectFocusMode?: boolean;
  currentActivity?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
}

export interface NotificationSchedulingResult {
  shouldDeliver: boolean;
  deliveryDelay: number;
  reasoning: string;
  batchingRecommended: boolean;
}

/**
 * Energy-Aware Notification Scheduler
 *
 * Intelligently schedules notifications based on user's current energy level,
 * focus type, and ADHD-optimized timing patterns.
 */
export class EnergyAwareNotificationScheduler {
  private focusModeActive: boolean = false;
  private currentEnergyLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
  private pendingNotifications: Map<string, NotificationData[]> = new Map();

  constructor() {
    this.initializeEnergyDetection();
  }

  /**
   * Schedules a notification with energy-aware timing
   */
  scheduleNotification(
    notification: NotificationData,
    options: EnergyAwareNotificationOptions = {}
  ): NotificationSchedulingResult {
    const {
      energyLevel = this.currentEnergyLevel,
      focusType,
      respectFocusMode = true,
      currentActivity,
      timeOfDay = this.getTimeOfDay(),
    } = options;

    // ADHD-friendly focus mode respect
    if (respectFocusMode && this.focusModeActive) {
      return this.handleFocusModeScheduling(notification, energyLevel);
    }

    // Energy-aware delivery timing
    const schedulingResult = this.calculateDeliveryTiming(
      notification,
      energyLevel,
      focusType,
      timeOfDay
    );

    // Apply scheduling result
    if (schedulingResult.deliveryDelay > 0) {
      this.queueNotification(notification, schedulingResult.deliveryDelay);
    }

    return schedulingResult;
  }

  /**
   * Calculate optimal delivery timing based on energy levels
   */
  private calculateDeliveryTiming(
    notification: NotificationData,
    energyLevel: 'LOW' | 'MEDIUM' | 'HIGH',
    focusType?: string,
    timeOfDay?: string
  ): NotificationSchedulingResult {
    const urgency = notification.severity || 'medium';

    // Immediate delivery for urgent notifications regardless of energy
    if (urgency === 'urgent') {
      return {
        shouldDeliver: true,
        deliveryDelay: 0,
        reasoning: 'Urgent notification - immediate delivery required',
        batchingRecommended: false,
      };
    }

    // Energy-aware scheduling logic
    switch (energyLevel) {
      case 'HIGH':
        // High energy = can handle interruptions well
        if (urgency === 'high') {
          return {
            shouldDeliver: true,
            deliveryDelay: 0,
            reasoning: 'High energy + high priority = immediate delivery',
            batchingRecommended: false,
          };
        }
        return {
          shouldDeliver: true,
          deliveryDelay: 2000, // 2s delay for grouping
          reasoning: 'High energy - short delay for batching',
          batchingRecommended: true,
        };

      case 'MEDIUM':
        // Medium energy = moderate interruption tolerance
        if (urgency === 'high') {
          return {
            shouldDeliver: true,
            deliveryDelay: 5000, // 5s delay
            reasoning: 'Medium energy + high priority = short delay',
            batchingRecommended: true,
          };
        }
        return {
          shouldDeliver: true,
          deliveryDelay: 15000, // 15s delay for batching
          reasoning: 'Medium energy - moderate batching delay',
          batchingRecommended: true,
        };

      case 'LOW':
        // Low energy = minimal interruptions preferred
        if (urgency === 'high') {
          return {
            shouldDeliver: true,
            deliveryDelay: 10000, // 10s delay even for high priority
            reasoning: 'Low energy - gentle timing even for high priority',
            batchingRecommended: true,
          };
        }
        return {
          shouldDeliver: true,
          deliveryDelay: 60000, // 1 minute delay for gentle delivery
          reasoning: 'Low energy - extended batching for gentle experience',
          batchingRecommended: true,
        };

      default:
        return {
          shouldDeliver: true,
          deliveryDelay: 10000,
          reasoning: 'Default moderate timing',
          batchingRecommended: true,
        };
    }
  }

  /**
   * Handle notification scheduling during focus mode
   */
  private handleFocusModeScheduling(
    notification: NotificationData,
    energyLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  ): NotificationSchedulingResult {
    const urgency = notification.severity || 'medium';

    // Only urgent notifications break focus mode
    if (urgency === 'urgent') {
      return {
        shouldDeliver: true,
        deliveryDelay: 3000, // 3s gentle delay even for urgent during focus
        reasoning: 'Urgent notification - gentle interruption during focus mode',
        batchingRecommended: false,
      };
    }

    // Queue all other notifications for after focus mode
    return {
      shouldDeliver: false,
      deliveryDelay: -1, // Special value indicating focus mode queuing
      reasoning: 'Focus mode active - queuing for later delivery',
      batchingRecommended: true,
    };
  }

  /**
   * Queue notification for delayed delivery
   */
  private queueNotification(notification: NotificationData, delay: number): void {
    if (delay === -1) {
      // Focus mode queuing
      const focusQueue = this.pendingNotifications.get('focus') || [];
      focusQueue.push(notification);
      this.pendingNotifications.set('focus', focusQueue);
      return;
    }

    // Timed delay
    setTimeout(() => {
      this.deliverNotification(notification);
    }, delay);
  }

  /**
   * Deliver a notification immediately
   */
  private deliverNotification(notification: NotificationData): void {
    // Emit custom event for notification delivery
    window.dispatchEvent(
      new CustomEvent('energy-aware-notification', {
        detail: notification,
      })
    );
  }

  /**
   * Set focus mode state
   */
  setFocusMode(active: boolean): void {
    this.focusModeActive = active;

    if (!active) {
      // Deliver queued focus mode notifications
      this.deliverFocusModeNotifications();
    }
  }

  /**
   * Update current energy level
   */
  setEnergyLevel(level: 'LOW' | 'MEDIUM' | 'HIGH'): void {
    this.currentEnergyLevel = level;
  }

  /**
   * Deliver all notifications queued during focus mode
   */
  private deliverFocusModeNotifications(): void {
    const focusQueue = this.pendingNotifications.get('focus') || [];

    if (focusQueue.length === 0) return;

    // Batch deliver with gentle timing
    focusQueue.forEach((notification, index) => {
      setTimeout(() => {
        this.deliverNotification(notification);
      }, index * 2000); // 2s between each notification
    });

    // Clear the focus queue
    this.pendingNotifications.set('focus', []);
  }

  /**
   * Get current time of day for energy-aware scheduling
   */
  private getTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
    const hour = new Date().getHours();

    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  /**
   * Initialize energy detection based on user activity patterns
   */
  private initializeEnergyDetection(): void {
    // This would integrate with the daily planner energy tracking
    // For now, we'll use time-based heuristics

    const updateEnergyBasedOnTime = () => {
      const hour = new Date().getHours();

      // Typical ADHD energy patterns
      if (hour >= 9 && hour <= 11) {
        this.currentEnergyLevel = 'HIGH'; // Morning peak
      } else if (hour >= 14 && hour <= 16) {
        this.currentEnergyLevel = 'MEDIUM'; // Afternoon moderate
      } else if (hour >= 20 && hour <= 22) {
        this.currentEnergyLevel = 'HIGH'; // Evening peak for some ADHD individuals
      } else {
        this.currentEnergyLevel = 'LOW'; // Other times
      }
    };

    // Update energy level every 30 minutes
    updateEnergyBasedOnTime();
    setInterval(updateEnergyBasedOnTime, 30 * 60 * 1000);
  }

  /**
   * Get current scheduling statistics
   */
  getStats(): {
    currentEnergyLevel: string;
    focusModeActive: boolean;
    pendingNotifications: number;
  } {
    const totalPending = Array.from(this.pendingNotifications.values()).reduce(
      (total, queue) => total + queue.length,
      0
    );

    return {
      currentEnergyLevel: this.currentEnergyLevel,
      focusModeActive: this.focusModeActive,
      pendingNotifications: totalPending,
    };
  }
}

// Singleton instance for global use
export const energyAwareScheduler = new EnergyAwareNotificationScheduler();

// React hook for easy integration
export function useEnergyAwareNotifications() {
  const setFocusMode = (active: boolean) => {
    energyAwareScheduler.setFocusMode(active);
  };

  const setEnergyLevel = (level: 'LOW' | 'MEDIUM' | 'HIGH') => {
    energyAwareScheduler.setEnergyLevel(level);
  };

  const scheduleNotification = (
    notification: NotificationData,
    options: EnergyAwareNotificationOptions = {}
  ) => {
    return energyAwareScheduler.scheduleNotification(notification, options);
  };

  const getStats = () => energyAwareScheduler.getStats();

  return {
    setFocusMode,
    setEnergyLevel,
    scheduleNotification,
    getStats,
  };
}
