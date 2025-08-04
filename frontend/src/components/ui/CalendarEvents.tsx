import React from 'react';
import { useCalendarEvents, CalendarEvent } from '../../hooks/useApi';

interface CalendarEventsProps {
  date?: string;
  className?: string;
  showRefresh?: boolean;
  maxEvents?: number;
}

const CalendarEvents: React.FC<CalendarEventsProps> = ({
  date,
  className = '',
  showRefresh = true,
  maxEvents,
}) => {
  const { data: calendarData, isLoading, error, refetch } = useCalendarEvents(date);

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getSourceIcon = (source: CalendarEvent['source']) => {
    switch (source) {
      case 'google':
        return '📅'; // Google Calendar icon
      case 'outlook':
        return '📧'; // Outlook icon
      default:
        return '🗓️';
    }
  };

  const getEnergyBadgeColor = (energyLevel?: CalendarEvent['energyLevel']) => {
    switch (energyLevel) {
      case 'HIGH':
        return 'badge-success';
      case 'MEDIUM':
        return 'badge-warning';
      case 'LOW':
        return 'badge-error';
      default:
        return 'badge-neutral';
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

  const displayEvents =
    maxEvents && calendarData?.events
      ? calendarData.events.slice(0, maxEvents)
      : calendarData?.events || [];

  if (error) {
    return (
      <div className={`card bg-base-100 shadow-lg ${className}`}>
        <div className="card-body">
          <h3 className="card-title text-error">Calendar Events</h3>
          <div className="alert alert-error">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Failed to load calendar events</span>
            <button className="btn btn-sm btn-outline" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`card bg-base-100 shadow-lg ${className}`}>
      <div className="card-body">
        <div className="flex items-center justify-between mb-4">
          <h3 className="card-title">
            📅 Calendar Events
            {calendarData && (
              <span className="badge badge-neutral ml-2">{calendarData.totalEvents}</span>
            )}
          </h3>
          {showRefresh && (
            <button
              className={`btn btn-sm btn-ghost ${isLoading ? 'loading' : ''}`}
              onClick={() => refetch()}
              disabled={isLoading}
              aria-label={isLoading ? 'Refreshing calendar events' : 'Refresh calendar events'}
            >
              {isLoading ? '' : '🔄'}
            </button>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <span className="loading loading-spinner loading-md"></span>
            <span className="ml-2">Loading calendar events...</span>
          </div>
        )}

        {/* Calendar Source Summary */}
        {calendarData && !isLoading && (
          <div className="flex gap-2 mb-4">
            {calendarData.sources.google > 0 && (
              <div className="badge badge-primary gap-1">
                📅 Google: {calendarData.sources.google}
              </div>
            )}
            {calendarData.sources.outlook > 0 && (
              <div className="badge badge-secondary gap-1">
                📧 Outlook: {calendarData.sources.outlook}
              </div>
            )}
          </div>
        )}

        {/* Events List */}
        {!isLoading && displayEvents.length === 0 ? (
          <div className="text-center py-8 text-base-content/60">
            <div className="text-4xl mb-2">🗓️</div>
            <p>No calendar events for today</p>
            <p className="text-sm">Your calendar is clear!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayEvents.map(event => (
              <div
                key={event.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-base-200 hover:bg-base-300 transition-colors"
              >
                <div className="text-lg mt-1">{getSourceIcon(event.source)}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-base-content truncate">{event.title}</h4>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {event.isAllDay ? (
                        <span className="badge badge-info badge-sm">All Day</span>
                      ) : (
                        <span className="text-sm text-base-content/70">
                          {formatTime(event.startTime)} - {formatTime(event.endTime)}
                        </span>
                      )}
                    </div>
                  </div>

                  {event.description && (
                    <p className="text-sm text-base-content/60 mt-1 line-clamp-2">
                      {event.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-2">
                    {event.energyLevel && (
                      <span className={`badge badge-sm ${getEnergyBadgeColor(event.energyLevel)}`}>
                        {event.energyLevel}
                      </span>
                    )}
                    {event.focusType && (
                      <span className={`text-xs font-medium ${getFocusTypeColor(event.focusType)}`}>
                        {event.focusType}
                      </span>
                    )}
                    <span className="badge badge-outline badge-xs">{event.source}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Show More Indicator */}
            {maxEvents && calendarData && calendarData.events.length > maxEvents && (
              <div className="text-center pt-2">
                <span className="text-sm text-base-content/60">
                  +{calendarData.events.length - maxEvents} more events
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarEvents;
