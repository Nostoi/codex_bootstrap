import { useState, useEffect, useCallback } from 'react';

// Type definitions matching backend service
export interface NotificationTypePreference {
  enabled: boolean;
  urgencyThreshold: 'low' | 'medium' | 'high' | 'critical';
}

export interface QuietHours {
  start: string; // 24-hour format "HH:MM"
  end: string;   // 24-hour format "HH:MM"
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

export interface PreferencesSummary {
  totalEnabled: number;
  totalTypes: number;
  quietHoursEnabled: boolean;
  batchingEnabled: boolean;
  adhdOptimized: boolean;
}

export interface UseNotificationPreferencesOptions {
  autoFetch?: boolean;
}

export function useNotificationPreferences(options: UseNotificationPreferencesOptions = {}) {
  const { autoFetch = true } = options;

  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [summary, setSummary] = useState<PreferencesSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch notification preferences
  const fetchPreferences = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch preferences: ${response.statusText}`);
      }

      const data = await response.json();
      setPreferences(data.preferences);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notification preferences';
      setError(errorMessage);
      console.error('Error fetching notification preferences:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch preferences summary
  const fetchSummary = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/preferences/summary', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Error fetching preferences summary:', err);
    }
  }, []);

  // Update notification preferences
  const updatePreferences = useCallback(async (updates: Partial<NotificationPreferences>) => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update preferences: ${response.statusText}`);
      }

      const data = await response.json();
      setPreferences(data.preferences);
      
      // Refresh summary after update
      await fetchSummary();
      
      return data.preferences;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update notification preferences';
      setError(errorMessage);
      console.error('Error updating notification preferences:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [fetchSummary]);

  // Reset preferences to defaults
  const resetToDefaults = useCallback(async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/notifications/preferences/reset', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to reset preferences: ${response.statusText}`);
      }

      const data = await response.json();
      setPreferences(data.preferences);
      
      // Refresh summary after reset
      await fetchSummary();
      
      return data.preferences;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset preferences';
      setError(errorMessage);
      console.error('Error resetting preferences:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [fetchSummary]);

  // Update specific notification type preference
  const updateTypePreference = useCallback(async (
    type: keyof NotificationPreferences['types'], 
    preference: Partial<NotificationTypePreference>
  ) => {
    if (!preferences) return;

    const updatedTypes = {
      ...preferences.types,
      [type]: {
        ...preferences.types[type],
        ...preference
      }
    };

    return updatePreferences({ types: updatedTypes });
  }, [preferences, updatePreferences]);

  // Update quiet hours
  const updateQuietHours = useCallback(async (quietHours: Partial<QuietHours>) => {
    if (!preferences) return;

    const updatedQuietHours = {
      ...preferences.quietHours,
      ...quietHours
    };

    return updatePreferences({ quietHours: updatedQuietHours });
  }, [preferences, updatePreferences]);

  // Update ADHD settings
  const updateAdhdSettings = useCallback(async (adhdSettings: Partial<NotificationPreferences['adhd']>) => {
    if (!preferences) return;

    const updatedAdhd = {
      ...preferences.adhd,
      ...adhdSettings
    };

    return updatePreferences({ adhd: updatedAdhd });
  }, [preferences, updatePreferences]);

  // Toggle global notifications
  const toggleGlobalNotifications = useCallback(async (enabled: boolean) => {
    return updatePreferences({ globalEnabled: enabled });
  }, [updatePreferences]);

  // Toggle specific notification type
  const toggleNotificationType = useCallback(async (
    type: keyof NotificationPreferences['types'], 
    enabled: boolean
  ) => {
    return updateTypePreference(type, { enabled });
  }, [updateTypePreference]);

  // Validate time format
  const isValidTimeFormat = useCallback((time: string): boolean => {
    const timeRegex = /^([01]?\d|2[0-3]):([0-5]?\d)$/;
    return timeRegex.test(time);
  }, []);

  // Check if currently in quiet hours
  const isInQuietHours = useCallback((): boolean => {
    if (!preferences?.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight
    
    const parseTime = (timeString: string): number => {
      const [hours, minutes] = timeString.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const startTime = parseTime(preferences.quietHours.start);
    const endTime = parseTime(preferences.quietHours.end);

    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    } else {
      return currentTime >= startTime && currentTime <= endTime;
    }
  }, [preferences]);

  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      fetchPreferences();
      fetchSummary();
    }
  }, [autoFetch, fetchPreferences, fetchSummary]);

  return {
    // Data
    preferences,
    summary,
    
    // State
    loading,
    error,
    saving,
    isInQuietHours: isInQuietHours(),
    
    // Actions
    fetchPreferences,
    fetchSummary,
    updatePreferences,
    resetToDefaults,
    updateTypePreference,
    updateQuietHours,
    updateAdhdSettings,
    toggleGlobalNotifications,
    toggleNotificationType,
    
    // Helpers
    isValidTimeFormat,
    hasPreferences: preferences !== null,
  };
}
