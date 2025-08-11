import React, { useState, useCallback } from 'react';
import { CalendarEvent } from '../../hooks/useApi';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Types for calendar conflicts
export interface CalendarConflict {
  id: string;
  eventId: string;
  conflictType: 'TITLE' | 'TIME' | 'LOCATION' | 'DESCRIPTION' | 'ATTENDEES';
  localVersion: Record<string, any>;
  remoteVersion: Record<string, any>;
  localEvent: CalendarEvent;
  remoteEvent: CalendarEvent;
  conflictData: {
    localValue: any;
    remoteValue: any;
    field: string;
  };
  createdAt: string;
  autoResolvable: boolean;
}

export interface ConflictResolutionRequest {
  conflictId: string;
  resolution: 'PREFER_LOCAL' | 'PREFER_REMOTE' | 'MERGE' | 'MANUAL';
  mergedData?: Record<string, any>;
  notes?: string;
}

interface CalendarConflictResolverProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts?: CalendarConflict[];
  onRefresh?: () => void;
  className?: string;
}

/**
 * Calendar Conflict Resolver Component
 *
 * Advanced UI for resolving calendar synchronization conflicts between
 * Google Calendar, Outlook, and local calendar events. Features ADHD-friendly
 * design with clear visual indicators and simplified conflict resolution options.
 */
export const CalendarConflictResolver: React.FC<CalendarConflictResolverProps> = ({
  isOpen,
  onClose,
  conflicts = [],
  onRefresh,
  className = '',
}) => {
  const [selectedConflictId, setSelectedConflictId] = useState<string | null>(null);
  const [mergeData, setMergeData] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState<'pending' | 'resolved' | 'auto'>('pending');

  const queryClient = useQueryClient();

  // Fetch conflicts from API
  const {
    data: apiConflicts,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['calendar-conflicts'],
    queryFn: async () => {
      const response = await fetch('/api/calendar/sync/conflicts', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('Failed to fetch conflicts');
      return response.json() as CalendarConflict[];
    },
    enabled: isOpen,
  });

  // Use API conflicts if available, otherwise use props
  const allConflicts = apiConflicts || conflicts;
  const pendingConflicts = allConflicts.filter(c => !c.autoResolvable);
  const autoResolvableConflicts = allConflicts.filter(c => c.autoResolvable);

  // Resolve conflict mutation
  const resolveConflictMutation = useMutation({
    mutationFn: async (request: ConflictResolutionRequest) => {
      const response = await fetch(`/api/calendar/sync/conflicts/${request.conflictId}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(request),
      });
      if (!response.ok) throw new Error('Failed to resolve conflict');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-conflicts'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      onRefresh?.();
      setSelectedConflictId(null);
      setMergeData({});
    },
  });

  // Auto-resolve all resolvable conflicts
  const autoResolveMutation = useMutation({
    mutationFn: async () => {
      const requests = autoResolvableConflicts.map(conflict => ({
        conflictId: conflict.id,
        resolution: 'PREFER_REMOTE' as const, // Default auto-resolution strategy
        notes: 'Auto-resolved conflict',
      }));

      await Promise.all(
        requests.map(request =>
          fetch(`/api/calendar/sync/conflicts/${request.conflictId}/resolve`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify(request),
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-conflicts'] });
      onRefresh?.();
    },
  });

  const handleResolveConflict = useCallback(
    (conflict: CalendarConflict, resolution: ConflictResolutionRequest['resolution']) => {
      const request: ConflictResolutionRequest = {
        conflictId: conflict.id,
        resolution,
        mergedData: resolution === 'MERGE' ? mergeData : undefined,
        notes: `Resolved via conflict resolver UI - ${resolution}`,
      };

      resolveConflictMutation.mutate(request);
    },
    [mergeData, resolveConflictMutation]
  );

  const getConflictIcon = (type: CalendarConflict['conflictType']) => {
    switch (type) {
      case 'TITLE':
        return '📝';
      case 'TIME':
        return '🕐';
      case 'LOCATION':
        return '📍';
      case 'DESCRIPTION':
        return '📄';
      case 'ATTENDEES':
        return '👥';
      default:
        return '⚠️';
    }
  };

  const getConflictTypeLabel = (type: CalendarConflict['conflictType']) => {
    switch (type) {
      case 'TITLE':
        return 'Event Title';
      case 'TIME':
        return 'Date & Time';
      case 'LOCATION':
        return 'Location';
      case 'DESCRIPTION':
        return 'Description';
      case 'ATTENDEES':
        return 'Attendees';
      default:
        return 'Unknown';
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}
    >
      <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-base-300">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">📅</span>
            <h2 className="text-xl font-semibold text-base-content">
              Calendar Conflict Resolution
            </h2>
            {allConflicts.length > 0 && (
              <span className="badge badge-warning">{allConflicts.length}</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            aria-label="Close conflict resolver"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center p-8">
              <span className="loading loading-spinner loading-lg mr-3"></span>
              <span className="text-base-content/70">Loading conflicts...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="alert alert-error mb-4">
              <span>⚠️</span>
              <span>Failed to load conflicts. Please try again.</span>
              <button onClick={() => refetch()} className="btn btn-sm btn-ghost">
                🔄 Retry
              </button>
            </div>
          )}

          {/* No Conflicts */}
          {!isLoading && !error && allConflicts.length === 0 && (
            <div className="text-center p-8">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-lg font-medium text-base-content mb-2">No Conflicts Found</h3>
              <p className="text-base-content/70">Your calendar is in sync across all platforms.</p>
            </div>
          )}

          {/* Conflicts Content */}
          {allConflicts.length > 0 && (
            <>
              {/* Tabs */}
              <div className="tabs tabs-boxed mb-6">
                <button
                  className={`tab ${activeTab === 'pending' ? 'tab-active' : ''}`}
                  onClick={() => setActiveTab('pending')}
                >
                  Manual Review ({pendingConflicts.length})
                </button>
                <button
                  className={`tab ${activeTab === 'auto' ? 'tab-active' : ''}`}
                  onClick={() => setActiveTab('auto')}
                >
                  Auto-Resolvable ({autoResolvableConflicts.length})
                </button>
              </div>

              {/* Auto-resolve section */}
              {activeTab === 'auto' && autoResolvableConflicts.length > 0 && (
                <div className="mb-6">
                  <div className="alert alert-info mb-4">
                    <span>ℹ️</span>
                    <div>
                      <p className="font-medium">Auto-resolvable conflicts detected</p>
                      <p className="text-sm">
                        These conflicts can be resolved automatically using default rules.
                      </p>
                    </div>
                    <button
                      onClick={() => autoResolveMutation.mutate()}
                      disabled={autoResolveMutation.isPending}
                      className="btn btn-sm btn-primary"
                    >
                      {autoResolveMutation.isPending ? 'Resolving...' : 'Auto-Resolve All'}
                    </button>
                  </div>
                </div>
              )}

              {/* Conflict List */}
              <div className="space-y-4">
                {(activeTab === 'pending' ? pendingConflicts : autoResolvableConflicts).map(
                  conflict => (
                    <div
                      key={conflict.id}
                      className="card bg-base-200 shadow-sm border border-warning/30"
                    >
                      <div className="card-body">
                        {/* Conflict Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">
                              {getConflictIcon(conflict.conflictType)}
                            </span>
                            <div>
                              <h3 className="font-semibold text-base-content">
                                {getConflictTypeLabel(conflict.conflictType)} Conflict
                              </h3>
                              <p className="text-sm text-base-content/70">
                                Event: {conflict.localEvent?.title || 'Unknown Event'}
                              </p>
                            </div>
                          </div>
                          <div className="text-xs text-base-content/50">
                            {new Date(conflict.createdAt).toLocaleString()}
                          </div>
                        </div>

                        {/* Conflict Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          {/* Local Version */}
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                              <span className="font-medium text-blue-800">Local Version</span>
                            </div>
                            <div className="text-sm text-blue-700">
                              <pre className="whitespace-pre-wrap font-mono">
                                {JSON.stringify(conflict.conflictData.localValue, null, 2)}
                              </pre>
                            </div>
                          </div>

                          {/* Remote Version */}
                          <div className="p-3 bg-green-50 border border-green-200 rounded">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                              <span className="font-medium text-green-800">Remote Version</span>
                            </div>
                            <div className="text-sm text-green-700">
                              <pre className="whitespace-pre-wrap font-mono">
                                {JSON.stringify(conflict.conflictData.remoteValue, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>

                        {/* Resolution Actions */}
                        {activeTab === 'pending' && (
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleResolveConflict(conflict, 'PREFER_LOCAL')}
                              disabled={resolveConflictMutation.isPending}
                              className="btn btn-sm btn-outline btn-primary"
                            >
                              📱 Use Local
                            </button>
                            <button
                              onClick={() => handleResolveConflict(conflict, 'PREFER_REMOTE')}
                              disabled={resolveConflictMutation.isPending}
                              className="btn btn-sm btn-outline btn-secondary"
                            >
                              ☁️ Use Remote
                            </button>
                            <button
                              onClick={() => setSelectedConflictId(conflict.id)}
                              disabled={resolveConflictMutation.isPending}
                              className="btn btn-sm btn-outline btn-accent"
                            >
                              🔀 Merge
                            </button>
                          </div>
                        )}

                        {/* Merge Interface */}
                        {selectedConflictId === conflict.id && (
                          <div className="mt-4 p-4 bg-base-100 border border-base-300 rounded">
                            <h4 className="font-medium mb-3">Merge Conflict Data</h4>
                            <div className="space-y-3">
                              <textarea
                                className="textarea textarea-bordered w-full h-24"
                                placeholder="Enter merged data as JSON..."
                                value={JSON.stringify(mergeData, null, 2)}
                                onChange={e => {
                                  try {
                                    setMergeData(JSON.parse(e.target.value));
                                  } catch {
                                    // Keep existing data if JSON is invalid
                                  }
                                }}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleResolveConflict(conflict, 'MERGE')}
                                  disabled={resolveConflictMutation.isPending}
                                  className="btn btn-sm btn-primary"
                                >
                                  ✅ Apply Merge
                                </button>
                                <button
                                  onClick={() => setSelectedConflictId(null)}
                                  className="btn btn-sm btn-ghost"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-base-300 bg-base-50">
          <div className="text-sm text-base-content/70">
            💡 Conflicts occur when the same event is modified in multiple places
          </div>
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

export default CalendarConflictResolver;
