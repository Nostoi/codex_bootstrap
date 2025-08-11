import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarEvent } from '../../hooks/useApi';
import { useWebSocket } from '../../contexts/WebSocketContext';

// Types for real-time calendar updates
export interface CalendarEventUpdate {
  type: 'created' | 'updated' | 'deleted' | 'moved' | 'conflict_detected';
  eventId: string;
  event?: CalendarEvent;
  previousEvent?: CalendarEvent;
  conflictInfo?: {
    conflictingEventId: string;
    conflictType: string;
    severity: 'minor' | 'major' | 'critical';
  };
  providerId: string;
  timestamp: string;
  userId: string;
}

export interface CalendarSyncUpdate {
  type: 'sync_started' | 'sync_completed' | 'sync_failed' | 'sync_progress';
  providerId: string;
  progress?: {
    total: number;
    processed: number;
    percentage: number;
    currentOperation: string;
  };
  stats?: {
    eventsCreated: number;
    eventsUpdated: number;
    eventsDeleted: number;
    conflictsDetected: number;
  };
  error?: string;
  timestamp: string;
}

interface RealTimeCalendarEventsProps {
  dateRange: {
    start: Date;
    end: Date;
  };
  providerId?: string;
  onEventUpdate?: (update: CalendarEventUpdate) => void;
  onSyncUpdate?: (update: CalendarSyncUpdate) => void;
  enableOptimisticUpdates?: boolean;
  className?: string;
  children: (props: {
    events: CalendarEvent[];
    isLoading: boolean;
    error: Error | null;
    lastUpdate: Date | null;
    syncStatus: Record<string, any>;
    optimisticUpdates: CalendarEvent[];
  }) => React.ReactNode;
}

/**
 * Real-Time Calendar Events Component
 *
 * Provides real-time calendar event updates with WebSocket integration,
 * optimistic UI updates, conflict detection, and sync status tracking.
 * Features ADHD-friendly progressive loading and clear sync feedback.
 */
export const RealTimeCalendarEvents: React.FC<RealTimeCalendarEventsProps> = ({
  dateRange,
  providerId,
  onEventUpdate,
  onSyncUpdate,
  enableOptimisticUpdates = true,
  className = '',
  children,
}) => {
  const [optimisticUpdates, setOptimisticUpdates] = useState<CalendarEvent[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<Record<string, any>>({});

  const queryClient = useQueryClient();
  const { socket, isConnected, sendMessage } = useWebSocket();

  // Convert date range to query string
  const startDate = dateRange.start.toISOString().split('T')[0];
  const endDate = dateRange.end.toISOString().split('T')[0];
  const queryKey = ['calendar-events', startDate, endDate, providerId];

  // Fetch calendar events with real-time updates
  const {
    data: events = [],
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async (): Promise<CalendarEvent[]> => {
      const params = new URLSearchParams({
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString(),
      });

      if (providerId) {
        params.append('providerId', providerId);
      }

      const response = await fetch(`/api/calendar/events?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (!response.ok) throw new Error('Failed to fetch calendar events');
      return response.json();
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute fallback
  });

  // Handle calendar event updates via WebSocket
  const handleCalendarEventUpdate = useCallback(
    (update: CalendarEventUpdate) => {
      setLastUpdate(new Date());

      // Call external handler
      onEventUpdate?.(update);

      // Handle optimistic updates
      if (enableOptimisticUpdates) {
        setOptimisticUpdates(prev => {
          switch (update.type) {
            case 'created':
              if (update.event && !prev.find(e => e.id === update.event.id)) {
                return [...prev, update.event];
              }
              return prev;

            case 'updated':
              if (update.event) {
                return prev.map(e => (e.id === update.eventId ? update.event! : e));
              }
              return prev;

            case 'deleted':
              return prev.filter(e => e.id !== update.eventId);

            case 'moved':
              if (update.event) {
                return prev.map(e => (e.id === update.eventId ? update.event! : e));
              }
              return prev;

            default:
              return prev;
          }
        });
      }

      // Invalidate queries to refetch data
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey });
        // Clear optimistic update after real data arrives
        if (enableOptimisticUpdates) {
          setOptimisticUpdates(prev => prev.filter(e => e.id !== update.eventId));
        }
      }, 1000);
    },
    [queryClient, queryKey, enableOptimisticUpdates, onEventUpdate]
  );

  // Handle sync updates via WebSocket
  const handleSyncUpdate = useCallback(
    (update: CalendarSyncUpdate) => {
      setSyncStatus(prev => ({
        ...prev,
        [update.providerId]: {
          type: update.type,
          progress: update.progress,
          stats: update.stats,
          error: update.error,
          timestamp: update.timestamp,
        },
      }));

      // Call external handler
      onSyncUpdate?.(update);

      // Refresh data when sync completes
      if (update.type === 'sync_completed') {
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey });
        }, 500);
      }
    },
    [queryClient, queryKey, onSyncUpdate]
  );

  // Set up WebSocket listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for calendar event updates
    socket.on('calendar:event:updated', handleCalendarEventUpdate);
    socket.on('calendar:event:created', handleCalendarEventUpdate);
    socket.on('calendar:event:deleted', handleCalendarEventUpdate);
    socket.on('calendar:event:moved', handleCalendarEventUpdate);
    socket.on('calendar:event:conflict', handleCalendarEventUpdate);

    // Listen for sync updates
    socket.on('calendar:sync:started', handleSyncUpdate);
    socket.on('calendar:sync:progress', handleSyncUpdate);
    socket.on('calendar:sync:completed', handleSyncUpdate);
    socket.on('calendar:sync:failed', handleSyncUpdate);

    // Join calendar room for this date range
    const roomId = `calendar:${startDate}:${endDate}`;
    socket.emit('join:calendar', { roomId, dateRange: { start: startDate, end: endDate } });

    return () => {
      // Cleanup listeners
      socket.off('calendar:event:updated', handleCalendarEventUpdate);
      socket.off('calendar:event:created', handleCalendarEventUpdate);
      socket.off('calendar:event:deleted', handleCalendarEventUpdate);
      socket.off('calendar:event:moved', handleCalendarEventUpdate);
      socket.off('calendar:event:conflict', handleCalendarEventUpdate);
      socket.off('calendar:sync:started', handleSyncUpdate);
      socket.off('calendar:sync:progress', handleSyncUpdate);
      socket.off('calendar:sync:completed', handleSyncUpdate);
      socket.off('calendar:sync:failed', handleSyncUpdate);

      // Leave calendar room
      socket.emit('leave:calendar', { roomId });
    };
  }, [socket, isConnected, startDate, endDate, handleCalendarEventUpdate, handleSyncUpdate]);

  // Merge real events with optimistic updates
  const mergedEvents = React.useMemo(() => {
    if (!enableOptimisticUpdates) return events;

    const realEventIds = new Set(events.map(e => e.id));
    const uniqueOptimisticUpdates = optimisticUpdates.filter(e => !realEventIds.has(e.id));

    return [...events, ...uniqueOptimisticUpdates];
  }, [events, optimisticUpdates, enableOptimisticUpdates]);

  // Helper functions for external API
  const triggerEventUpdate = useCallback(
    (eventId: string, updates: Partial<CalendarEvent>) => {
      if (enableOptimisticUpdates) {
        // Apply optimistic update immediately
        setOptimisticUpdates(prev => {
          const existingEvent =
            prev.find(e => e.id === eventId) || events.find(e => e.id === eventId);
          if (existingEvent) {
            const updatedEvent = { ...existingEvent, ...updates };
            return prev.some(e => e.id === eventId)
              ? prev.map(e => (e.id === eventId ? updatedEvent : e))
              : [...prev, updatedEvent];
          }
          return prev;
        });
      }

      // Send WebSocket message for real-time updates to other clients
      if (socket && isConnected) {
        sendMessage('calendar:event:update', {
          eventId,
          updates,
          dateRange: { start: startDate, end: endDate },
        });
      }
    },
    [events, enableOptimisticUpdates, socket, isConnected, sendMessage, startDate, endDate]
  );

  const triggerEventCreation = useCallback(
    (event: Omit<CalendarEvent, 'id'>) => {
      const tempId = `temp-${Date.now()}`;
      const tempEvent: CalendarEvent = {
        ...event,
        id: tempId,
      };

      if (enableOptimisticUpdates) {
        setOptimisticUpdates(prev => [...prev, tempEvent]);
      }

      // Send WebSocket message
      if (socket && isConnected) {
        sendMessage('calendar:event:create', {
          event: tempEvent,
          dateRange: { start: startDate, end: endDate },
        });
      }

      return tempId;
    },
    [enableOptimisticUpdates, socket, isConnected, sendMessage, startDate, endDate]
  );

  const triggerEventDeletion = useCallback(
    (eventId: string) => {
      if (enableOptimisticUpdates) {
        setOptimisticUpdates(prev => prev.filter(e => e.id !== eventId));
      }

      // Send WebSocket message
      if (socket && isConnected) {
        sendMessage('calendar:event:delete', {
          eventId,
          dateRange: { start: startDate, end: endDate },
        });
      }
    },
    [enableOptimisticUpdates, socket, isConnected, sendMessage, startDate, endDate]
  );

  // Enhanced props for children
  const childProps = {
    events: mergedEvents,
    isLoading,
    error,
    lastUpdate,
    syncStatus,
    optimisticUpdates,
    // Helper functions
    updateEvent: triggerEventUpdate,
    createEvent: triggerEventCreation,
    deleteEvent: triggerEventDeletion,
    // Connection status
    isRealTimeConnected: isConnected,
    // Sync helpers
    triggerSync: (providerId: string) => {
      if (socket && isConnected) {
        sendMessage('calendar:sync:trigger', { providerId });
      }
    },
  };

  return <div className={className}>{children(childProps)}</div>;
};

export default RealTimeCalendarEvents;
