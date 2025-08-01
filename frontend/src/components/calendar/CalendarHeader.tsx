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
          return `${startOfWeek.toLocaleDateString('en-US', { month: 'long' })} ${startOfWeek.getDate()}-${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`;
        } else {
          return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        }
      case 'monthly':
        return date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long' 
        });
    }
  };

  const getNavigationLabel = (direction: 'previous' | 'next') => {
    const date = new Date(currentDate.year, currentDate.month - 1, currentDate.day);
    
    switch (currentView) {
      case 'daily':
        const dayOffset = direction === 'previous' ? -1 : 1;
        const targetDate = new Date(date);
        targetDate.setDate(date.getDate() + dayOffset);
        return `${direction === 'previous' ? 'Previous' : 'Next'} day, ${targetDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`;
      
      case 'weekly':
        const weekOffset = direction === 'previous' ? -7 : 7;
        const targetWeek = new Date(date);
        targetWeek.setDate(date.getDate() + weekOffset);
        return `${direction === 'previous' ? 'Previous' : 'Next'} week`;
      
      case 'monthly':
        const monthOffset = direction === 'previous' ? -1 : 1;
        const targetMonth = new Date(date.getFullYear(), date.getMonth() + monthOffset, 1);
        return `${direction === 'previous' ? 'Previous' : 'Next'} month, ${targetMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
        
      default:
        return `${direction === 'previous' ? 'Previous' : 'Next'}`;
    }
  };

  return (
    <header 
      className="calendar-header"
      role={CALENDAR_ARIA.BANNER}
    >
      <div className="flex justify-between items-center p-4 border-b">
        {/* Navigation Controls */}
        <div className="flex items-center gap-2">
          <button
            className="btn btn-sm btn-ghost"
            onClick={onPrevious}
            disabled={disabled || isLoading}
            aria-label={getNavigationLabel('previous')}
          >
            <span aria-hidden="true">←</span>
            <span className="hidden sm:inline ml-1">Previous</span>
          </button>
          
          <button
            className="btn btn-sm btn-outline"
            onClick={onToday}
            disabled={disabled || isLoading}
          >
            Today
          </button>
          
          <button
            className="btn btn-sm btn-ghost"
            onClick={onNext}
            disabled={disabled || isLoading}
            aria-label={getNavigationLabel('next')}
          >
            <span className="hidden sm:inline mr-1">Next</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>

        {/* Current Date Display */}
        <h1 
          className="text-lg font-semibold text-center"
          aria-live="polite"
        >
          {formatDateDisplay()}
        </h1>

        {/* View Controls and Actions */}
        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          {onRefresh && (
            <button
              className={`btn btn-sm btn-ghost ${isLoading ? 'loading' : ''}`}
              onClick={onRefresh}
              disabled={disabled || isLoading}
              aria-label="Refresh calendar data"
            >
              {!isLoading && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              <span className="hidden sm:inline ml-1">Refresh</span>
            </button>
          )}

          {/* View Selector */}
          {showViewSelector && (
            <div className="join" role="group" aria-label="Calendar view options">
              <button
                className={`btn btn-sm join-item ${currentView === 'daily' ? 'btn-active' : ''}`}
                onClick={() => onViewChange('daily')}
                disabled={disabled || isLoading}
                aria-pressed={currentView === 'daily'}
              >
                Day
              </button>
              <button
                className={`btn btn-sm join-item ${currentView === 'weekly' ? 'btn-active' : ''}`}
                onClick={() => onViewChange('weekly')}
                disabled={disabled || isLoading}
                aria-pressed={currentView === 'weekly'}
              >
                Week
              </button>
              <button
                className={`btn btn-sm join-item ${currentView === 'monthly' ? 'btn-active' : ''}`}
                onClick={() => onViewChange('monthly')}
                disabled={disabled || isLoading}
                aria-pressed={currentView === 'monthly'}
              >
                Month
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
