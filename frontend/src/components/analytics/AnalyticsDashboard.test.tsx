import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect } from 'vitest';
import Dashboard from '../ui/Dashboard';

// Mock daily plan data structure that the Dashboard expects
const mockDailyPlan = {
  date: new Date().toISOString().split('T')[0],
  scheduleBlocks: [
    {
      startTime: '09:00',
      endTime: '11:00',
      task: {
        id: '1',
        title: 'Complete project documentation',
        description: 'Write comprehensive documentation for the project',
        energyLevel: 'MEDIUM' as const,
        focusType: 'TECHNICAL' as const,
        priority: 5,
        estimatedMinutes: 120,
      },
      energyMatch: 0.8,
      focusMatch: 0.9,
      reasoning: 'Good morning energy for technical work',
    },
  ],
  unscheduledTasks: [
    {
      id: '2',
      title: 'Review code changes',
      description: 'Review the latest pull requests',
      energyLevel: 'HIGH' as const,
      focusType: 'TECHNICAL' as const,
      priority: 8,
      estimatedMinutes: 60,
    },
  ],
  totalEstimatedMinutes: 180,
  energyOptimization: 0.85,
  focusOptimization: 0.9,
  deadlineRisk: 0.2,
};

// Mock task data - must be defined before the mock
const mockTasks = [
  {
    id: '1',
    title: 'Complete project documentation',
    description: 'Write comprehensive documentation for the project',
    completed: false,
    energyLevel: 'MEDIUM' as const,
    focusType: 'TECHNICAL' as const,
    priority: 5,
    estimatedMinutes: 120,
    source: 'MANUAL' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Review code changes',
    description: 'Review the latest pull requests',
    completed: true,
    energyLevel: 'HIGH' as const,
    focusType: 'TECHNICAL' as const,
    priority: 8,
    estimatedMinutes: 60,
    source: 'MANUAL' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Create a test query client
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
    },
  });

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

// Mock the useApi hooks
vi.mock('../../hooks/useApi', () => ({
  useTasks: vi.fn(() => ({
    data: mockTasks,
    isLoading: false,
    error: null,
  })),
  useCreateTask: vi.fn(() => ({
    mutate: vi.fn(),
    isLoading: false,
  })),
  useUpdateTask: vi.fn(() => ({
    mutate: vi.fn(),
    isLoading: false,
  })),
  useDeleteTask: vi.fn(() => ({
    mutate: vi.fn(),
    isLoading: false,
  })),
  useDailyPlan: vi.fn(() => ({
    data: mockDailyPlan,
    isLoading: false,
    error: null,
  })),
  useRefreshDailyPlan: vi.fn(() => ({
    mutate: vi.fn(),
    isLoading: false,
    error: null,
  })),
}));

// Mock AI service
vi.mock('../../lib/aiService', () => ({
  aiService: {
    sendChatMessage: vi.fn(() => Promise.resolve({ data: 'Mocked AI response' })),
  },
}));

// Mock all complex child components
vi.mock('../ui/FocusView', () => ({
  default: ({ todaysTasks }: any) => (
    <div data-testid="focus-view">Focus View - {todaysTasks?.length || 0} tasks</div>
  ),
}));

vi.mock('../ui/CalendarEvents', () => ({
  default: () => <div data-testid="calendar-events">Calendar Events</div>,
}));

vi.mock('../ui/EmailIntegration', () => ({
  default: () => <div data-testid="email-integration">Email Integration</div>,
}));

vi.mock('../ui/ChatGPTIntegration', () => ({
  default: ({ messages, onSendMessage }: any) => (
    <div data-testid="chatgpt-integration">
      ChatGPT Integration - {messages?.length || 0} messages
      <button data-testid="send-message" onClick={() => onSendMessage?.('Test message')}>
        Send Message
      </button>
    </div>
  ),
}));

vi.mock('../ui/FilterBar', () => {
  const MockFilterBar = ({ filters, onFiltersChange }: any) => (
    <div data-testid="filter-bar">
      <input
        data-testid="search-input"
        value={filters?.search || ''}
        onChange={e => onFiltersChange?.({ ...filters, search: e.target.value })}
        placeholder="Search tasks..."
      />
    </div>
  );

  return {
    FilterBar: MockFilterBar,
    default: MockFilterBar,
  };
});

vi.mock('../ui/TaskCard', () => ({
  default: ({ task }: any) => (
    <div data-testid={`task-card-${task.id}`}>
      <h3>{task.title}</h3>
      <p>Status: {task.status}</p>
    </div>
  ),
}));

describe('Dashboard Integration Tests', () => {
  it('renders dashboard without crashing', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // Wait for the component to load
    await screen.findByText('Helmsman Dashboard');
    expect(screen.getByText('Helmsman Dashboard')).toBeInTheDocument();
    expect(screen.getByText('AI-powered productivity workspace')).toBeInTheDocument();
  });

  it('shows focus view when focus mode is selected', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // Wait for dashboard to load
    await screen.findByText('Helmsman Dashboard');

    // Switch to focus view
    const focusButton = screen.getByText('🎯 Focus');
    fireEvent.click(focusButton);

    // Wait for focus view to appear
    await waitFor(() => {
      expect(screen.getByTestId('focus-view')).toBeInTheDocument();
    });

    expect(screen.getByTestId('chatgpt-integration')).toBeInTheDocument();
  });

  it('renders with initial tasks', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // Wait for dashboard to load
    await screen.findByText('Helmsman Dashboard');

    // Should show tasks from the mock daily plan (1 scheduled + 1 unscheduled = 2 total)
    await waitFor(() => {
      expect(screen.getByText(/Tasks \(/)).toBeInTheDocument();
    });

    // Check for task content
    expect(screen.getByText('Complete project documentation')).toBeInTheDocument();
  });

  it('displays dashboard header and navigation', () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // Check for header elements
    expect(screen.getByText('Helmsman Dashboard')).toBeInTheDocument();
    expect(screen.getByText('📋 Grid')).toBeInTheDocument();
    expect(screen.getByText('🎯 Focus')).toBeInTheDocument();
    expect(screen.getByText('➕ New Task')).toBeInTheDocument();
  });

  it('displays task statistics', () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // Check for stats display
    expect(screen.getByText('Tasks')).toBeInTheDocument();
    expect(screen.getByText('Filtered')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('integrates with filter bar', () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    expect(screen.getByTestId('filter-bar')).toBeInTheDocument();
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
  });

  it('shows AI connection status', () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    expect(screen.getByText(/AI Connected/)).toBeInTheDocument();
  });
});
