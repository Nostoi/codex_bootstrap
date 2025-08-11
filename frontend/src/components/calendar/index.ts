// Calendar Components Export - Enhanced with Advanced Features
export { default as CalendarView } from './CalendarView';
export { CalendarHeader } from './CalendarHeader';
export { CalendarGrid } from './CalendarGrid';
export { DailyGrid } from './DailyGrid';
export { WeeklyGrid } from './WeeklyGrid';
export { MonthlyGrid } from './MonthlyGrid';

// Advanced calendar components (Phase 3 Item 14)
export { default as CalendarConflictResolver } from './CalendarConflictResolver';
export { default as MultiCalendarPreferences } from './MultiCalendarPreferences';
export { default as CalendarSyncStatusDisplay } from './CalendarSyncStatusDisplay';
export { default as RealTimeCalendarEvents } from './RealTimeCalendarEvents';
export { default as EnhancedCalendarView } from './EnhancedCalendarView';

// Re-export types for convenience
export type {
  CalendarViewType,
  CalendarDate,
  CalendarViewComponentProps,
  ADHDCalendarSettings,
  TaskWithMetadata,
} from '../../types/calendar';

// Re-export calendar tokens
export { calendarTokens } from '../../styles/calendar-tokens';
