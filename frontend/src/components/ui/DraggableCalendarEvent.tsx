import React, { forwardRef } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { ADHDCalendarSettings } from '../../types/calendar';
import { CalendarEvent as APICalendarEvent } from '../../hooks/useApi';
import { calendarTokens } from '../../styles/calendar-tokens';

interface DraggableCalendarEventProps {
  event: APICalendarEvent;
  onClick?: (event: APICalendarEvent) => void;
  adhdSettings?: ADHDCalendarSettings;
  isDragDisabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  showTime?: boolean;
  compact?: boolean;
}

export const DraggableCalendarEvent = forwardRef<HTMLDivElement, DraggableCalendarEventProps>(
  ({
    event,
    onClick,
    adhdSettings,
    isDragDisabled = false,
    className = '',
    style = {},
    showTime = true,
    compact = false,
    ...props
  }, ref) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      isDragging,
    } = useDraggable({
      id: event.id,
      disabled: isDragDisabled,
      data: {
        type: 'event',
        data: event,
        canAccept: () => true, // Events can be dropped on any time slot
      },
    });

    // Energy level colors for ADHD-friendly visual coding
    const getEnergyLevelColor = (energyLevel: string) => {
      switch (energyLevel) {
        case 'HIGH':
          return calendarTokens.colors.energyLevels.HIGH.primary;
        case 'MEDIUM':
          return calendarTokens.colors.energyLevels.MEDIUM.primary;
        case 'LOW':
          return calendarTokens.colors.energyLevels.LOW.primary;
        default:
          return calendarTokens.colors.energyLevels.MEDIUM.primary;
      }
    };

    // Focus type icons for cognitive clarity
    const getFocusTypeIcon = (focusType: string) => {
      switch (focusType) {
        case 'CREATIVE':
          return '🎨';
        case 'TECHNICAL':
          return '⚙️';
        case 'ADMINISTRATIVE':
          return '📋';
        case 'SOCIAL':
          return '👥';
        default:
          return '📝';
      }
    };

    // Format time for display
    const formatTime = (date: string | Date) => {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    };

    // Calculate duration
    const getDuration = () => {
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      const durationMs = end.getTime() - start.getTime();
      const durationMins = Math.round(durationMs / (1000 * 60));
      
      if (durationMins < 60) {
        return `${durationMins}m`;
      } else {
        const hours = Math.floor(durationMins / 60);
        const mins = durationMins % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
      }
    };

    // Transform styles for dragging
    const transformStyle = transform ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      zIndex: 1000,
    } : {};

    // Base styles
    const baseStyles: React.CSSProperties = {
      backgroundColor: getEnergyLevelColor(event.energyLevel || 'MEDIUM'),
      borderLeft: `4px solid ${getEnergyLevelColor(event.energyLevel || 'MEDIUM')}`,
      opacity: isDragging ? 0.5 : 1,
      cursor: isDragDisabled ? 'default' : 'grab',
      userSelect: 'none',
      transition: adhdSettings?.reducedMotion 
        ? 'none' 
        : 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      ...transformStyle,
      ...style,
    };

    // Handle click
    const handleClick = () => {
      if (!isDragging && onClick) {
        onClick(event);
      }
    };

    // Handle keyboard interactions
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick?.(event);
      }
    };

    return (
      <div
        ref={(node) => {
          setNodeRef(node);
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        className={`
          calendar-event
          relative
          p-2
          rounded-md
          border
          border-opacity-20
          text-sm
          ${compact ? 'p-1 text-xs' : 'p-2 text-sm'}
          ${isDragging ? 'shadow-lg' : 'shadow-sm'}
          ${isDragDisabled ? '' : 'hover:shadow-md'}
          ${adhdSettings?.highContrast ? 'border-2 border-current' : 'border border-white/20'}
          ${className}
        `}
        style={baseStyles}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={`${event.title} - ${formatTime(event.startTime)} to ${formatTime(event.endTime)}`}
        {...attributes}
        {...listeners}
        {...props}
      >
        {/* Drag handle for better accessibility */}
        {!isDragDisabled && (
          <div 
            className="absolute top-1 right-1 opacity-50 hover:opacity-100"
            aria-label="Drag handle"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <circle cx="3" cy="3" r="1"/>
              <circle cx="3" cy="6" r="1"/>
              <circle cx="3" cy="9" r="1"/>
              <circle cx="6" cy="3" r="1"/>
              <circle cx="6" cy="6" r="1"/>
              <circle cx="6" cy="9" r="1"/>
              <circle cx="9" cy="3" r="1"/>
              <circle cx="9" cy="6" r="1"/>
              <circle cx="9" cy="9" r="1"/>
            </svg>
          </div>
        )}

        {/* Event content */}
        <div className="flex items-start gap-1">
          {/* Focus type icon */}
          <span 
            className="flex-shrink-0 text-xs"
            aria-label={`Focus type: ${event.focusType || 'General'}`}
          >
            {getFocusTypeIcon(event.focusType || 'ADMINISTRATIVE')}
          </span>

          <div className="flex-1 min-w-0">
            {/* Event title */}
            <div 
              className={`font-medium ${compact ? 'text-xs' : 'text-sm'} truncate`}
              title={event.title}
            >
              {event.title}
            </div>

            {/* Time and duration */}
            {showTime && (
              <div className={`opacity-90 ${compact ? 'text-xs' : 'text-xs'} flex items-center gap-1`}>
                <span>{formatTime(event.startTime)}</span>
                {!compact && (
                  <>
                    <span>•</span>
                    <span>{getDuration()}</span>
                  </>
                )}
              </div>
            )}

            {/* Energy level indicator */}
            {adhdSettings?.showEnergyIndicators && (
              <div className="flex items-center gap-1 mt-1">
                <div 
                  className={`w-2 h-2 rounded-full`}
                  style={{ backgroundColor: getEnergyLevelColor(event.energyLevel || 'MEDIUM') }}
                  aria-label={`Energy level: ${event.energyLevel || 'Medium'}`}
                />
                <span className="text-xs opacity-75">
                  {event.energyLevel || 'Medium'}
                </span>
              </div>
            )}

            {/* Description (if not compact) */}
            {!compact && event.description && (
              <div className="text-xs opacity-75 mt-1 line-clamp-2">
                {event.description}
              </div>
            )}
          </div>
        </div>

        {/* Calendar source indicator */}
        <div className="absolute bottom-1 right-1">
          <span 
            className={`inline-block w-2 h-2 rounded-full ${
              event.source === 'google' ? 'bg-blue-500' :
              event.source === 'outlook' ? 'bg-orange-500' :
              'bg-purple-500'
            }`}
            aria-label={`Source: ${event.source || 'task'}`}
          />
        </div>

        {/* All-day indicator */}
        {event.isAllDay && (
          <div className="absolute top-1 left-1">
            <span 
              className="text-xs px-1 py-0.5 bg-black/20 rounded text-white"
              aria-label="All day event"
            >
              All day
            </span>
          </div>
        )}
      </div>
    );
  }
);

DraggableCalendarEvent.displayName = 'DraggableCalendarEvent';
