/**
 * Calendar Accessibility Utilities
 * Integrates comprehensive accessibility framework with calendar components
 * WCAG 2.2 AA compliant calendar navigation and interaction patterns
 */

import { useEffect, useRef, useCallback } from 'react';
import { 
  FocusTrap, 
  LiveAnnouncer, 
  KeyboardNavigator,
  useAccessibilityPreferences,
  useFocusTrap,
  useScreenReaderAnnounce
} from '../lib/accessibility';
import { 
  KeyboardNavigationManager,
  useKeyboardNavigation,
  useGlobalKeyboardShortcuts
} from '../lib/keyboard-navigation';
import { ARIA_ROLES, ARIA_PROPERTIES, KEYBOARD_SHORTCUTS } from '../lib/aria-constants';
import { CalendarViewType, CalendarDate, CalendarEvent } from '../types/calendar';

// Calendar-specific keyboard shortcuts
export const CALENDAR_KEYBOARD_SHORTCUTS = {
  PREVIOUS_PERIOD: ['ArrowLeft', 'PageUp'],
  NEXT_PERIOD: ['ArrowRight', 'PageDown'],
  TODAY: ['Home', 't'],
  DAILY_VIEW: ['1'],
  WEEKLY_VIEW: ['2'],
  MONTHLY_VIEW: ['3'],
  SELECT_EVENT: ['Enter', ' '],
  ESCAPE: ['Escape'],
  FIRST_EVENT: ['Shift+Home'],
  LAST_EVENT: ['Shift+End'],
  GRID_UP: ['ArrowUp'],
  GRID_DOWN: ['ArrowDown'],
  GRID_LEFT: ['ArrowLeft'],
  GRID_RIGHT: ['ArrowRight']
} as const;

// ARIA roles and properties for calendar
export const CALENDAR_ARIA = {
  CALENDAR: 'application',
  GRID: 'grid',
  GRIDCELL: 'gridcell',
  BUTTON: 'button',
  COMBOBOX: 'combobox',
  LISTBOX: 'listbox',
  OPTION: 'option',
  REGION: 'region',
  BANNER: 'banner',
  NAVIGATION: 'navigation'
} as const;

// Screen reader announcements for calendar actions
export const CALENDAR_ANNOUNCEMENTS = {
  VIEW_CHANGED: (view: CalendarViewType) => `Switched to ${view} view`,
  DATE_CHANGED: (date: Date) => `Navigated to ${formatDateForScreenReader(date)}`,
  EVENT_SELECTED: (event: CalendarEvent) => 
    `Selected event: ${event.title} from ${formatTimeForScreenReader(event.startTime)} to ${formatTimeForScreenReader(event.endTime)}`,
  EVENT_MOVED: (event: CalendarEvent, newTime: Date) => 
    `Event ${event.title} moved to ${formatTimeForScreenReader(newTime)}`,
  LOADING_STARTED: 'Loading calendar events',
  LOADING_FINISHED: 'Calendar events loaded',
  ERROR_OCCURRED: 'Error loading calendar. Please try again.',
  TODAY_NAVIGATED: 'Navigated to today',
  CONFLICT_DETECTED: (eventTitle: string) => `Scheduling conflict detected for ${eventTitle}`,
  TIME_SLOT_SELECTED: (time: Date) => `Selected time slot: ${formatTimeForScreenReader(time)}`
} as const;

// Format date for screen reader announcements
export function formatDateForScreenReader(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Format time for screen reader announcements
export function formatTimeForScreenReader(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

// Generate calendar grid instructions for screen readers
export function generateCalendarInstructions(view: CalendarViewType): string {
  const baseInstructions = [
    'Use arrow keys to navigate between dates and time slots.',
    'Press Enter or Space to select an event or time slot.',
    'Press Escape to cancel current action.',
    'Press Home to go to today.',
    'Press 1 for daily view, 2 for weekly view, 3 for monthly view.'
  ];

  const viewSpecific = {
    daily: [
      'Use Up and Down arrows to navigate between time slots.',
      'Use Shift+Home to go to first event, Shift+End to go to last event.'
    ],
    weekly: [
      'Use arrow keys to navigate between days and time slots.',
      'Left and Right arrows change days, Up and Down change time slots.'
    ],
    monthly: [
      'Use arrow keys to navigate between dates.',
      'Press Enter on a date to view that day in detail.'
    ]
  };

  return [...baseInstructions, ...viewSpecific[view]].join(' ');
}

// Hook for calendar accessibility features
export function useCalendarAccessibility() {
  const announcer = useRef<LiveAnnouncer>(new LiveAnnouncer());
  const { announce } = useScreenReaderAnnounce();
  const preferences = useAccessibilityPreferences();

  // Announce calendar state changes
  const announceViewChange = useCallback((view: CalendarViewType) => {
    announce(CALENDAR_ANNOUNCEMENTS.VIEW_CHANGED(view), 'polite');
  }, [announce]);

  const announceDateChange = useCallback((date: Date) => {
    announce(CALENDAR_ANNOUNCEMENTS.DATE_CHANGED(date), 'polite');
  }, [announce]);

  const announceEventSelection = useCallback((event: CalendarEvent) => {
    announce(CALENDAR_ANNOUNCEMENTS.EVENT_SELECTED(event), 'polite');
  }, [announce]);

  const announceEventMove = useCallback((event: CalendarEvent, newTime: Date) => {
    announce(CALENDAR_ANNOUNCEMENTS.EVENT_MOVED(event, newTime), 'polite');
  }, [announce]);

  const announceLoading = useCallback((isLoading: boolean) => {
    if (isLoading) {
      announce(CALENDAR_ANNOUNCEMENTS.LOADING_STARTED, 'polite');
    } else {
      announce(CALENDAR_ANNOUNCEMENTS.LOADING_FINISHED, 'polite');
    }
  }, [announce]);

  const announceError = useCallback(() => {
    announce(CALENDAR_ANNOUNCEMENTS.ERROR_OCCURRED, 'assertive');
  }, [announce]);

  const announceConflict = useCallback((eventTitle: string) => {
    announce(CALENDAR_ANNOUNCEMENTS.CONFLICT_DETECTED(eventTitle), 'assertive');
  }, [announce]);

  const announceTimeSlotSelection = useCallback((time: Date) => {
    announce(CALENDAR_ANNOUNCEMENTS.TIME_SLOT_SELECTED(time), 'polite');
  }, [announce]);

  return {
    announceViewChange,
    announceDateChange,
    announceEventSelection,
    announceEventMove,
    announceLoading,
    announceError,
    announceConflict,
    announceTimeSlotSelection,
    preferences
  };
}

// Hook for calendar keyboard navigation
export function useCalendarKeyboardNavigation(
  currentView: CalendarViewType,
  currentDate: CalendarDate,
  events: CalendarEvent[],
  onNavigate: (direction: 'previous' | 'next' | 'today') => void,
  onViewChange: (view: CalendarViewType) => void,
  onEventSelect: (event: CalendarEvent) => void,
  onTimeSlotSelect: (time: Date) => void,
  disabled: boolean = false
) {
  const keyboardManager = useRef<KeyboardNavigationManager>();
  const { announceViewChange, announceDateChange, announceEventSelection, announceTimeSlotSelection } = useCalendarAccessibility();

  // Initialize keyboard navigation manager
  useEffect(() => {
    if (!keyboardManager.current) {
      keyboardManager.current = new KeyboardNavigationManager({
        enableArrowKeys: true,
        enableTabNavigation: true,
        enableTypeahead: false, // Calendar doesn't need typeahead
        announceChanges: true
      });
    }
  }, []);

  // Global keyboard shortcuts for calendar
  useGlobalKeyboardShortcuts({
    [KEYBOARD_SHORTCUTS.GLOBAL_SHORTCUTS.CALENDAR_PREVIOUS]: () => {
      if (disabled) return;
      onNavigate('previous');
    },
    [KEYBOARD_SHORTCUTS.GLOBAL_SHORTCUTS.CALENDAR_NEXT]: () => {
      if (disabled) return;
      onNavigate('next');
    },
    [KEYBOARD_SHORTCUTS.GLOBAL_SHORTCUTS.CALENDAR_TODAY]: () => {
      if (disabled) return;
      onNavigate('today');
    },
    [KEYBOARD_SHORTCUTS.GLOBAL_SHORTCUTS.CALENDAR_DAILY]: () => {
      if (disabled) return;
      onViewChange('daily');
      announceViewChange('daily');
    },
    [KEYBOARD_SHORTCUTS.GLOBAL_SHORTCUTS.CALENDAR_WEEKLY]: () => {
      if (disabled) return;
      onViewChange('weekly');
      announceViewChange('weekly');
    },
    [KEYBOARD_SHORTCUTS.GLOBAL_SHORTCUTS.CALENDAR_MONTHLY]: () => {
      if (disabled) return;
      onViewChange('monthly');
      announceViewChange('monthly');
    }
  }, disabled);

  return {
    keyboardManager: keyboardManager.current
  };
}

// Hook for calendar focus management
export function useCalendarFocusManagement(containerRef: React.RefObject<HTMLElement>) {
  const focusTrap = useFocusTrap(containerRef);

  // Set focus to first focusable element in calendar
  const focusFirstElement = useCallback(() => {
    if (containerRef.current) {
      const firstFocusable = containerRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }
  }, [containerRef]);

  // Set focus to calendar grid
  const focusGrid = useCallback(() => {
    if (containerRef.current) {
      const grid = containerRef.current.querySelector('[role="grid"]') as HTMLElement;
      if (grid) {
        grid.focus();
      }
    }
  }, [containerRef]);

  // Set focus to specific event
  const focusEvent = useCallback((eventId: string) => {
    if (containerRef.current) {
      const eventElement = containerRef.current.querySelector(
        `[data-event-id="${eventId}"]`
      ) as HTMLElement;
      if (eventElement) {
        eventElement.focus();
      }
    }
  }, [containerRef]);

  // Set focus to specific time slot
  const focusTimeSlot = useCallback((time: Date) => {
    if (containerRef.current) {
      const timeString = time.toISOString();
      const timeSlot = containerRef.current.querySelector(
        `[data-time-slot="${timeString}"]`
      ) as HTMLElement;
      if (timeSlot) {
        timeSlot.focus();
      }
    }
  }, [containerRef]);

  return {
    focusFirstElement,
    focusGrid,
    focusEvent,
    focusTimeSlot,
    ...focusTrap
  };
}

// Generate ARIA properties for calendar components
export function getCalendarAriaProps(
  view: CalendarViewType,
  currentDate: CalendarDate,
  isLoading: boolean = false,
  hasError: boolean = false
) {
  const dateString = new Date(currentDate.year, currentDate.month - 1, currentDate.day)
    .toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

  return {
    role: CALENDAR_ARIA.CALENDAR,
    'aria-label': `${view} calendar view for ${dateString}`,
    'aria-busy': isLoading,
    'aria-invalid': hasError,
    'aria-describedby': 'calendar-instructions calendar-help',
    tabIndex: 0
  };
}

// Generate ARIA properties for calendar grid
export function getCalendarGridAriaProps(
  view: CalendarViewType,
  rowCount: number,
  columnCount: number
) {
  return {
    role: CALENDAR_ARIA.GRID,
    'aria-label': `${view} calendar grid`,
    'aria-rowcount': rowCount,
    'aria-colcount': columnCount,
    'aria-readonly': false
  };
}

// Generate ARIA properties for calendar events
export function getCalendarEventAriaProps(
  event: CalendarEvent,
  isSelected: boolean = false,
  isDragging: boolean = false
) {
  const startTime = formatTimeForScreenReader(event.startTime);
  const endTime = formatTimeForScreenReader(event.endTime);
  const duration = Math.round((event.endTime.getTime() - event.startTime.getTime()) / 60000);

  return {
    role: 'button',
    'aria-label': `${event.title} from ${startTime} to ${endTime}, ${duration} minutes, ${event.energyLevel} energy, ${event.focusType} focus`,
    'aria-selected': isSelected,
    'aria-describedby': `event-${event.id}-details`,
    'aria-pressed': isSelected,
    'aria-disabled': isDragging,
    'data-event-id': event.id,
    tabIndex: isSelected ? 0 : -1
  };
}

// Generate ARIA properties for time slots
export function getTimeSlotAriaProps(
  time: Date,
  hasEvents: boolean = false,
  eventCount: number = 0,
  isSelected: boolean = false
) {
  const timeString = formatTimeForScreenReader(time);
  const description = hasEvents 
    ? `${timeString}, ${eventCount} event${eventCount === 1 ? '' : 's'}`
    : `${timeString}, available time slot`;

  return {
    role: CALENDAR_ARIA.GRIDCELL,
    'aria-label': description,
    'aria-selected': isSelected,
    'data-time-slot': time.toISOString(),
    tabIndex: isSelected ? 0 : -1,
    'aria-describedby': hasEvents ? `timeslot-${time.getTime()}-events` : undefined
  };
}

export default {
  useCalendarAccessibility,
  useCalendarKeyboardNavigation,
  useCalendarFocusManagement,
  getCalendarAriaProps,
  getCalendarGridAriaProps,
  getCalendarEventAriaProps,
  getTimeSlotAriaProps,
  generateCalendarInstructions,
  formatDateForScreenReader,
  formatTimeForScreenReader,
  CALENDAR_KEYBOARD_SHORTCUTS,
  CALENDAR_ARIA,
  CALENDAR_ANNOUNCEMENTS
};
