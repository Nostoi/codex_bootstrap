import type { Task, EnergyLevel, FocusType, Priority } from '@/hooks/useApi';

export interface TestTask extends Task {
  metadata?: {
    energyLevel?: EnergyLevel;
    focusType?: FocusType;
    deadline?: string;
    estimatedDuration?: number;
    complexity?: number;
  };
}

export const mockTasks: TestTask[] = [
  {
    id: 'task-1',
    title: 'High Energy Creative Task',
    description: 'Design new user interface mockups with creative exploration',
    status: 'pending',
    priority: 'high' as Priority,
    projectId: 'project-1',
    userId: 'user-1',
    createdAt: '2025-01-01T09:00:00Z',
    updatedAt: '2025-01-01T09:00:00Z',
    metadata: {
      energyLevel: 'high' as EnergyLevel,
      focusType: 'creative' as FocusType,
      deadline: '2025-01-15T17:00:00Z',
      estimatedDuration: 120,
      complexity: 8,
    },
  },
  {
    id: 'task-2',
    title: 'Medium Energy Analysis Task',
    description: 'Review quarterly metrics and prepare summary report',
    status: 'in-progress',
    priority: 'medium' as Priority,
    projectId: 'project-1',
    userId: 'user-1',
    createdAt: '2025-01-01T10:00:00Z',
    updatedAt: '2025-01-01T11:00:00Z',
    metadata: {
      energyLevel: 'medium' as EnergyLevel,
      focusType: 'analytical' as FocusType,
      deadline: '2025-01-10T12:00:00Z',
      estimatedDuration: 90,
      complexity: 6,
    },
  },
  {
    id: 'task-3',
    title: 'Low Energy Administrative Task',
    description: 'Update project documentation and organize files',
    status: 'pending',
    priority: 'low' as Priority,
    projectId: 'project-2',
    userId: 'user-1',
    createdAt: '2025-01-01T14:00:00Z',
    updatedAt: '2025-01-01T14:00:00Z',
    metadata: {
      energyLevel: 'low' as EnergyLevel,
      focusType: 'administrative' as FocusType,
      deadline: '2025-01-20T17:00:00Z',
      estimatedDuration: 45,
      complexity: 3,
    },
  },
  {
    id: 'task-4',
    title: 'High Priority Technical Debugging',
    description: 'Fix critical authentication bug affecting user login',
    status: 'blocked',
    priority: 'high' as Priority,
    projectId: 'project-1',
    userId: 'user-1',
    createdAt: '2025-01-02T08:00:00Z',
    updatedAt: '2025-01-02T08:30:00Z',
    metadata: {
      energyLevel: 'high' as EnergyLevel,
      focusType: 'technical' as FocusType,
      deadline: '2025-01-03T18:00:00Z',
      estimatedDuration: 180,
      complexity: 9,
    },
  },
  {
    id: 'task-5',
    title: 'Collaborative Design Review',
    description: 'Meet with team to review design proposals and gather feedback',
    status: 'completed',
    priority: 'medium' as Priority,
    projectId: 'project-2',
    userId: 'user-1',
    createdAt: '2024-12-28T15:00:00Z',
    updatedAt: '2024-12-30T16:00:00Z',
    metadata: {
      energyLevel: 'medium' as EnergyLevel,
      focusType: 'collaborative' as FocusType,
      deadline: '2024-12-30T17:00:00Z',
      estimatedDuration: 60,
      complexity: 4,
    },
  },
];

export const mockTasksWithDependencies: TestTask[] = [
  {
    id: 'dep-task-1',
    title: 'Setup Development Environment',
    description: 'Configure local development tools and dependencies',
    status: 'completed',
    priority: 'high' as Priority,
    projectId: 'project-dep',
    userId: 'user-1',
    createdAt: '2025-01-01T08:00:00Z',
    updatedAt: '2025-01-01T12:00:00Z',
    metadata: {
      energyLevel: 'medium' as EnergyLevel,
      focusType: 'technical' as FocusType,
      complexity: 5,
    },
  },
  {
    id: 'dep-task-2',
    title: 'Create Database Schema',
    description: 'Design and implement database structure',
    status: 'in-progress',
    priority: 'high' as Priority,
    projectId: 'project-dep',
    userId: 'user-1',
    createdAt: '2025-01-01T13:00:00Z',
    updatedAt: '2025-01-01T14:00:00Z',
    dependsOn: ['dep-task-1'],
    metadata: {
      energyLevel: 'high' as EnergyLevel,
      focusType: 'technical' as FocusType,
      complexity: 7,
    },
  },
  {
    id: 'dep-task-3',
    title: 'Implement API Endpoints',
    description: 'Build REST API for core functionality',
    status: 'blocked',
    priority: 'high' as Priority,
    projectId: 'project-dep',
    userId: 'user-1',
    createdAt: '2025-01-01T15:00:00Z',
    updatedAt: '2025-01-01T15:00:00Z',
    dependsOn: ['dep-task-2'],
    metadata: {
      energyLevel: 'high' as EnergyLevel,
      focusType: 'technical' as FocusType,
      complexity: 8,
    },
  },
];

export const mockLargeDashboardTasks: TestTask[] = Array.from({ length: 120 }, (_, i) => ({
  id: `perf-task-${i + 1}`,
  title: `Performance Test Task ${i + 1}`,
  description: `A task designed to test dashboard performance with large datasets - Item ${i + 1}`,
  status:
    i % 4 === 0 ? 'completed' : i % 4 === 1 ? 'in-progress' : i % 4 === 2 ? 'blocked' : 'pending',
  priority: (i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low') as Priority,
  projectId: `perf-project-${Math.floor(i / 20) + 1}`,
  userId: 'user-1',
  createdAt: new Date(2025, 0, 1 + Math.floor(i / 5)).toISOString(),
  updatedAt: new Date(2025, 0, 1 + Math.floor(i / 3)).toISOString(),
  metadata: {
    energyLevel: (i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low') as EnergyLevel,
    focusType: (
      ['creative', 'analytical', 'technical', 'administrative', 'collaborative'] as FocusType[]
    )[i % 5],
    deadline: new Date(2025, 0, 15 + Math.floor(i / 10)).toISOString(),
    estimatedDuration: 30 + (i % 120),
    complexity: 1 + (i % 10),
  },
}));

export const mockAIExtractionTexts = [
  {
    input:
      'I need to finish the project documentation by Friday and also schedule a team meeting for next week to discuss the quarterly review.',
    expectedTasks: [
      {
        title: 'Finish project documentation',
        priority: 'medium' as Priority,
        metadata: {
          deadline: 'Friday',
          energyLevel: 'medium' as EnergyLevel,
          focusType: 'administrative' as FocusType,
        },
      },
      {
        title: 'Schedule team meeting for quarterly review',
        priority: 'low' as Priority,
        metadata: {
          deadline: 'next week',
          energyLevel: 'low' as EnergyLevel,
          focusType: 'collaborative' as FocusType,
        },
      },
    ],
  },
  {
    input:
      "Debug the authentication system - it's critical and blocking other work. High complexity task that requires deep focus.",
    expectedTasks: [
      {
        title: 'Debug authentication system',
        priority: 'high' as Priority,
        metadata: {
          energyLevel: 'high' as EnergyLevel,
          focusType: 'technical' as FocusType,
          complexity: 8,
        },
      },
    ],
  },
  {
    input:
      'Creative brainstorming session for new product features. Low pressure, just need to generate ideas.',
    expectedTasks: [
      {
        title: 'Creative brainstorming for new product features',
        priority: 'low' as Priority,
        metadata: {
          energyLevel: 'medium' as EnergyLevel,
          focusType: 'creative' as FocusType,
          complexity: 3,
        },
      },
    ],
  },
];

export const mockDailyPlans = [
  {
    date: '2025-01-15',
    scheduleBlocks: [
      {
        startTime: '09:00',
        endTime: '11:00',
        task: {
          id: 'task-1',
          title: 'High Priority Task',
          description: 'Important morning task',
          energyLevel: 'HIGH' as const,
          focusType: 'TECHNICAL' as const,
          estimatedMinutes: 120,
          priority: 5,
        },
        energyMatch: 0.9,
        focusMatch: 0.85,
        reasoning: 'Optimal energy level match for high-priority technical work',
      },
      {
        startTime: '14:00',
        endTime: '15:30',
        task: {
          id: 'task-2',
          title: 'Medium Priority Task',
          description: 'Afternoon administrative work',
          energyLevel: 'MEDIUM' as const,
          focusType: 'ADMINISTRATIVE' as const,
          estimatedMinutes: 90,
          priority: 3,
        },
        energyMatch: 0.8,
        focusMatch: 0.9,
        reasoning: 'Good energy match for administrative tasks',
      },
    ],
    unscheduledTasks: [
      {
        id: 'task-3',
        title: 'Low Priority Task',
        description: 'Can be done anytime',
        energyLevel: 'LOW' as const,
        focusType: 'CREATIVE' as const,
        estimatedMinutes: 45,
        priority: 1,
      },
    ],
    totalEstimatedMinutes: 255,
    energyOptimization: 0.85,
    focusOptimization: 0.87,
    deadlineRisk: 0.15,
  },
];

export const testSelectors = {
  dashboard: {
    title: 'h1:has-text("Helmsman Dashboard")',
    subtitle: 'text="AI-powered productivity workspace"',
    mainContent: '.p-6', // Main content wrapper
    gridView: '.grid.grid-cols-1.lg\\:grid-cols-12', // Main grid layout
    tasksGrid: '[data-testid="main-task-grid"]', // Task cards grid with unique selector
    taskGrid: '[data-testid="main-task-grid"]', // Alias for tasksGrid for test compatibility
    sidebar: '.lg\\:col-span-4.space-y-6', // Right sidebar
    stats: '.stats.stats-horizontal.shadow', // Task statistics
    viewModeToggle: '.join', // Grid/Focus toggle buttons
    refreshButton: 'button:has-text("� Refresh Plan")',
    aiStatus: '.badge.gap-2', // AI connection status
  },
  taskCard: {
    container: '.card.h-fit', // TaskCard container
    title: '[data-testid="task-title"]', // Task title element
    description: '[data-testid="task-description"]', // Task description
    status: '[data-testid="task-status"]', // Task status badge
    priority: '[data-testid="task-priority"]', // Priority indicator
    energyLevel: '[data-testid="task-energy"]', // Energy level badge
    focusType: '[data-testid="task-focus-type"]', // Focus type badge
    deadline: '[data-testid="task-deadline"]', // Deadline display
    estimatedTime: '[data-testid="task-estimated-time"]', // Time estimate
    actions: '[data-testid="task-actions"]', // Action buttons
    // Dependency Management Elements
    dependencyIndicator: 'span:has-text("dependencies")', // Dependency indicator
    blockedIndicator: 'span:has-text("Blocked")', // Blocked status indicator
    dependencyCount: 'span:has-text("dependencies")', // Dependency count display
  },
  filterBar: {
    container: '.sticky.top-0.z-10', // FilterBar container
    searchInput: '#task-search', // Updated to use actual id
    energyFilters: '[data-testid="energy-filter-group"]',
    focusFilters: '[data-testid="focus-filter-group"]',
    statusFilters: '[data-testid="status-filter-group"]',
    priorityRange: '[data-testid="priority-range"]',
    clearButton: 'button:has-text("Clear")',
    resetButton: 'button:has-text("Reset")',
    // Individual energy level buttons
    highEnergyFilter: 'button:has-text("⚡")',
    mediumEnergyFilter: 'button:has-text("⚖️")',
    lowEnergyFilter: 'button:has-text("🌱")',
    // Individual focus type buttons
    creativeFilter: 'button:has-text("🎨")',
    technicalFilter: 'button:has-text("⚙️")',
    administrativeFilter: 'button:has-text("📋")',
    socialFilter: 'button:has-text("👥")',
  },
  dailyPlanning: {
    planHeader: 'h1:has-text("Helmsman Dashboard")', // Main dashboard header
    loadingAlert: '.alert.alert-info:has-text("Loading your daily plan")',
    errorAlert: '.alert.alert-warning',
    optimizationStats: '.grid.grid-cols-1.md\\:grid-cols-3.gap-4',
    energyOptimization: '.stat:has-text("Energy Optimization")',
    focusOptimization: '.stat:has-text("Focus Optimization")',
    deadlineRisk: '.stat:has-text("Deadline Risk")',
    refreshPlanButton: 'button:has-text("Retry")', // The refresh plan button in error state
    generatePlan: 'button:has-text("Retry")', // Same as refresh plan for now
  },
  viewModes: {
    gridViewButton: 'button:has-text("📋 Grid")',
    focusViewButton: 'button:has-text("🎯 Focus")',
    focusViewContainer: '.lg\\:col-span-6', // Focus view main area
  },
  aiIntegration: {
    chatContainer: '.card', // ChatGPT integration card
    textInput:
      'textarea[placeholder*="Ask AI to help plan your day, extract tasks, or optimize your workflow"]',
    sendButton: 'button[type="submit"]',
    extractButton: 'button:has-text("📋 Extract Tasks")',
    clearButton: 'button:has-text("Clear Chat")',
    messagesContainer: '.messages',
    aiStatus: '.badge:has-text("AI")',
  },
  calendarEvents: {
    container: '.card:has(.card-title:has-text("📅"))',
    eventsList: '[data-testid="calendar-events-list"]',
    noEventsMessage: 'text="No calendar events"',
  },
  emailIntegration: {
    container: '.card:has(.card-title:has-text("📧"))',
    providerSelect: 'select',
    scanButton: 'button:has-text("Scan")',
    extractedTasks: '[data-testid="extracted-email-tasks"]',
  },
};
