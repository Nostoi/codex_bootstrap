import React from 'react';
import { CalendarViewType, CalendarDate } from '../../types/calendar';
import { CALENDAR_ARIA } from '../../lib/calendar-accessibility';

interface CalendarHeaderProps {
  currentDate: CalendarDate;
  currentView: CalendarViewType;
  onDateChange: (date: CalendarDate) => void;
  onViewChange: (view: CalendarViewType) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  showViewSelector?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  currentView,
  onViewChange,
  onPrevious,
  onNext,
  onToday,
  showViewSelector = true,
  disabled = false,
  isLoading = false,
  onRefresh,
}) => {
  // Format current date for display
  const formatDateDisplay = () => {
    const date = new Date(currentDate.year, currentDate.month - 1, currentDate.day);
    
    switch (currentView) {
      case 'daily':
        return date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      case 'weekly':
        // Show week range
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
          return `${startOfWeek.toLocaleDateString('en-US', { month: 'long' })} ${startOfWeek.getDate()} - ${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`;
        } else {
          return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        }
      case 'monthly':
        return date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long' 
        });
      default:
        return date.toLocaleDateString();
    }
  };

  const isToday = () => {
    const today = new Date();
    return currentDate.year === today.getFullYear() &&
           currentDate.month === today.getMonth() + 1 &&
           currentDate.day === today.getDate();
  };

  return (
    <header 
      className="calendar-header flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 p-4 bg-base-100 rounded-lg shadow-sm"
      role={CALENDAR_ARIA.BANNER}
      aria-label="Calendar navigation and controls"
    >
      {/* Date Display and Navigation */}
      <nav 
        className="flex items-center gap-2"
        role={CALENDAR_ARIA.NAVIGATION}
        aria-label="Calendar date navigation"
      >
        {/* Previous Button */}
        <button
          className="btn btn-sm btn-ghost"
          onClick={onPrevious}
          disabled={disabled || isLoading}
          aria-label={`Go to previous ${currentView}`}
          title={`Previous ${currentView} (Left Arrow)`}
          type="button"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-4 w-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Current Date Display */}
        <div className="flex items-center gap-2">
          <h2 
            className="text-lg font-semibold text-base-content min-w-0"
            id="current-date-display"
            aria-live="polite"
          >
            {formatDateDisplay()}
          </h2>
          {isToday() && (
            <span 
              className="badge badge-primary badge-sm"
              aria-label="Today's date"
            >
              Today
            </span>
          )}
        </div>

        {/* Next Button */}
                  onClick={onNext}
          disabled={disabled || isLoading}
          aria-label={`Go to next ${currentView}`}
          title={`Next ${currentView} (Right Arrow)`}
          type="button"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-4 w-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Today Button */}
        <button
          className={`btn btn-sm ${isToday() ? 'btn-outline' : 'btn-primary'}`}
          onClick={onToday}
          disabled={disabled || isLoading || isToday()}
          aria-label={isToday() ? "Already viewing today" : "Go to today"}
          title="Go to today (Home key)"
          type="button"
        >
          Today
        </button>
      </nav>

      {/* View Selector and Actions */}
      <div className="flex items-center gap-2">
        {/* Refresh Button */}
        {onRefresh && (
          <button
            className={`btn btn-sm btn-ghost ${isLoading ? 'loading' : ''}`}
            onClick={onRefresh}
            disabled={disabled || isLoading}
            aria-label={isLoading ? "Refreshing calendar..." : "Refresh calendar"}
            title="Refresh calendar data"
            type="button"
          >
            {!isLoading && (
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            <span className="sr-only">
              {isLoading ? "Refreshing..." : "Refresh"}
            </span>
          </button>
        )}

        {/* View Selector */}
        {showViewSelector && (
          <div 
            className="join" 
            role="tablist" 
            aria-label="Calendar view selection"
            aria-describedby="view-selector-help"
          >
            {/* Hidden help text for screen readers */}
            <div id="view-selector-help" className="sr-only">
              Select calendar view mode. Use keyboard shortcuts: 1 for daily, 2 for weekly, 3 for monthly.
            </div>
            
            <button
              className={`btn btn-sm join-item ${currentView === 'daily' ? 'btn-active' : ''}`}
              onClick={() => onViewChange('daily')}
              disabled={disabled || isLoading}
              role="tab"
              aria-selected={currentView === 'daily'}
              aria-controls="calendar-grid"
              title="Daily view (Keyboard shortcut: 1)"
              type="button"
            >
              Day
            </button>
            <button
              className={`btn btn-sm join-item ${currentView === 'weekly' ? 'btn-active' : ''}`}
              onClick={() => onViewChange('weekly')}
              disabled={disabled || isLoading}
              role="tab"
              aria-selected={currentView === 'weekly'}
              aria-controls="calendar-grid"
              title="Weekly view (Keyboard shortcut: 2)"
              type="button"
            >
              Week
            </button>
            <button
              className={`btn btn-sm join-item ${currentView === 'monthly' ? 'btn-active' : ''}`}
              onClick={() => onViewChange('monthly')}
              disabled={disabled || isLoading}
              role="tab"
              aria-selected={currentView === 'monthly'}
              aria-controls="calendar-grid"
              title="Monthly view (Keyboard shortcut: 3)"
              type="button"
            >
              Month
            </button>
          </div>
        )}
      </div>
    </header>
  );
      </div>

      {/* View Selector and Actions */}
      <div className="flex items-center gap-2">
        {/* Refresh Button */}
        {onRefresh && (
          <button
            className={`btn btn-sm btn-ghost ${isLoading ? 'loading' : ''}`}
            onClick={onRefresh}
            disabled={disabled || isLoading}
            aria-label="Refresh calendar"
            title="Refresh calendar data"
          >
            {!isLoading && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
          </button>
        )}

        {/* View Selector */}
        {showViewSelector && (
          <div className="join" role="tablist" aria-label="Calendar view options">
            <button
              className={`btn btn-sm join-item ${currentView === 'daily' ? 'btn-active' : ''}`}
              onClick={() => onViewChange('daily')}
              disabled={disabled || isLoading}
              role="tab"
              aria-selected={currentView === 'daily'}
              title="Daily view (Ctrl+1)"
            >
              Day
            </button>
            <button
              className={`btn btn-sm join-item ${currentView === 'weekly' ? 'btn-active' : ''}`}
              onClick={() => onViewChange('weekly')}
              disabled={disabled || isLoading}
              role="tab"
              aria-selected={currentView === 'weekly'}
              title="Weekly view (Ctrl+2)"
            >
              Week
            </button>
            <button
              className={`btn btn-sm join-item ${currentView === 'monthly' ? 'btn-active' : ''}`}
              onClick={() => onViewChange('monthly')}
              disabled={disabled || isLoading}
              role="tab"
              aria-selected={currentView === 'monthly'}
              title="Monthly view (Ctrl+3)"
            >
              Month
            </button>
          </div>
        )}
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute top-2 right-2 loading loading-spinner loading-sm opacity-50"></div>
      )}
    </div>
  );
};
