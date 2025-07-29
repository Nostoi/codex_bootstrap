import React from 'react';
import { CalendarViewType, CalendarDate } from '../../types/calendar';

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
    <div className="calendar-header flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 p-4 bg-base-100 rounded-lg shadow-sm">
      {/* Date Display and Navigation */}
      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <button
          className="btn btn-sm btn-ghost"
          onClick={onPrevious}
          disabled={disabled || isLoading}
          aria-label={`Previous ${currentView}`}
          title={`Previous ${currentView} (Left Arrow)`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Current Date Display */}
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-base-content min-w-0">
            {formatDateDisplay()}
          </h2>
          {isToday() && (
            <span className="badge badge-primary badge-sm">Today</span>
          )}
        </div>

        {/* Next Button */}
        <button
          className="btn btn-sm btn-ghost"
          onClick={onNext}
          disabled={disabled || isLoading}
          aria-label={`Next ${currentView}`}
          title={`Next ${currentView} (Right Arrow)`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Today Button */}
        <button
          className={`btn btn-sm ${isToday() ? 'btn-outline' : 'btn-primary'}`}
          onClick={onToday}
          disabled={disabled || isLoading || isToday()}
          title="Go to today (Home key)"
        >
          Today
        </button>
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
