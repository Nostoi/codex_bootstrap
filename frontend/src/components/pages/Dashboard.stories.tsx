import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import Dashboard from '../ui/Dashboard';
import { Task } from '../ui/Dashboard';

// Mock tasks for stories
const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Complete user onboarding flow',
    description: 'Design and implement the complete user onboarding experience',
    status: 'IN_PROGRESS',
    priority: 5,
    energyLevel: 'HIGH',
    focusType: 'CREATIVE',
    estimatedMinutes: 120,
    hardDeadline: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    source: 'SELF',
    isOverdue: false,
    isBlocked: false,
    dependencyCount: 0,
  },
  {
    id: 'task-2',
    title: 'Review pull request #123',
    description: 'Code review for the authentication feature',
    status: 'TODO',
    priority: 3,
    energyLevel: 'MEDIUM',
    focusType: 'TECHNICAL',
    estimatedMinutes: 45,
    source: 'TEAM',
    isOverdue: false,
    isBlocked: false,
    dependencyCount: 0,
  },
  {
    id: 'task-3',
    title: 'Update project documentation',
    description: 'Refresh the README and API documentation',
    status: 'TODO',
    priority: 2,
    energyLevel: 'LOW',
    focusType: 'ADMINISTRATIVE',
    estimatedMinutes: 90,
    source: 'SELF',
    isOverdue: false,
    isBlocked: false,
    dependencyCount: 0,
  },
  {
    id: 'task-4',
    title: 'Team standup meeting',
    description: 'Daily team sync meeting',
    status: 'DONE',
    priority: 3,
    energyLevel: 'MEDIUM',
    focusType: 'SOCIAL',
    estimatedMinutes: 30,
    source: 'TEAM',
    isOverdue: false,
    isBlocked: false,
    dependencyCount: 0,
  },
  {
    id: 'task-5',
    title: 'Debug production issue',
    description: 'Investigate and fix critical bug in payment system',
    status: 'BLOCKED',
    priority: 5,
    energyLevel: 'HIGH',
    focusType: 'TECHNICAL',
    estimatedMinutes: 180,
    hardDeadline: new Date(Date.now() + 43200000).toISOString(), // 12 hours
    source: 'BOSS',
    isOverdue: false,
    isBlocked: true,
    dependencyCount: 2,
    aiSuggestion: 'Consider breaking this into smaller debugging tasks',
  },
];

const meta: Meta<typeof Dashboard> = {
  title: 'Pages/Dashboard',
  component: Dashboard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The enhanced Dashboard component is the main productivity interface for the Helmsman AI system. It integrates multiple components and features for comprehensive task management:

## Key Features

- **Dual View Modes**: Switch between Grid view (TaskCard-based) and Focus view (traditional)
- **Advanced Filtering**: Comprehensive FilterBar integration with search, energy levels, focus types, status, and priority filters
- **Real-time API Integration**: Connected to daily planning API with live data updates
- **AI Integration**: ChatGPT-powered task extraction and intelligent recommendations
- **Calendar Integration**: Side-by-side calendar events display
- **ADHD-Optimized Design**: Clear visual hierarchy, predictable interactions, minimal cognitive load

## Layout Structure

### Grid View (Default)
- **F-Pattern Layout**: Important information positioned top-left for natural reading flow
- **TaskCard Grid**: Enhanced task cards in responsive 2-column grid
- **Integrated Sidebar**: Calendar events and AI recommendations
- **Sticky FilterBar**: Always-accessible filtering controls

### Focus View
- **Traditional Layout**: Original FocusView component for concentrated work
- **Single-task Focus**: Minimal distractions with focused task display
- **AI Guidance**: Prominent AI recommendations and focus goal setting

## ADHD-Friendly Features

- **Clear Visual Hierarchy**: Consistent spacing, typography, and color usage
- **Predictable Interactions**: Familiar UI patterns and consistent behavior
- **Progressive Disclosure**: Information revealed as needed to reduce cognitive load
- **Immediate Feedback**: Visual confirmation of all user actions
- **Minimal Context Switching**: All essential information in a single interface

## Real-time Features

- **Live Data Updates**: Automatic refresh from daily planning API
- **Optimistic UI**: Immediate visual feedback for user actions
- **Error Handling**: Graceful degradation with clear error states
- **Background Sync**: Non-intrusive data synchronization

## Accessibility

- **WCAG 2.2 AA Compliant**: Full keyboard navigation and screen reader support
- **Focus Management**: Clear focus indicators and logical tab order
- **ARIA Labels**: Comprehensive semantic markup
- **High Contrast**: Support for high contrast themes and color blindness
        `,
      },
    },
  },
  argTypes: {
    initialTasks: {
      control: 'object',
      description: 'Initial task data for the dashboard',
    },
    onTaskUpdate: {
      action: 'task-updated',
      description: 'Callback when a task is updated',
    },
    onTaskAdd: {
      action: 'task-added',
      description: 'Callback when a new task is added',
    },
    onTaskDelete: {
      action: 'task-deleted',
      description: 'Callback when a task is deleted',
    },
    layout: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Dashboard layout orientation',
    },
    chatPosition: {
      control: 'select',
      options: ['left', 'right', 'bottom'],
      description: 'Position of the chat panel',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
  args: {
    onTaskUpdate: fn(),
    onTaskAdd: fn(),
    onTaskDelete: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default dashboard state with mixed task statuses and priorities
 */
export const Default: Story = {
  args: {
    initialTasks: mockTasks,
  },
};

/**
 * Dashboard with many tasks showing filtering capabilities
 */
export const WithManyTasks: Story = {
  args: {
    initialTasks: [
      ...mockTasks,
      {
        id: 'task-6',
        title: 'Design system updates',
        description: 'Update design tokens and component library',
        status: 'TODO',
        priority: 4,
        energyLevel: 'HIGH',
        focusType: 'CREATIVE',
        estimatedMinutes: 240,
        source: 'SELF',
        isOverdue: false,
        isBlocked: false,
        dependencyCount: 0,
      },
      {
        id: 'task-7',
        title: 'Database optimization',
        description: 'Optimize slow queries and improve performance',
        status: 'IN_PROGRESS',
        priority: 4,
        energyLevel: 'HIGH',
        focusType: 'TECHNICAL',
        estimatedMinutes: 180,
        source: 'TEAM',
        isOverdue: false,
        isBlocked: false,
        dependencyCount: 1,
      },
      {
        id: 'task-8',
        title: 'Schedule team retrospective',
        description: 'Plan and coordinate next sprint retrospective',
        status: 'TODO',
        priority: 2,
        energyLevel: 'LOW',
        focusType: 'ADMINISTRATIVE',
        estimatedMinutes: 60,
        source: 'SELF',
        isOverdue: false,
        isBlocked: false,
        dependencyCount: 0,
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Dashboard with expanded task list demonstrating filtering and organization capabilities.',
      },
    },
  },
};

/**
 * Empty state showing the dashboard with no tasks
 */
export const EmptyState: Story = {
  args: {
    initialTasks: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty dashboard state with helpful onboarding messaging and call-to-action.',
      },
    },
  },
};

/**
 * High priority and overdue tasks scenario
 */
export const HighPriorityTasks: Story = {
  args: {
    initialTasks: [
      {
        id: 'urgent-1',
        title: 'Fix critical security vulnerability',
        description: 'Patch authentication bypass in user login',
        status: 'IN_PROGRESS',
        priority: 5,
        energyLevel: 'HIGH',
        focusType: 'TECHNICAL',
        estimatedMinutes: 120,
        hardDeadline: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago (overdue)
        source: 'BOSS',
        isOverdue: true,
        isBlocked: false,
        dependencyCount: 0,
      },
      {
        id: 'urgent-2',
        title: 'Emergency client presentation',
        description: 'Prepare slides for unexpected client meeting',
        status: 'TODO',
        priority: 5,
        energyLevel: 'HIGH',
        focusType: 'CREATIVE',
        estimatedMinutes: 90,
        hardDeadline: new Date(Date.now() + 7200000).toISOString(), // 2 hours
        source: 'BOSS',
        isOverdue: false,
        isBlocked: false,
        dependencyCount: 0,
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'High-stress scenario with urgent, high-priority tasks and overdue items.',
      },
    },
  },
};

/**
 * Completed productive day scenario
 */
export const ProductiveDay: Story = {
  args: {
    initialTasks: [
      {
        id: 'done-1',
        title: 'Complete user research analysis',
        description: 'Analyze and summarize user interview findings',
        status: 'DONE',
        priority: 4,
        energyLevel: 'HIGH',
        focusType: 'CREATIVE',
        estimatedMinutes: 180,
        source: 'SELF',
        isOverdue: false,
        isBlocked: false,
        dependencyCount: 0,
      },
      {
        id: 'done-2',
        title: 'Code review and merge PR #456',
        description: 'Review and approve feature branch',
        status: 'DONE',
        priority: 3,
        energyLevel: 'MEDIUM',
        focusType: 'TECHNICAL',
        estimatedMinutes: 45,
        source: 'TEAM',
        isOverdue: false,
        isBlocked: false,
        dependencyCount: 0,
      },
      {
        id: 'done-3',
        title: 'Update project timeline',
        description: 'Revise project schedule based on new requirements',
        status: 'DONE',
        priority: 2,
        energyLevel: 'LOW',
        focusType: 'ADMINISTRATIVE',
        estimatedMinutes: 30,
        source: 'SELF',
        isOverdue: false,
        isBlocked: false,
        dependencyCount: 0,
      },
      {
        id: 'remaining-1',
        title: 'Prepare tomorrow\'s standup',
        description: 'Review progress and plan discussion points',
        status: 'TODO',
        priority: 2,
        energyLevel: 'LOW',
        focusType: 'ADMINISTRATIVE',
        estimatedMinutes: 15,
        source: 'SELF',
        isOverdue: false,
        isBlocked: false,
        dependencyCount: 0,
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Successful day with most tasks completed, showing progress and achievement.',
      },
    },
  },
};

/**
 * Horizontal layout variation
 */
export const HorizontalLayout: Story = {
  args: {
    initialTasks: mockTasks,
    layout: 'horizontal',
    chatPosition: 'bottom',
  },
  parameters: {
    docs: {
      description: {
        story: 'Dashboard with horizontal layout optimization and bottom chat position.',
      },
    },
  },
};

/**
 * Mobile responsive view
 */
export const Mobile: Story = {
  args: {
    initialTasks: mockTasks,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Mobile-optimized dashboard with responsive layout and touch-friendly interactions.',
      },
    },
  },
};

/**
 * Tablet responsive view
 */
export const Tablet: Story = {
  args: {
    initialTasks: mockTasks,
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'Tablet-optimized dashboard showing responsive grid adaptation.',
      },
    },
  },
};

/**
 * Dark theme demonstration
 */
export const DarkTheme: Story = {
  args: {
    initialTasks: mockTasks,
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'Dashboard in dark theme showing consistent design system application.',
      },
    },
  },
};

/**
 * ADHD-friendly high contrast mode
 */
export const HighContrast: Story = {
  args: {
    initialTasks: mockTasks,
    className: 'high-contrast',
  },
  parameters: {
    docs: {
      description: {
        story: 'High contrast mode for users with visual processing differences or ADHD.',
      },
    },
  },
};
