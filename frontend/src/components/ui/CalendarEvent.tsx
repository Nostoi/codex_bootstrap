import React, { useState, useCallback } from 'react';
import { CalendarEvent as CalendarEventType } from '../../hooks/useApi';
import { calendarTokens } from '../../styles/calendar-tokens';
import { useDraggable } from '@dnd-kit/core';

interface CalendarEventProps {
  event: CalendarEventType;
  onClick?: (event: CalendarEventType) => void;
  onEdit?: (event: CalendarEventType) => void;
  onDelete?: (event: CalendarEventType) => void;
  compact?: boolean;
  showTimeLabels?: boolean;
  enableDragAndDrop?: boolean;
  className?: string;
  style?: React.CSSProperties;
  isConflicting?: boolean;
  conflictCount?: number;
}

/**
 * CalendarEvent component for displaying individual calendar events and tasks
 * with ADHD-friendly design and energy level color coding
 */
export const CalendarEvent: React.FC<CalendarEventProps> = ({
  event,
  onClick,
  onEdit,
  onDelete,
  compact = false,
  showTimeLabels = true,
  enableDragAndDrop = true,
  className = '',
  style = {},
  isConflicting = false,
  conflictCount = 0,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Drag and drop setup
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `calendar-event-${event.id}`,
    data: {
      type: 'calendar-event',
      event,
    },
    disabled: !enableDragAndDrop,
  });

  // Get energy level styling
  const getEnergyLevelStyles = useCallback(() => {
    const energyLevel = event.energyLevel || 'MEDIUM';
    const colors = calendarTokens.colors.energyLevels[energyLevel];
    
    return {
      backgroundColor: colors.secondary,
      borderLeftColor: colors.primary,
      color: colors.text,
    };
  }, [event.energyLevel]);

  // Get focus type styling
  const getFocusTypeStyles = useCallback(() => {
    if (!event.focusType) return {};
    
    const colors = calendarTokens.colors.focusTypes[event.focusType];
    return {
      borderRightColor: colors.primary,
      borderRightWidth: '3px' as const,
      borderRightStyle: 'solid' as const,
    };
  }, [event.focusType]);

  // Get source icon
  const getSourceIcon = useCallback(() => {
    switch (event.source) {
      case 'google':
        return '📅'; // Google Calendar
      case 'outlook':
        return '📧'; // Outlook
      default:
        return '🗓️'; // Generic calendar
    }
  }, [event.source]);

  // Format time display
  const formatTime = useCallback((dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }, []);

  // Calculate event duration
  const getDuration = useCallback(() => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const diffMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes}m`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  }, [event.startTime, event.endTime]);

  // Handle click events
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(event);
  }, [onClick, event]);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(event);
  }, [onEdit, event]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(event);
  }, [onDelete, event]);

  // Combine styles
  const combinedStyles = {
    ...getEnergyLevelStyles(),
    ...getFocusTypeStyles(),
    ...style,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : isConflicting ? 10 : 1,
  };

  // CSS classes
  const eventClasses = [
    'calendar-event',
    'relative',
    'rounded-md',
    'border-l-4',
    'p-2',
    'mb-1',
    'transition-all',
    'duration-200',
    'cursor-pointer',
    'select-none',
    compact ? 'text-xs' : 'text-sm',
    isConflicting ? 'ring-2 ring-red-400 ring-opacity-50' : '',
    isDragging ? 'shadow-lg scale-105' : 'shadow-sm',
    isHovered ? 'shadow-md scale-102' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={eventClasses}
      style={combinedStyles}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
      tabIndex={0}
      role="button"
      aria-label={`${event.title} - ${formatTime(event.startTime)} to ${formatTime(event.endTime)}`}
      aria-describedby={showTooltip ? `tooltip-${event.id}` : undefined}
    >
      {/* Conflict indicator */}
      {isConflicting && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
          {conflictCount > 1 ? conflictCount : '!'}
        </div>
      )}

      {/* Event header */}
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-1 min-w-0 flex-1">
          {/* Source icon */}
          <span className="text-xs flex-shrink-0" aria-label={`${event.source} calendar`}>
            {getSourceIcon()}
          </span>
          
          {/* Event title */}
          <h4 className="font-medium truncate flex-1" title={event.title}>
            {event.title}
          </h4>
        </div>

        {/* Action buttons (show on hover/focus) */}
        {(isHovered || showTooltip) && (onEdit || onDelete) && (
          <div className="flex gap-1 ml-2 flex-shrink-0">
            {onEdit && (
              <button
                onClick={handleEdit}
                className="text-xs text-gray-500 hover:text-blue-600 p-1 rounded"
                aria-label="Edit event"
                title="Edit event"
              >
                ✏️
              </button>
            )}
            {onDelete && (
              <button
                onClick={handleDelete}
                className="text-xs text-gray-500 hover:text-red-600 p-1 rounded"
                aria-label="Delete event"
                title="Delete event"
              >
                🗑️
              </button>
            )}
          </div>
        )}
      </div>

      {/* Time and duration */}
      {showTimeLabels && (
        <div className="flex items-center justify-between text-xs opacity-75">
          <span className="font-mono">
            {event.isAllDay ? 'All day' : `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`}
          </span>
          {!event.isAllDay && (
            <span className="text-xs ml-2">
              {getDuration()}
            </span>
          )}
        </div>
      )}

      {/* Event description (compact mode) */}
      {!compact && event.description && (
        <p className="text-xs opacity-75 mt-1 line-clamp-2" title={event.description}>
          {event.description}
        </p>
      )}

      {/* Energy and focus badges */}
      <div className="flex items-center gap-1 mt-1">
        {/* Energy level badge */}
        {event.energyLevel && (
          <span 
            className="px-1.5 py-0.5 text-xs rounded-full border"
            style={{
              backgroundColor: calendarTokens.colors.energyLevels[event.energyLevel].secondary,
              color: calendarTokens.colors.energyLevels[event.energyLevel].text,
              borderColor: calendarTokens.colors.energyLevels[event.energyLevel].primary,
            }}
          >
            {event.energyLevel.charAt(0)}
          </span>
        )}

        {/* Focus type badge */}
        {event.focusType && (
          <span 
            className="px-1.5 py-0.5 text-xs rounded-full border"
            style={{
              backgroundColor: calendarTokens.colors.focusTypes[event.focusType].secondary,
              color: calendarTokens.colors.focusTypes[event.focusType].text,
              borderColor: calendarTokens.colors.focusTypes[event.focusType].primary,
            }}
          >
            {event.focusType.charAt(0)}
          </span>
        )}
      </div>

      {/* Tooltip for additional details */}
      {showTooltip && (
        <div
          id={`tooltip-${event.id}`}
          className="absolute z-50 p-2 mt-1 text-xs bg-gray-900 text-white rounded shadow-lg max-w-xs"
          style={{ top: '100%', left: '0' }}
        >
          <div><strong>{event.title}</strong></div>
          {event.description && (
            <div className="mt-1 opacity-75">{event.description}</div>
          )}
          <div className="mt-1">
            <div>⏰ {formatTime(event.startTime)} - {formatTime(event.endTime)}</div>
            <div>⚡ Energy: {event.energyLevel || 'Not set'}</div>
            <div>🎯 Focus: {event.focusType || 'Not set'}</div>
            <div>📅 Source: {event.source}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarEvent;
