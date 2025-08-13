/**
 * Microsoft Graph Calendar Integration Component
 * ADHD-optimized calendar view specifically for Microsoft Graph data
 * Features energy-based filtering, focus type visualization, and real-time sync
 *
 * Part of: Frontend OAuth Integration (Phase 3)
 * Used by: Dashboard, Settings page
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  parseISO,
  addDays,
  subDays,
} from 'date-fns';
import {
  useMicrosoftCalendar,
  CalendarEvent,
  CalendarViewOptions,
} from '@/hooks/useMicrosoftCalendar';
import { useAuth } from '@/contexts/AuthContext';

// ADHD-friendly color schemes
const ENERGY_COLORS = {
  LOW: 'bg-green-50 text-green-700 border-green-200',
  MEDIUM: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  HIGH: 'bg-red-50 text-red-700 border-red-200',
} as const;

const FOCUS_TYPES = {
  CREATIVE: { icon: '🎨', color: 'bg-purple-50 text-purple-700', label: 'Creative' },
  TECHNICAL: { icon: '⚙️', color: 'bg-blue-50 text-blue-700', label: 'Technical' },
  ADMINISTRATIVE: { icon: '📋', color: 'bg-gray-50 text-gray-700', label: 'Admin' },
  SOCIAL: { icon: '👥', color: 'bg-green-50 text-green-700', label: 'Social' },
} as const;

interface MicrosoftCalendarProps {
  className?: string;
  initialDate?: Date;
  showFilters?: boolean;
  compactMode?: boolean;
  onEventClick?: (event: CalendarEvent) => void;
  onCreateEvent?: (date: Date) => void;
}

export function MicrosoftCalendar({
  className = '',
  initialDate = new Date(),
  showFilters = true,
  compactMode = false,
  onEventClick,
  onCreateEvent,
}: MicrosoftCalendarProps) {
  const { isMicrosoftConnected, connectMicrosoft } = useAuth();

  // State management
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [selectedEnergyLevels, setSelectedEnergyLevels] = useState<('LOW' | 'MEDIUM' | 'HIGH')[]>(
    []
  );
  const [selectedFocusTypes, setSelectedFocusTypes] = useState<
    ('CREATIVE' | 'TECHNICAL' | 'ADMINISTRATIVE' | 'SOCIAL')[]
  >([]);
  const [viewMode, setViewMode] = useState<'week' | 'list'>('week');

  // Calculate week boundaries
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Calendar options with ADHD filters
  const calendarOptions: CalendarViewOptions = useMemo(
    () => ({
      startTime: weekStart,
      endTime: weekEnd,
      energyFilter: selectedEnergyLevels.length > 0 ? selectedEnergyLevels : undefined,
      focusFilter: selectedFocusTypes.length > 0 ? selectedFocusTypes : undefined,
      maxResults: 100,
      orderBy: 'start',
    }),
    [weekStart, weekEnd, selectedEnergyLevels, selectedFocusTypes]
  );

  // Fetch calendar data
  const { events, isLoading, isError, error, syncCalendar, isSyncing, syncStatus } =
    useMicrosoftCalendar(calendarOptions);

  // Group events by day
  const eventsByDay = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {};

    events.forEach(event => {
      const dayKey = format(parseISO(event.start.dateTime), 'yyyy-MM-dd');
      if (!grouped[dayKey]) {
        grouped[dayKey] = [];
      }
      grouped[dayKey].push(event);
    });

    // Sort events within each day
    Object.keys(grouped).forEach(day => {
      grouped[day].sort(
        (a, b) => new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime()
      );
    });

    return grouped;
  }, [events]);

  // Navigation handlers
  const navigatePrevious = useCallback(() => {
    setCurrentDate(prev => subDays(prev, 7));
  }, []);

  const navigateNext = useCallback(() => {
    setCurrentDate(prev => addDays(prev, 7));
  }, []);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // Filter handlers
  const toggleEnergyFilter = useCallback((level: 'LOW' | 'MEDIUM' | 'HIGH') => {
    setSelectedEnergyLevels(prev =>
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
    );
  }, []);

  const toggleFocusFilter = useCallback(
    (type: 'CREATIVE' | 'TECHNICAL' | 'ADMINISTRATIVE' | 'SOCIAL') => {
      setSelectedFocusTypes(prev =>
        prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
      );
    },
    []
  );

  // Connection prompt
  if (!isMicrosoftConnected) {
    return (
      <div
        className={`microsoft-calendar-disconnected ${className}`}
        data-testid="microsoft-calendar"
      >
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body text-center">
            <h3 className="card-title justify-center text-xl mb-4">
              📅 Connect Microsoft Calendar
            </h3>
            <p className="text-base-content/70 mb-6">
              Connect your Microsoft account to view and sync your Outlook calendar events.
            </p>
            <div className="card-actions justify-center">
              <button className="btn btn-primary" onClick={connectMicrosoft}>
                Connect Microsoft Account
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`microsoft-calendar ${className}`} data-testid="microsoft-calendar">
      {/* Header with Navigation and Controls */}
      <div className="calendar-header mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Date Navigation */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                className="btn btn-sm btn-outline"
                onClick={navigatePrevious}
                aria-label="Previous week"
              >
                ←
              </button>
              <button className="btn btn-sm btn-outline" onClick={goToToday}>
                Today
              </button>
              <button
                className="btn btn-sm btn-outline"
                onClick={navigateNext}
                aria-label="Next week"
              >
                →
              </button>
            </div>

            <h2 className="text-lg font-semibold">
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
            </h2>
          </div>

          {/* View Controls */}
          <div className="flex items-center space-x-2">
            {/* View Mode Toggle */}
            <div className="tabs tabs-boxed">
              <button
                className={`tab tab-sm ${viewMode === 'week' ? 'tab-active' : ''}`}
                onClick={() => setViewMode('week')}
              >
                Week
              </button>
              <button
                className={`tab tab-sm ${viewMode === 'list' ? 'tab-active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                List
              </button>
            </div>

            {/* Sync Button */}
            <button
              className={`btn btn-sm ${isSyncing ? 'loading' : ''}`}
              onClick={syncCalendar}
              disabled={isSyncing}
              aria-label="Sync calendar"
            >
              {!isSyncing && '🔄'}
              Sync
            </button>
          </div>
        </div>

        {/* ADHD Filters */}
        {showFilters && !compactMode && (
          <div className="filters mt-4 space-y-3">
            {/* Energy Level Filters */}
            <div>
              <label className="text-sm font-medium text-base-content/70 block mb-2">
                Energy Level:
              </label>
              <div className="flex flex-wrap gap-2">
                {(['LOW', 'MEDIUM', 'HIGH'] as const).map(level => (
                  <button
                    key={level}
                    className={`btn btn-xs ${
                      selectedEnergyLevels.includes(level) ? ENERGY_COLORS[level] : 'btn-outline'
                    }`}
                    onClick={() => toggleEnergyFilter(level)}
                    aria-pressed={selectedEnergyLevels.includes(level)}
                  >
                    {level}
                  </button>
                ))}
                {selectedEnergyLevels.length > 0 && (
                  <button
                    className="btn btn-xs btn-ghost"
                    onClick={() => setSelectedEnergyLevels([])}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Focus Type Filters */}
            <div>
              <label className="text-sm font-medium text-base-content/70 block mb-2">
                Focus Type:
              </label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(FOCUS_TYPES) as Array<keyof typeof FOCUS_TYPES>).map(type => {
                  const focusType = FOCUS_TYPES[type];
                  return (
                    <button
                      key={type}
                      className={`btn btn-xs ${
                        selectedFocusTypes.includes(type) ? focusType.color : 'btn-outline'
                      }`}
                      onClick={() => toggleFocusFilter(type)}
                      aria-pressed={selectedFocusTypes.includes(type)}
                    >
                      {focusType.icon} {focusType.label}
                    </button>
                  );
                })}
                {selectedFocusTypes.length > 0 && (
                  <button
                    className="btn btn-xs btn-ghost"
                    onClick={() => setSelectedFocusTypes([])}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sync Status */}
        {syncStatus.status !== 'idle' && (
          <div className="sync-status mt-4">
            <div
              className={`alert alert-sm ${
                syncStatus.status === 'success'
                  ? 'alert-success'
                  : syncStatus.status === 'error'
                    ? 'alert-error'
                    : 'alert-info'
              }`}
            >
              <span className="text-xs">
                {syncStatus.status === 'syncing' && '🔄 Syncing calendar...'}
                {syncStatus.status === 'success' && `✅ Synced ${syncStatus.eventsCount} events`}
                {syncStatus.status === 'error' && `❌ ${syncStatus.errorMessage}`}
                {syncStatus.lastSyncAt && ` • ${format(syncStatus.lastSyncAt, 'HH:mm')}`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Calendar Content */}
      <div className="calendar-content">
        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="loading loading-spinner loading-lg"></div>
              <p className="mt-4 text-base-content/70">Loading calendar events...</p>
            </div>
          </div>
        )}

        {isError && (
          <div className="alert alert-error">
            <div>
              <h3 className="font-bold">Calendar Error</h3>
              <div className="text-xs">{error}</div>
              <button className="btn btn-sm btn-outline mt-2" onClick={syncCalendar}>
                Retry
              </button>
            </div>
          </div>
        )}

        {!isLoading && !isError && (
          <>
            {viewMode === 'week' ? (
              <WeekGrid
                weekDays={weekDays}
                eventsByDay={eventsByDay}
                onEventClick={onEventClick}
                onCreateEvent={onCreateEvent}
                compactMode={compactMode}
              />
            ) : (
              <EventsList events={events} onEventClick={onEventClick} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Week Grid Component
interface WeekGridProps {
  weekDays: Date[];
  eventsByDay: Record<string, CalendarEvent[]>;
  onEventClick?: (event: CalendarEvent) => void;
  onCreateEvent?: (date: Date) => void;
  compactMode: boolean;
}

function WeekGrid({
  weekDays,
  eventsByDay,
  onEventClick,
  onCreateEvent,
  compactMode,
}: WeekGridProps) {
  const isToday = useCallback((date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }, []);

  return (
    <div
      className={`week-grid grid gap-2 ${compactMode ? 'grid-cols-7' : 'grid-cols-1 lg:grid-cols-7'}`}
    >
      {weekDays.map(day => {
        const dayKey = format(day, 'yyyy-MM-dd');
        const dayEvents = eventsByDay[dayKey] || [];

        return (
          <div
            key={dayKey}
            className={`day-column border rounded-lg p-3 min-h-[200px] ${
              isToday(day) ? 'bg-primary/5 border-primary/30' : 'bg-base-100'
            }`}
          >
            {/* Day Header */}
            <div className="day-header mb-3 text-center">
              <div className="text-xs text-base-content/70 uppercase tracking-wide">
                {format(day, 'EEE')}
              </div>
              <div className={`text-lg font-semibold ${isToday(day) ? 'text-primary' : ''}`}>
                {format(day, 'd')}
              </div>
            </div>

            {/* Events */}
            <div className="events space-y-2">
              {dayEvents.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  compact={compactMode}
                  onClick={() => onEventClick?.(event)}
                />
              ))}

              {/* Add Event Button */}
              {onCreateEvent && (
                <button
                  className="w-full btn btn-xs btn-outline btn-dashed opacity-50 hover:opacity-100"
                  onClick={() => onCreateEvent(day)}
                >
                  + Add Event
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Events List Component
interface EventsListProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
}

function EventsList({ events, onEventClick }: EventsListProps) {
  if (events.length === 0) {
    return (
      <div className="events-list">
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📅</div>
          <h3 className="text-lg font-medium mb-2">No events found</h3>
          <p className="text-base-content/70">No calendar events match your current filters.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="events-list space-y-3">
      {events.map(event => (
        <EventCard key={event.id} event={event} expanded onClick={() => onEventClick?.(event)} />
      ))}
    </div>
  );
}

// Event Card Component
interface EventCardProps {
  event: CalendarEvent;
  compact?: boolean;
  expanded?: boolean;
  onClick?: () => void;
}

function EventCard({ event, compact = false, expanded = false, onClick }: EventCardProps) {
  const energyColor = event.energyLevel ? ENERGY_COLORS[event.energyLevel] : 'bg-base-200';
  const focusType = event.focusType ? FOCUS_TYPES[event.focusType] : null;

  const startTime = format(parseISO(event.start.dateTime), 'HH:mm');
  const endTime = format(parseISO(event.end.dateTime), 'HH:mm');
  const duration = Math.round(
    (new Date(event.end.dateTime).getTime() - new Date(event.start.dateTime).getTime()) /
      (1000 * 60)
  );

  return (
    <div
      className={`event-card border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${energyColor}`}
      onClick={onClick}
      data-testid="microsoft-calendar-event"
    >
      {/* Event Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium ${compact ? 'text-xs' : 'text-sm'} truncate`}>
            {event.subject}
          </h4>
          <div className={`text-current/70 ${compact ? 'text-xs' : 'text-sm'} mt-1`}>
            {startTime} - {endTime} ({duration}min)
          </div>
        </div>

        {focusType && (
          <div className={`ml-2 px-2 py-1 rounded text-xs ${focusType.color}`}>
            {focusType.icon}
          </div>
        )}
      </div>

      {/* Event Details */}
      {!compact && (
        <>
          {event.location?.displayName && (
            <div className="text-xs text-current/70 mb-2">📍 {event.location.displayName}</div>
          )}

          {expanded && event.body?.content && (
            <div className="text-xs text-current/70 mt-2 line-clamp-2">
              {event.body.content.replace(/<[^>]*>/g, '')}
            </div>
          )}
        </>
      )}

      {/* ADHD Enhancements */}
      {expanded && event.adhdFriendly && (
        <div className="adhd-enhancements mt-3 pt-2 border-t border-current/20">
          <div className="flex flex-wrap gap-2 text-xs">
            {event.adhdFriendly.estimatedPreparationTime && (
              <span className="badge badge-sm">
                ⏰ {event.adhdFriendly.estimatedPreparationTime}min prep
              </span>
            )}
            {event.adhdFriendly.requiresDeepFocus && (
              <span className="badge badge-sm badge-info">🧠 Deep focus</span>
            )}
            {event.adhdFriendly.contextSwitchingWarning && (
              <span className="badge badge-sm badge-warning">⚠️ Context switch</span>
            )}
            {event.adhdFriendly.isLowStimulation && (
              <span className="badge badge-sm badge-success">🕯️ Low stimulation</span>
            )}
          </div>
        </div>
      )}

      {/* Priority Indicator */}
      {event.importance === 'high' && (
        <div className="priority-indicator mt-2">
          <span className="badge badge-sm badge-error">❗ High Priority</span>
        </div>
      )}
    </div>
  );
}

export default MicrosoftCalendar;
