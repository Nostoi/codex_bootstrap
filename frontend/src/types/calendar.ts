/**
 * Calendar Component Type Definitions
 * ADHD-optimized calendar interface for Helmsman task management
 */

// Energy levels for ADHD-aware scheduling
export type EnergyLevel = 'HIGH' | 'MEDIUM' | 'LOW';

// Focus types for cognitive load management
export type FocusType = 'CREATIVE' | 'TECHNICAL' | 'ADMINISTRATIVE' | 'SOCIAL';

// Calendar view modes
export type CalendarViewMode = 'daily' | 'weekly' | 'monthly';

// Calendar data sources
export type CalendarSource = 'google' | 'outlook' | 'task';

// Conflict severity levels
export type ConflictLevel = 'none' | 'soft' | 'hard';

// ADHD-specific calendar settings
export interface ADHDCalendarSettings {
  // Visual preferences
  reducedMotion: boolean;
  highContrast: boolean;
  colorblindMode: 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';

  // Interaction preferences
  dragDelay: number; // ms delay before drag starts (default: 300ms)
  confirmTimeChanges: boolean; // Show confirmation for significant time changes
  enableSounds: boolean; // Audio feedback for interactions

  // Cognitive load management
  maxEventsPerView: number; // Limit events shown to prevent overwhelm
  showEnergyIndicators: boolean; // Show energy level color coding
  enableFocusMode: boolean; // Hide non-essential UI elements

  // Notification preferences
  reminderBuffer: number; // Minutes before event to show reminder
  gentleTransitions: boolean; // Use slower, calmer animations
}

// User energy patterns for optimal scheduling
export interface UserEnergyPattern {
  morning: EnergyLevel; // 6AM - 12PM
  afternoon: EnergyLevel; // 12PM - 6PM
  evening: EnergyLevel; // 6PM - 10PM
  timezone: string;
  workingHours: {
    start: string; // HH:MM format
    end: string; // HH:MM format
  };
}

// Calendar event interface matching backend CalendarEvent
export interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  source: CalendarSource;
  energyLevel: EnergyLevel;
  focusType: FocusType;
  isAllDay: boolean;
  description?: string;
  conflictLevel?: ConflictLevel;

  // Additional frontend properties
  isDragging?: boolean;
  isSelected?: boolean;
  backgroundColor?: string;
  textColor?: string;
}

// Task with metadata for calendar display
export interface TaskWithMetadata {
  id: string;
  title: string;
  description?: string;
  priority: number; // 1-5
  energyLevel: EnergyLevel;
  focusType: FocusType;
  estimatedDuration: number; // minutes
  deadline?: Date;
  scheduledTime?: Date;
  status: 'pending' | 'in-progress' | 'blocked' | 'done';
  dependencies?: string[]; // Task IDs

  // Calendar-specific properties
  isScheduled: boolean;
  conflictLevel?: ConflictLevel;
  canReschedule: boolean;
}

// Main calendar component props
export interface CalendarViewProps {
  // View configuration
  view: CalendarViewMode;
  currentDate: Date;

  // Data
  events: CalendarEvent[];
  tasks: TaskWithMetadata[];
  userEnergyPattern?: UserEnergyPattern;

  // Event handlers
  onEventDrop: (eventId: string, newStartTime: Date, newEndTime: Date) => Promise<void>;
  onTimeSlotClick: (date: Date, hour: number, minute: number) => void;
  onEventClick: (event: CalendarEvent) => void;
  onTaskClick: (task: TaskWithMetadata) => void;
  onNavigate: (direction: 'prev' | 'next' | 'today') => void;
  onViewChange: (view: CalendarViewMode) => void;

  // Configuration
  adhdSettings?: ADHDCalendarSettings;
  loading?: boolean;
  error?: string;

  // Accessibility
  ariaLabel?: string;
  showKeyboardShortcuts?: boolean;
}

// Time slot representation for calendar grid
export interface TimeSlot {
  date: Date;
  hour: number;
  minute: number;
  duration: number; // minutes
  isEmpty: boolean;
  events: CalendarEvent[];
  tasks: TaskWithMetadata[];
  energyLevel?: EnergyLevel; // Based on user pattern
  conflictLevel: ConflictLevel;
  isCurrentTime?: boolean;
  isWorkingHours?: boolean;
}

// Calendar navigation state
export interface CalendarNavigationState {
  currentDate: Date;
  view: CalendarViewMode;
  selectedDate?: Date;
  selectedEvent?: string;
  focusedElement?: string;
  isNavigating: boolean;
}

// Drag and drop state
export interface DragState {
  isDragging: boolean;
  draggedItem?: CalendarEvent | TaskWithMetadata;
  draggedItemType: 'event' | 'task' | null;
  dropTarget?: TimeSlot;
  isValidDrop: boolean;
  originalPosition?: { date: Date; hour: number; minute: number };
}

// Calendar grid configuration
export interface CalendarGridConfig {
  // Time settings
  startHour: number; // 0-23
  endHour: number; // 0-23
  timeSlotDuration: number; // minutes (15, 30, 60)
  showAllDayEvents: boolean;

  // Display settings
  showWeekends: boolean;
  firstDayOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
  showTimeAxis: boolean;
  showDateHeaders: boolean;

  // ADHD optimizations
  highlightCurrentTime: boolean;
  showEnergyZones: boolean;
  useCompactView: boolean;
  maxEventsPerSlot: number;
}

// Export type for calendar component state
export interface CalendarState {
  navigation: CalendarNavigationState;
  dragState: DragState;
  gridConfig: CalendarGridConfig;
  settings: ADHDCalendarSettings;
  loading: boolean;
  error?: string;
}

// Type aliases for compatibility with component implementations
export type CalendarViewType = CalendarViewMode;

// Simple date interface for navigation
export interface CalendarDate {
  year: number;
  month: number; // 1-12
  day: number;
}

// Updated CalendarViewProps for our implemented component
export interface CalendarViewComponentProps {
  initialView?: CalendarViewType;
  initialDate?: CalendarDate;
  className?: string;
  showNavigation?: boolean;
  showViewSelector?: boolean;
  onDateChange?: (date: CalendarDate) => void;
  onViewChange?: (view: CalendarViewType) => void;
  onEventClick?: (event: import('../hooks/useApi').CalendarEvent) => void;
  disableNavigation?: boolean;
  maxEventsPerSlot?: number;
  enableDragAndDrop?: boolean;
  adhdSettings?: ADHDCalendarSettings;
}
