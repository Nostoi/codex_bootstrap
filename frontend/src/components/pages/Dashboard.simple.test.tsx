import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from '../ui/Dashboard';

// Create a test query client
const createTestQueryClient = () => new QueryClient({
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
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Mock the API hooks
vi.mock('../../hooks/useApi', () => ({
  useDailyPlan: vi.fn(() => ({
    data: {
      date: '2025-07-29',
      scheduleBlocks: [],
      unscheduledTasks: [],
      energyOptimization: 0.75,
      focusOptimization: 0.68,
      deadlineRisk: 0.25,
    },
    isLoading: false,
    error: null,
  })),
  useRefreshDailyPlan: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

// Mock all child components
vi.mock('../ui/FocusView', () => ({
  default: () => <div data-testid="focus-view">FocusView Mock</div>,
}));

vi.mock('../ui/ChatGPTIntegration', () => ({
  default: () => <div data-testid="chat-integration">Chat Mock</div>,
}));

vi.mock('../ui/CalendarEvents', () => ({
  default: () => <div data-testid="calendar-events">Calendar Mock</div>,
}));

vi.mock('../ui/FilterBar', () => ({
  FilterBar: () => <div data-testid="filter-bar">Filter Mock</div>,
}));

vi.mock('../ui/TaskCard', () => ({
  default: ({ task }: any) => (
    <div data-testid={`task-card-${task.id}`}>
      Task: {task.title}
    </div>
  ),
}));

describe('Enhanced Dashboard - Simple Tests', () => {
  it('renders dashboard without crashing', () => {
    render(
      <TestWrapper>
        <Dashboard initialTasks={[]} />
      </TestWrapper>
    );

    expect(screen.getByText('Helmsman Dashboard')).toBeInTheDocument();
  });

  it('shows empty state when no tasks provided', () => {
    render(
      <TestWrapper>
        <Dashboard initialTasks={[]} />
      </TestWrapper>
    );

    expect(screen.getByText('No tasks yet')).toBeInTheDocument();
  });
});
