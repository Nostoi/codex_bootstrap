import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// Types for sync status
export interface CalendarSyncStatus {
  providerId: string;
  providerName: string;
  providerType: 'google' | 'outlook' | 'local';
  status: 'idle' | 'syncing' | 'success' | 'error' | 'paused';
  lastSyncAt: string | null;
  nextSyncAt: string | null;
  progress?: {
    total: number;
    processed: number;
    percentage: number;
    currentOperation: string;
  };
  stats: {
    totalEvents: number;
    syncedEvents: number;
    failedEvents: number;
    conflictsDetected: number;
    lastSyncDuration: number; // milliseconds
  };
  error?: {
    message: string;
    code: string;
    retryable: boolean;
    retryCount: number;
    nextRetryAt?: string;
  };
}

export interface GlobalSyncStatus {
  isGlobalSyncActive: boolean;
  providers: CalendarSyncStatus[];
  summary: {
    totalProviders: number;
    connectedProviders: number;
    syncingProviders: number;
    errorProviders: number;
    totalEvents: number;
    totalConflicts: number;
    lastGlobalSync: string | null;
  };
}

interface CalendarSyncStatusDisplayProps {
  compact?: boolean;
  showDetails?: boolean;
  onConflictClick?: () => void;
  onProviderClick?: (providerId: string) => void;
  className?: string;
  refreshInterval?: number; // milliseconds
}

/**
 * Calendar Sync Status Display
 *
 * Real-time display of calendar synchronization status across all providers
 * with ADHD-friendly visual indicators, progress tracking, and quick access
 * to conflict resolution. Shows sync health, progress, and error states.
 */
export const CalendarSyncStatusDisplay: React.FC<CalendarSyncStatusDisplayProps> = ({
  compact = false,
  showDetails = true,
  onConflictClick,
  onProviderClick,
  className = '',
  refreshInterval = 5000, // 5 seconds
}) => {
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(new Set());
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

  // Fetch sync status with auto-refresh
  const {
    data: syncStatus,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['calendar-sync-status'],
    queryFn: async (): Promise<GlobalSyncStatus> => {
      const response = await fetch('/api/calendar/sync/status', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('Failed to fetch sync status');
      return response.json();
    },
    refetchInterval: refreshInterval,
    refetchIntervalInBackground: true,
  });

  // Update last update time when data changes
  useEffect(() => {
    if (syncStatus) {
      setLastUpdateTime(new Date());
    }
  }, [syncStatus]);

  const toggleProviderExpansion = (providerId: string) => {
    const newExpanded = new Set(expandedProviders);
    if (newExpanded.has(providerId)) {
      newExpanded.delete(providerId);
    } else {
      newExpanded.add(providerId);
    }
    setExpandedProviders(newExpanded);
  };

  const getProviderIcon = (type: CalendarSyncStatus['providerType']) => {
    switch (type) {
      case 'google':
        return '🟦';
      case 'outlook':
        return '🟧';
      case 'local':
        return '📱';
      default:
        return '📅';
    }
  };

  const getStatusIcon = (status: CalendarSyncStatus['status']) => {
    switch (status) {
      case 'syncing':
        return '🔄';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'paused':
        return '⏸️';
      default:
        return '⏹️';
    }
  };

  const getStatusColor = (status: CalendarSyncStatus['status']) => {
    switch (status) {
      case 'syncing':
        return 'text-warning';
      case 'success':
        return 'text-success';
      case 'error':
        return 'text-error';
      case 'paused':
        return 'text-info';
      default:
        return 'text-base-content';
    }
  };

  const formatDuration = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  // Compact view for dashboard
  if (compact) {
    return (
      <div className={`card bg-base-100 shadow-sm ${className}`}>
        <div className="card-body p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg">📊</span>
              <h3 className="font-medium">Calendar Sync</h3>
            </div>
            {isLoading && <span className="loading loading-spinner loading-sm"></span>}
          </div>

          {syncStatus && (
            <div className="mt-2 space-y-2">
              {/* Quick Summary */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-base-content/70">
                  {syncStatus.summary.connectedProviders}/{syncStatus.summary.totalProviders}{' '}
                  providers
                </span>
                <span
                  className={
                    syncStatus.summary.syncingProviders > 0 ? 'text-warning' : 'text-success'
                  }
                >
                  {syncStatus.summary.syncingProviders > 0 ? 'Syncing...' : 'Up to date'}
                </span>
              </div>

              {/* Provider Status Indicators */}
              <div className="flex space-x-1">
                {syncStatus.providers.map(provider => (
                  <div
                    key={provider.providerId}
                    className={`w-3 h-3 rounded-full tooltip tooltip-top ${
                      provider.status === 'success'
                        ? 'bg-success'
                        : provider.status === 'syncing'
                          ? 'bg-warning'
                          : provider.status === 'error'
                            ? 'bg-error'
                            : 'bg-base-300'
                    }`}
                    data-tip={`${provider.providerName}: ${provider.status}`}
                    onClick={() => onProviderClick?.(provider.providerId)}
                  />
                ))}
              </div>

              {/* Conflicts Indicator */}
              {syncStatus.summary.totalConflicts > 0 && (
                <div
                  className="flex items-center space-x-1 text-warning cursor-pointer hover:text-warning-focus"
                  onClick={onConflictClick}
                >
                  <span>⚠️</span>
                  <span className="text-sm">{syncStatus.summary.totalConflicts} conflicts</span>
                </div>
              )}
            </div>
          )}

          {error && <div className="text-error text-sm mt-2">Sync status unavailable</div>}
        </div>
      </div>
    );
  }

  // Full detailed view
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">📊</span>
          <h2 className="text-xl font-semibold">Calendar Sync Status</h2>
          {isLoading && <span className="loading loading-spinner loading-sm"></span>}
        </div>
        <div className="flex items-center space-x-2 text-sm text-base-content/70">
          <span>Last updated: {lastUpdateTime.toLocaleTimeString()}</span>
          <button
            onClick={() => refetch()}
            className="btn btn-ghost btn-xs"
            aria-label="Refresh sync status"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && !syncStatus && (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <div className="flex items-center space-x-3">
              <span className="loading loading-spinner loading-md"></span>
              <span>Loading sync status...</span>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="alert alert-error">
          <span>⚠️</span>
          <span>Failed to load sync status. Please check your connection.</span>
          <button onClick={() => refetch()} className="btn btn-sm btn-ghost">
            Retry
          </button>
        </div>
      )}

      {/* Sync Status Content */}
      {syncStatus && (
        <>
          {/* Global Summary */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h3 className="card-title">Sync Overview</h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="stat">
                  <div className="stat-title">Providers</div>
                  <div className="stat-value text-lg">
                    {syncStatus.summary.connectedProviders}
                    <span className="text-sm text-base-content/50">
                      /{syncStatus.summary.totalProviders}
                    </span>
                  </div>
                  <div className="stat-desc">Connected</div>
                </div>

                <div className="stat">
                  <div className="stat-title">Events</div>
                  <div className="stat-value text-lg text-primary">
                    {syncStatus.summary.totalEvents.toLocaleString()}
                  </div>
                  <div className="stat-desc">Total synced</div>
                </div>

                <div className="stat">
                  <div className="stat-title">Status</div>
                  <div
                    className={`stat-value text-lg ${
                      syncStatus.summary.errorProviders > 0
                        ? 'text-error'
                        : syncStatus.summary.syncingProviders > 0
                          ? 'text-warning'
                          : 'text-success'
                    }`}
                  >
                    {syncStatus.summary.errorProviders > 0
                      ? 'Issues'
                      : syncStatus.summary.syncingProviders > 0
                        ? 'Syncing'
                        : 'Healthy'}
                  </div>
                  <div className="stat-desc">
                    {syncStatus.summary.syncingProviders > 0 &&
                      `${syncStatus.summary.syncingProviders} syncing`}
                    {syncStatus.summary.errorProviders > 0 &&
                      `${syncStatus.summary.errorProviders} errors`}
                  </div>
                </div>

                <div className="stat">
                  <div className="stat-title">Conflicts</div>
                  <div
                    className={`stat-value text-lg ${
                      syncStatus.summary.totalConflicts > 0 ? 'text-warning' : 'text-success'
                    }`}
                  >
                    {syncStatus.summary.totalConflicts}
                  </div>
                  <div className="stat-desc">
                    {syncStatus.summary.totalConflicts > 0 ? (
                      <button onClick={onConflictClick} className="link link-warning">
                        Review conflicts
                      </button>
                    ) : (
                      'None pending'
                    )}
                  </div>
                </div>
              </div>

              {/* Global Actions */}
              <div className="card-actions justify-end mt-4">
                {syncStatus.summary.totalConflicts > 0 && (
                  <button onClick={onConflictClick} className="btn btn-warning btn-sm">
                    ⚠️ Resolve {syncStatus.summary.totalConflicts} Conflicts
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Provider Details */}
          <div className="space-y-3">
            {syncStatus.providers.map(provider => (
              <div key={provider.providerId} className="card bg-base-100 shadow-sm">
                <div className="card-body">
                  {/* Provider Header */}
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleProviderExpansion(provider.providerId)}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getProviderIcon(provider.providerType)}</span>
                      <div>
                        <h4 className="font-semibold">{provider.providerName}</h4>
                        <p className={`text-sm ${getStatusColor(provider.status)}`}>
                          {getStatusIcon(provider.status)} {provider.status}
                          {provider.status === 'syncing' && provider.progress && (
                            <span className="ml-2">({provider.progress.percentage}%)</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Quick Stats */}
                      <div className="text-right text-sm">
                        <div className="font-medium">{provider.stats.syncedEvents}</div>
                        <div className="text-base-content/50">events</div>
                      </div>

                      {/* Expand/Collapse */}
                      <button className="btn btn-ghost btn-sm">
                        {expandedProviders.has(provider.providerId) ? '📁' : '📂'}
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar for Active Syncs */}
                  {provider.status === 'syncing' && provider.progress && (
                    <div className="mt-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{provider.progress.currentOperation}</span>
                        <span>
                          {provider.progress.processed}/{provider.progress.total}
                        </span>
                      </div>
                      <progress
                        className="progress progress-primary w-full"
                        value={provider.progress.percentage}
                        max="100"
                      />
                    </div>
                  )}

                  {/* Expanded Details */}
                  {showDetails && expandedProviders.has(provider.providerId) && (
                    <div className="mt-4 space-y-4">
                      {/* Detailed Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="stat">
                          <div className="stat-title text-xs">Total Events</div>
                          <div className="stat-value text-sm">{provider.stats.totalEvents}</div>
                        </div>
                        <div className="stat">
                          <div className="stat-title text-xs">Synced</div>
                          <div className="stat-value text-sm text-success">
                            {provider.stats.syncedEvents}
                          </div>
                        </div>
                        <div className="stat">
                          <div className="stat-title text-xs">Failed</div>
                          <div className="stat-value text-sm text-error">
                            {provider.stats.failedEvents}
                          </div>
                        </div>
                        <div className="stat">
                          <div className="stat-title text-xs">Conflicts</div>
                          <div className="stat-value text-sm text-warning">
                            {provider.stats.conflictsDetected}
                          </div>
                        </div>
                      </div>

                      {/* Timing Information */}
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div>
                          <span className="text-base-content/70">Last sync:</span>
                          <span className="ml-1 font-medium">
                            {formatRelativeTime(provider.lastSyncAt)}
                          </span>
                        </div>
                        {provider.nextSyncAt && (
                          <div>
                            <span className="text-base-content/70">Next sync:</span>
                            <span className="ml-1 font-medium">
                              {formatRelativeTime(provider.nextSyncAt)}
                            </span>
                          </div>
                        )}
                        {provider.stats.lastSyncDuration > 0 && (
                          <div>
                            <span className="text-base-content/70">Duration:</span>
                            <span className="ml-1 font-medium">
                              {formatDuration(provider.stats.lastSyncDuration)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Error Details */}
                      {provider.error && (
                        <div className="alert alert-error alert-sm">
                          <span>❌</span>
                          <div>
                            <div className="font-medium">{provider.error.message}</div>
                            <div className="text-xs">Code: {provider.error.code}</div>
                            {provider.error.retryable && provider.error.nextRetryAt && (
                              <div className="text-xs">
                                Next retry: {formatRelativeTime(provider.error.nextRetryAt)}
                                (Attempt {provider.error.retryCount + 1})
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Provider Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => onProviderClick?.(provider.providerId)}
                          className="btn btn-sm btn-outline"
                        >
                          ⚙️ Settings
                        </button>
                        {provider.stats.conflictsDetected > 0 && (
                          <button
                            onClick={onConflictClick}
                            className="btn btn-sm btn-warning btn-outline"
                          >
                            ⚠️ View Conflicts ({provider.stats.conflictsDetected})
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default CalendarSyncStatusDisplay;
