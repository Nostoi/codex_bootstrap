/**
 * Real-time Calendar Sync Service
 * WebSocket integration for instant calendar updates and conflict resolution
 * ADHD-optimized with predictable sync behavior and clear status indicators
 *
 * Part of: Frontend OAuth Integration (Phase 3)
 * Used by: Calendar components, dashboard widgets
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { CalendarEvent } from '@/hooks/useMicrosoftCalendar';

// WebSocket message types for calendar sync
interface CalendarSyncMessage {
  type:
    | 'calendar_event_created'
    | 'calendar_event_updated'
    | 'calendar_event_deleted'
    | 'calendar_sync_status';
  userId: string;
  eventId?: string;
  event?: CalendarEvent;
  timestamp: string;
  source: 'microsoft_graph' | 'google_calendar' | 'manual';
}

// Real-time sync status for ADHD users
interface RealTimeSyncStatus {
  isConnected: boolean;
  lastHeartbeat?: Date;
  pendingUpdates: number;
  conflictCount: number;
  autoSyncEnabled: boolean;
  retryAttempts: number;
  status: 'connected' | 'connecting' | 'disconnected' | 'error' | 'syncing';
  statusMessage?: string;
}

// Sync conflict resolution
interface SyncConflict {
  id: string;
  eventId: string;
  localVersion: CalendarEvent;
  remoteVersion: CalendarEvent;
  conflictType: 'time_overlap' | 'content_mismatch' | 'deleted_locally' | 'deleted_remotely';
  timestamp: Date;
  autoResolvable: boolean;
}

/**
 * Real-time calendar synchronization hook
 * Provides WebSocket integration for instant updates across all connected clients
 */
export function useRealTimeCalendarSync() {
  const queryClient = useQueryClient();
  const { user, getAccessToken } = useAuth();

  // WebSocket connection and status
  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Real-time sync state
  const [syncStatus, setSyncStatus] = useState<RealTimeSyncStatus>({
    isConnected: false,
    pendingUpdates: 0,
    conflictCount: 0,
    autoSyncEnabled: true,
    retryAttempts: 0,
    status: 'disconnected',
  });

  // Sync conflicts state
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);

  /**
   * Establish WebSocket connection for real-time updates
   * ADHD-friendly: Clear connection status and automatic reconnection
   */
  const connectWebSocket = useCallback(async () => {
    if (!user?.id) return;

    try {
      setSyncStatus(prev => ({ ...prev, status: 'connecting' }));

      // Get fresh access token for WebSocket authentication
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('No access token available');
      }

      // WebSocket URL with authentication
      const wsUrl = new URL(
        '/ws/calendar',
        process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3501'
      );
      wsUrl.searchParams.set('token', accessToken);
      wsUrl.searchParams.set('userId', user.id);

      const ws = new WebSocket(wsUrl.toString());
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Calendar WebSocket connected');
        setSyncStatus(prev => ({
          ...prev,
          isConnected: true,
          status: 'connected',
          lastHeartbeat: new Date(),
          retryAttempts: 0,
          statusMessage: 'Real-time sync active',
        }));

        // Start heartbeat
        startHeartbeat();
      };

      ws.onmessage = event => {
        try {
          const message: CalendarSyncMessage = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = event => {
        console.log('Calendar WebSocket disconnected:', event.code, event.reason);
        setSyncStatus(prev => ({
          ...prev,
          isConnected: false,
          status: 'disconnected',
          statusMessage: event.reason || 'Connection lost',
        }));

        // Clean up heartbeat
        if (heartbeatRef.current) {
          clearInterval(heartbeatRef.current);
          heartbeatRef.current = null;
        }

        // Attempt reconnection with exponential backoff
        if (!event.wasClean && syncStatus.retryAttempts < 5) {
          const delay = Math.min(1000 * Math.pow(2, syncStatus.retryAttempts), 30000);

          reconnectTimeoutRef.current = setTimeout(() => {
            setSyncStatus(prev => ({ ...prev, retryAttempts: prev.retryAttempts + 1 }));
            connectWebSocket();
          }, delay);
        }
      };

      ws.onerror = error => {
        console.error('Calendar WebSocket error:', error);
        setSyncStatus(prev => ({
          ...prev,
          status: 'error',
          statusMessage: 'Connection error',
        }));
      };
    } catch (error) {
      console.error('Failed to connect calendar WebSocket:', error);
      setSyncStatus(prev => ({
        ...prev,
        status: 'error',
        statusMessage: error instanceof Error ? error.message : 'Connection failed',
      }));
    }
  }, [user?.id, getAccessToken, syncStatus.retryAttempts]);

  /**
   * Start heartbeat to maintain connection
   * ADHD-friendly: Predictable connection status updates
   */
  const startHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
    }

    heartbeatRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
        setSyncStatus(prev => ({ ...prev, lastHeartbeat: new Date() }));
      }
    }, 30000); // 30 second heartbeat
  }, []);

  /**
   * Handle incoming WebSocket messages
   * Processes real-time calendar updates and conflicts
   */
  const handleWebSocketMessage = useCallback(
    (message: CalendarSyncMessage) => {
      // Ignore messages from other users
      if (message.userId !== user?.id) return;

      switch (message.type) {
        case 'calendar_event_created':
        case 'calendar_event_updated':
          if (message.event) {
            // Update React Query cache with new event data
            queryClient.setQueryData(['microsoft-calendar', user?.id], (oldData: any) => {
              if (!oldData) return oldData;

              const events = oldData.value || [];
              const existingIndex = events.findIndex(
                (e: CalendarEvent) => e.id === message.event!.id
              );

              if (existingIndex >= 0) {
                // Update existing event
                events[existingIndex] = message.event;
              } else {
                // Add new event
                events.push(message.event);
              }

              return {
                ...oldData,
                value: events.sort(
                  (a: CalendarEvent, b: CalendarEvent) =>
                    new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime()
                ),
              };
            });

            // Check for conflicts with local changes
            checkForConflicts(message.event);
          }
          break;

        case 'calendar_event_deleted':
          if (message.eventId) {
            // Remove event from React Query cache
            queryClient.setQueryData(['microsoft-calendar', user?.id], (oldData: any) => {
              if (!oldData) return oldData;

              return {
                ...oldData,
                value: (oldData.value || []).filter((e: CalendarEvent) => e.id !== message.eventId),
              };
            });
          }
          break;

        case 'calendar_sync_status':
          setSyncStatus(prev => ({
            ...prev,
            lastHeartbeat: new Date(),
          }));
          break;
      }

      // Update pending updates counter
      setSyncStatus(prev => ({
        ...prev,
        pendingUpdates: Math.max(0, prev.pendingUpdates - 1),
      }));
    },
    [user?.id, queryClient]
  );

  /**
   * Check for sync conflicts between local and remote changes
   * ADHD-friendly: Clear conflict identification and resolution options
   */
  const checkForConflicts = useCallback(
    (remoteEvent: CalendarEvent) => {
      // Get current local cache
      const cachedData = queryClient.getQueryData(['microsoft-calendar', user?.id]) as any;
      if (!cachedData?.value) return;

      const localEvent = cachedData.value.find((e: CalendarEvent) => e.id === remoteEvent.id);
      if (!localEvent) return;

      // Compare timestamps to detect conflicts
      const localModified = new Date(localEvent.lastModifiedDateTime || 0);
      const remoteModified = new Date(remoteEvent.lastModifiedDateTime || 0);

      // Check for time overlap conflicts
      const hasTimeConflict =
        localEvent.start.dateTime !== remoteEvent.start.dateTime ||
        localEvent.end.dateTime !== remoteEvent.end.dateTime;

      // Check for content mismatches
      const hasContentConflict =
        localEvent.subject !== remoteEvent.subject ||
        localEvent.body?.content !== remoteEvent.body?.content;

      if (hasTimeConflict || hasContentConflict) {
        const conflict: SyncConflict = {
          id: `${remoteEvent.id}-${Date.now()}`,
          eventId: remoteEvent.id,
          localVersion: localEvent,
          remoteVersion: remoteEvent,
          conflictType: hasTimeConflict ? 'time_overlap' : 'content_mismatch',
          timestamp: new Date(),
          autoResolvable: remoteModified > localModified, // Prefer newer version
        };

        setConflicts(prev => [...prev, conflict]);
        setSyncStatus(prev => ({ ...prev, conflictCount: prev.conflictCount + 1 }));
      }
    },
    [user?.id, queryClient]
  );

  /**
   * Resolve sync conflict with user choice or auto-resolution
   */
  const resolveConflict = useCallback(
    (conflictId: string, resolution: 'accept_local' | 'accept_remote' | 'merge') => {
      setConflicts(prev => {
        const conflict = prev.find(c => c.id === conflictId);
        if (!conflict) return prev;

        // Apply resolution
        let resolvedEvent: CalendarEvent;

        switch (resolution) {
          case 'accept_local':
            resolvedEvent = conflict.localVersion;
            break;
          case 'accept_remote':
            resolvedEvent = conflict.remoteVersion;
            break;
          case 'merge':
            // Simple merge strategy - prefer newer content, local time
            resolvedEvent = {
              ...conflict.remoteVersion,
              start: conflict.localVersion.start,
              end: conflict.localVersion.end,
            };
            break;
        }

        // Update cache with resolved event
        queryClient.setQueryData(['microsoft-calendar', user?.id], (oldData: any) => {
          if (!oldData) return oldData;

          const events = oldData.value || [];
          const eventIndex = events.findIndex((e: CalendarEvent) => e.id === conflict.eventId);

          if (eventIndex >= 0) {
            events[eventIndex] = resolvedEvent;
          }

          return { ...oldData, value: events };
        });

        // Remove resolved conflict
        return prev.filter(c => c.id !== conflictId);
      });

      setSyncStatus(prev => ({ ...prev, conflictCount: Math.max(0, prev.conflictCount - 1) }));
    },
    [user?.id, queryClient]
  );

  /**
   * Auto-resolve conflicts when possible
   * ADHD-friendly: Reduces cognitive load by handling simple conflicts automatically
   */
  const autoResolveConflicts = useCallback(() => {
    const autoResolvable = conflicts.filter(c => c.autoResolvable);

    autoResolvable.forEach(conflict => {
      resolveConflict(conflict.id, 'accept_remote'); // Prefer newer remote version
    });
  }, [conflicts, resolveConflict]);

  /**
   * Manually trigger sync refresh
   * ADHD-friendly: Provides user control over sync timing
   */
  const triggerSync = useCallback(() => {
    setSyncStatus(prev => ({ ...prev, status: 'syncing' }));

    // Invalidate and refetch all calendar queries
    queryClient.invalidateQueries(['microsoft-calendar']);

    setTimeout(() => {
      setSyncStatus(prev => ({ ...prev, status: 'connected' }));
    }, 1000);
  }, [queryClient]);

  /**
   * Disconnect WebSocket and cleanup
   */
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }

    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setSyncStatus({
      isConnected: false,
      pendingUpdates: 0,
      conflictCount: 0,
      autoSyncEnabled: false,
      retryAttempts: 0,
      status: 'disconnected',
    });
  }, []);

  // Auto-connect when user is available
  useEffect(() => {
    if (user?.id && syncStatus.autoSyncEnabled && !syncStatus.isConnected) {
      connectWebSocket();
    }

    return () => {
      disconnect();
    };
  }, [user?.id, syncStatus.autoSyncEnabled, syncStatus.isConnected, connectWebSocket, disconnect]);

  // Auto-resolve conflicts periodically
  useEffect(() => {
    if (conflicts.length > 0) {
      const autoResolveTimer = setTimeout(autoResolveConflicts, 5000); // 5 second delay
      return () => clearTimeout(autoResolveTimer);
    }
  }, [conflicts.length, autoResolveConflicts]);

  return {
    // Status
    syncStatus,
    isRealTimeEnabled: syncStatus.isConnected,
    hasConflicts: conflicts.length > 0,

    // Conflicts
    conflicts,
    resolveConflict,
    autoResolveConflicts,

    // Actions
    connect: connectWebSocket,
    disconnect,
    triggerSync,

    // Utilities
    getStatusMessage: () => {
      if (!syncStatus.isConnected) return 'Real-time sync disabled';
      if (syncStatus.pendingUpdates > 0) return `${syncStatus.pendingUpdates} updates pending`;
      if (conflicts.length > 0) return `${conflicts.length} conflicts need resolution`;
      return 'Real-time sync active';
    },

    getStatusColor: () => {
      if (conflicts.length > 0) return 'warning';
      if (!syncStatus.isConnected) return 'error';
      if (syncStatus.pendingUpdates > 0) return 'info';
      return 'success';
    },
  };
}
