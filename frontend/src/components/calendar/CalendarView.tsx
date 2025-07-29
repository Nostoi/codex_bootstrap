import React, { useState, useCallback, useEffect } from 'react';
import { CalendarViewType, CalendarDate, CalendarViewComponentProps } from '../../types/calendar';
import { CalendarHeader } from './CalendarHeader';
import { CalendarGrid } from './CalendarGrid';
import { useCalendarEvents } from '../../hooks/useApi';
import { calendarTokens } from '../../styles/calendar-tokens';

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

  // Handle event move for drag and drop
  const handleEventMove = async (eventId: string, newStartTime: Date, newEndTime: Date) => {
    try {
      // Here you would call your API to update the event
      console.log('Moving event:', eventId, 'to', newStartTime, newEndTime);
      
      // For now, just log the action
      // In a real implementation, you'd call an API endpoint:
      // await updateCalendarEvent(eventId, { startTime: newStartTime, endTime: newEndTime });
      
      // Refresh the calendar data after successful move
      await refetch();
    } catch (error) {
      console.error('Failed to move event:', error);
      throw error; // Re-throw to trigger error feedback in drag handler
    }
  };

  // Handle time slot click for creating new events
  const handleTimeSlotClick = (startTime: Date) => {
    console.log('Time slot clicked:', startTime);
    // In a real implementation, this might open a "create event" modal
  };

  // Handle view changes
  const handleViewChange = useCallback((view: CalendarViewType) => {
    setCurrentView(view);
    onViewChange?.(view);
  }, [onViewChange]);

  // Handle date navigation
  const handleDateChange = useCallback((date: CalendarDate) => {
    setCurrentDate(date);
    onDateChange?.(date);
  }, [onDateChange]);

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
  }, [handleDateChange]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (disableNavigation) return;

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          handlePrevious();
          break;
        case 'ArrowRight':
          event.preventDefault();
          handleNext();
          break;
        case 'Home':
          event.preventDefault();
          handleToday();
          break;
        case '1':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            handleViewChange('daily');
          }
          break;
        case '2':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            handleViewChange('weekly');
          }
          break;
        case '3':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            handleViewChange('monthly');
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [disableNavigation, handlePrevious, handleNext, handleToday, handleViewChange]);

  // Apply ADHD-specific CSS variables
  const adhdStyles = adhdSettings ? {
    '--calendar-motion-duration': adhdSettings.reducedMotion ? '0ms' : calendarTokens.motion.durations.normal,
    '--calendar-motion-easing': calendarTokens.motion.easing.gentle,
    '--calendar-max-colors': adhdSettings.maxEventsPerView?.toString() || '3',
    '--calendar-focus-ring': adhdSettings.enableFocusMode ? calendarTokens.accessibility.focusRing.width : '2px',
  } as React.CSSProperties : {};

  return (
    <div 
      className={`calendar-view ${className}`}
      style={adhdStyles}
      role="application"
      aria-label="Calendar view"
      tabIndex={0}
    >
      {/* Screen reader instructions */}
      <div className="sr-only" id="calendar-instructions">
        Use arrow keys to navigate dates. Ctrl+1 for daily view, Ctrl+2 for weekly view, Ctrl+3 for monthly view. Home key to go to today.
      </div>

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

      {/* Error State */}
      {error && (
        <div className="alert alert-error mb-4" role="alert">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Failed to load calendar events</span>
          <button className="btn btn-sm btn-outline" onClick={() => refetch()}>
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
        onEventClick={onEventClick}
        maxEventsPerSlot={maxEventsPerSlot}
        enableDragAndDrop={enableDragAndDrop}
        adhdSettings={adhdSettings}
        onEventMove={handleEventMove}
        onTimeSlotClick={handleTimeSlotClick}
        aria-describedby="calendar-instructions"
      />

      {/* Loading overlay */}
      {isLoading && (
        <div 
          className="absolute inset-0 bg-base-100/50 flex items-center justify-center z-10"
          aria-live="polite"
          aria-label="Loading calendar"
        >
          <div className="flex items-center gap-2">
            <span className="loading loading-spinner loading-md"></span>
            <span>Loading calendar...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
