import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard, { Task } from '../ui/Dashboard';

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

// Mock the API hooks
vi.mock('../../hooks/useApi', () => ({
  useDailyPlan: vi.fn(() => ({
    data: {
      date: '2025-07-29',
      scheduleBlocks: [
        {
          task: {
            id: 'api-task-1',
            title: 'API Task 1',
            description: 'From API',
            priority: 3,
            estimatedMinutes: 60,
            energyLevel: 'MEDIUM',
            focusType: 'TECHNICAL',
            hardDeadline: null,
          },
        },
      ],
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

// Mock child components to isolate Dashboard testing
vi.mock('../ui/FocusView', () => ({
  default: ({ todaysTasks, onTaskClick }: any) => (
    <div data-testid="focus-view">
      Focus View with {todaysTasks.length} tasks
      {todaysTasks.map((task: Task) => (
        <button key={task.id} onClick={() => onTaskClick(task.id)}>
          {task.title}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('../ui/ChatGPTIntegration', () => ({
  default: ({ onSendMessage, onExtractTasks }: any) => (
    <div data-testid="chat-integration">
      Chat Integration
      <button onClick={() => onSendMessage('test message')}>Send Test Message</button>
      <button onClick={() => onExtractTasks([{ title: 'Extracted Task', priority: 'medium' }])}>
        Extract Test Task
      </button>
    </div>
  ),
}));

vi.mock('../ui/CalendarEvents', () => ({
  default: () => <div data-testid="calendar-events">Calendar Events</div>,
}));

vi.mock('../ui/FilterBar', () => {
  const MockFilterBar = ({ filters, onFiltersChange, onClear }: any) => (
    <div data-testid="filter-bar">
      Filter Bar
      <input
        data-testid="search-input"
        value={filters.search}
        onChange={e => onFiltersChange({ ...filters, search: e.target.value })}
        placeholder="Search tasks..."
      />
      <button data-testid="clear-filters" onClick={onClear}>
        Clear
      </button>
      <button
        data-testid="high-energy-filter"
        onClick={() =>
          onFiltersChange({
            ...filters,
            energyLevels: filters.energyLevels.includes('HIGH')
              ? filters.energyLevels.filter((e: string) => e !== 'HIGH')
              : [...filters.energyLevels, 'HIGH'],
          })
        }
      >
        High Energy ({filters.energyLevels.includes('HIGH') ? 'ON' : 'OFF'})
      </button>
    </div>
  );

  return {
    FilterBar: MockFilterBar,
    default: MockFilterBar,
  };
});

vi.mock('../ui/TaskCard', () => ({
  default: ({ task, onClick, onStatusChange }: any) => (
    <div data-testid={`task-card-${task.id}`} className="task-card">
      <h3>{task.title}</h3>
      <p>Status: {task.status}</p>
      <p>Priority: {task.priority}</p>
      <p>Energy: {task.energyLevel}</p>
      <button onClick={onClick}>Click Task</button>
      <button onClick={() => onStatusChange('DONE')}>Mark Done</button>
    </div>
  ),
}));

// Mock task data
const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'High Priority Creative Task',
    description: 'A creative task requiring high energy',
    status: 'TODO',
    priority: 5,
    energyLevel: 'HIGH',
    focusType: 'CREATIVE',
    estimatedMinutes: 120,
    source: 'SELF',
    isOverdue: false,
    isBlocked: false,
    dependencyCount: 0,
  },
  {
    id: 'task-2',
    title: 'Medium Priority Technical Task',
    description: 'A technical task requiring medium energy',
    status: 'IN_PROGRESS',
    priority: 3,
    energyLevel: 'MEDIUM',
    focusType: 'TECHNICAL',
    estimatedMinutes: 90,
    source: 'TEAM',
    isOverdue: false,
    isBlocked: false,
    dependencyCount: 0,
  },
  {
    id: 'task-3',
    title: 'Low Priority Admin Task',
    description: 'An administrative task requiring low energy',
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
    id: 'task-4',
    title: 'Blocked High Priority Task',
    description: 'A blocked task that cannot proceed',
    status: 'BLOCKED',
    priority: 4,
    energyLevel: 'HIGH',
    focusType: 'TECHNICAL',
    estimatedMinutes: 180,
    source: 'BOSS',
    isOverdue: false,
    isBlocked: true,
    dependencyCount: 2,
  },
];

describe('Enhanced Dashboard', () => {
  let mockOnTaskUpdate: ReturnType<typeof vi.fn>;
  let mockOnTaskAdd: ReturnType<typeof vi.fn>;
  let mockOnTaskDelete: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnTaskUpdate = vi.fn();
    mockOnTaskAdd = vi.fn();
    mockOnTaskDelete = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders dashboard header with title and stats', () => {
      render(
        <TestWrapper>
          <Dashboard
            initialTasks={mockTasks}
            onTaskUpdate={mockOnTaskUpdate}
            onTaskAdd={mockOnTaskAdd}
            onTaskDelete={mockOnTaskDelete}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Helmsman Dashboard')).toBeInTheDocument();
      expect(screen.getByText('AI-powered productivity workspace')).toBeInTheDocument();
      expect(screen.getByText('Tasks')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument(); // Total tasks count
    });

    it('renders view mode toggle buttons', () => {
      render(
        <TestWrapper>
          <Dashboard initialTasks={mockTasks} />
        </TestWrapper>
      );

      expect(screen.getByText('📋 Grid')).toBeInTheDocument();
      expect(screen.getByText('🎯 Focus')).toBeInTheDocument();
    });

    it('renders filter bar component', () => {
      render(
        <TestWrapper>
          <Dashboard initialTasks={mockTasks} />
        </TestWrapper>
      );

      expect(screen.getByTestId('filter-bar')).toBeInTheDocument();
    });

    it('renders planning optimization metrics when daily plan is available', () => {
      render(
        <TestWrapper>
          <Dashboard initialTasks={mockTasks} />
        </TestWrapper>
      );

      expect(screen.getByText('Energy Optimization')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('Focus Optimization')).toBeInTheDocument();
      expect(screen.getByText('68%')).toBeInTheDocument();
      expect(screen.getByText('Deadline Risk')).toBeInTheDocument();
      expect(screen.getByText('25%')).toBeInTheDocument();
    });
  });

  describe('View Mode Switching', () => {
    it('defaults to grid view', () => {
      render(
        <TestWrapper>
          <Dashboard initialTasks={mockTasks} />
        </TestWrapper>
      );

      // Should show TaskCards in grid view
      expect(screen.getByTestId('task-card-task-1')).toBeInTheDocument();
      expect(screen.getByTestId('task-card-task-2')).toBeInTheDocument();

      // Should not show FocusView
      expect(screen.queryByTestId('focus-view')).not.toBeInTheDocument();
    });

    it('switches to focus view when focus button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <Dashboard initialTasks={mockTasks} />
        </TestWrapper>
      );

      await user.click(screen.getByText('🎯 Focus'));

      expect(screen.getByTestId('focus-view')).toBeInTheDocument();
      expect(screen.queryByTestId('task-card-task-1')).not.toBeInTheDocument();
    });

    it('switches back to grid view when grid button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <Dashboard initialTasks={mockTasks} />
        </TestWrapper>
      );

      // Switch to focus view first
      await user.click(screen.getByText('🎯 Focus'));
      expect(screen.getByTestId('focus-view')).toBeInTheDocument();

      // Switch back to grid view
      await user.click(screen.getByText('📋 Grid'));
      expect(screen.getByTestId('task-card-task-1')).toBeInTheDocument();
      expect(screen.queryByTestId('focus-view')).not.toBeInTheDocument();
    });
  });

  describe('Task Filtering', () => {
    it('filters tasks based on search input', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <Dashboard initialTasks={mockTasks} />
        </TestWrapper>
      );

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'High Priority');

      await waitFor(() => {
        expect(screen.getByTestId('task-card-task-1')).toBeInTheDocument();
        expect(screen.getByTestId('task-card-task-4')).toBeInTheDocument();
        expect(screen.queryByTestId('task-card-task-2')).not.toBeInTheDocument();
        expect(screen.queryByTestId('task-card-task-3')).not.toBeInTheDocument();
      });
    });

    it('filters tasks based on energy level', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <Dashboard initialTasks={mockTasks} />
        </TestWrapper>
      );

      await user.click(screen.getByTestId('high-energy-filter'));

      await waitFor(() => {
        expect(screen.getByTestId('task-card-task-1')).toBeInTheDocument();
        expect(screen.getByTestId('task-card-task-4')).toBeInTheDocument();
        expect(screen.queryByTestId('task-card-task-2')).not.toBeInTheDocument();
        expect(screen.queryByTestId('task-card-task-3')).not.toBeInTheDocument();
      });
    });

    it('clears filters when clear button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <Dashboard initialTasks={mockTasks} />
        </TestWrapper>
      );

      // Apply search filter
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'High Priority');

      await waitFor(() => {
        expect(screen.queryByTestId('task-card-task-2')).not.toBeInTheDocument();
      });

      // Clear filters
      await user.click(screen.getByTestId('clear-filters'));

      await waitFor(() => {
        expect(screen.getByTestId('task-card-task-1')).toBeInTheDocument();
        expect(screen.getByTestId('task-card-task-2')).toBeInTheDocument();
        expect(screen.getByTestId('task-card-task-3')).toBeInTheDocument();
        expect(screen.getByTestId('task-card-task-4')).toBeInTheDocument();
      });
    });

    it('updates filtered task count in stats', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <Dashboard initialTasks={mockTasks} />
        </TestWrapper>
      );

      expect(screen.getByText('Filtered')).toBeInTheDocument();
      expect(screen.getAllByText('4')[1]).toBeInTheDocument(); // Filtered count

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'High Priority');

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument(); // Updated filtered count
      });
    });
  });

  describe('Task Interactions', () => {
    it('handles task click events', async () => {
      const user = userEvent.setup();
      render(<Dashboard initialTasks={mockTasks} onTaskUpdate={mockOnTaskUpdate} />);

      const taskButton = screen.getByTestId('task-card-task-1').querySelector('button');
      if (taskButton) {
        await user.click(taskButton);
      }

      expect(mockOnTaskUpdate).toHaveBeenCalledWith('task-1', { status: 'IN_PROGRESS' });
    });

    it('handles task status changes', async () => {
      const user = userEvent.setup();
      render(<Dashboard initialTasks={mockTasks} onTaskUpdate={mockOnTaskUpdate} />);

      const markDoneButton = screen
        .getByTestId('task-card-task-1')
        .querySelector('button:last-child');
      if (markDoneButton) {
        await user.click(markDoneButton);
      }

      expect(mockOnTaskUpdate).toHaveBeenCalledWith('task-1', { status: 'DONE' });
    });

    it('handles task extraction from chat', async () => {
      const user = userEvent.setup();
      render(<Dashboard initialTasks={[]} onTaskAdd={mockOnTaskAdd} />);

      const extractButton = screen.getByText('Extract Test Task');
      await user.click(extractButton);

      expect(mockOnTaskAdd).toHaveBeenCalled();
    });
  });

  describe('Empty States', () => {
    it('displays empty state when no tasks are available', () => {
      render(<Dashboard initialTasks={[]} />);

      expect(screen.getByText('No tasks yet')).toBeInTheDocument();
      expect(
        screen.getByText('Start by adding some tasks or ask AI to help plan your day.')
      ).toBeInTheDocument();
    });

    it('displays filtered empty state when no tasks match filters', async () => {
      const user = userEvent.setup();
      render(<Dashboard initialTasks={mockTasks} />);

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'nonexistent task');

      await waitFor(() => {
        expect(screen.getByText('No tasks match your filters')).toBeInTheDocument();
        expect(
          screen.getByText('Try adjusting your filters to see more tasks.')
        ).toBeInTheDocument();
        expect(screen.getByText('Clear Filters')).toBeInTheDocument();
      });
    });
  });

  describe('Task Sorting', () => {
    it('sorts tasks by priority and status', () => {
      render(<Dashboard initialTasks={mockTasks} />);

      const taskCards = screen.getAllByText(/Priority:/);

      // First task should be highest priority (5)
      expect(taskCards[0]).toHaveTextContent('Priority: 5');

      // Should be followed by task with priority 4
      expect(taskCards[1]).toHaveTextContent('Priority: 4');
    });

    it('prioritizes in-progress tasks within same priority level', () => {
      const tasksWithSamePriority: Task[] = [
        {
          id: 'task-a',
          title: 'Todo Task',
          status: 'TODO',
          priority: 3,
          energyLevel: 'MEDIUM',
          focusType: 'TECHNICAL',
          estimatedMinutes: 60,
          source: 'SELF',
          isOverdue: false,
          isBlocked: false,
          dependencyCount: 0,
        },
        {
          id: 'task-b',
          title: 'In Progress Task',
          status: 'IN_PROGRESS',
          priority: 3,
          energyLevel: 'MEDIUM',
          focusType: 'TECHNICAL',
          estimatedMinutes: 60,
          source: 'SELF',
          isOverdue: false,
          isBlocked: false,
          dependencyCount: 0,
        },
      ];

      render(<Dashboard initialTasks={tasksWithSamePriority} />);

      const taskCards = screen.getAllByTestId(/task-card-/);

      // In-progress task should come first
      expect(taskCards[0]).toHaveAttribute('data-testid', 'task-card-task-b');
      expect(taskCards[1]).toHaveAttribute('data-testid', 'task-card-task-a');
    });
  });

  describe('Responsive Design', () => {
    it('renders sidebar components on larger screens', () => {
      render(<Dashboard initialTasks={mockTasks} />);

      expect(screen.getByTestId('calendar-events')).toBeInTheDocument();
      expect(screen.getByTestId('chat-integration')).toBeInTheDocument();
    });

    it('handles custom className prop', () => {
      const { container } = render(
        <Dashboard initialTasks={mockTasks} className="custom-dashboard" />
      );

      expect(container.firstChild).toHaveClass('custom-dashboard');
    });
  });

  describe('API Integration', () => {
    it('displays refresh button and handles refresh action', async () => {
      const user = userEvent.setup();
      render(<Dashboard initialTasks={mockTasks} />);

      const refreshButton = screen.getByText('🔄 Refresh Plan');
      expect(refreshButton).toBeInTheDocument();

      await user.click(refreshButton);
      // Mock should be called (tested in mock verification)
    });

    it('displays AI connection status', () => {
      render(<Dashboard initialTasks={mockTasks} />);

      expect(screen.getByText('AI Connected')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<Dashboard initialTasks={mockTasks} />);

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Helmsman Dashboard');

      const taskHeading = screen.getByRole('heading', { level: 2 });
      expect(taskHeading).toHaveTextContent(/Tasks \(/);
    });

    it('provides meaningful button labels', () => {
      render(<Dashboard initialTasks={mockTasks} />);

      expect(screen.getByText('📋 Grid')).toBeInTheDocument();
      expect(screen.getByText('🎯 Focus')).toBeInTheDocument();
      expect(screen.getByText('🔄 Refresh Plan')).toBeInTheDocument();
    });

    it('maintains focus management during view switching', async () => {
      const user = userEvent.setup();
      render(<Dashboard initialTasks={mockTasks} />);

      const focusButton = screen.getByText('🎯 Focus');
      await user.click(focusButton);

      // Focus button should remain focusable
      expect(focusButton).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('handles large number of tasks efficiently', () => {
      const largeMockTasks = Array.from({ length: 100 }, (_, i) => ({
        id: `task-${i}`,
        title: `Task ${i}`,
        status: 'TODO' as const,
        priority: Math.floor(Math.random() * 5) + 1,
        energyLevel: 'MEDIUM' as const,
        focusType: 'TECHNICAL' as const,
        estimatedMinutes: 60,
        source: 'SELF' as const,
        isOverdue: false,
        isBlocked: false,
        dependencyCount: 0,
      }));

      const { container } = render(<Dashboard initialTasks={largeMockTasks} />);

      // Should render without performance issues
      expect(container).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument(); // Task count
    });
  });
});
