import React, { useMemo } from 'react';
import { CalendarViewType, CalendarDate, ADHDCalendarSettings } from '../../types/calendar';
import { CalendarEvent } from '../../hooks/useApi';
import { DailyGrid } from './DailyGrid';
import { WeeklyGrid } from './WeeklyGrid';
import { MonthlyGrid } from './MonthlyGrid';
import {
  getCalendarGridAriaProps,
  useCalendarAccessibility,
} from '../../lib/calendar-accessibility';

interface CalendarGridProps {
  currentDate: CalendarDate;
  currentView: CalendarViewType;
  events: CalendarEvent[];
  isLoading?: boolean;
  onEventClick?: (event: CalendarEvent) => void;
  maxEventsPerSlot?: number;
  enableDragAndDrop?: boolean;
  adhdSettings?: ADHDCalendarSettings;
  onEventMove?: (eventId: string, newStartTime: Date, newEndTime: Date) => Promise<void>;
  onTimeSlotClick?: (startTime: Date) => void;
  'aria-describedby'?: string;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  currentView,
  events,
  isLoading = false,
  onEventClick,
  maxEventsPerSlot = 3,
  enableDragAndDrop = true,
  adhdSettings,
  onEventMove,
  onTimeSlotClick,
  ...ariaProps
}) => {
  // Get accessibility preferences
  const { preferences } = useCalendarAccessibility();

  // Filter events based on current view and date
  const filteredEvents = useMemo(() => {
    const currentDateObj = new Date(currentDate.year, currentDate.month - 1, currentDate.day);

    return events.filter(event => {
      const eventStart = new Date(event.startTime);

      switch (currentView) {
        case 'daily':
          // Show events for the current day
          return eventStart.toDateString() === currentDateObj.toDateString();

        case 'weekly':
          // Show events for the current week
          const startOfWeek = new Date(currentDateObj);
          startOfWeek.setDate(currentDateObj.getDate() - currentDateObj.getDay());
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          endOfWeek.setHours(23, 59, 59, 999);

          return eventStart >= startOfWeek && eventStart <= endOfWeek;

        case 'monthly':
          // Show events for the current month
          return (
            eventStart.getFullYear() === currentDate.year &&
            eventStart.getMonth() === currentDate.month - 1
          );

        default:
          return false;
      }
    });
  }, [events, currentDate, currentView]);

  // Apply ADHD-specific CSS variables with accessibility preferences
  const gridStyles = {
    // Original ADHD settings
    ...(adhdSettings
      ? {
          '--calendar-reduce-motion': adhdSettings.reducedMotion ? '1' : '0',
          '--calendar-enhance-focus': adhdSettings.enableFocusMode ? '1' : '0',
          '--calendar-max-colors': adhdSettings.maxEventsPerView?.toString() || '3',
        }
      : {}),
    // Accessibility preferences override
    ...(preferences.reducedMotion && {
      '--calendar-reduce-motion': '1',
    }),
    ...(preferences.highContrast && {
      '--calendar-high-contrast': '1',
    }),
  } as React.CSSProperties;

  // Calculate grid dimensions for ARIA
  const getGridDimensions = () => {
    switch (currentView) {
      case 'daily':
        return { rows: 24, columns: 1 }; // 24 hours, 1 day
      case 'weekly':
        return { rows: 24, columns: 7 }; // 24 hours, 7 days
      case 'monthly':
        return { rows: 6, columns: 7 }; // 6 weeks max, 7 days
      default:
        return { rows: 1, columns: 1 };
    }
  };

  const { rows, columns } = getGridDimensions();
  const gridAriaProps = getCalendarGridAriaProps(currentView, rows, columns);

  const commonProps = {
    currentDate,
    events: filteredEvents,
    isLoading,
    onEventClick,
    maxEventsPerSlot,
    enableDragAndDrop,
    adhdSettings,
    onEventMove,
    onTimeSlotClick,
    ...ariaProps,
  };

  return (
    <div
      className="calendar-grid"
      style={gridStyles}
      {...gridAriaProps}
      aria-busy={isLoading}
      {...ariaProps}
    >
      {currentView === 'daily' && <DailyGrid {...commonProps} />}

      {currentView === 'weekly' && <WeeklyGrid {...commonProps} />}

      {currentView === 'monthly' && <MonthlyGrid {...commonProps} />}
    </div>
  );
};
