import { useEffect, useState, useCallback } from 'react';
import { useWebSocket, NotificationData } from '../contexts/WebSocketContext';

export interface NotificationSettings {
  enableBrowserNotifications: boolean;
  enableSoundAlerts: boolean;
  enableFocusMode: boolean;
  batchNotifications: boolean;
  batchInterval: number; // in milliseconds
  priorityFilter: ('low' | 'medium' | 'high' | 'urgent')[];
  adhdFriendlyMode: boolean;
}

const defaultSettings: NotificationSettings = {
  enableBrowserNotifications: true,
  enableSoundAlerts: false,
  enableFocusMode: false,
  batchNotifications: true,
  batchInterval: 30000, // 30 seconds
  priorityFilter: ['medium', 'high', 'urgent'],
  adhdFriendlyMode: true,
};

export function useNotifications(customSettings?: Partial<NotificationSettings>) {
  const {
    notifications,
    unreadCount,
    markNotificationAsRead,
    markAllAsRead,
    clearNotifications,
    isConnected,
  } = useWebSocket();

  const [settings, setSettings] = useState<NotificationSettings>({
    ...defaultSettings,
    ...customSettings,
  });

  const [batchedNotifications, setBatchedNotifications] = useState<NotificationData[]>([]);
  const [focusMode, setFocusMode] = useState(false);
  const [lastNotificationTime, setLastNotificationTime] = useState<Date | null>(null);

  // Filter notifications based on settings
  const filteredNotifications = notifications.filter(notification => {
    if (!notification.severity) return true;
    return settings.priorityFilter.includes(notification.severity);
  });

  // Get recent notifications (last 24 hours)
  const recentNotifications = filteredNotifications.filter(notification => {
    const notificationDate = new Date(notification.timestamp);
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return notificationDate > dayAgo;
  });

  // Get urgent notifications
  const urgentNotifications = filteredNotifications.filter(
    notification => notification.severity === 'urgent' && !notification.read
  );

  // ADHD-friendly notification batching
  useEffect(() => {
    if (!settings.batchNotifications || !settings.adhdFriendlyMode) {
      return;
    }

    const newNotifications = notifications.filter(
      n => !n.read && !batchedNotifications.some(bn => bn.id === n.id)
    );

    if (newNotifications.length === 0) {
      return;
    }

    // If in focus mode, only allow urgent notifications
    if (focusMode) {
      const urgentOnly = newNotifications.filter(n => n.severity === 'urgent');
      if (urgentOnly.length === 0) {
        return;
      }
    }

    // Batch notifications to reduce interruptions
    const batchTimer = setTimeout(() => {
      setBatchedNotifications(prev => [...prev, ...newNotifications]);
      setLastNotificationTime(new Date());
    }, settings.batchInterval);

    return () => clearTimeout(batchTimer);
  }, [
    notifications,
    settings.batchNotifications,
    settings.batchInterval,
    settings.adhdFriendlyMode,
    focusMode,
    batchedNotifications,
  ]);

  // Play notification sound (gentle for ADHD-friendly mode)
  const playNotificationSound = useCallback(
    (severity: string) => {
      if (!settings.enableSoundAlerts) return;

      const audio = new Audio();

      if (settings.adhdFriendlyMode) {
        // Gentle, non-startling sounds for ADHD users
        switch (severity) {
          case 'low':
            audio.src = '/sounds/gentle-chime.mp3';
            audio.volume = 0.3;
            break;
          case 'medium':
            audio.src = '/sounds/soft-bell.mp3';
            audio.volume = 0.4;
            break;
          case 'high':
            audio.src = '/sounds/calm-alert.mp3';
            audio.volume = 0.5;
            break;
          case 'urgent':
            audio.src = '/sounds/priority-tone.mp3';
            audio.volume = 0.6;
            break;
          default:
            audio.src = '/sounds/gentle-chime.mp3';
            audio.volume = 0.3;
        }
      } else {
        // Standard notification sounds
        audio.src = '/sounds/notification.mp3';
        audio.volume = 0.7;
      }

      audio.play().catch(console.warn);
    },
    [settings.enableSoundAlerts, settings.adhdFriendlyMode]
  );

  // Handle new notifications with ADHD-friendly features
  useEffect(() => {
    const handleNewNotification = (notification: NotificationData) => {
      // Skip if in focus mode and not urgent
      if (focusMode && notification.severity !== 'urgent') {
        return;
      }

      // Play sound if enabled
      if (notification.severity) {
        playNotificationSound(notification.severity);
      }

      // Show browser notification for important items
      if (
        settings.enableBrowserNotifications &&
        ['high', 'urgent'].includes(notification.severity || '')
      ) {
        showBrowserNotification(notification);
      }
    };

    // Listen for new notifications
    notifications.forEach(notification => {
      if (!notification.read) {
        const notificationTime = new Date(notification.timestamp);
        if (!lastNotificationTime || notificationTime > lastNotificationTime) {
          handleNewNotification(notification);
        }
      }
    });
  }, [
    notifications,
    focusMode,
    settings.enableBrowserNotifications,
    playNotificationSound,
    lastNotificationTime,
  ]);

  // Browser notification helper
  const showBrowserNotification = useCallback(
    (notification: NotificationData) => {
      if ('Notification' in window && Notification.permission === 'granted') {
        const browserNotification = new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: notification.id,
          requireInteraction: notification.severity === 'urgent',
          silent: settings.adhdFriendlyMode, // Non-intrusive for ADHD users
        });

        // Auto-close non-urgent notifications after 5 seconds
        if (notification.severity !== 'urgent') {
          setTimeout(() => {
            browserNotification.close();
          }, 5000);
        }

        browserNotification.onclick = () => {
          markNotificationAsRead(notification.id);
          browserNotification.close();
          // Could navigate to relevant page here
        };
      }
    },
    [settings.adhdFriendlyMode, markNotificationAsRead]
  );

  // Focus mode management
  const enableFocusMode = useCallback((duration?: number) => {
    setFocusMode(true);

    if (duration) {
      setTimeout(() => {
        setFocusMode(false);
      }, duration);
    }
  }, []);

  const disableFocusMode = useCallback(() => {
    setFocusMode(false);
  }, []);

  // Settings management
  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Batch operations
  const processBatchedNotifications = useCallback(() => {
    if (batchedNotifications.length > 0) {
      // Process all batched notifications at once
      setBatchedNotifications([]);

      // Show summary notification for ADHD-friendly experience
      if (settings.adhdFriendlyMode && batchedNotifications.length > 1) {
        const summaryNotification: NotificationData = {
          id: `batch-${Date.now()}`,
          type: 'task-update',
          title: `${batchedNotifications.length} New Updates`,
          message: 'You have several new notifications to review',
          timestamp: new Date().toISOString(),
          severity: 'medium',
        };

        showBrowserNotification(summaryNotification);
      }
    }
  }, [batchedNotifications, settings.adhdFriendlyMode, showBrowserNotification]);

  // Snooze notifications (ADHD-friendly feature)
  const snoozeNotifications = useCallback((duration: number = 15 * 60 * 1000) => {
    const snoozeUntil = new Date(Date.now() + duration);
    setSettings(prev => ({ ...prev, snoozeUntil }));

    setTimeout(() => {
      setSettings(prev => ({ ...prev, snoozeUntil: undefined }));
    }, duration);
  }, []);

  return {
    // Notification data
    notifications: filteredNotifications,
    recentNotifications,
    urgentNotifications,
    batchedNotifications,
    unreadCount,
    isConnected,

    // Notification actions
    markNotificationAsRead,
    markAllAsRead,
    clearNotifications,
    processBatchedNotifications,

    // Focus mode
    focusMode,
    enableFocusMode,
    disableFocusMode,

    // Settings
    settings,
    updateSettings,

    // ADHD-friendly features
    snoozeNotifications,
    lastNotificationTime,
  };
}

// Hook for deadline reminders with ADHD-friendly features
export function useDeadlineReminders() {
  const { notifications } = useWebSocket();

  const deadlineNotifications = notifications.filter(
    n => n.type === 'deadline-reminder' && !n.read
  );

  const upcomingDeadlines = deadlineNotifications
    .map(n => ({
      ...n,
      deadline: new Date(n.data?.deadline),
      timeUntilDeadline: new Date(n.data?.deadline).getTime() - Date.now(),
    }))
    .sort((a, b) => a.timeUntilDeadline - b.timeUntilDeadline);

  const criticalDeadlines = upcomingDeadlines.filter(
    d => d.timeUntilDeadline <= 24 * 60 * 60 * 1000 // Within 24 hours
  );

  return {
    deadlineNotifications,
    upcomingDeadlines,
    criticalDeadlines,
  };
}

// Hook for calendar conflict management
export function useCalendarConflicts() {
  const { notifications, sendMessage } = useWebSocket();

  const conflictNotifications = notifications.filter(n => n.type === 'conflict-alert' && !n.read);

  const resolveConflict = useCallback(
    (conflictId: string, resolution: 'reschedule' | 'override' | 'cancel') => {
      sendMessage('resolve-calendar-conflict', { conflictId, resolution });
    },
    [sendMessage]
  );

  return {
    conflictNotifications,
    resolveConflict,
  };
}
