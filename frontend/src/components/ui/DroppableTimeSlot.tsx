import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { TaskWithMetadata, ADHDCalendarSettings } from '../../types/calendar';
import { CalendarEvent as APICalendarEvent } from '../../hooks/useApi';
import { DraggableCalendarEvent } from './DraggableCalendarEvent';
import { calendarTokens } from '../../styles/calendar-tokens';

interface DroppableTimeSlotProps {
  id: string;
  startTime: Date;
  endTime: Date;
  events: APICalendarEvent[];
  tasks?: TaskWithMetadata[];
  energyLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
  isWorkingHours?: boolean;
  isCurrentTime?: boolean;
  isEmpty?: boolean;
  maxEventsPerSlot?: number;
  adhdSettings?: ADHDCalendarSettings;
  onEventClick?: (event: APICalendarEvent) => void;
  onTimeSlotClick?: (startTime: Date) => void;
  className?: string;
  showTimeLabel?: boolean;
  compact?: boolean;
}

export const DroppableTimeSlot: React.FC<DroppableTimeSlotProps> = ({
  id,
  startTime,
  endTime,
  events = [],
  tasks = [],
  energyLevel,
  isWorkingHours = true,
  isCurrentTime = false,
  isEmpty = true,
  maxEventsPerSlot = 3,
  adhdSettings,
  onEventClick,
  onTimeSlotClick,
  className = '',
  showTimeLabel = true,
  compact = false,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: {
      type: 'timeslot',
      startTime,
      endTime,
      canAccept: (item: { type: string; data: unknown }) => {
        // Basic validation - can be extended with more complex logic
        if (item.type === 'event') {
          // Events can be dropped if there's space
          return events.length < maxEventsPerSlot;
        }
        if (item.type === 'task') {
          // Tasks can be scheduled if within working hours
          return isWorkingHours;
        }
        return false;
      },
    },
  });

  // Get energy level color for background
  const getEnergyBackgroundColor = (level?: string) => {
    if (!level || !adhdSettings?.showEnergyIndicators) return 'transparent';
    
    switch (level) {
      case 'HIGH':
        return calendarTokens.colors.energyLevels.HIGH.primary + '10'; // 10% opacity
      case 'MEDIUM':
        return calendarTokens.colors.energyLevels.MEDIUM.primary + '10';
      case 'LOW':
        return calendarTokens.colors.energyLevels.LOW.primary + '10';
      default:
        return 'transparent';
    }
  };

  // Format time label
  const formatTimeLabel = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Handle time slot click
  const handleTimeSlotClick = (e: React.MouseEvent) => {
    // Only trigger if clicking the slot itself, not an event
    if (e.target === e.currentTarget) {
      onTimeSlotClick?.(startTime);
    }
  };

  // Handle keyboard interaction
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onTimeSlotClick?.(startTime);
    }
  };

  // Calculate slot styles
  const slotStyles: React.CSSProperties = {
    backgroundColor: getEnergyBackgroundColor(energyLevel),
    borderColor: isCurrentTime 
      ? calendarTokens.colors.interface.focus 
      : isOver 
        ? calendarTokens.colors.interface.focus
        : 'transparent',
    borderWidth: isCurrentTime ? '2px' : isOver ? '2px' : '1px',
    borderStyle: isCurrentTime ? 'solid' : isOver ? 'dashed' : 'solid',
    transition: adhdSettings?.reducedMotion 
      ? 'none' 
      : 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    minHeight: compact ? '30px' : '60px',
  };

  // Determine if slot is full
  const isFull = events.length >= maxEventsPerSlot;
  const visibleEvents = events.slice(0, maxEventsPerSlot);
  const hiddenEventsCount = Math.max(0, events.length - maxEventsPerSlot);

  return (
    <div
      ref={setNodeRef}
      className={`
        time-slot
        relative
        border
        ${compact ? 'min-h-[30px] p-1' : 'min-h-[60px] p-2'}
        ${isOver ? 'bg-accent/10' : ''}
        ${isCurrentTime ? 'bg-primary/5' : ''}
        ${!isWorkingHours ? 'bg-base-200/50' : ''}
        ${isEmpty && !isOver ? 'cursor-pointer hover:bg-base-200/30' : ''}
        ${isFull ? 'opacity-75' : ''}
        ${className}
      `}
      style={slotStyles}
      onClick={handleTimeSlotClick}
      onKeyDown={handleKeyDown}
      tabIndex={isEmpty ? 0 : -1}
      role="gridcell"
      aria-label={`Time slot ${formatTimeLabel(startTime)} to ${formatTimeLabel(endTime)}${
        events.length > 0 ? `, ${events.length} event${events.length === 1 ? '' : 's'}` : ', empty'
      }`}
      aria-dropeffect={isOver ? 'move' : 'none'}
    >
      {/* Time label */}
      {showTimeLabel && (
        <div className={`
          absolute top-1 left-1 
          text-xs opacity-60 
          ${compact ? 'text-xs' : 'text-sm'}
          pointer-events-none
        `}>
          {formatTimeLabel(startTime)}
        </div>
      )}

      {/* Current time indicator */}
      {isCurrentTime && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary z-10" />
      )}

      {/* Energy level indicator */}
      {adhdSettings?.showEnergyIndicators && energyLevel && (
        <div className="absolute top-1 right-1 flex items-center gap-1">
          <div 
            className="w-2 h-2 rounded-full"
            style={{ 
              backgroundColor: energyLevel === 'HIGH' 
                ? calendarTokens.colors.energyLevels.HIGH.primary
                : energyLevel === 'MEDIUM'
                ? calendarTokens.colors.energyLevels.MEDIUM.primary
                : energyLevel === 'LOW'
                ? calendarTokens.colors.energyLevels.LOW.primary
                : 'transparent'
            }}
          />
          {!compact && (
            <span className="text-xs opacity-60">
              {energyLevel}
            </span>
          )}
        </div>
      )}

      {/* Drop zone indicator */}
      {isOver && (
        <div className="absolute inset-0 border-2 border-dashed border-accent pointer-events-none">
          <div className="absolute inset-0 bg-accent/10 flex items-center justify-center">
            <span className="text-sm font-medium text-accent">
              Drop here
            </span>
          </div>
        </div>
      )}

      {/* Events container */}
      {events.length > 0 && (
        <div className={`
          events-container
          ${showTimeLabel ? 'mt-6' : 'mt-1'}
          space-y-1
          ${compact ? 'space-y-0.5' : 'space-y-1'}
        `}>
          {visibleEvents.map((event, index) => (
            <DraggableCalendarEvent
              key={event.id}
              event={event}
              onClick={onEventClick}
              adhdSettings={adhdSettings}
              compact={compact}
              isDragDisabled={false}
              style={{
                zIndex: 10 + index,
              }}
            />
          ))}

          {/* Hidden events indicator */}
          {hiddenEventsCount > 0 && (
            <div className={`
              text-xs opacity-60 
              ${compact ? 'px-1' : 'px-2 py-1'}
              bg-base-200 rounded
              text-center
            `}>
              +{hiddenEventsCount} more
            </div>
          )}
        </div>
      )}

      {/* Tasks (if any) */}
      {tasks && tasks.length > 0 && (
        <div className={`
          tasks-container
          ${events.length > 0 ? 'mt-2' : showTimeLabel ? 'mt-6' : 'mt-1'}
          space-y-1
        `}>
          {tasks.map(task => (
            <div
              key={task.id}
              className={`
                task-item
                ${compact ? 'p-1 text-xs' : 'p-2 text-sm'}
                bg-secondary/20
                border border-secondary/30
                rounded
                text-secondary-content
              `}
            >
              <div className="font-medium truncate">
                {task.title}
              </div>
              {!compact && task.estimatedDuration && (
                <div className="text-xs opacity-75">
                  {task.estimatedDuration} min
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty state message */}
      {isEmpty && !isOver && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-xs opacity-30">
            {isWorkingHours ? 'Available' : 'Off hours'}
          </span>
        </div>
      )}

      {/* Non-working hours overlay */}
      {!isWorkingHours && (
        <div className="absolute inset-0 bg-base-300/20 pointer-events-none">
          <div className="absolute bottom-1 right-1">
            <span className="text-xs opacity-40">Off hours</span>
          </div>
        </div>
      )}
    </div>
  );
};
