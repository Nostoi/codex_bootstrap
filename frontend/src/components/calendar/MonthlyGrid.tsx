import React, { useMemo, useCallback } from 'react';
import { CalendarDate, ADHDCalendarSettings } from '../../types/calendar';
import { CalendarEvent } from '../../hooks/useApi';
import { DragWrapper } from '../ui/DragWrapper';
import { TimeSlot } from '../ui/TimeSlot';
import { CalendarEvent as CalendarEventComponent } from '../ui/CalendarEvent';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';

interface MonthlyGridProps {
  currentDate: CalendarDate;
  events: CalendarEvent[];
  tasks?: any[]; // Add tasks prop
  isLoading?: boolean;
  onEventClick?: (event: CalendarEvent) => void;
  onTaskClick?: (task: any) => void; // Add task click handler
  onEventUpdate?: (event: CalendarEvent) => Promise<void>; // Add event update handler
  onTaskUpdate?: (task: any) => Promise<void>; // Add task update handler
  maxEventsPerSlot?: number;
  enableDragAndDrop?: boolean;
  adhdSettings?: ADHDCalendarSettings;
  onEventMove?: (eventId: string, newStartTime: Date, newEndTime: Date) => Promise<void>;
  onTimeSlotClick?: (startTime: Date) => void;
  'aria-describedby'?: string;
}

export const MonthlyGrid: React.FC<MonthlyGridProps> = ({
  currentDate,
  events,
  tasks = [],
  isLoading = false,
  onEventClick,
  onTaskClick,
  onEventUpdate,
  onTaskUpdate,
  maxEventsPerSlot = 3,
  enableDragAndDrop = true,
  adhdSettings,
  onEventMove,
  onTimeSlotClick,
  ...ariaProps
}) => {
  // Use maxEventsPerSlot for display limit
  const maxEventsPerDay = maxEventsPerSlot;
  const { handlers } = useDragAndDrop({
    adhdSettings,
    onEventMove,
    onConflictDetected: conflicts => {
      console.warn('Calendar conflicts detected:', conflicts);
    },
  });

  // Calculate month grid (6 weeks x 7 days)
  const monthGrid = useMemo(() => {
    const firstDay = new Date(currentDate.year, currentDate.month - 1, 1);
    const startDate = new Date(firstDay);

    // Start from Sunday of the week containing the first day
    const dayOfWeek = firstDay.getDay();
    startDate.setDate(firstDay.getDate() - dayOfWeek);

    const grid = [];
    const currentIterDate = new Date(startDate);

    // Generate 6 weeks of days
    for (let week = 0; week < 6; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        const date = new Date(currentIterDate);
        weekDays.push({
          date: date,
          day: date.getDate(),
          month: date.getMonth() + 1,
          year: date.getFullYear(),
          isToday: date.toDateString() === new Date().toDateString(),
          isCurrentMonth: date.getMonth() === currentDate.month - 1,
          isPastDate: date < new Date(new Date().toDateString()),
        });
        currentIterDate.setDate(currentIterDate.getDate() + 1);
      }
      grid.push(weekDays);
    }

    return grid;
  }, [currentDate]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const groupedEvents: Record<string, CalendarEvent[]> = {};

    events.forEach(event => {
      const eventDate = new Date(event.startTime);
      const dateKey = eventDate.toDateString();

      if (!groupedEvents[dateKey]) {
        groupedEvents[dateKey] = [];
      }
      groupedEvents[dateKey].push(event);
    });

    return groupedEvents;
  }, [events]);

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    const dateKey = date.toDateString();
    return eventsByDate[dateKey] || [];
  };

  if (isLoading) {
    return (
      <div
        className="grid grid-cols-7 gap-1 h-full animate-pulse"
        role="grid"
        aria-label="Loading monthly calendar"
        {...ariaProps}
      >
        {Array.from({ length: 42 }).map((_, index) => (
          <div key={index} className="bg-gray-200 rounded min-h-[100px]"></div>
        ))}
      </div>
    );
  }

  return (
    <DragWrapper adhdSettings={adhdSettings}>
      <div className="h-full flex flex-col">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(dayName => (
            <div
              key={dayName}
              className="text-center py-2 text-sm font-medium text-gray-700 bg-base-200 rounded"
            >
              {dayName}
            </div>
          ))}
        </div>

        <div
          className="grid grid-cols-7 gap-1 flex-1"
          role="grid"
          aria-label={`Monthly calendar for ${new Date(currentDate.year, currentDate.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
          {...ariaProps}
        >
          {monthGrid.flat().map((dayInfo, index) => {
            const dayEvents = getEventsForDate(dayInfo.date);
            const displayEvents = dayEvents.slice(0, maxEventsPerDay);
            const hasMoreEvents = dayEvents.length > maxEventsPerDay;

            return (
              <div
                key={`${dayInfo.date.toDateString()}-${index}`}
                className={`
                  relative min-h-[100px] p-1 border rounded transition-colors
                  hover:bg-gray-50 focus-within:ring-2 focus-within:ring-primary/50
                  ${dayInfo.isToday ? 'bg-primary/10 border-primary' : 'border-gray-200'}
                  ${!dayInfo.isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''}
                  ${dayInfo.isPastDate && dayInfo.isCurrentMonth ? 'bg-gray-25' : ''}
                `}
                role="gridcell"
                aria-label={`${dayInfo.date.toLocaleDateString()}, ${dayEvents.length} events`}
                tabIndex={0}
                onClick={() => onTimeSlotClick?.(dayInfo.date)}
              >
                <div className="flex justify-between items-start mb-1">
                  <span
                    className={`
                      text-sm font-medium
                      ${dayInfo.isToday ? 'text-primary font-bold' : ''}
                      ${!dayInfo.isCurrentMonth ? 'text-gray-400' : ''}
                    `}
                  >
                    {dayInfo.day}
                  </span>

                  {dayEvents.length > 0 && (
                    <span className="text-xs bg-primary text-primary-content rounded-full px-1 min-w-[16px] text-center">
                      {dayEvents.length}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  {displayEvents.map((event, eventIndex) => (
                    <CalendarEventComponent
                      key={`${event.id}-${eventIndex}`}
                      event={event}
                      onClick={onEventClick}
                      compact={true}
                      showTimeLabels={false}
                      enableDragAndDrop={enableDragAndDrop}
                      className="w-full text-xs"
                    />
                  ))}

                  {hasMoreEvents && (
                    <div className="text-xs text-gray-500 text-center py-1 bg-gray-100 rounded">
                      +{dayEvents.length - maxEventsPerDay} more
                    </div>
                  )}
                </div>

                {dayInfo.isToday && (
                  <div
                    className="absolute bottom-1 right-1 w-2 h-2 bg-primary rounded-full"
                    aria-hidden="true"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </DragWrapper>
  );
};
