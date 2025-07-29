import type { Task, EnergyLevel, FocusType, Priority } from '@/hooks/useApi'

export interface TestTask extends Task {
  metadata?: {
    energyLevel?: EnergyLevel
    focusType?: FocusType
    deadline?: string
    estimatedDuration?: number
    complexity?: number
  }
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
      complexity: 8
    }
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
      complexity: 6
    }
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
      complexity: 3
    }
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
      complexity: 9
    }
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
      complexity: 4
    }
  }
]

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
      complexity: 5
    }
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
      complexity: 7
    }
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
      complexity: 8
    }
  }
]

export const mockLargeDashboardTasks: TestTask[] = Array.from({ length: 120 }, (_, i) => ({
  id: `perf-task-${i + 1}`,
  title: `Performance Test Task ${i + 1}`,
  description: `A task designed to test dashboard performance with large datasets - Item ${i + 1}`,
  status: i % 4 === 0 ? 'completed' : i % 4 === 1 ? 'in-progress' : i % 4 === 2 ? 'blocked' : 'pending',
  priority: (i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low') as Priority,
  projectId: `perf-project-${Math.floor(i / 20) + 1}`,
  userId: 'user-1',
  createdAt: new Date(2025, 0, 1 + Math.floor(i / 5)).toISOString(),
  updatedAt: new Date(2025, 0, 1 + Math.floor(i / 3)).toISOString(),
  metadata: {
    energyLevel: (i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low') as EnergyLevel,
    focusType: (['creative', 'analytical', 'technical', 'administrative', 'collaborative'] as FocusType[])[i % 5],
    deadline: new Date(2025, 0, 15 + Math.floor(i / 10)).toISOString(),
    estimatedDuration: 30 + (i % 120),
    complexity: 1 + (i % 10)
  }
}))

export const mockAIExtractionTexts = [
  {
    input: 'I need to finish the project documentation by Friday and also schedule a team meeting for next week to discuss the quarterly review.',
    expectedTasks: [
      {
        title: 'Finish project documentation',
        priority: 'medium' as Priority,
        metadata: {
          deadline: 'Friday',
          energyLevel: 'medium' as EnergyLevel,
          focusType: 'administrative' as FocusType
        }
      },
      {
        title: 'Schedule team meeting for quarterly review',
        priority: 'low' as Priority,
        metadata: {
          deadline: 'next week',
          energyLevel: 'low' as EnergyLevel,
          focusType: 'collaborative' as FocusType
        }
      }
    ]
  },
  {
    input: 'Debug the authentication system - it\'s critical and blocking other work. High complexity task that requires deep focus.',
    expectedTasks: [
      {
        title: 'Debug authentication system',
        priority: 'high' as Priority,
        metadata: {
          energyLevel: 'high' as EnergyLevel,
          focusType: 'technical' as FocusType,
          complexity: 8
        }
      }
    ]
  },
  {
    input: 'Creative brainstorming session for new product features. Low pressure, just need to generate ideas.',
    expectedTasks: [
      {
        title: 'Creative brainstorming for new product features',
        priority: 'low' as Priority,
        metadata: {
          energyLevel: 'medium' as EnergyLevel,
          focusType: 'creative' as FocusType,
          complexity: 3
        }
      }
    ]
  }
]

export const mockDailyPlans = [
  {
    date: '2025-01-15',
    userEnergyPattern: {
      morning: 'high' as EnergyLevel,
      afternoon: 'medium' as EnergyLevel,
      evening: 'low' as EnergyLevel
    },
    scheduledTasks: [
      {
        taskId: 'task-1',
        timeSlot: '09:00-11:00',
        energyMatch: 'optimal'
      },
      {
        taskId: 'task-2', 
        timeSlot: '14:00-15:30',
        energyMatch: 'good'
      },
      {
        taskId: 'task-3',
        timeSlot: '16:00-16:45',
        energyMatch: 'optimal'
      }
    ]
  }
]

export const testSelectors = {
  dashboard: {
    title: '[data-testid="dashboard-title"]',
    filterBar: '[data-testid="filter-bar"]',
    taskGrid: '[data-testid="task-grid"]',
    taskCard: '[data-testid="task-card"]',
    focusView: '[data-testid="focus-view"]',
    calendarEvents: '[data-testid="calendar-events"]'
  },
  taskCard: {
    title: '[data-testid="task-title"]',
    description: '[data-testid="task-description"]',
    priority: '[data-testid="task-priority"]',
    energyLevel: '[data-testid="energy-level"]',
    focusType: '[data-testid="focus-type"]',
    deadline: '[data-testid="task-deadline"]',
    complexity: '[data-testid="task-complexity"]',
    duration: '[data-testid="estimated-duration"]'
  },
  filterBar: {
    searchInput: '[data-testid="search-input"]',
    energyFilter: '[data-testid="energy-filter"]',
    focusFilter: '[data-testid="focus-filter"]',
    statusFilter: '[data-testid="status-filter"]',
    priorityFilter: '[data-testid="priority-filter"]',
    clearFilters: '[data-testid="clear-filters"]'
  },
  dailyPlanning: {
    planHeader: '[data-testid="plan-header"]',
    timeSlot: '[data-testid="time-slot"]',
    energyIndicator: '[data-testid="energy-indicator"]',
    scheduledTask: '[data-testid="scheduled-task"]',
    generatePlan: '[data-testid="generate-plan"]'
  },
  aiIntegration: {
    textInput: '[data-testid="ai-text-input"]',
    extractButton: '[data-testid="extract-tasks"]',
    suggestedTasks: '[data-testid="suggested-tasks"]',
    acceptSuggestion: '[data-testid="accept-suggestion"]',
    rejectSuggestion: '[data-testid="reject-suggestion"]'
  }
}
