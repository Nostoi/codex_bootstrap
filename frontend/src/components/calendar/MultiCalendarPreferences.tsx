import React, { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Types for calendar preferences
export interface CalendarProvider {
  id: string;
  name: string;
  type: 'google' | 'outlook' | 'local';
  isConnected: boolean;
  isDefault: boolean;
  syncEnabled: boolean;
  lastSyncAt: string | null;
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
  errorMessage?: string;
  settings: {
    syncDirection: 'pull' | 'push' | 'bidirectional';
    conflictResolution: 'prefer_local' | 'prefer_remote' | 'prefer_latest' | 'manual';
    syncFrequency: 'realtime' | 'hourly' | 'daily' | 'manual';
    includeAllDayEvents: boolean;
    includeBusyStatus: boolean;
    includePrivateEvents: boolean;
  };
  calendars: CalendarInfo[];
}

export interface CalendarInfo {
  id: string;
  name: string;
  color: string;
  isEnabled: boolean;
  isReadOnly: boolean;
  description?: string;
  timeZone: string;
}

export interface CalendarPreferences {
  providers: CalendarProvider[];
  globalSettings: {
    defaultCalendar: string;
    timeZone: string;
    defaultDuration: number; // minutes
    workingHours: {
      start: string; // HH:mm format
      end: string;
      workingDays: number[]; // 0-6, Sunday = 0
    };
    adhd: {
      enableEnergyAwareness: boolean;
      highlightConflicts: boolean;
      enableFocusMode: boolean;
      bufferTime: number; // minutes
      maxEventsPerHour: number;
    };
  };
}

interface MultiCalendarPreferencesProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (preferences: CalendarPreferences) => void;
  className?: string;
}

/**
 * Multi-Calendar Preferences Management
 *
 * Advanced settings panel for managing multiple calendar integrations
 * with ADHD-friendly options, sync preferences, and conflict resolution
 * strategies. Supports Google Calendar, Outlook, and local calendars.
 */
export const MultiCalendarPreferences: React.FC<MultiCalendarPreferencesProps> = ({
  isOpen,
  onClose,
  onSave,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'providers' | 'settings' | 'sync'>('providers');
  const [editingProvider, setEditingProvider] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Fetch calendar preferences
  const {
    data: preferences,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['calendar-preferences'],
    queryFn: async (): Promise<CalendarPreferences> => {
      const response = await fetch('/api/calendar/preferences', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('Failed to fetch preferences');
      return response.json();
    },
    enabled: isOpen,
  });

  // Save preferences mutation
  const savePreferencesMutation = useMutation({
    mutationFn: async (newPreferences: CalendarPreferences) => {
      const response = await fetch('/api/calendar/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(newPreferences),
      });
      if (!response.ok) throw new Error('Failed to save preferences');
      return response.json();
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['calendar-preferences'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      onSave?.(data);
    },
  });

  // Trigger sync mutation
  const triggerSyncMutation = useMutation({
    mutationFn: async (providerId: string) => {
      const response = await fetch(`/api/calendar/sync/trigger/${providerId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('Failed to trigger sync');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-preferences'] });
    },
  });

  // Connect/disconnect provider mutation
  const toggleProviderMutation = useMutation({
    mutationFn: async ({
      providerId,
      action,
    }: {
      providerId: string;
      action: 'connect' | 'disconnect';
    }) => {
      const response = await fetch(`/api/calendar/providers/${providerId}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error(`Failed to ${action} provider`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-preferences'] });
    },
  });

  const handleSavePreferences = useCallback(() => {
    if (preferences) {
      savePreferencesMutation.mutate(preferences);
    }
  }, [preferences, savePreferencesMutation]);

  const updateProvider = useCallback(
    (providerId: string, updates: Partial<CalendarProvider>) => {
      if (!preferences) return;

      const updatedProviders = preferences.providers.map(provider =>
        provider.id === providerId ? { ...provider, ...updates } : provider
      );

      savePreferencesMutation.mutate({
        ...preferences,
        providers: updatedProviders,
      });
    },
    [preferences, savePreferencesMutation]
  );

  const updateGlobalSettings = useCallback(
    (updates: Partial<CalendarPreferences['globalSettings']>) => {
      if (!preferences) return;

      savePreferencesMutation.mutate({
        ...preferences,
        globalSettings: { ...preferences.globalSettings, ...updates },
      });
    },
    [preferences, savePreferencesMutation]
  );

  const getProviderIcon = (type: CalendarProvider['type']) => {
    switch (type) {
      case 'google':
        return '🟦'; // Google blue
      case 'outlook':
        return '🟧'; // Microsoft orange
      case 'local':
        return '📱'; // Local device
      default:
        return '📅';
    }
  };

  const getStatusIcon = (status: CalendarProvider['syncStatus']) => {
    switch (status) {
      case 'syncing':
        return '🔄';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '⏸️';
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}
    >
      <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-base-300">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">⚙️</span>
            <h2 className="text-xl font-semibold text-base-content">Calendar Preferences</h2>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" aria-label="Close preferences">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-120px)]">
          {/* Sidebar Navigation */}
          <div className="w-64 bg-base-200 border-r border-base-300 p-4">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('providers')}
                className={`w-full text-left px-3 py-2 rounded transition-colors ${
                  activeTab === 'providers'
                    ? 'bg-primary text-primary-content'
                    : 'hover:bg-base-300'
                }`}
              >
                📚 Calendar Providers
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full text-left px-3 py-2 rounded transition-colors ${
                  activeTab === 'settings' ? 'bg-primary text-primary-content' : 'hover:bg-base-300'
                }`}
              >
                🎛️ Global Settings
              </button>
              <button
                onClick={() => setActiveTab('sync')}
                className={`w-full text-left px-3 py-2 rounded transition-colors ${
                  activeTab === 'sync' ? 'bg-primary text-primary-content' : 'hover:bg-base-300'
                }`}
              >
                🔄 Sync Management
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center p-8">
                <span className="loading loading-spinner loading-lg mr-3"></span>
                <span className="text-base-content/70">Loading preferences...</span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="alert alert-error mb-4">
                <span>⚠️</span>
                <span>Failed to load preferences. Please try again.</span>
                <button onClick={() => refetch()} className="btn btn-sm btn-ghost">
                  🔄 Retry
                </button>
              </div>
            )}

            {/* Calendar Providers Tab */}
            {activeTab === 'providers' && preferences && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Calendar Providers</h3>
                  <button className="btn btn-sm btn-primary">➕ Add Provider</button>
                </div>

                <div className="grid gap-4">
                  {preferences.providers.map(provider => (
                    <div key={provider.id} className="card bg-base-200 shadow-sm">
                      <div className="card-body">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{getProviderIcon(provider.type)}</span>
                            <div>
                              <h4 className="font-semibold">{provider.name}</h4>
                              <p className="text-sm text-base-content/70 capitalize">
                                {provider.type} Calendar
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{getStatusIcon(provider.syncStatus)}</span>
                            <div className="form-control">
                              <label className="label cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="toggle toggle-primary"
                                  checked={provider.isConnected}
                                  onChange={e => {
                                    const action = e.target.checked ? 'connect' : 'disconnect';
                                    toggleProviderMutation.mutate({
                                      providerId: provider.id,
                                      action,
                                    });
                                  }}
                                />
                              </label>
                            </div>
                          </div>
                        </div>

                        {provider.isConnected && (
                          <div className="mt-4 space-y-4">
                            {/* Provider Settings */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="label">
                                  <span className="label-text">Sync Direction</span>
                                </label>
                                <select
                                  className="select select-bordered w-full"
                                  value={provider.settings.syncDirection}
                                  onChange={e =>
                                    updateProvider(provider.id, {
                                      settings: {
                                        ...provider.settings,
                                        syncDirection: e.target.value as any,
                                      },
                                    })
                                  }
                                >
                                  <option value="pull">Pull Only (📥 From calendar)</option>
                                  <option value="push">Push Only (📤 To calendar)</option>
                                  <option value="bidirectional">
                                    Bidirectional (🔄 Both ways)
                                  </option>
                                </select>
                              </div>

                              <div>
                                <label className="label">
                                  <span className="label-text">Conflict Resolution</span>
                                </label>
                                <select
                                  className="select select-bordered w-full"
                                  value={provider.settings.conflictResolution}
                                  onChange={e =>
                                    updateProvider(provider.id, {
                                      settings: {
                                        ...provider.settings,
                                        conflictResolution: e.target.value as any,
                                      },
                                    })
                                  }
                                >
                                  <option value="prefer_local">Prefer Local</option>
                                  <option value="prefer_remote">Prefer Remote</option>
                                  <option value="prefer_latest">Prefer Latest</option>
                                  <option value="manual">Manual Review</option>
                                </select>
                              </div>

                              <div>
                                <label className="label">
                                  <span className="label-text">Sync Frequency</span>
                                </label>
                                <select
                                  className="select select-bordered w-full"
                                  value={provider.settings.syncFrequency}
                                  onChange={e =>
                                    updateProvider(provider.id, {
                                      settings: {
                                        ...provider.settings,
                                        syncFrequency: e.target.value as any,
                                      },
                                    })
                                  }
                                >
                                  <option value="realtime">Real-time</option>
                                  <option value="hourly">Every Hour</option>
                                  <option value="daily">Daily</option>
                                  <option value="manual">Manual Only</option>
                                </select>
                              </div>
                            </div>

                            {/* Provider Options */}
                            <div className="space-y-2">
                              <label className="label cursor-pointer justify-start space-x-3">
                                <input
                                  type="checkbox"
                                  className="checkbox"
                                  checked={provider.settings.includeAllDayEvents}
                                  onChange={e =>
                                    updateProvider(provider.id, {
                                      settings: {
                                        ...provider.settings,
                                        includeAllDayEvents: e.target.checked,
                                      },
                                    })
                                  }
                                />
                                <span className="label-text">Include all-day events</span>
                              </label>

                              <label className="label cursor-pointer justify-start space-x-3">
                                <input
                                  type="checkbox"
                                  className="checkbox"
                                  checked={provider.settings.includePrivateEvents}
                                  onChange={e =>
                                    updateProvider(provider.id, {
                                      settings: {
                                        ...provider.settings,
                                        includePrivateEvents: e.target.checked,
                                      },
                                    })
                                  }
                                />
                                <span className="label-text">Include private events</span>
                              </label>

                              <label className="label cursor-pointer justify-start space-x-3">
                                <input
                                  type="checkbox"
                                  className="checkbox"
                                  checked={provider.settings.includeBusyStatus}
                                  onChange={e =>
                                    updateProvider(provider.id, {
                                      settings: {
                                        ...provider.settings,
                                        includeBusyStatus: e.target.checked,
                                      },
                                    })
                                  }
                                />
                                <span className="label-text">Sync busy/free status</span>
                              </label>
                            </div>

                            {/* Sync Actions */}
                            <div className="flex gap-2 pt-2">
                              <button
                                onClick={() => triggerSyncMutation.mutate(provider.id)}
                                disabled={
                                  triggerSyncMutation.isPending || provider.syncStatus === 'syncing'
                                }
                                className="btn btn-sm btn-outline"
                              >
                                {provider.syncStatus === 'syncing' ? 'Syncing...' : '🔄 Sync Now'}
                              </button>

                              {provider.lastSyncAt && (
                                <span className="self-center text-xs text-base-content/50">
                                  Last sync: {new Date(provider.lastSyncAt).toLocaleString()}
                                </span>
                              )}
                            </div>

                            {/* Error Display */}
                            {provider.errorMessage && (
                              <div className="alert alert-error alert-sm">
                                <span>{provider.errorMessage}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Global Settings Tab */}
            {activeTab === 'settings' && preferences && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Global Calendar Settings</h3>

                <div className="grid gap-6">
                  {/* Default Settings */}
                  <div className="card bg-base-200 shadow-sm">
                    <div className="card-body">
                      <h4 className="card-title">Default Settings</h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="label">
                            <span className="label-text">Default Calendar</span>
                          </label>
                          <select
                            className="select select-bordered w-full"
                            value={preferences.globalSettings.defaultCalendar}
                            onChange={e =>
                              updateGlobalSettings({ defaultCalendar: e.target.value })
                            }
                          >
                            {preferences.providers
                              .filter(p => p.isConnected)
                              .map(provider => (
                                <option key={provider.id} value={provider.id}>
                                  {getProviderIcon(provider.type)} {provider.name}
                                </option>
                              ))}
                          </select>
                        </div>

                        <div>
                          <label className="label">
                            <span className="label-text">Time Zone</span>
                          </label>
                          <select
                            className="select select-bordered w-full"
                            value={preferences.globalSettings.timeZone}
                            onChange={e => updateGlobalSettings({ timeZone: e.target.value })}
                          >
                            <option value="America/New_York">Eastern Time</option>
                            <option value="America/Chicago">Central Time</option>
                            <option value="America/Denver">Mountain Time</option>
                            <option value="America/Los_Angeles">Pacific Time</option>
                            <option value="UTC">UTC</option>
                          </select>
                        </div>

                        <div>
                          <label className="label">
                            <span className="label-text">Default Event Duration (minutes)</span>
                          </label>
                          <input
                            type="number"
                            className="input input-bordered w-full"
                            value={preferences.globalSettings.defaultDuration}
                            onChange={e =>
                              updateGlobalSettings({ defaultDuration: parseInt(e.target.value) })
                            }
                            min="15"
                            max="480"
                            step="15"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ADHD-Specific Settings */}
                  <div className="card bg-base-200 shadow-sm">
                    <div className="card-body">
                      <h4 className="card-title">🧠 ADHD-Friendly Features</h4>

                      <div className="space-y-4">
                        <label className="label cursor-pointer justify-start space-x-3">
                          <input
                            type="checkbox"
                            className="checkbox checkbox-primary"
                            checked={preferences.globalSettings.adhd.enableEnergyAwareness}
                            onChange={e =>
                              updateGlobalSettings({
                                adhd: {
                                  ...preferences.globalSettings.adhd,
                                  enableEnergyAwareness: e.target.checked,
                                },
                              })
                            }
                          />
                          <div>
                            <span className="label-text font-medium">Energy-Aware Scheduling</span>
                            <p className="text-sm text-base-content/70">
                              Color-code events by energy requirements and suggest optimal timing
                            </p>
                          </div>
                        </label>

                        <label className="label cursor-pointer justify-start space-x-3">
                          <input
                            type="checkbox"
                            className="checkbox checkbox-primary"
                            checked={preferences.globalSettings.adhd.highlightConflicts}
                            onChange={e =>
                              updateGlobalSettings({
                                adhd: {
                                  ...preferences.globalSettings.adhd,
                                  highlightConflicts: e.target.checked,
                                },
                              })
                            }
                          />
                          <div>
                            <span className="label-text font-medium">Conflict Highlighting</span>
                            <p className="text-sm text-base-content/70">
                              Clearly highlight scheduling conflicts and overbooked periods
                            </p>
                          </div>
                        </label>

                        <label className="label cursor-pointer justify-start space-x-3">
                          <input
                            type="checkbox"
                            className="checkbox checkbox-primary"
                            checked={preferences.globalSettings.adhd.enableFocusMode}
                            onChange={e =>
                              updateGlobalSettings({
                                adhd: {
                                  ...preferences.globalSettings.adhd,
                                  enableFocusMode: e.target.checked,
                                },
                              })
                            }
                          />
                          <div>
                            <span className="label-text font-medium">Focus Mode</span>
                            <p className="text-sm text-base-content/70">
                              Hide distracting elements and reduce visual noise during focus
                              sessions
                            </p>
                          </div>
                        </label>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="label">
                              <span className="label-text">Buffer Time (minutes)</span>
                            </label>
                            <input
                              type="number"
                              className="input input-bordered w-full"
                              value={preferences.globalSettings.adhd.bufferTime}
                              onChange={e =>
                                updateGlobalSettings({
                                  adhd: {
                                    ...preferences.globalSettings.adhd,
                                    bufferTime: parseInt(e.target.value),
                                  },
                                })
                              }
                              min="0"
                              max="60"
                              step="5"
                            />
                            <div className="label">
                              <span className="label-text-alt">
                                Extra time between events for transitions
                              </span>
                            </div>
                          </div>

                          <div>
                            <label className="label">
                              <span className="label-text">Max Events Per Hour</span>
                            </label>
                            <input
                              type="number"
                              className="input input-bordered w-full"
                              value={preferences.globalSettings.adhd.maxEventsPerHour}
                              onChange={e =>
                                updateGlobalSettings({
                                  adhd: {
                                    ...preferences.globalSettings.adhd,
                                    maxEventsPerHour: parseInt(e.target.value),
                                  },
                                })
                              }
                              min="1"
                              max="10"
                            />
                            <div className="label">
                              <span className="label-text-alt">
                                Prevent overscheduling and cognitive overload
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sync Management Tab */}
            {activeTab === 'sync' && preferences && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Sync Management</h3>

                <div className="grid gap-4">
                  {preferences.providers
                    .filter(p => p.isConnected)
                    .map(provider => (
                      <div key={provider.id} className="card bg-base-200 shadow-sm">
                        <div className="card-body">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">{getProviderIcon(provider.type)}</span>
                              <div>
                                <h4 className="font-semibold">{provider.name}</h4>
                                <p className="text-sm text-base-content/70">
                                  {provider.settings.syncDirection} •{' '}
                                  {provider.settings.syncFrequency}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{getStatusIcon(provider.syncStatus)}</span>
                              <button
                                onClick={() => triggerSyncMutation.mutate(provider.id)}
                                disabled={
                                  triggerSyncMutation.isPending || provider.syncStatus === 'syncing'
                                }
                                className="btn btn-sm btn-primary"
                              >
                                {provider.syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
                              </button>
                            </div>
                          </div>

                          {/* Sync Statistics */}
                          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div className="stat">
                              <div className="stat-title text-xs">Calendars</div>
                              <div className="stat-value text-lg">{provider.calendars.length}</div>
                            </div>
                            <div className="stat">
                              <div className="stat-title text-xs">Active</div>
                              <div className="stat-value text-lg text-success">
                                {provider.calendars.filter(c => c.isEnabled).length}
                              </div>
                            </div>
                            <div className="stat">
                              <div className="stat-title text-xs">Last Sync</div>
                              <div className="stat-value text-sm">
                                {provider.lastSyncAt
                                  ? new Date(provider.lastSyncAt).toLocaleDateString()
                                  : 'Never'}
                              </div>
                            </div>
                            <div className="stat">
                              <div className="stat-title text-xs">Status</div>
                              <div
                                className={`stat-value text-sm ${
                                  provider.syncStatus === 'success'
                                    ? 'text-success'
                                    : provider.syncStatus === 'error'
                                      ? 'text-error'
                                      : provider.syncStatus === 'syncing'
                                        ? 'text-warning'
                                        : 'text-base-content'
                                }`}
                              >
                                {provider.syncStatus}
                              </div>
                            </div>
                          </div>

                          {/* Individual Calendar Controls */}
                          <div className="mt-4">
                            <h5 className="font-medium mb-2">Individual Calendars</h5>
                            <div className="space-y-2">
                              {provider.calendars.map(calendar => (
                                <div
                                  key={calendar.id}
                                  className="flex items-center justify-between p-2 bg-base-100 rounded"
                                >
                                  <div className="flex items-center space-x-3">
                                    <div
                                      className="w-4 h-4 rounded-full border border-base-300"
                                      style={{ backgroundColor: calendar.color }}
                                    ></div>
                                    <span className="text-sm font-medium">{calendar.name}</span>
                                    {calendar.isReadOnly && (
                                      <span className="badge badge-sm badge-outline">
                                        Read-only
                                      </span>
                                    )}
                                  </div>
                                  <div className="form-control">
                                    <label className="label cursor-pointer">
                                      <input
                                        type="checkbox"
                                        className="toggle toggle-sm toggle-primary"
                                        checked={calendar.isEnabled}
                                        onChange={e => {
                                          // Update calendar enabled status
                                          const updatedCalendars = provider.calendars.map(c =>
                                            c.id === calendar.id
                                              ? { ...c, isEnabled: e.target.checked }
                                              : c
                                          );
                                          updateProvider(provider.id, {
                                            calendars: updatedCalendars,
                                          });
                                        }}
                                      />
                                    </label>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-base-300 bg-base-50">
          <div className="text-sm text-base-content/70">💡 Changes are saved automatically</div>
          <div className="flex gap-2">
            <button onClick={() => refetch()} disabled={isLoading} className="btn btn-sm btn-ghost">
              🔄 Refresh
            </button>
            <button onClick={onClose} className="btn btn-sm btn-primary">
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiCalendarPreferences;
