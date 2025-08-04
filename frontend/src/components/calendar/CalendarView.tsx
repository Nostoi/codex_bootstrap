import React, { useState, useCallback, useEffect, useRef } from 'react';
import { CalendarViewType, CalendarDate, CalendarViewComponentProps } from '../../types/calendar';
import { CalendarHeader } from './CalendarHeader';
import { CalendarGrid } from './CalendarGrid';
import { useCalendarEvents } from '../../hooks/useApi';
import { calendarTokens } from '../../styles/calendar-tokens';
import {
  useCalendarAccessibility,
  useCalendarKeyboardNavigation,
  useCalendarFocusManagement,
  getCalendarAriaProps,
  generateCalendarInstructions,
  CALENDAR_ANNOUNCEMENTS,
} from '../../lib/calendar-accessibility';
import { AccessibilityProvider } from '../accessibility/AccessibilityComponents';

const CalendarView: React.FC<CalendarViewComponentProps> = ({
  initialView = 'weekly',
  initialDate,
  className = '',
  showNavigation = true,
  showViewSelector = true,
  onDateChange,
  onViewChange,
  onEventClick,
  disableNavigation = false,
  maxEventsPerSlot = 3,
  enableDragAndDrop = true,
  adhdSettings,
}) => {
  // Refs for accessibility
  const calendarRef = useRef<HTMLDivElement>(null);

  // State management
  const [currentView, setCurrentView] = useState<CalendarViewType>(initialView);
  const [currentDate, setCurrentDate] = useState<CalendarDate>(
    initialDate || {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: new Date().getDate(),
    }
  );

  // Convert CalendarDate to ISO string for API
  const dateString = `${currentDate.year}-${currentDate.month.toString().padStart(2, '0')}-${currentDate.day.toString().padStart(2, '0')}`;

  // Fetch calendar events for current date
  const { data: calendarData, isLoading, error, refetch } = useCalendarEvents(dateString);

  // Accessibility hooks
  const {
    announceViewChange,
    announceDateChange,
    announceEventSelection,
    announceEventMove,
    announceLoading,
    announceError,
    announceTimeSlotSelection,
    preferences,
  } = useCalendarAccessibility();

  // Focus management
  const { focusFirstElement, focusGrid, focusEvent, focusTimeSlot } =
    useCalendarFocusManagement(calendarRef);

  // Handle event move for drag and drop
  const handleEventMove = async (eventId: string, newStartTime: Date, newEndTime: Date) => {
    try {
      // Here you would call your API to update the event
      console.log('Moving event:', eventId, 'to', newStartTime, newEndTime);

      // Find the event being moved for accessibility announcement
      const movedEvent = calendarData?.events?.find(e => e.id === eventId);
      if (movedEvent) {
        // TODO: Fix type mismatch between CalendarEvent types
        // announceEventMove(movedEvent, newStartTime);
      }

      // For now, just log the action
      // In a real implementation, you'd call an API endpoint:
      // await updateCalendarEvent(eventId, { startTime: newStartTime, endTime: newEndTime });

      // Refresh the calendar data after successful move
      await refetch();
    } catch (error) {
      console.error('Failed to move event:', error);
      announceError();
      throw error; // Re-throw to trigger error feedback in drag handler
    }
  };

  // Handle time slot click for creating new events
  const handleTimeSlotClick = (startTime: Date) => {
    console.log('Time slot clicked:', startTime);
    announceTimeSlotSelection(startTime);
    // In a real implementation, this might open a "create event" modal
  };

  // Handle event click with accessibility announcement
  const handleEventClick = (event: any) => {
    announceEventSelection(event);
    onEventClick?.(event);
  };

  // Handle view changes
  const handleViewChange = useCallback(
    (view: CalendarViewType) => {
      setCurrentView(view);
      announceViewChange(view);
      onViewChange?.(view);

      // Focus the grid after view change
      setTimeout(() => focusGrid(), 100);
    },
    [onViewChange, announceViewChange, focusGrid]
  );

  // Handle date navigation
  const handleDateChange = useCallback(
    (date: CalendarDate) => {
      setCurrentDate(date);
      const dateObj = new Date(date.year, date.month - 1, date.day);
      announceDateChange(dateObj);
      onDateChange?.(date);
    },
    [onDateChange, announceDateChange]
  );

  // Navigate to previous period
  const handlePrevious = useCallback(() => {
    const newDate = { ...currentDate };

    switch (currentView) {
      case 'daily':
        // Go to previous day
        const prevDay = new Date(currentDate.year, currentDate.month - 1, currentDate.day - 1);
        newDate.year = prevDay.getFullYear();
        newDate.month = prevDay.getMonth() + 1;
        newDate.day = prevDay.getDate();
        break;
      case 'weekly':
        // Go to previous week
        const prevWeek = new Date(currentDate.year, currentDate.month - 1, currentDate.day - 7);
        newDate.year = prevWeek.getFullYear();
        newDate.month = prevWeek.getMonth() + 1;
        newDate.day = prevWeek.getDate();
        break;
      case 'monthly':
        // Go to previous month
        if (currentDate.month === 1) {
          newDate.year = currentDate.year - 1;
          newDate.month = 12;
        } else {
          newDate.month = currentDate.month - 1;
        }
        // Keep same day, but adjust if it doesn't exist in the new month
        const daysInMonth = new Date(newDate.year, newDate.month, 0).getDate();
        newDate.day = Math.min(currentDate.day, daysInMonth);
        break;
    }

    handleDateChange(newDate);
  }, [currentDate, currentView, handleDateChange]);

  // Navigate to next period
  const handleNext = useCallback(() => {
    const newDate = { ...currentDate };

    switch (currentView) {
      case 'daily':
        // Go to next day
        const nextDay = new Date(currentDate.year, currentDate.month - 1, currentDate.day + 1);
        newDate.year = nextDay.getFullYear();
        newDate.month = nextDay.getMonth() + 1;
        newDate.day = nextDay.getDate();
        break;
      case 'weekly':
        // Go to next week
        const nextWeek = new Date(currentDate.year, currentDate.month - 1, currentDate.day + 7);
        newDate.year = nextWeek.getFullYear();
        newDate.month = nextWeek.getMonth() + 1;
        newDate.day = nextWeek.getDate();
        break;
      case 'monthly':
        // Go to next month
        if (currentDate.month === 12) {
          newDate.year = currentDate.year + 1;
          newDate.month = 1;
        } else {
          newDate.month = currentDate.month + 1;
        }
        // Keep same day, but adjust if it doesn't exist in the new month
        const daysInMonth = new Date(newDate.year, newDate.month, 0).getDate();
        newDate.day = Math.min(currentDate.day, daysInMonth);
        break;
    }

    handleDateChange(newDate);
  }, [currentDate, currentView, handleDateChange]);

  // Navigate to today
  const handleToday = useCallback(() => {
    const today = new Date();
    const todayDate: CalendarDate = {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      day: today.getDate(),
    };
    handleDateChange(todayDate);
    // Additional announcement for "today" navigation
    setTimeout(() => {
      announceViewChange('Today');
    }, 100);
  }, [handleDateChange, announceViewChange]);

  // Keyboard navigation with accessibility integration
  useCalendarKeyboardNavigation(
    currentView,
    currentDate,
    calendarData?.events || [],
    direction => {
      if (direction === 'previous') handlePrevious();
      else if (direction === 'next') handleNext();
      else if (direction === 'today') handleToday();
    },
    handleViewChange,
    handleEventClick,
    handleTimeSlotClick,
    disableNavigation
  );

  // Announce loading state changes
  useEffect(() => {
    announceLoading(isLoading);
  }, [isLoading, announceLoading]);

  // Announce errors
  useEffect(() => {
    if (error) {
      announceError();
    }
  }, [error, announceError]);

  // Focus management on mount
  useEffect(() => {
    if (calendarRef.current) {
      focusFirstElement();
    }
  }, [focusFirstElement]);

  // Apply ADHD-specific CSS variables with accessibility preferences
  const adhdStyles = {
    // Original ADHD settings
    ...(adhdSettings
      ? {
          '--calendar-motion-duration': adhdSettings.reducedMotion
            ? '0ms'
            : calendarTokens.motion.durations.normal,
          '--calendar-motion-easing': calendarTokens.motion.easing.gentle,
          '--calendar-max-colors': adhdSettings.maxEventsPerView?.toString() || '3',
          '--calendar-focus-ring': adhdSettings.enableFocusMode
            ? calendarTokens.accessibility.focusRing.width
            : '2px',
        }
      : {}),
    // Accessibility preferences from user settings
    ...(preferences.reducedMotion && {
      '--calendar-motion-duration': '0ms',
      '--calendar-motion-easing': 'linear',
    }),
    ...(preferences.highContrast && {
      '--calendar-contrast-mode': 'high',
    }),
    ...(preferences.prefersDarkMode && {
      '--calendar-theme': 'dark',
    }),
  } as React.CSSProperties;

  // Generate accessibility props
  const calendarAriaProps = getCalendarAriaProps(currentView, currentDate, isLoading, !!error);

  // Generate screen reader instructions
  const screenReaderInstructions = generateCalendarInstructions(currentView);

  return (
    <AccessibilityProvider>
      <div
        ref={calendarRef}
        className={`calendar-view ${className}`}
        style={adhdStyles}
        {...calendarAriaProps}
      >
        {/* Enhanced screen reader instructions */}
        <div className="sr-only" id="calendar-instructions">
          {screenReaderInstructions}
        </div>

        {/* Additional help text for complex interactions */}
        <div className="sr-only" id="calendar-help">
          Calendar events can be selected and rescheduled.
          {enableDragAndDrop && 'Drag and drop is enabled for moving events. '}
          Use Tab to navigate between interactive elements.
        </div>

        {/* Live region for dynamic announcements */}
        <div
          className="sr-only"
          aria-live="polite"
          aria-atomic="true"
          id="calendar-announcements"
        />

        {/* Assertive live region for errors and important alerts */}
        <div className="sr-only" aria-live="assertive" aria-atomic="true" id="calendar-alerts" />

        {/* Calendar Header */}
        {showNavigation && (
          <CalendarHeader
            currentDate={currentDate}
            currentView={currentView}
            onDateChange={handleDateChange}
            onViewChange={handleViewChange}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onToday={handleToday}
            showViewSelector={showViewSelector}
            disabled={disableNavigation}
            isLoading={isLoading}
            onRefresh={refetch}
          />
        )}

        {/* Error State with enhanced accessibility */}
        {error && (
          <div
            className="alert alert-error mb-4"
            role="alert"
            aria-live="assertive"
            aria-labelledby="error-title"
            aria-describedby="error-description"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 id="error-title" className="font-semibold">
                Calendar Error
              </h3>
              <p id="error-description">
                Failed to load calendar events. Please check your connection and try again.
              </p>
            </div>
            <button
              className="btn btn-sm btn-outline"
              onClick={() => refetch()}
              aria-label="Retry loading calendar events"
            >
              Retry
            </button>
          </div>
        )}

        {/* Calendar Grid */}
        <CalendarGrid
          currentDate={currentDate}
          currentView={currentView}
          events={calendarData?.events || []}
          isLoading={isLoading}
          onEventClick={handleEventClick}
          maxEventsPerSlot={maxEventsPerSlot}
          enableDragAndDrop={enableDragAndDrop}
          adhdSettings={adhdSettings}
          onEventMove={handleEventMove}
          onTimeSlotClick={handleTimeSlotClick}
          aria-describedby="calendar-instructions calendar-help"
        />

        {/* Enhanced loading overlay with better accessibility */}
        {isLoading && (
          <div
            className="absolute inset-0 bg-base-100/50 flex items-center justify-center z-10"
            role="status"
            aria-live="polite"
            aria-label="Loading calendar events"
          >
            <div className="flex items-center gap-2">
              <span className="loading loading-spinner loading-md" aria-hidden="true" />
              <span id="loading-text">Loading calendar events...</span>
            </div>
          </div>
        )}
      </div>
    </AccessibilityProvider>
  );
};

export default CalendarView;
