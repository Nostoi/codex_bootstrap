/**
 * Accessible Calendar Component with ADHD-optimized keyboard navigation
 * 
 * Implements WCAG 2.2 AA compliant calendar with comprehensive keyboard support,
 * screen reader announcements, and ADHD-friendly interaction patterns.
 */

import React, { 
  useState, 
  useRef, 
  useEffect, 
  useCallback, 
  forwardRef,
  useMemo
} from 'react';
import { 
  useAccessibilityContext,
  AccessibleButton,
  EnergyIndicator,
  LiveRegion,
  KeyboardNavigationContainer 
} from './AccessibilityComponents';
import { useKeyboardNavigation } from '../../lib/keyboard-navigation';
import { CALENDAR_ARIA, srText } from '../../lib/aria-constants';

// ===== TYPES =====

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  energyLevel?: 'high' | 'medium' | 'low';
  type?: 'task' | 'meeting' | 'deadline' | 'reminder';
  priority?: number;
}

interface CalendarProps {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  events?: CalendarEvent[];
  minDate?: Date;
  maxDate?: Date;
  showEnergyLevels?: boolean;
  showWeekNumbers?: boolean;
  className?: string;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
  events: CalendarEvent[];
  energyLevel?: 'high' | 'medium' | 'low';
}

// ===== UTILITY FUNCTIONS =====

function getDaysInMonth(date: Date): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  
  const days: Date[] = [];
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }
  
  return days;
}

function getCalendarGrid(date: Date): CalendarDay[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // Get the first day of the week (Sunday = 0)
  const firstDayOfWeek = firstDay.getDay();
  
  // Get previous month's trailing days
  const prevMonth = new Date(year, month - 1, 0);
  const prevMonthDays: Date[] = [];
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    prevMonthDays.push(new Date(year, month - 1, prevMonth.getDate() - i));
  }
  
  // Get current month's days
  const currentMonthDays = getDaysInMonth(date);
  
  // Get next month's leading days
  const totalCells = 42; // 6 weeks × 7 days
  const remainingCells = totalCells - prevMonthDays.length - currentMonthDays.length;
  const nextMonthDays: Date[] = [];
  for (let i = 1; i <= remainingCells; i++) {
    nextMonthDays.push(new Date(year, month + 1, i));
  }
  
  // Combine all days
  const allDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  
  return allDays.map(day => ({
    date: day,
    isCurrentMonth: day.getMonth() === month,
    isToday: isSameDay(day, new Date()),
    isSelected: false, // Will be set by component
    isDisabled: false, // Will be set by component
    events: [], // Will be populated by component
    energyLevel: undefined, // Will be calculated by component
  }));
}

function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

function formatDateForScreenReader(date: Date, events?: CalendarEvent[]): string {
  return srText.calendarDate(date, events && events.length > 0);
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// ===== CALENDAR DAY COMPONENT =====

interface CalendarDayProps {
  day: CalendarDay;
  onSelect: (date: Date) => void;
  showEnergyLevels: boolean;
  tabIndex: number;
}

const CalendarDay = forwardRef<HTMLButtonElement, CalendarDayProps>(
  ({ day, onSelect, showEnergyLevels, tabIndex }, ref) => {
    const { announcer } = useAccessibilityContext();
    
    const handleClick = useCallback(() => {
      onSelect(day.date);
      const announcement = `Selected ${formatDateForScreenReader(day.date, day.events)}`;
      announcer.announce(announcement);
    }, [day.date, day.events, onSelect, announcer]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    }, [handleClick]);

    const dayNumber = day.date.getDate();
    const hasEvents = day.events.length > 0;
    const ariaLabel = formatDateForScreenReader(day.date, day.events);

    return (
      <button
        ref={ref}
        role="gridcell"
        tabIndex={tabIndex}
        aria-label={ariaLabel}
        aria-selected={day.isSelected}
        aria-disabled={day.isDisabled}
        aria-current={day.isToday ? 'date' : undefined}
        aria-describedby={hasEvents ? `events-${day.date.toISOString().split('T')[0]}` : undefined}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        disabled={day.isDisabled}
        className={`
          calendar-day
          ${day.isCurrentMonth ? 'calendar-day--current-month' : 'calendar-day--other-month'}
          ${day.isToday ? 'calendar-day--today' : ''}
          ${day.isSelected ? 'calendar-day--selected' : ''}
          ${day.isDisabled ? 'calendar-day--disabled' : ''}
          ${hasEvents ? 'calendar-day--has-events' : ''}
        `}
        style={{
          position: 'relative',
          width: '100%',
          height: '40px',
          border: '1px solid var(--color-border-primary)',
          backgroundColor: day.isSelected 
            ? 'var(--color-primary)' 
            : day.isToday 
              ? 'var(--color-surface-secondary)' 
              : 'var(--color-surface-primary)',
          color: day.isCurrentMonth 
            ? 'var(--color-text-primary)' 
            : 'var(--color-text-secondary)',
          cursor: day.isDisabled ? 'not-allowed' : 'pointer',
          opacity: day.isDisabled ? 0.5 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'var(--font-size-sm)',
          transition: 'all 0.2s ease',
        }}
      >
        <span className="calendar-day__number">
          {dayNumber}
        </span>
        
        {hasEvents && (
          <span 
            className="calendar-day__event-indicator"
            aria-hidden="true"
            style={{
              position: 'absolute',
              bottom: '2px',
              right: '2px',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary)',
            }}
          />
        )}
        
        {showEnergyLevels && day.energyLevel && (
          <EnergyIndicator 
            level={day.energyLevel}
            className="calendar-day__energy"
            showText={false}
            style={{
              position: 'absolute',
              top: '2px',
              left: '2px',
              fontSize: '8px',
            }}
          />
        )}
        
        {hasEvents && (
          <div 
            id={`events-${day.date.toISOString().split('T')[0]}`}
            className="sr-only"
          >
            {day.events.length === 1 
              ? `1 event: ${day.events[0].title}`
              : `${day.events.length} events`
            }
          </div>
        )}
      </button>
    );
  }
);

CalendarDay.displayName = 'CalendarDay';

// ===== MAIN CALENDAR COMPONENT =====

export const AccessibleCalendar = forwardRef<HTMLDivElement, CalendarProps>(
  ({ 
    selectedDate,
    onDateSelect,
    events = [],
    minDate,
    maxDate,
    showEnergyLevels = true,
    showWeekNumbers = false,
    className = ''
  }, ref) => {
    const { announcer } = useAccessibilityContext();
    const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
    const [focusedDate, setFocusedDate] = useState(selectedDate || new Date());
    const gridRef = useRef<HTMLDivElement>(null);
    const [announcement, setAnnouncement] = useState('');

    // Generate calendar grid
    const calendarDays = useMemo(() => {
      const grid = getCalendarGrid(currentDate);
      
      return grid.map(day => {
        const dayEvents = events.filter(event => isSameDay(event.date, day.date));
        const isSelected = selectedDate ? isSameDay(day.date, selectedDate) : false;
        const isDisabled = !!(
          (minDate && day.date < minDate) ||
          (maxDate && day.date > maxDate)
        );
        
        // Calculate energy level based on events
        let energyLevel: 'high' | 'medium' | 'low' | undefined;
        if (dayEvents.length > 0) {
          const avgEnergy = dayEvents.reduce((sum, event) => {
            const energyMap = { high: 3, medium: 2, low: 1 };
            return sum + (energyMap[event.energyLevel || 'medium']);
          }, 0) / dayEvents.length;
          
          energyLevel = avgEnergy >= 2.5 ? 'high' : avgEnergy >= 1.5 ? 'medium' : 'low';
        }

        return {
          ...day,
          events: dayEvents,
          isSelected,
          isDisabled,
          energyLevel,
        };
      });
    }, [currentDate, events, selectedDate, minDate, maxDate]);

    // Navigation functions
    const navigateMonth = useCallback((direction: 'prev' | 'next') => {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
      setCurrentDate(newDate);
      
      const monthName = newDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      setAnnouncement(`Navigated to ${monthName}`);
    }, [currentDate]);

    const navigateDay = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
      const newDate = new Date(focusedDate);
      
      switch (direction) {
        case 'up':
          newDate.setDate(newDate.getDate() - 7);
          break;
        case 'down':
          newDate.setDate(newDate.getDate() + 7);
          break;
        case 'left':
          newDate.setDate(newDate.getDate() - 1);
          break;
        case 'right':
          newDate.setDate(newDate.getDate() + 1);
          break;
      }
      
      setFocusedDate(newDate);
      
      // Focus the corresponding button
      const dayIndex = calendarDays.findIndex(day => isSameDay(day.date, newDate));
      if (dayIndex >= 0) {
        const button = gridRef.current?.querySelector(`[data-day-index="${dayIndex}"]`) as HTMLButtonElement;
        button?.focus();
      }
    }, [focusedDate, calendarDays]);

    // Keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          navigateDay('up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          navigateDay('down');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          navigateDay('left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          navigateDay('right');
          break;
        case 'Home':
          e.preventDefault();
          const firstDay = calendarDays.find(day => day.isCurrentMonth);
          if (firstDay) {
            setFocusedDate(firstDay.date);
          }
          break;
        case 'End':
          e.preventDefault();
          const lastDay = [...calendarDays].reverse().find(day => day.isCurrentMonth);
          if (lastDay) {
            setFocusedDate(lastDay.date);
          }
          break;
        case 'PageUp':
          e.preventDefault();
          navigateMonth('prev');
          break;
        case 'PageDown':
          e.preventDefault();
          navigateMonth('next');
          break;
      }
    }, [navigateDay, navigateMonth, calendarDays]);

    // Date selection handler
    const handleDateSelect = useCallback((date: Date) => {
      setFocusedDate(date);
      onDateSelect?.(date);
    }, [onDateSelect]);

    // Month navigation
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const currentMonthName = monthNames[currentDate.getMonth()];
    const currentYear = currentDate.getFullYear();

    return (
      <div 
        ref={ref}
        className={`accessible-calendar ${className}`}
        style={{ 
          fontFamily: 'var(--font-family-primary)',
          backgroundColor: 'var(--color-surface-primary)',
          border: '1px solid var(--color-border-primary)',
          borderRadius: 'var(--border-radius-md)',
          padding: 'var(--space-4)',
        }}
      >
        {/* Calendar Header */}
        <div className="accessible-calendar__header" style={{ marginBottom: 'var(--space-4)' }}>
          <div className="accessible-calendar__navigation" style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 'var(--space-2)'
          }}>
            <AccessibleButton
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('prev')}
              aria-label={`Previous month, ${monthNames[currentDate.getMonth() - 1] || 'December'}`}
            >
              ← Previous
            </AccessibleButton>
            
            <h2 
              className="accessible-calendar__title"
              aria-live="polite"
              style={{ 
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                textAlign: 'center',
                margin: 0,
              }}
            >
              {currentMonthName} {currentYear}
            </h2>
            
            <AccessibleButton
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('next')}
              aria-label={`Next month, ${monthNames[currentDate.getMonth() + 1] || 'January'}`}
            >
              Next →
            </AccessibleButton>
          </div>
        </div>

        {/* Calendar Grid */}
        <div 
          ref={gridRef}
          role="grid"
          aria-label={`Calendar for ${currentMonthName} ${currentYear}`}
          aria-rowcount={7} // 1 header + 6 weeks
          aria-colcount={showWeekNumbers ? 8 : 7}
          onKeyDown={handleKeyDown}
          className="accessible-calendar__grid"
          style={{
            display: 'grid',
            gridTemplateColumns: showWeekNumbers 
              ? 'auto repeat(7, 1fr)' 
              : 'repeat(7, 1fr)',
            gap: '1px',
            backgroundColor: 'var(--color-border-primary)',
          }}
        >
          {/* Week number header */}
          <div role="row" style={{ display: 'contents' }}>
            {showWeekNumbers && (
              <div 
                role="columnheader"
                className="accessible-calendar__week-header"
                style={{
                  padding: 'var(--space-2)',
                  backgroundColor: 'var(--color-surface-secondary)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  textAlign: 'center',
                }}
              >
                Wk
              </div>
            )}

            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName, index) => (
              <div
                key={dayName}
                role="columnheader"
                aria-colindex={showWeekNumbers ? index + 2 : index + 1}
                className="accessible-calendar__day-header"
                style={{
                  padding: 'var(--space-2)',
                  backgroundColor: 'var(--color-surface-secondary)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  textAlign: 'center',
                }}
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* Calendar weeks */}
          {Array.from({ length: 6 }, (_, weekIndex) => {
            const weekStart = weekIndex * 7;
            const weekDays = calendarDays.slice(weekStart, weekStart + 7);
            const firstDayOfWeek = weekDays[0]?.date;
            
            return (
              <div key={weekIndex} role="row" style={{ display: 'contents' }}>
                {/* Week number */}
                {showWeekNumbers && firstDayOfWeek && (
                  <div 
                    role="rowheader"
                    aria-rowindex={weekIndex + 2}
                    className="accessible-calendar__week-number"
                    style={{
                      padding: 'var(--space-2)',
                      backgroundColor: 'var(--color-surface-secondary)',
                      fontSize: 'var(--font-size-xs)',
                      textAlign: 'center',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {getWeekNumber(firstDayOfWeek)}
                  </div>
                )}

                {/* Week days */}
                {weekDays.map((day, dayIndex) => {
                  const absoluteIndex = weekStart + dayIndex;
                  const isFocused = isSameDay(day.date, focusedDate);
                  
                  return (
                    <CalendarDay
                      key={day.date.toISOString()}
                      day={day}
                      onSelect={handleDateSelect}
                      showEnergyLevels={showEnergyLevels}
                      tabIndex={isFocused ? 0 : -1}
                      data-day-index={absoluteIndex}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Live announcements */}
        <LiveRegion level="polite">
          {announcement}
        </LiveRegion>

        {/* Instructions */}
        <div 
          className="accessible-calendar__instructions sr-only"
          aria-label="Calendar keyboard instructions"
        >
          Use arrow keys to navigate dates. 
          Press PageUp/PageDown to change months. 
          Press Home/End to go to first/last day of month.
          Press Enter or Space to select a date.
        </div>
      </div>
    );
  }
);

AccessibleCalendar.displayName = 'AccessibleCalendar';

export default AccessibleCalendar;
