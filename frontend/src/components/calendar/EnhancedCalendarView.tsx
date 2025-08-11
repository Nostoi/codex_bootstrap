import React, { useState, useCallback, useRef, useEffect } from 'react';
import { CalendarEvent } from '../../hooks/useApi';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';
import { CalendarConflictResolver } from './CalendarConflictResolver';
import { MultiCalendarPreferences } from './MultiCalendarPreferences';
import { CalendarSyncStatusDisplay } from './CalendarSyncStatusDisplay';
import { RealTimeCalendarEvents } from './RealTimeCalendarEvents';
import {
  CalendarIcon,
  CogIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

// Enhanced view modes
type CalendarViewMode = 'day' | 'week' | 'month' | 'agenda';

interface CalendarConflict {
  id: string;
  eventId: string;
  conflictingEventId: string;
  type: string;
  severity: 'minor' | 'major' | 'critical';
  description: string;
  suggestedResolution?: string;
}

interface EnhancedCalendarViewProps {
  className?: string;
  onEventSelect?: (event: CalendarEvent) => void;
  onEventUpdate?: (eventId: string, updates: Partial<CalendarEvent>) => void;
  onEventCreate?: (event: Omit<CalendarEvent, 'id'>) => void;
  onEventDelete?: (eventId: string) => void;
  enableAdvancedFeatures?: boolean;
  defaultView?: CalendarViewMode;
  adhdOptimizations?: {
    energyAwareColoring?: boolean;
    maxEventsPerHour?: number;
    showBufferTime?: boolean;
    reduceVisualClutter?: boolean;
  };
}

/**
 * Enhanced Calendar View with Advanced Features
 *
 * Integrates all advanced calendar components:
 * - Real-time event synchronization
 * - Conflict resolution UI
 * - Multi-calendar preferences
 * - Sync status monitoring
 * - Enhanced drag-and-drop with conflict detection
 * - ADHD-optimized viewing options
 */
export const EnhancedCalendarView: React.FC<EnhancedCalendarViewProps> = ({
  className = '',
  onEventSelect,
  onEventUpdate,
  onEventCreate,
  onEventDelete,
  enableAdvancedFeatures = true,
  defaultView = 'week',
  adhdOptimizations = {
    energyAwareColoring: true,
    maxEventsPerHour: 3,
    showBufferTime: true,
    reduceVisualClutter: false,
  },
}) => {
  // State management
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>(defaultView);
  const [showConflictResolver, setShowConflictResolver] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showSyncStatus, setShowSyncStatus] = useState(false);
  const [conflicts, setConflicts] = useState<CalendarConflict[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const calendarRef = useRef<HTMLDivElement>(null);

  // Calculate date range based on view mode
  const getDateRange = useCallback(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    switch (viewMode) {
      case 'day':
        end.setDate(start.getDate() + 1);
        break;
      case 'week':
        start.setDate(start.getDate() - start.getDay());
        end.setDate(start.getDate() + 7);
        break;
      case 'month':
        start.setDate(1);
        end.setMonth(start.getMonth() + 1);
        end.setDate(0);
        break;
      case 'agenda':
        end.setDate(start.getDate() + 14); // 2 weeks for agenda view
        break;
    }

    return { start, end };
  }, [currentDate, viewMode]);

  const dateRange = getDateRange();

  // Enhanced drag and drop with conflict detection
  const {
    isDragging,
    draggedEvent,
    handleDragStart,
    handleDragEnd,
    validateDrop,
    detectConflicts,
  } = useDragAndDrop({
    onEventMove: (eventId: string, newStartTime: Date, newEndTime: Date) => {
      // Check for conflicts before moving
      const conflicts = detectConflicts(eventId, newStartTime, newEndTime);

      if (conflicts.length > 0) {
        const criticalConflicts = conflicts.filter(c => c.severity === 'critical');
        if (criticalConflicts.length > 0) {
          // Show conflict resolver for critical conflicts
          setConflicts(conflicts);
          setShowConflictResolver(true);
          return false; // Prevent move
        }
      }

      // Update event if no critical conflicts
      onEventUpdate?.(eventId, {
        startTime: newStartTime,
        endTime: newEndTime,
      });

      return true;
    },
    conflictDetection: {
      enabled: true,
      showWarnings: true,
      preventCriticalOverlaps: true,
    },
  });

  // Navigation helpers
  const navigateDate = useCallback(
    (direction: 'prev' | 'next') => {
      const newDate = new Date(currentDate);

      switch (viewMode) {
        case 'day':
          newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
          break;
        case 'week':
          newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
          break;
        case 'month':
          newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
          break;
        case 'agenda':
          newDate.setDate(newDate.getDate() + (direction === 'next' ? 14 : -14));
          break;
      }

      setCurrentDate(newDate);
    },
    [currentDate, viewMode]
  );

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // Event handlers
  const handleEventClick = useCallback(
    (event: CalendarEvent) => {
      setSelectedEventId(event.id);
      onEventSelect?.(event);
    },
    [onEventSelect]
  );

  const handleConflictResolution = useCallback(
    (resolvedConflicts: CalendarConflict[]) => {
      setConflicts(prev => prev.filter(c => !resolvedConflicts.some(rc => rc.id === c.id)));

      if (conflicts.length === resolvedConflicts.length) {
        setShowConflictResolver(false);
      }
    },
    [conflicts.length]
  );

  // Format current date for display
  const formatCurrentDate = useCallback(() => {
    const options: Intl.DateTimeFormatOptions =
      viewMode === 'month'
        ? { year: 'numeric', month: 'long' }
        : viewMode === 'week'
          ? { year: 'numeric', month: 'short', day: 'numeric' }
          : { year: 'numeric', month: 'short', day: 'numeric' };

    return currentDate.toLocaleDateString('en-US', options);
  }, [currentDate, viewMode]);

  // ADHD-optimized event styling
  const getEventStyle = useCallback(
    (event: CalendarEvent) => {
      let baseClasses = 'rounded-lg border-l-4 p-2 text-sm transition-all duration-200 ';

      if (adhdOptimizations.energyAwareColoring) {
        // Energy level color coding
        switch (event.energyLevel) {
          case 'HIGH':
            baseClasses += 'bg-red-50 border-red-400 text-red-900 ';
            break;
          case 'MEDIUM':
            baseClasses += 'bg-yellow-50 border-yellow-400 text-yellow-900 ';
            break;
          case 'LOW':
            baseClasses += 'bg-green-50 border-green-400 text-green-900 ';
            break;
          default:
            baseClasses += 'bg-blue-50 border-blue-400 text-blue-900 ';
        }
      } else {
        baseClasses += 'bg-blue-50 border-blue-400 text-blue-900 ';
      }

      if (selectedEventId === event.id) {
        baseClasses += 'ring-2 ring-blue-500 ring-opacity-50 ';
      }

      if (isDragging && draggedEvent?.id === event.id) {
        baseClasses += 'opacity-50 ';
      }

      return baseClasses;
    },
    [adhdOptimizations.energyAwareColoring, selectedEventId, isDragging, draggedEvent]
  );

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header with navigation and controls */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        {/* Date navigation */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 rounded-md hover:bg-gray-200 transition-colors"
              aria-label="Previous period"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>

            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
            >
              Today
            </button>

            <button
              onClick={() => navigateDate('next')}
              className="p-2 rounded-md hover:bg-gray-200 transition-colors"
              aria-label="Next period"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-lg font-semibold text-gray-900">{formatCurrentDate()}</h2>
        </div>

        {/* View mode selector */}
        <div className="flex items-center space-x-2">
          {(['day', 'week', 'month', 'agenda'] as CalendarViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === mode ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        {/* Advanced features toolbar */}
        {enableAdvancedFeatures && (
          <div className="flex items-center space-x-2">
            {/* Sync status indicator */}
            <button
              onClick={() => setShowSyncStatus(!showSyncStatus)}
              className="p-2 rounded-md hover:bg-gray-200 transition-colors relative"
              aria-label="Calendar sync status"
            >
              <ArrowPathIcon className="w-5 h-5" />
            </button>

            {/* Conflict indicator */}
            {conflicts.length > 0 && (
              <button
                onClick={() => setShowConflictResolver(true)}
                className="p-2 rounded-md hover:bg-red-100 text-red-600 transition-colors relative"
                aria-label={`${conflicts.length} calendar conflicts`}
              >
                <ExclamationTriangleIcon className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {conflicts.length}
                </span>
              </button>
            )}

            {/* Preferences */}
            <button
              onClick={() => setShowPreferences(true)}
              className="p-2 rounded-md hover:bg-gray-200 transition-colors"
              aria-label="Calendar preferences"
            >
              <CogIcon className="w-5 h-5" />
            </button>

            {/* View options */}
            <button
              onClick={() => setShowSyncStatus(true)}
              className="p-2 rounded-md hover:bg-gray-200 transition-colors"
              aria-label="View options"
            >
              <EyeIcon className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Main calendar area with real-time events */}
      <div className="flex-1 overflow-hidden">
        <RealTimeCalendarEvents
          dateRange={dateRange}
          onEventUpdate={update => {
            // Handle real-time event updates
            if (update.type === 'conflict_detected' && update.conflictInfo) {
              const newConflict: CalendarConflict = {
                id: `${update.eventId}-${update.conflictInfo.conflictingEventId}`,
                eventId: update.eventId,
                conflictingEventId: update.conflictInfo.conflictingEventId,
                type: update.conflictInfo.conflictType,
                severity: update.conflictInfo.severity,
                description: `Conflict detected between events`,
              };
              setConflicts(prev => [...prev, newConflict]);
            }
          }}
          enableOptimisticUpdates={true}
          className="h-full"
        >
          {({
            events,
            isLoading,
            error,
            lastUpdate,
            syncStatus,
            updateEvent,
            createEvent,
            deleteEvent,
          }) => (
            <div ref={calendarRef} className="h-full p-4">
              {isLoading && (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                  <span className="ml-2 text-gray-600">Loading events...</span>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Error loading events</h3>
                      <p className="mt-1 text-sm text-red-700">{error.message}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Event list/grid based on view mode */}
              <div
                className={`h-full ${adhdOptimizations.reduceVisualClutter ? 'space-y-3' : 'space-y-2'}`}
              >
                {events.map(event => (
                  <div
                    key={event.id}
                    className={getEventStyle(event)}
                    onClick={() => handleEventClick(event)}
                    onMouseDown={e => handleDragStart(e, event)}
                    onMouseUp={() => handleDragEnd()}
                    draggable
                    role="button"
                    tabIndex={0}
                    aria-label={`Event: ${event.title}`}
                  >
                    <div className="font-medium">{event.title}</div>
                    {event.description && (
                      <div className="text-xs opacity-75 mt-1">{event.description}</div>
                    )}
                    <div className="text-xs opacity-75 mt-1">
                      {new Date(event.startTime).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                      {' - '}
                      {new Date(event.endTime).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                ))}

                {events.length === 0 && !isLoading && (
                  <div className="flex items-center justify-center h-32 text-gray-500">
                    <CalendarIcon className="w-12 h-12 mb-2" />
                    <p>No events in this period</p>
                  </div>
                )}
              </div>

              {/* Last update indicator */}
              {lastUpdate && (
                <div className="text-xs text-gray-500 mt-4 text-center">
                  Last updated: {lastUpdate.toLocaleTimeString()}
                </div>
              )}
            </div>
          )}
        </RealTimeCalendarEvents>
      </div>

      {/* Advanced feature modals */}
      {enableAdvancedFeatures && (
        <>
          {/* Conflict resolver modal */}
          {showConflictResolver && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="text-lg font-semibold">Resolve Calendar Conflicts</h3>
                  <button
                    onClick={() => setShowConflictResolver(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                <CalendarConflictResolver
                  onResolved={handleConflictResolution}
                  onClose={() => setShowConflictResolver(false)}
                />
              </div>
            </div>
          )}

          {/* Preferences modal */}
          {showPreferences && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="text-lg font-semibold">Calendar Preferences</h3>
                  <button
                    onClick={() => setShowPreferences(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                <MultiCalendarPreferences onClose={() => setShowPreferences(false)} />
              </div>
            </div>
          )}

          {/* Sync status display */}
          {showSyncStatus && (
            <div className="fixed top-4 right-4 bg-white rounded-lg shadow-xl border z-40 max-w-sm">
              <div className="flex items-center justify-between p-3 border-b">
                <h4 className="font-medium">Sync Status</h4>
                <button
                  onClick={() => setShowSyncStatus(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <CalendarSyncStatusDisplay view="compact" autoRefresh={true} refreshInterval={5000} />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EnhancedCalendarView;
