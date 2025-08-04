import React, { useMemo, useCallback } from 'react';
import { CalendarDate, ADHDCalendarSettings } from '../../types/calendar';
import { CalendarEvent } from '../../hooks/useApi';
import { DragWrapper } from '../ui/DragWrapper';
import { TimeSlot } from '../ui/TimeSlot';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';

interface WeeklyGridProps {
  currentDate: CalendarDate;
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

export const WeeklyGrid: React.FC<WeeklyGridProps> = ({
  currentDate,
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
  // Initialize drag and drop
  const { handlers } = useDragAndDrop({
    adhdSettings,
    onEventMove,
    onConflictDetected: conflicts => {
      console.warn('Calendar conflicts detected:', conflicts);
    },
  });

  // Calculate week start (Sunday)
  const weekStart = useMemo(() => {
    const date = new Date(currentDate.year, currentDate.month - 1, currentDate.day);
    const dayOfWeek = date.getDay();
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - dayOfWeek);
    return startOfWeek;
  }, [currentDate]);

  // Generate 7 days of the week
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      days.push({
        date: date,
        day: date.getDate(),
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        isToday: date.toDateString() === new Date().toDateString(),
        isCurrentMonth: date.getMonth() === currentDate.month - 1,
      });
    }
    return days;
  }, [weekStart, currentDate.month]);

  // Generate time slots for weekly view (24hrs x 7 days, 1-hour intervals for better weekly view)
  const timeSlots = useMemo(() => {
    const slots = [];

    for (let hour = 0; hour < 24; hour++) {
      const hourSlots = [];

      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const slotStart = new Date(weekDays[dayIndex].date);
        slotStart.setHours(hour, 0, 0, 0);

        const slotEnd = new Date(slotStart);
        slotEnd.setHours(hour + 1, 0, 0, 0);

        // Filter events for this specific time slot
        const slotEvents = events.filter(event => {
          const eventStart = new Date(event.startTime);
          const eventEnd = new Date(event.endTime);

          return (
            (eventStart >= slotStart && eventStart < slotEnd) ||
            (eventEnd > slotStart && eventEnd <= slotEnd) ||
            (eventStart <= slotStart && eventEnd >= slotEnd)
          );
        });

        hourSlots.push({
          startTime: slotStart,
          endTime: slotEnd,
          events: slotEvents,
          dayIndex,
          isWorkingHours: hour >= 9 && hour < 17, // 9 AM to 5 PM
          isToday: slotStart.toDateString() === new Date().toDateString(),
        });
      }
      slots.push({
        hour,
        timeLabel: formatTimeLabel(hour),
        slots: hourSlots,
      });
    }

    return slots;
  }, [weekDays, events]);

  // Format time labels
  const formatTimeLabel = useCallback((hour: number) => {
    const time = new Date();
    time.setHours(hour, 0, 0, 0);
    return time.toLocaleTimeString([], {
      hour: 'numeric',
      hour12: true,
    });
  }, []);

  // Format day headers
  const formatDayHeader = useCallback((day: (typeof weekDays)[0]) => {
    return {
      dayName: day.date.toLocaleDateString([], { weekday: 'short' }),
      dayNumber: day.day,
      isToday: day.isToday,
    };
  }, []);

  // ADHD-friendly styling
  const gridStyles = {
    '--calendar-reduce-motion': adhdSettings?.reducedMotion ? '1' : '0',
    '--calendar-enhance-focus': adhdSettings?.enableFocusMode ? '1' : '0',
    '--calendar-max-colors': adhdSettings?.maxEventsPerView?.toString() || '3',
  } as React.CSSProperties;

  if (isLoading) {
    return (
      <div className="weekly-grid weekly-grid--loading" style={gridStyles} {...ariaProps}>
        <div className="grid grid-cols-8 gap-px">
          {/* Time column header placeholder */}
          <div className="bg-muted/50 p-2">
            <div className="h-4 bg-muted rounded animate-pulse" />
          </div>

          {/* Day headers placeholders */}
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="bg-muted/50 p-2 text-center">
              <div className="h-4 bg-muted rounded animate-pulse mb-1" />
              <div className="h-6 bg-muted rounded animate-pulse" />
            </div>
          ))}

          {/* Time slots placeholders */}
          {Array.from({ length: 24 }).map((_, timeIndex) => (
            <React.Fragment key={timeIndex}>
              <div className="bg-muted/30 p-1 text-xs">
                <div className="h-3 bg-muted rounded animate-pulse" />
              </div>
              {Array.from({ length: 7 }).map((_, dayIndex) => (
                <div key={dayIndex} className="bg-background border border-border min-h-[60px]">
                  <div className="h-full bg-muted/20 rounded animate-pulse" />
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  return (
    <DragWrapper
      adhdSettings={adhdSettings}
      onDragStart={handlers.handleDragStart}
      onDragEnd={handlers.handleDragEnd}
      onDragCancel={handlers.handleDragCancel}
      className="weekly-grid"
    >
      <div
        className="grid grid-cols-8 gap-px bg-border"
        style={gridStyles}
        role="grid"
        aria-label="Weekly calendar view"
        aria-rowcount={25} // 24 time slots + 1 header
        aria-colcount={8} // 7 days + 1 time column
        {...ariaProps}
      >
        {/* Empty corner cell */}
        <div
          className="bg-muted/50 p-2 text-xs font-medium sticky top-0 z-10"
          role="columnheader"
          aria-label="Time column"
        />

        {/* Day headers */}
        {weekDays.map((day, dayIndex) => {
          const { dayName, dayNumber, isToday } = formatDayHeader(day);
          return (
            <div
              key={dayIndex}
              className={`
                bg-background p-2 text-center sticky top-0 z-10 border-b
                ${isToday ? 'bg-primary/10 border-primary font-bold' : 'border-border'}
              `}
              role="columnheader"
              aria-label={`${dayName} ${dayNumber}${isToday ? ' (today)' : ''}`}
            >
              <div className={`text-xs ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                {dayName}
              </div>
              <div
                className={`text-lg font-semibold ${isToday ? 'text-primary' : 'text-foreground'}`}
              >
                {dayNumber}
              </div>
            </div>
          );
        })}

        {/* Time slots grid */}
        {timeSlots.map(timeSlot => (
          <React.Fragment key={timeSlot.hour}>
            {/* Time label */}
            <div
              className="bg-muted/30 p-1 text-xs text-muted-foreground text-right pr-2 sticky left-0 z-5"
              role="rowheader"
              aria-label={timeSlot.timeLabel}
            >
              {timeSlot.timeLabel}
            </div>

            {/* Day slots for this hour */}
            {timeSlot.slots.map((slot, slotIndex) => (
              <TimeSlot
                key={`${slot.dayIndex}-${timeSlot.hour}`}
                startTime={slot.startTime}
                endTime={slot.endTime}
                events={slot.events}
                onClick={onTimeSlotClick}
                onEventClick={onEventClick}
                onEventMove={onEventMove}
                enableDragAndDrop={enableDragAndDrop}
                maxEventsPerSlot={maxEventsPerSlot}
                showTimeLabel={false} // Time labels are in the row headers
                isWorkingHours={slot.isWorkingHours}
                className={`
                  min-h-[60px] border-b border-border
                  ${slot.isToday ? 'bg-primary/5' : 'bg-background'}
                  hover:bg-muted/50 transition-colors
                  ${!slot.isWorkingHours ? 'bg-muted/20' : ''}
                `}
                compact={true}
              />
            ))}
          </React.Fragment>
        ))}
      </div>
    </DragWrapper>
  );
};
