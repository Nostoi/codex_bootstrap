import React, { useMemo, useCallback, useState } from 'react';
import { CalendarEvent as CalendarEventType } from '../../hooks/useApi';
import { useDroppable } from '@dnd-kit/core';
import { calendarTokens } from '../../styles/calendar-tokens';
import { CalendarEvent } from './CalendarEvent';

interface TimeSlotProps {
  startTime: Date;
  endTime: Date;
  events: CalendarEventType[];
  onClick?: (startTime: Date) => void;
  onEventClick?: (event: CalendarEventType) => void;
  onEventMove?: (eventId: string, newStartTime: Date, newEndTime: Date) => Promise<void>;
  enableDragAndDrop?: boolean;
  maxEventsPerSlot?: number;
  showTimeLabel?: boolean;
  isWorkingHours?: boolean;
  className?: string;
  style?: React.CSSProperties;
  compact?: boolean;
}

/**
 * TimeSlot component for displaying time blocks with calendar events
 * Supports drag and drop, conflict detection, and ADHD-friendly design
 */
export const TimeSlot: React.FC<TimeSlotProps> = ({
  startTime,
  endTime,
  events,
  onClick,
  onEventClick,
  onEventMove: _onEventMove,
  enableDragAndDrop = true,
  maxEventsPerSlot = 3,
  showTimeLabel = true,
  isWorkingHours = true,
  className = '',
  style = {},
  compact = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);

  // Create droppable zone
  const { isOver, setNodeRef, active } = useDroppable({
    id: `time-slot-${startTime.getTime()}`,
    data: {
      type: 'time-slot',
      startTime,
      endTime,
      accepts: ['calendar-event', 'task'],
    },
    disabled: !enableDragAndDrop,
  });

  // Calculate conflicts
  const { conflictGroups, hasConflicts } = useMemo(() => {
    const conflicts = new Map<string, CalendarEventType[]>();
    const processed = new Set<string>();

    events.forEach(event => {
      if (processed.has(event.id)) return;

      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);

      // Find overlapping events
      const overlapping = events.filter(otherEvent => {
        if (otherEvent.id === event.id) return true;

        const otherStart = new Date(otherEvent.startTime);
        const otherEnd = new Date(otherEvent.endTime);

        // Check for overlap
        return (
          (eventStart < otherEnd && eventEnd > otherStart) ||
          (otherStart < eventEnd && otherEnd > eventStart)
        );
      });

      if (overlapping.length > 1) {
        const groupKey = overlapping
          .map(e => e.id)
          .sort()
          .join('-');
        conflicts.set(groupKey, overlapping);
        overlapping.forEach(e => processed.add(e.id));
      }
    });

    return {
      conflictGroups: Array.from(conflicts.values()),
      hasConflicts: conflicts.size > 0,
    };
  }, [events]);

  // Filter events for this time slot
  const slotEvents = useMemo(() => {
    return events.filter(event => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);

      // Event overlaps with this time slot
      return (
        (eventStart < endTime && eventEnd > startTime) ||
        (eventStart >= startTime && eventStart < endTime) ||
        (eventEnd > startTime && eventEnd <= endTime)
      );
    });
  }, [events, startTime, endTime]);

  // Handle time slot click
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClick?.(startTime);
      }
    },
    [onClick, startTime]
  );

  // Handle event interactions
  const handleEventClick = useCallback(
    (event: CalendarEventType) => {
      onEventClick?.(event);
    },
    [onEventClick]
  );

  // Format time for display
  const formatTime = useCallback((date: Date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }, []);

  // Get time slot duration in minutes
  const getDurationMinutes = useCallback(() => {
    return Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
  }, [startTime, endTime]);

  // Determine if this is a focus time slot (based on events)
  const getFocusType = useCallback(() => {
    if (slotEvents.length === 0) return null;

    // Get most common focus type in this slot
    const focusTypeCounts = slotEvents.reduce(
      (acc, event) => {
        if (event.focusType) {
          acc[event.focusType] = (acc[event.focusType] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    const mostCommonFocus = Object.keys(focusTypeCounts).reduce(
      (a, b) => (focusTypeCounts[a] > focusTypeCounts[b] ? a : b),
      Object.keys(focusTypeCounts)[0]
    );

    return mostCommonFocus || null;
  }, [slotEvents]);

  // Calculate visual properties
  const visualProps = useMemo(() => {
    const duration = getDurationMinutes();
    const focusType = getFocusType();

    // Base height calculation (minimum 40px, scale with duration)
    const height = Math.max(40, Math.min(120, duration * 1.2));

    // Color based on availability and working hours
    let backgroundColor = isWorkingHours ? 'rgba(255, 255, 255, 0.8)' : 'rgba(248, 250, 252, 0.6)';

    let borderColor = isWorkingHours ? 'rgba(203, 213, 225, 0.5)' : 'rgba(203, 213, 225, 0.3)';

    // Highlight if dragging over
    if (isOver) {
      backgroundColor = 'rgba(59, 130, 246, 0.1)';
      borderColor = 'rgba(59, 130, 246, 0.4)';
    }

    // Focus type coloring
    if (focusType && slotEvents.length > 0) {
      const focusColors =
        calendarTokens.colors.focusTypes[
          focusType as keyof typeof calendarTokens.colors.focusTypes
        ];
      if (focusColors) {
        backgroundColor = focusColors.secondary;
        borderColor = focusColors.primary;
      }
    }

    // Conflict indication
    if (hasConflicts) {
      borderColor = '#EF4444'; // Red for conflicts
      backgroundColor = 'rgba(239, 68, 68, 0.05)';
    }

    return {
      height: `${height}px`,
      backgroundColor,
      borderColor,
      focusType,
    };
  }, [getDurationMinutes, getFocusType, isOver, isWorkingHours, hasConflicts, slotEvents.length]);

  // CSS classes
  const slotClasses = [
    'time-slot',
    'relative',
    'border',
    'rounded-md',
    'p-1',
    'transition-all',
    'duration-200',
    'cursor-pointer',
    'select-none',
    hasConflicts ? 'border-red-400' : 'border-gray-200',
    isOver ? 'ring-2 ring-blue-400 ring-opacity-50' : '',
    isHovered ? 'shadow-sm' : '',
    !isWorkingHours ? 'opacity-60' : '',
    compact ? 'text-xs' : 'text-sm',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Display events (limit to maxEventsPerSlot)
  const displayEvents = slotEvents.slice(0, maxEventsPerSlot);
  const hiddenEventCount = Math.max(0, slotEvents.length - maxEventsPerSlot);

  return (
    <div
      ref={setNodeRef}
      className={slotClasses}
      style={{
        ...visualProps,
        ...style,
      }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsActive(true)}
      onBlur={() => setIsActive(false)}
      tabIndex={0}
      role="button"
      aria-label={`Time slot ${formatTime(startTime)} to ${formatTime(endTime)}, ${slotEvents.length} events`}
      aria-expanded={isActive}
      aria-describedby={hasConflicts ? `conflicts-${startTime.getTime()}` : undefined}
    >
      {/* Time label */}
      {showTimeLabel && (
        <div className="absolute top-1 left-1 text-xs text-gray-500 font-mono bg-white bg-opacity-75 px-1 rounded">
          {formatTime(startTime)}
        </div>
      )}

      {/* Working hours indicator */}
      {!isWorkingHours && <div className="absolute top-1 right-1 text-xs text-gray-400">💤</div>}

      {/* Drop zone indicator */}
      {isOver && active && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-10 border-2 border-blue-500 border-dashed rounded-md flex items-center justify-center">
          <span className="text-blue-600 font-medium">Drop here</span>
        </div>
      )}

      {/* Events container */}
      <div className="events-container mt-6 space-y-1">
        {displayEvents.map((event, index) => {
          const isConflicting = conflictGroups.some(group =>
            group.some(conflictEvent => conflictEvent.id === event.id)
          );
          const conflictCount = isConflicting
            ? conflictGroups.find(group => group.some(e => e.id === event.id))?.length || 0
            : 0;

          return (
            <CalendarEvent
              key={event.id}
              event={event}
              onClick={handleEventClick}
              compact={compact}
              showTimeLabels={false} // Time slot already shows time
              enableDragAndDrop={enableDragAndDrop}
              isConflicting={isConflicting}
              conflictCount={conflictCount}
              style={{
                // Stack overlapping events slightly
                marginLeft: `${index * 4}px`,
                zIndex: 100 + index,
              }}
            />
          );
        })}

        {/* Hidden events indicator */}
        {hiddenEventCount > 0 && (
          <div className="text-xs text-gray-500 text-center py-1 bg-gray-100 rounded">
            +{hiddenEventCount} more event{hiddenEventCount === 1 ? '' : 's'}
          </div>
        )}
      </div>

      {/* Conflict indicator */}
      {hasConflicts && (
        <div
          id={`conflicts-${startTime.getTime()}`}
          className="absolute bottom-1 right-1 text-red-500 text-xs font-bold"
          title={`${conflictGroups.length} conflict${conflictGroups.length === 1 ? '' : 's'} detected`}
        >
          ⚠️ {conflictGroups.length}
        </div>
      )}

      {/* Empty slot indicator */}
      {slotEvents.length === 0 && isHovered && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs">
          Click to create event
        </div>
      )}
    </div>
  );
};

export default TimeSlot;
