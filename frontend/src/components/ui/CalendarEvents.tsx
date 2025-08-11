import React, { useEffect, useState } from 'react';
import { useCalendarEvents, CalendarEvent } from '../../hooks/useApi';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useNotifications } from '../../hooks/useNotifications';

interface CalendarEventsProps {
  date?: string;
  className?: string;
  showRefresh?: boolean;
  maxEvents?: number;
  enableRealTimeUpdates?: boolean;
  adhdOptimized?: boolean;
  enableNotifications?: boolean;
  energyAwareNotifications?: boolean;
}

const CalendarEvents: React.FC<CalendarEventsProps> = ({
  date,
  className = '',
  showRefresh = true,
  maxEvents = 8,
  enableRealTimeUpdates = true,
  adhdOptimized = true,
  enableNotifications = true,
  energyAwareNotifications = true,
}) => {
  const { data: calendarData, isLoading, error, refetch } = useCalendarEvents(date);
  const { sendMessage, isConnected } = useWebSocket();
  const { settings: notificationSettings, sendNotification } = useNotifications();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [conflictsDetected, setConflictsDetected] = useState<any[]>([]);

  // Real-time updates integration with energy-aware triggers from Item 8
  useEffect(() => {
    if (!enableRealTimeUpdates) return;

    const handleCalendarUpdate = () => {
      setLastUpdated(new Date());
      refetch();
    };

    // Listen for calendar updates via WebSocket or polling
    const interval = setInterval(handleCalendarUpdate, 30000); // 30s polling for calendar changes

    return () => clearInterval(interval);
  }, [enableRealTimeUpdates, refetch]);

  // Enhanced notification integration for calendar events (Item 10)
  useEffect(() => {
    if (!enableNotifications || !calendarData?.events) return;

    const checkForConflicts = (events: CalendarEvent[]) => {
      const conflicts: any[] = [];

      // Check for overlapping events
      for (let i = 0; i < events.length; i++) {
        for (let j = i + 1; j < events.length; j++) {
          const event1 = events[i];
          const event2 = events[j];

          const start1 = new Date(event1.startTime);
          const end1 = new Date(event1.endTime);
          const start2 = new Date(event2.startTime);
          const end2 = new Date(event2.endTime);

          // Check for overlap
          if (start1 < end2 && start2 < end1) {
            conflicts.push({
              id: `conflict-${event1.id}-${event2.id}`,
              event1: event1,
              event2: event2,
              overlapMinutes:
                Math.min(end1.getTime(), end2.getTime()) -
                Math.max(start1.getTime(), start2.getTime()),
            });
          }
        }
      }

      return conflicts;
    };

    const newConflicts = checkForConflicts(calendarData.events);

    // Detect new conflicts and send notifications
    if (newConflicts.length > conflictsDetected.length) {
      const freshConflicts = newConflicts.filter(
        newConflict => !conflictsDetected.some(existing => existing.id === newConflict.id)
      );

      freshConflicts.forEach(conflict => {
        if (enableNotifications && isConnected) {
          // Energy-aware notification timing
          const urgency = energyAwareNotifications ? getConflictUrgency(conflict) : 'medium';

          sendMessage('calendar-conflict-detected', {
            conflict,
            urgency,
            timestamp: new Date(),
          });

          // Local notification for immediate feedback
          if (sendNotification) {
            sendNotification({
              id: `calendar-conflict-${Date.now()}`,
              type: 'conflict-alert',
              title: '📅 Calendar Conflict Detected',
              message: `Overlap detected between "${conflict.event1.title}" and "${conflict.event2.title}"`,
              severity: urgency as any,
              data: { conflict },
            });
          }
        }
      });
    }

    setConflictsDetected(newConflicts);
  }, [
    calendarData?.events,
    enableNotifications,
    isConnected,
    energyAwareNotifications,
    conflictsDetected,
    sendMessage,
    sendNotification,
  ]);

  // Energy-aware notification scheduling helper
  const getConflictUrgency = (conflict: any): 'low' | 'medium' | 'high' | 'urgent' => {
    const now = new Date();
    const conflictStart = new Date(
      Math.min(
        new Date(conflict.event1.startTime).getTime(),
        new Date(conflict.event2.startTime).getTime()
      )
    );

    const minutesUntilConflict = (conflictStart.getTime() - now.getTime()) / (1000 * 60);

    // Energy-aware urgency calculation
    if (minutesUntilConflict <= 15) return 'urgent'; // Immediate action needed
    if (minutesUntilConflict <= 60) return 'high'; // High energy required to resolve
    if (minutesUntilConflict <= 240) return 'medium'; // Medium energy - plan resolution
    return 'low'; // Low energy - gentle reminder
  };

  // Calendar sync notification trigger
  useEffect(() => {
    if (!enableNotifications || !calendarData) return;

    const eventCount = calendarData.events?.length || 0;
    const hasHighEnergyEvents = calendarData.events?.some(e => e.energyLevel === 'HIGH');

    // Send sync notification with energy awareness
    if (eventCount > 0 && isConnected) {
      const syncNotification = {
        type: 'calendar-sync',
        eventCount,
        hasHighEnergyEvents,
        conflicts: conflictsDetected.length,
        timestamp: lastUpdated,
      };

      // Energy-aware notification timing
      if (energyAwareNotifications && hasHighEnergyEvents) {
        // High energy events = immediate notification
        sendMessage('calendar-sync-complete', syncNotification);
      } else {
        // Regular events = batched notification
        setTimeout(() => {
          sendMessage('calendar-sync-complete', syncNotification);
        }, notificationSettings?.batchInterval || 5000);
      }
    }
  }, [
    calendarData,
    enableNotifications,
    isConnected,
    lastUpdated,
    conflictsDetected.length,
    energyAwareNotifications,
    sendMessage,
    notificationSettings?.batchInterval,
  ]);

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Enhanced dual-calendar source indicators with ADHD-friendly icons
  const getSourceIcon = (source: CalendarEvent['source']) => {
    switch (source) {
      case 'google':
        return '🟦'; // Google Calendar - blue square
      case 'outlook':
        return '🟧'; // Outlook - orange square
      default:
        return '⚪'; // Unknown source - neutral
    }
  };

  const getSourceLabel = (source: CalendarEvent['source']) => {
    switch (source) {
      case 'google':
        return 'Google Calendar';
      case 'outlook':
        return 'Microsoft Outlook';
      default:
        return 'Calendar';
    }
  };

  // ADHD-optimized energy level color coding
  const getEnergyBadgeColor = (energyLevel?: CalendarEvent['energyLevel']) => {
    switch (energyLevel) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-200'; // Red - Peak focus required
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'; // Yellow - Moderate effort
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-200'; // Green - Easy when tired
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'; // Neutral
    }
  };

  // Focus type icons for ADHD cognitive load reduction
  const getFocusTypeIcon = (focusType?: CalendarEvent['focusType']) => {
    switch (focusType) {
      case 'CREATIVE':
        return '🎨'; // Creative - writing, design, brainstorming
      case 'TECHNICAL':
        return '⚙️'; // Technical - coding, debugging, analysis
      case 'ADMINISTRATIVE':
        return '📋'; // Administrative - email, reports, data entry
      case 'SOCIAL':
        return '👥'; // Social - meetings, calls, collaboration
      default:
        return '📅'; // Default calendar icon
    }
  };

  const getFocusTypeColor = (focusType?: CalendarEvent['focusType']) => {
    switch (focusType) {
      case 'CREATIVE':
        return 'text-purple-600';
      case 'TECHNICAL':
        return 'text-blue-600';
      case 'ADMINISTRATIVE':
        return 'text-gray-600';
      case 'SOCIAL':
        return 'text-green-600';
      default:
        return 'text-base-content';
    }
  };

  // ADHD-optimized event display with progressive disclosure
  const displayEvents = React.useMemo(() => {
    const events = calendarData?.events || [];
    const limitedEvents = maxEvents ? events.slice(0, maxEvents) : events;

    // Sort by energy level (HIGH first) and then by time for ADHD priority awareness
    return limitedEvents.sort((a, b) => {
      const energyPriority = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      const aEnergy = energyPriority[a.energyLevel || 'LOW'];
      const bEnergy = energyPriority[b.energyLevel || 'LOW'];

      if (aEnergy !== bEnergy) return bEnergy - aEnergy;

      // Secondary sort by start time
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });
  }, [calendarData?.events, maxEvents]);

  // ADHD-friendly loading state with clear progress indication
  if (isLoading) {
    return (
      <div className={`card bg-base-100 shadow-sm ${className}`}>
        <div className="card-body">
          <div className="flex items-center space-x-2">
            <span className="loading loading-spinner loading-sm"></span>
            <span className="text-sm text-base-content/70">Loading calendar events...</span>
          </div>
          <div className="text-xs text-base-content/50 mt-2">
            Syncing Google Calendar and Outlook events
          </div>
        </div>
      </div>
    );
  }

  // Enhanced error handling with recovery actions
  if (error) {
    return (
      <div className={`card bg-base-100 shadow-sm border-warning ${className}`}>
        <div className="card-body">
          <div className="flex items-center space-x-2 text-warning">
            <span>⚠️</span>
            <span className="font-medium">Calendar Sync Issue</span>
          </div>
          <p className="text-sm text-base-content/70 mt-2">
            Having trouble connecting to your calendar. Your tasks are still available.
          </p>
          {showRefresh && (
            <div className="card-actions mt-3">
              <button
                onClick={() => refetch()}
                className="btn btn-sm btn-outline btn-warning"
                aria-label="Retry calendar sync"
              >
                🔄 Retry Sync
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Enhanced main component with ADHD-optimized layout
  return (
    <div className={`card bg-base-100 shadow-sm ${className}`}>
      <div className="card-body">
        {/* Header with dual-calendar status and real-time indicator */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="card-title text-base-content flex items-center space-x-2">
            <span>📅</span>
            <span>Today's Schedule</span>
            {enableRealTimeUpdates && (
              <div className="badge badge-success badge-sm">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                Live
              </div>
            )}
          </h3>

          {showRefresh && (
            <button
              onClick={() => refetch()}
              className="btn btn-ghost btn-sm"
              aria-label="Refresh calendar events"
              title="Sync with Google Calendar and Outlook"
            >
              🔄
            </button>
          )}
        </div>

        {/* Calendar source indicators */}
        <div className="flex items-center space-x-4 mb-4 text-xs text-base-content/70">
          <div className="flex items-center space-x-1">
            <span>🟦</span>
            <span>Google Calendar</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>🟧</span>
            <span>Microsoft Outlook</span>
          </div>
          <div className="text-xs">Last updated: {lastUpdated.toLocaleTimeString()}</div>
        </div>

        {/* Events list with ADHD-optimized display */}
        {displayEvents.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🎯</div>
            <p className="text-base-content/70">No calendar events today</p>
            <p className="text-sm text-base-content/50 mt-1">Perfect time for focused work!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayEvents.map((event, index) => (
              <div
                key={event.id || index}
                className={`
                  card card-compact bg-base-100 border-l-4 hover:shadow-md transition-all duration-200
                  ${adhdOptimized ? 'border-l-blue-500' : ''}
                `}
                role="article"
                aria-label={`Calendar event: ${event.title}`}
              >
                <div className="card-body py-3">
                  {/* Event header with time and source */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg" aria-hidden="true">
                        {getSourceIcon(event.source)}
                      </span>
                      <div className="text-sm font-medium text-base-content">
                        {formatTime(event.startTime)} - {formatTime(event.endTime)}
                      </div>
                      <div
                        className="badge badge-xs badge-outline"
                        title={getSourceLabel(event.source)}
                      >
                        {event.source || 'calendar'}
                      </div>
                    </div>
                  </div>

                  {/* Event title with focus type icon */}
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg" title={`Focus type: ${event.focusType || 'General'}`}>
                      {getFocusTypeIcon(event.focusType)}
                    </span>
                    <h4 className="font-semibold text-base-content line-clamp-2">
                      {event.title || 'Untitled Event'}
                    </h4>
                  </div>

                  {/* Energy level and additional metadata */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {event.energyLevel && (
                        <span
                          className={`
                            inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium
                            ${getEnergyBadgeColor(event.energyLevel)}
                          `}
                          aria-label={`Energy level: ${event.energyLevel.toLowerCase()}`}
                          title={`Energy requirement: ${event.energyLevel}`}
                        >
                          {event.energyLevel}
                        </span>
                      )}

                      {event.focusType && (
                        <span className={`text-xs ${getFocusTypeColor(event.focusType)}`}>
                          {event.focusType}
                        </span>
                      )}
                    </div>

                    {/* Event duration */}
                    <div className="text-xs text-base-content/60">
                      {(() => {
                        const start = new Date(event.startTime);
                        const end = new Date(event.endTime);
                        const durationMinutes = Math.round(
                          (end.getTime() - start.getTime()) / (1000 * 60)
                        );
                        return `${durationMinutes}min`;
                      })()}
                    </div>
                  </div>

                  {/* Event description (progressive disclosure) */}
                  {event.description && (
                    <div className="mt-2 text-sm text-base-content/70 line-clamp-2">
                      {event.description}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Show more button if events are limited */}
            {maxEvents && calendarData?.events && calendarData.events.length > maxEvents && (
              <div className="text-center mt-4">
                <button className="btn btn-ghost btn-sm">
                  View {calendarData.events.length - maxEvents} more events
                </button>
              </div>
            )}
          </div>
        )}

        {/* Calendar summary for ADHD awareness */}
        {calendarData && displayEvents.length > 0 && (
          <div className="mt-4 pt-4 border-t border-base-300">
            <div className="grid grid-cols-3 gap-4 text-center text-xs">
              <div>
                <div className="font-medium text-base-content">Total Events</div>
                <div className="text-base-content/70">
                  {calendarData.totalEvents || displayEvents.length}
                </div>
              </div>
              <div>
                <div className="font-medium text-base-content">High Energy</div>
                <div className="text-red-600">
                  {displayEvents.filter(e => e.energyLevel === 'HIGH').length}
                </div>
              </div>
              <div>
                <div className="font-medium text-base-content">Free Time</div>
                <div className="text-green-600">
                  {(() => {
                    const totalScheduled = displayEvents.reduce((acc, event) => {
                      const start = new Date(event.startTime);
                      const end = new Date(event.endTime);
                      return acc + (end.getTime() - start.getTime()) / (1000 * 60);
                    }, 0);
                    const freeMinutes = 8 * 60 - totalScheduled; // Assuming 8-hour workday
                    return `${Math.max(0, Math.round(freeMinutes / 60))}h`;
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarEvents;
