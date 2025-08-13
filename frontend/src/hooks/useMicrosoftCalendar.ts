/**
 * Microsoft Graph Calendar Integration Hook
 * Connects frontend components to Microsoft Graph backend APIs
 * ADHD-optimized with predictable loading states and error handling
 *
 * Part of: Frontend OAuth Integration (Phase 3)
 * Used by: Calendar components, dashboard
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRealTimeCalendarSync } from './useRealTimeCalendarSync';

// ADHD-friendly calendar event interface
export interface CalendarEvent {
  id: string;
  subject: string;
  body?: {
    contentType: 'HTML' | 'Text';
    content: string;
  };
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: {
    displayName: string;
  };
  attendees?: Array<{
    emailAddress: {
      address: string;
      name?: string;
    };
    status?: {
      response: 'notResponded' | 'organizer' | 'tentativelyAccepted' | 'accepted' | 'declined';
      time?: string;
    };
  }>;
  isAllDay?: boolean;
  showAs?: 'free' | 'tentative' | 'busy' | 'oof' | 'workingElsewhere';
  importance?: 'low' | 'normal' | 'high';
  sensitivity?: 'normal' | 'personal' | 'private' | 'confidential';
  categories?: string[];
  organizer?: {
    emailAddress: {
      address: string;
      name?: string;
    };
  };
  webLink?: string;
  lastModifiedDateTime?: string;

  // ADHD-specific enhancements
  energyLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  focusType?: 'CREATIVE' | 'TECHNICAL' | 'ADMINISTRATIVE' | 'SOCIAL';
  adhdFriendly?: {
    estimatedPreparationTime?: number; // minutes
    contextSwitchingWarning?: boolean;
    isLowStimulation?: boolean;
    requiresDeepFocus?: boolean;
  };
}

// Calendar view options for ADHD optimization
export interface CalendarViewOptions {
  startTime?: Date;
  endTime?: Date;
  timeZone?: string;
  maxResults?: number;
  orderBy?: 'start' | 'lastModified';
  includeAttendees?: boolean;
  includeRecurrence?: boolean;
  energyFilter?: ('LOW' | 'MEDIUM' | 'HIGH')[];
  focusFilter?: ('CREATIVE' | 'TECHNICAL' | 'ADMINISTRATIVE' | 'SOCIAL')[];
}

// Microsoft Graph API response interface
interface GraphCalendarResponse {
  value: CalendarEvent[];
  '@odata.nextLink'?: string;
  totalCount: number;
}

// ADHD-friendly status tracking
interface CalendarSyncStatus {
  status: 'idle' | 'syncing' | 'success' | 'error' | 'partial';
  lastSyncAt?: Date;
  eventsCount?: number;
  errorMessage?: string;
  isInitialLoad: boolean;
}

/**
 * Main hook for Microsoft Graph calendar integration
 * Provides ADHD-optimized calendar data management
 */
export function useMicrosoftCalendar(options: CalendarViewOptions = {}) {
  const { getAccessToken, user, isMicrosoftConnected } = useAuth();
  const queryClient = useQueryClient();

  // Integrate real-time sync
  const {
    syncStatus: realTimeSyncStatus,
    isRealTimeEnabled,
    hasConflicts,
    conflicts,
    resolveConflict,
    triggerSync: triggerRealTimeSync,
  } = useRealTimeCalendarSync();

  // ADHD-friendly sync status tracking
  const [syncStatus, setSyncStatus] = useState<CalendarSyncStatus>({
    status: 'idle',
    isInitialLoad: true,
  });

  // Default options optimized for ADHD users
  const defaultOptions: CalendarViewOptions = {
    startTime: options.startTime || new Date(),
    endTime: options.endTime || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    timeZone: options.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    maxResults: options.maxResults || 50, // Reasonable limit to prevent overwhelm
    orderBy: options.orderBy || 'start',
    includeAttendees: options.includeAttendees ?? true,
    includeRecurrence: options.includeRecurrence ?? true,
    ...options,
  };

  /**
   * Query key factory for calendar data
   * Enables granular cache invalidation
   */
  const getQueryKey = useCallback(
    (queryOptions: CalendarViewOptions) => [
      'microsoft-calendar',
      user?.id,
      queryOptions.startTime?.toISOString(),
      queryOptions.endTime?.toISOString(),
      queryOptions.maxResults,
      queryOptions.orderBy,
      queryOptions.energyFilter,
      queryOptions.focusFilter,
    ],
    [user?.id]
  );

  /**
   * Fetch calendar events from Microsoft Graph API
   * Includes ADHD-specific data enrichment
   */
  const fetchCalendarEvents = useCallback(
    async (queryOptions: CalendarViewOptions): Promise<GraphCalendarResponse> => {
      if (!user?.id || !isMicrosoftConnected) {
        throw new Error('Microsoft Graph not connected');
      }

      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('No access token available');
      }

      const params = new URLSearchParams();
      if (queryOptions.startTime) {
        params.append('startTime', queryOptions.startTime.toISOString());
      }
      if (queryOptions.endTime) {
        params.append('endTime', queryOptions.endTime.toISOString());
      }
      if (queryOptions.timeZone) {
        params.append('timeZone', queryOptions.timeZone);
      }
      if (queryOptions.maxResults) {
        params.append('maxResults', queryOptions.maxResults.toString());
      }
      if (queryOptions.orderBy) {
        params.append('orderBy', queryOptions.orderBy);
      }

      const response = await api.get(
        `/integrations/microsoft/${user.id}/calendar/events?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch calendar events');
      }

      // Enrich events with ADHD-specific metadata
      const enrichedEvents = response.data.data.value.map(enrichEventWithADHDData);

      return {
        value: enrichedEvents,
        '@odata.nextLink': response.data.data['@odata.nextLink'],
        totalCount: response.data.data.totalCount,
      };
    },
    [user?.id, isMicrosoftConnected, getAccessToken]
  );

  /**
   * Main calendar events query with ADHD optimizations
   */
  const {
    data: calendarData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: getQueryKey(defaultOptions),
    queryFn: () => fetchCalendarEvents(defaultOptions),
    enabled: !!user?.id && isMicrosoftConnected,
    staleTime: 2 * 60 * 1000, // 2 minutes - fresh data for ADHD planning
    cacheTime: 10 * 60 * 1000, // 10 minutes cache
    refetchOnWindowFocus: true, // Stay current when user returns
    retry: (failureCount, error) => {
      // ADHD-friendly retry logic
      if (failureCount >= 3) return false;
      if (error?.message?.includes('access denied')) return false;
      return true;
    },
    onSuccess: data => {
      setSyncStatus({
        status: 'success',
        lastSyncAt: new Date(),
        eventsCount: data.value.length,
        isInitialLoad: false,
      });
    },
    onError: error => {
      setSyncStatus({
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Sync failed',
        isInitialLoad: false,
      });
    },
  });

  /**
   * Create new calendar event
   * ADHD-optimized with preparation time suggestions
   */
  const createEventMutation = useMutation({
    mutationFn: async (eventData: Partial<CalendarEvent>) => {
      if (!user?.id) throw new Error('User not authenticated');

      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error('No access token available');

      const response = await api.post(
        `/integrations/microsoft/${user.id}/calendar/events`,
        eventData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to create event');
      }

      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate and refetch calendar data
      queryClient.invalidateQueries(['microsoft-calendar']);
    },
  });

  /**
   * Update existing calendar event
   */
  const updateEventMutation = useMutation({
    mutationFn: async ({
      eventId,
      updates,
    }: {
      eventId: string;
      updates: Partial<CalendarEvent>;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error('No access token available');

      const response = await api.put(
        `/integrations/microsoft/${user.id}/calendar/events/${eventId}`,
        updates,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to update event');
      }

      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['microsoft-calendar']);
    },
  });

  /**
   * Delete calendar event
   */
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error('No access token available');

      const response = await api.delete(
        `/integrations/microsoft/${user.id}/calendar/events/${eventId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to delete event');
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['microsoft-calendar']);
    },
  });

  /**
   * Sync calendar data manually
   * ADHD-friendly: Provides user control over data freshness
   */
  const syncCalendar = useCallback(async () => {
    setSyncStatus(prev => ({ ...prev, status: 'syncing' }));
    try {
      // Trigger both React Query refetch and real-time sync
      await Promise.all([refetch(), triggerRealTimeSync()]);
    } catch (error) {
      console.error('Calendar sync failed:', error);
    }
  }, [refetch, triggerRealTimeSync]);

  /**
   * Filter events by ADHD criteria
   */
  const filterEventsByADHD = useCallback(
    (
      events: CalendarEvent[],
      filters: Pick<CalendarViewOptions, 'energyFilter' | 'focusFilter'>
    ) => {
      return events.filter(event => {
        if (filters.energyFilter && event.energyLevel) {
          if (!filters.energyFilter.includes(event.energyLevel)) {
            return false;
          }
        }

        if (filters.focusFilter && event.focusType) {
          if (!filters.focusFilter.includes(event.focusType)) {
            return false;
          }
        }

        return true;
      });
    },
    []
  );

  // Apply ADHD filters to current data
  const filteredEvents = calendarData?.value
    ? filterEventsByADHD(calendarData.value, defaultOptions)
    : [];

  return {
    // Data
    events: filteredEvents,
    rawEvents: calendarData?.value || [],
    totalCount: calendarData?.totalCount || 0,
    hasMore: !!calendarData?.['@odata.nextLink'],

    // Status
    isLoading: isLoading && syncStatus.isInitialLoad,
    isSyncing: isFetching || realTimeSyncStatus.status === 'syncing',
    isError,
    error: error || syncStatus.errorMessage,
    syncStatus: {
      ...syncStatus,
      isRealTimeEnabled,
      hasConflicts,
      conflictCount: conflicts.length,
    },

    // Real-time features
    realTimeStatus: realTimeSyncStatus,
    conflicts,
    resolveConflict,

    // Actions
    syncCalendar,
    createEvent: createEventMutation.mutate,
    updateEvent: updateEventMutation.mutate,
    deleteEvent: deleteEventMutation.mutate,

    // Mutation status
    isCreating: createEventMutation.isLoading,
    isUpdating: updateEventMutation.isLoading,
    isDeleting: deleteEventMutation.isLoading,

    // Utility
    filterEventsByADHD,
    refetch,
  };
}

/**
 * Enrich Microsoft Graph events with ADHD-specific metadata
 * Analyzes event properties to suggest energy levels and focus types
 */
function enrichEventWithADHDData(event: CalendarEvent): CalendarEvent {
  // Analyze event characteristics for ADHD optimization
  const isLongMeeting =
    event.start &&
    event.end &&
    new Date(event.end.dateTime).getTime() - new Date(event.start.dateTime).getTime() >
      60 * 60 * 1000; // > 1 hour

  const hasManyAttendees = event.attendees && event.attendees.length > 5;
  const isImportant = event.importance === 'high';
  const isPrivate = event.sensitivity === 'private' || event.sensitivity === 'confidential';

  // Determine energy level based on event characteristics
  let energyLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
  if (isImportant || hasManyAttendees || isLongMeeting) {
    energyLevel = 'HIGH';
  } else if (event.showAs === 'free' || event.isAllDay) {
    energyLevel = 'LOW';
  }

  // Determine focus type based on event content
  let focusType: 'CREATIVE' | 'TECHNICAL' | 'ADMINISTRATIVE' | 'SOCIAL' = 'SOCIAL';
  const subject = event.subject?.toLowerCase() || '';
  const body = event.body?.content?.toLowerCase() || '';

  if (
    subject.includes('design') ||
    subject.includes('creative') ||
    subject.includes('brainstorm')
  ) {
    focusType = 'CREATIVE';
  } else if (
    subject.includes('code') ||
    subject.includes('technical') ||
    subject.includes('development')
  ) {
    focusType = 'TECHNICAL';
  } else if (
    subject.includes('admin') ||
    subject.includes('report') ||
    subject.includes('review')
  ) {
    focusType = 'ADMINISTRATIVE';
  }

  return {
    ...event,
    energyLevel,
    focusType,
    adhdFriendly: {
      estimatedPreparationTime: isImportant ? 15 : isLongMeeting ? 10 : 5,
      contextSwitchingWarning: hasManyAttendees || isImportant,
      isLowStimulation: event.isAllDay || event.showAs === 'free',
      requiresDeepFocus: focusType === 'TECHNICAL' || focusType === 'CREATIVE',
    },
  };
}

/**
 * Hook for calendar sync status monitoring
 * Provides ADHD-friendly status updates
 */
export function useCalendarSyncStatus() {
  const { isMicrosoftConnected, microsoftStatus } = useAuth();

  return {
    isConnected: isMicrosoftConnected,
    status: microsoftStatus?.status || 'disconnected',
    lastSyncAt: microsoftStatus?.lastSyncAt,
    errorMessage: microsoftStatus?.errorMessage,
    canSync: isMicrosoftConnected && microsoftStatus?.status === 'active',
  };
}
