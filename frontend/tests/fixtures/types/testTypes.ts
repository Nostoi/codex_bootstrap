/**
 * Type definitions for test data factory system
 * Ensures compatibility with both frontend and backend types
 */

// Energy levels for ADHD optimization
export type EnergyLevel = 'HIGH' | 'MEDIUM' | 'LOW';

// Focus types for cognitive load management
export type FocusType = 'CREATIVE' | 'TECHNICAL' | 'ADMINISTRATIVE' | 'SOCIAL';

// Priority levels
export type Priority = 'low' | 'medium' | 'high';

// Task status
export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'blocked';

/**
 * Test Task interface with ADHD-specific metadata
 */
export interface TestTask {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  projectId?: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string | null;
  completedAt?: string | null;
  tags: string[];
  metadata?: {
    energyLevel?: EnergyLevel;
    focusType?: FocusType;
    complexity?: number;
    estimatedDuration?: number;
    deadline?: string;
    dependsOn?: string[];
  };
}

/**
 * Test User interface with ADHD preferences
 */
export interface TestUser {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  preferences: {
    theme: string;
    energyPattern: 'morning-person' | 'night-owl' | 'consistent';
    defaultView: 'grid' | 'list' | 'focus';
    notificationsEnabled: boolean;
    reducedMotion?: boolean;
    highContrast?: boolean;
    batchNotifications?: boolean;
    focusMode?: {
      enabled: boolean;
      duration: number;
      breakDuration: number;
    };
    calendarIntegration: {
      google: boolean;
      outlook: boolean;
    };
    emailIntegration?: {
      gmail: boolean;
      outlook: boolean;
    };
    aiFeatures?: {
      taskExtraction: boolean;
      smartSuggestions: boolean;
      proactiveReminders: boolean;
    };
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Test Project interface
 */
export interface TestProject {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  members: string[];
  settings: {
    defaultEnergyLevel: EnergyLevel;
    defaultFocusType: FocusType;
    enableAI: boolean;
    requireApproval: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Calendar Event interface for testing
 */
export interface TestCalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  attendees?: Array<{
    email: string;
    name?: string;
    status?: 'accepted' | 'declined' | 'tentative' | 'needs-action';
  }>;
  source: 'google' | 'outlook' | 'manual';
  type?: 'meeting' | 'focus' | 'break' | 'reminder';
}

/**
 * Notification interface for testing
 */
export interface TestNotification {
  id: string;
  type: 'task_reminder' | 'deadline_warning' | 'energy_suggestion' | 'calendar_conflict';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * Daily Plan interface for testing
 */
export interface TestDailyPlan {
  date: string;
  timeSlots: Array<{
    startTime: string;
    endTime: string;
    taskId?: string | null;
    energyLevel: EnergyLevel;
    focusType?: FocusType;
    available: boolean;
    reasoning?: string;
  }>;
  calendarEvents: TestCalendarEvent[];
  conflicts: string[];
  optimizationScore: number;
  totalPlannedTime: number;
  energyDistribution: Record<EnergyLevel, number>;
}

/**
 * AI Response interfaces for testing
 */
export interface TestAITaskExtraction {
  tasks: Array<{
    title: string;
    description: string;
    energyLevel: EnergyLevel;
    focusType: FocusType;
    priority: number;
    estimatedDuration: number;
    complexity: number;
  }>;
  confidence: number;
  processingTime: number;
}

export interface TestAITaskClassification {
  energyLevel: EnergyLevel;
  focusType: FocusType;
  priority: number;
  estimatedDuration: number;
  complexity: number;
  tags: string[];
  suggestedTimeSlot: string;
  confidence: number;
}

/**
 * Test scenario configurations
 */
export interface TestScenario {
  name: string;
  description: string;
  userProfile: 'basic' | 'adhd' | 'power';
  taskCount: number;
  energyDistribution: Record<EnergyLevel, number>;
  hasDependencies: boolean;
  hasCalendarEvents: boolean;
  networkCondition: 'normal' | 'slow' | 'offline';
  aiServiceStatus: 'available' | 'degraded' | 'down';
}

/**
 * Mock response types
 */
export interface MockAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    type: string;
    message: string;
    code?: string;
  };
  metadata?: {
    requestId: string;
    timestamp: string;
    processingTime: number;
  };
}

/**
 * Test state management
 */
export interface TestState {
  currentUser: TestUser | null;
  tasks: TestTask[];
  projects: TestProject[];
  currentProject: TestProject | null;
  dailyPlan: TestDailyPlan | null;
  notifications: TestNotification[];
  calendarEvents: TestCalendarEvent[];
  isLoading: boolean;
  errors: string[];
}

/**
 * Test context configuration
 */
export interface TestContextConfig {
  mockAPI: boolean;
  seedData: boolean;
  adhdProfile: 'high-energy' | 'moderate' | 'low-energy';
  accessibility: boolean;
  viewport: {
    width: number;
    height: number;
  };
  networkDelay: number;
  errorSimulation: boolean;
}

/**
 * Accessibility test configuration
 */
export interface AccessibilityTestConfig {
  checkColorContrast: boolean;
  checkKeyboardNavigation: boolean;
  checkScreenReaderSupport: boolean;
  checkFocusManagement: boolean;
  checkReducedMotion: boolean;
  wcagLevel: 'A' | 'AA' | 'AAA';
}

/**
 * Performance test metrics
 */
export interface PerformanceMetrics {
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
  totalBlockingTime: number;
  bundleSize: number;
  memoryUsage: number;
}

/**
 * E2E test result interface
 */
export interface E2ETestResult {
  testName: string;
  duration: number;
  status: 'passed' | 'failed' | 'skipped';
  steps: Array<{
    name: string;
    status: 'passed' | 'failed';
    duration: number;
    screenshot?: string;
    error?: string;
  }>;
  performance?: PerformanceMetrics;
  accessibility?: {
    violations: Array<{
      id: string;
      description: string;
      impact: 'minor' | 'moderate' | 'serious' | 'critical';
      nodes: Array<{
        target: string;
        html: string;
      }>;
    }>;
    passes: number;
  };
}
