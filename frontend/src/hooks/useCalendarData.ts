import { useCalendarEvents, CalendarEvent } from './useApi';
import { useMemo, useCallback } from 'react';

export interface CalendarDataHookResult {
  events: CalendarEvent[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
  
  // Event manipulation functions
  getEventsForTimeSlot: (startTime: Date, endTime: Date) => CalendarEvent[];
  getEventsForDay: (date: Date) => CalendarEvent[];
  hasConflicts: (event: CalendarEvent) => boolean;
  getConflictingEvents: (event: CalendarEvent) => CalendarEvent[];
  
  // Stats
  totalEvents: number;
  sourceStats: {
    google: number;
    outlook: number;
  };
}

export interface UseCalendarDataOptions {
  date?: string;
  includeAllDay?: boolean;
  filterBySource?: ('google' | 'outlook')[];
  filterByEnergyLevel?: ('HIGH' | 'MEDIUM' | 'LOW')[];
}

/**
 * Enhanced calendar data hook with utility functions for calendar integration
 * Provides filtered events, conflict detection, and time slot utilities
 */
export function useCalendarData(options: UseCalendarDataOptions = {}): CalendarDataHookResult {
  const {
    date,
    includeAllDay = true,
    filterBySource,
    filterByEnergyLevel,
  } = options;

  // Get base calendar data
  const { data: calendarData, isLoading, error, refetch } = useCalendarEvents(date);

  // Filter and process events
  const processedEvents = useMemo(() => {
    if (!calendarData?.events) return [];

    let events = calendarData.events;

    // Filter by source if specified
    if (filterBySource && filterBySource.length > 0) {
      events = events.filter(event => filterBySource.includes(event.source));
    }

    // Filter by energy level if specified
    if (filterByEnergyLevel && filterByEnergyLevel.length > 0) {
      events = events.filter(event => 
        event.energyLevel && filterByEnergyLevel.includes(event.energyLevel)
      );
    }

    // Filter all-day events if not included
    if (!includeAllDay) {
      events = events.filter(event => !event.isAllDay);
    }

    // Sort events by start time
    return events.sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }, [calendarData?.events, filterBySource, filterByEnergyLevel, includeAllDay]);

  // Utility function to get events for a specific time slot
  const getEventsForTimeSlot = useCallback((startTime: Date, endTime: Date): CalendarEvent[] => {
    return processedEvents.filter(event => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);

      // Check if event overlaps with time slot
      return (
        (eventStart < endTime && eventEnd > startTime) || // Overlaps
        (eventStart >= startTime && eventStart < endTime) || // Starts within slot
        (eventEnd > startTime && eventEnd <= endTime) // Ends within slot
      );
    });
  }, [processedEvents]);

  // Utility function to get events for a specific day
  const getEventsForDay = useCallback((targetDate: Date): CalendarEvent[] => {
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    return getEventsForTimeSlot(startOfDay, endOfDay);
  }, [getEventsForTimeSlot]);

  // Get events that conflict with the given event
  const getConflictingEvents = useCallback((targetEvent: CalendarEvent): CalendarEvent[] => {
    const targetStart = new Date(targetEvent.startTime);
    const targetEnd = new Date(targetEvent.endTime);

    return processedEvents.filter(event => {
      // Don't compare with itself
      if (event.id === targetEvent.id) return false;

      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);

      // Check for time overlap
      return (
        (eventStart < targetEnd && eventEnd > targetStart) || // Events overlap
        (eventStart.getTime() === targetStart.getTime()) // Same start time
      );
    });
  }, [processedEvents]);

  // Check if an event has conflicts with other events
  const hasConflicts = useCallback((event: CalendarEvent): boolean => {
    return getConflictingEvents(event).length > 0;
  }, [getConflictingEvents]);

  // Calculate source statistics
  const sourceStats = useMemo(() => {
    return {
      google: processedEvents.filter(event => event.source === 'google').length,
      outlook: processedEvents.filter(event => event.source === 'outlook').length,
    };
  }, [processedEvents]);

  return {
    events: processedEvents,
    isLoading,
    error,
    refetch,
    
    // Utility functions
    getEventsForTimeSlot,
    getEventsForDay,
    hasConflicts,
    getConflictingEvents,
    
    // Stats
    totalEvents: processedEvents.length,
    sourceStats,
  };
}

/**
 * Hook for calendar events on a specific date with enhanced utilities
 */
export function useCalendarDataForDate(date: Date, options: Omit<UseCalendarDataOptions, 'date'> = {}) {
  const dateString = date.toISOString().split('T')[0];
  return useCalendarData({ ...options, date: dateString });
}

/**
 * Hook for today's calendar events
 */
export function useTodaysCalendarData(options: Omit<UseCalendarDataOptions, 'date'> = {}) {
  return useCalendarDataForDate(new Date(), options);
}
