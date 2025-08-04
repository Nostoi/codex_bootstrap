import React, { useMemo, useCallback } from 'react';
import { CalendarDate, ADHDCalendarSettings } from '../../types/calendar';
import { CalendarEvent } from '../../hooks/useApi';
import { calendarTokens } from '../../styles/calendar-tokens';
import { DragWrapper } from '../ui/DragWrapper';
import { TimeSlot } from '../ui/TimeSlot';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';

interface DailyGridProps {
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

export const DailyGrid: React.FC<DailyGridProps> = ({
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

  // Generate 24-hour time slots (30-minute intervals)
  const timeSlots = useMemo(() => {
    const slots = [];
    const targetDate = new Date(currentDate.year, currentDate.month - 1, currentDate.day);

    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotStart = new Date(targetDate);
        slotStart.setHours(hour, minute, 0, 0);

        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + 30);

        slots.push({
          id: `slot-${hour}-${minute}`,
          startTime: slotStart,
          endTime: slotEnd,
          hour,
          minute,
          label: slotStart.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }),
        });
      }
    }
    return slots;
  }, [currentDate]);

  // Group events by time slot
  const eventsInSlots = useMemo(() => {
    const slotEvents: { [key: string]: CalendarEvent[] } = {};

    events.forEach(event => {
      const startTime = new Date(event.startTime);
      const hour = startTime.getHours();
      const minute = Math.floor(startTime.getMinutes() / 30) * 30;
      const slotId = `slot-${hour}-${minute}`;

      if (!slotEvents[slotId]) {
        slotEvents[slotId] = [];
      }
      slotEvents[slotId].push(event);
    });

    return slotEvents;
  }, [events]);

  // Determine energy level for time slot based on user patterns
  const getSlotEnergyLevel = useCallback((hour: number): 'HIGH' | 'MEDIUM' | 'LOW' => {
    if (hour >= 6 && hour < 12) return 'HIGH'; // Morning
    if (hour >= 12 && hour < 18) return 'MEDIUM'; // Afternoon
    return 'LOW'; // Evening/Night
  }, []);

  // Check if time slot is in working hours
  const isWorkingHours = useCallback((hour: number) => {
    return hour >= 8 && hour < 18; // 8 AM to 6 PM
  }, []);

  // Check if current time slot is now
  const isCurrentTimeSlot = useCallback((slotTime: Date) => {
    const now = new Date();
    const slotEnd = new Date(slotTime);
    slotEnd.setMinutes(slotEnd.getMinutes() + 30);

    return now >= slotTime && now < slotEnd;
  }, []);

  // Handle time slot click
  const handleTimeSlotClick = useCallback(
    (startTime: Date) => {
      onTimeSlotClick?.(startTime);
    },
    [onTimeSlotClick]
  );

  // Wrapper content for drag and drop
  const gridContent = (
    <div className="daily-grid h-full">
      {/* Date Header */}
      <div className="sticky top-0 z-10 bg-base-100 border-b border-base-300 p-4">
        <h3 className="text-lg font-semibold">
          {new Date(currentDate.year, currentDate.month - 1, currentDate.day).toLocaleDateString(
            'en-US',
            {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }
          )}
        </h3>
        <p className="text-sm text-base-content/70">
          {events.length} event{events.length !== 1 ? 's' : ''} scheduled
        </p>
      </div>

      {/* All Day Events */}
      {events.some(e => e.isAllDay) && (
        <div className="all-day-section bg-base-50 border-b border-base-300 p-4">
          <h4 className="text-sm font-medium text-base-content/70 mb-2">All Day</h4>
          <div className="space-y-1">
            {events
              .filter(e => e.isAllDay)
              .slice(0, maxEventsPerSlot)
              .map(event => (
                <div
                  key={event.id}
                  className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-base-200 transition-colors"
                  onClick={() => onEventClick?.(event)}
                  style={{
                    borderLeft: `4px solid ${calendarTokens.colors.energyLevels[event.energyLevel || 'MEDIUM'].primary}`,
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`All day event: ${event.title}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{event.title}</div>
                    {event.focusType && (
                      <div
                        className="text-xs font-medium"
                        style={{ color: calendarTokens.colors.focusTypes[event.focusType].primary }}
                      >
                        {event.focusType}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-base-content/50">{event.source}</div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Time Grid with Drag and Drop */}
      <div className="time-grid flex-1 overflow-y-auto" role="grid" {...ariaProps}>
        {timeSlots.map(slot => {
          const slotEvents = eventsInSlots[slot.id]?.filter(e => !e.isAllDay) || [];
          const energyLevel = getSlotEnergyLevel(slot.hour);
          const isWorkingTime = isWorkingHours(slot.hour);
          const isCurrentSlot = isCurrentTimeSlot(slot.startTime);

          return (
            <TimeSlot
              key={slot.id}
              startTime={slot.startTime}
              endTime={slot.endTime}
              events={slotEvents}
              onClick={handleTimeSlotClick}
              onEventClick={onEventClick}
              onEventMove={onEventMove}
              enableDragAndDrop={enableDragAndDrop}
              maxEventsPerSlot={maxEventsPerSlot}
              showTimeLabel={true}
              isWorkingHours={isWorkingTime}
              className="border-b border-base-200"
              style={{
                backgroundColor: isCurrentSlot
                  ? calendarTokens.colors.energyLevels[energyLevel].secondary
                  : undefined,
                borderLeftColor: calendarTokens.colors.energyLevels[energyLevel].primary,
                borderLeftWidth: '3px',
                borderLeftStyle: 'solid',
              }}
              compact={false}
            />
          );
        })}
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-base-100/80 flex items-center justify-center z-20">
          <div className="flex items-center gap-2">
            <span className="loading loading-spinner loading-md"></span>
            <span>Loading events...</span>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && events.length === 0 && (
        <div className="flex items-center justify-center h-64 text-base-content/60">
          <div className="text-center">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-lg font-medium mb-2">No events today</h3>
            <p className="text-sm">Your schedule is clear</p>
          </div>
        </div>
      )}
    </div>
  );

  // Wrap with drag and drop context if enabled
  if (enableDragAndDrop) {
    return (
      <DragWrapper
        adhdSettings={adhdSettings}
        onDragStart={handlers.handleDragStart}
        onDragEnd={handlers.handleDragEnd}
        onDragCancel={handlers.handleDragCancel}
        className="daily-grid-wrapper"
      >
        {gridContent}
      </DragWrapper>
    );
  }

  return gridContent;
};
