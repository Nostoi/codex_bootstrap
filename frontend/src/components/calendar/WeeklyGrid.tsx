import React, { useMemo } from 'react';
import { CalendarDate, ADHDCalendarSettings } from '../../types/calendar';
import { CalendarEvent } from '../../hooks/useApi';
import { CalendarEvent as CalendarEventComponent } from '../ui/CalendarEvent';

interface WeeklyGridProps {
  currentDate: CalendarDate;
  events: CalendarEvent[];
  isLoading?: boolean;
  onEventClick?: (event: CalendarEvent) => void;
  maxEventsPerDay?: number;
  enableDragAndDrop?: boolean;
  adhdSettings?: ADHDCalendarSettings;
  'aria-describedby'?: string;
}

export const WeeklyGrid: React.FC<WeeklyGridProps> = ({
  currentDate,
  events,
  isLoading = false,
  onEventClick,
  maxEventsPerDay = 3,
  enableDragAndDrop = true,
  adhdSettings: _adhdSettings,
  ..._ariaProps
}) => {
  // Calculate week start (Monday)
  const weekStart = useMemo(() => {
    const date = new Date(currentDate.year, currentDate.month - 1, currentDate.day);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    return new Date(date.setDate(diff));
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
        isCurrentMonth: date.getMonth() === currentDate.month - 1
      });
    }
    return days;
  }, [weekStart, currentDate.month]);

  // Generate hour slots (6 AM to 10 PM by default)
  const hourSlots = useMemo(() => {
    const slots = [];
    for (let hour = 6; hour <= 22; hour++) {
      slots.push({
        hour,
        timeLabel: new Date(0, 0, 0, hour).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          hour12: true 
        })
      });
    }
    return slots;
  }, []);

  // Group events by day and hour
  const eventsByDayHour = useMemo(() => {
    const groupedEvents: Record<string, Record<number, CalendarEvent[]>> = {};
    
    events.forEach(event => {
      const eventDate = new Date(event.startTime);
      const dateKey = eventDate.toDateString();
      const hour = eventDate.getHours();
      
      if (!groupedEvents[dateKey]) {
        groupedEvents[dateKey] = {};
      }
      if (!groupedEvents[dateKey][hour]) {
        groupedEvents[dateKey][hour] = [];
      }
      groupedEvents[dateKey][hour].push(event);
    });
    
    return groupedEvents;
  }, [events]);

  // Get events for a specific day and hour
  const getEventsForDayHour = (date: Date, hour: number) => {
    const dateKey = date.toDateString();
    return eventsByDayHour[dateKey]?.[hour] || [];
  };

  if (isLoading) {
    return (
      <div 
        className="grid grid-cols-8 gap-1 h-full animate-pulse"
        role="grid"
        aria-label="Loading weekly calendar"
        {..._ariaProps}
      >
        <div className="bg-gray-200 rounded"></div>
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="bg-gray-200 rounded"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-8 gap-1 mb-2 min-h-[60px]">
        <div className="flex items-center justify-center">
          <span className="text-sm font-medium text-gray-500">Time</span>
        </div>
        
        {weekDays.map((day, index) => (
          <div
            key={index}
            className={`
              flex flex-col items-center justify-center p-2 rounded-lg
              ${day.isToday ? 'bg-primary text-primary-content' : 'bg-base-200'}
              ${!day.isCurrentMonth ? 'opacity-50' : ''}
            `}
          >
            <span className="text-xs font-medium">
              {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
            </span>
            <span className="text-lg font-bold">
              {day.day}
            </span>
          </div>
        ))}
      </div>

      <div 
        className="grid grid-cols-8 gap-1 flex-1 overflow-auto"
        role="grid"
        aria-label={`Weekly calendar for ${weekStart.toLocaleDateString()}`}
        {..._ariaProps}
      >
        {hourSlots.map((slot) => (
          <React.Fragment key={slot.hour}>
            <div 
              className="flex items-start justify-end pr-2 py-1 text-sm text-gray-500"
              role="rowheader"
            >
              {slot.timeLabel}
            </div>
            
            {weekDays.map((day, _dayIndex) => {
              const dayEvents = getEventsForDayHour(day.date, slot.hour);
              const displayEvents = dayEvents.slice(0, maxEventsPerDay);
              const hasMoreEvents = dayEvents.length > maxEventsPerDay;
              
              return (
                <div
                  key={`${day.date.toDateString()}-${slot.hour}`}
                  className={`
                    relative min-h-[60px] p-1 border border-gray-200 rounded
                    hover:bg-gray-50 transition-colors
                    ${day.isToday && slot.hour === new Date().getHours() ? 'bg-primary/10' : ''}
                  `}
                  role="gridcell"
                  aria-label={`${slot.timeLabel} on ${day.date.toLocaleDateString()}, ${dayEvents.length} events`}
                >
                  <div className="space-y-1">
                    {displayEvents.map((event, eventIndex) => (
                      <CalendarEventComponent
                        key={`${event.id}-${eventIndex}`}
                        event={event}
                        onClick={onEventClick}
                        compact={true}
                        showTimeLabels={false}
                        enableDragAndDrop={enableDragAndDrop}
                        className="w-full"
                      />
                    ))}
                    
                    {hasMoreEvents && (
                      <div className="text-xs text-gray-500 text-center py-1">
                        +{dayEvents.length - maxEventsPerDay} more
                      </div>
                    )}
                  </div>
                  
                  {day.isToday && slot.hour === new Date().getHours() && (
                    <div 
                      className="absolute left-0 w-full h-0.5 bg-red-500 z-10"
                      style={{
                        top: `${(new Date().getMinutes() / 60) * 100}%`
                      }}
                      aria-hidden="true"
                    />
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
