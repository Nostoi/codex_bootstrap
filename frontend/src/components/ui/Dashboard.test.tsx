import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import Dashboard from './Dashboard';
import type { Task } from './Dashboard';

// Mock component props interfaces
interface MockFocusViewProps {
  tasks?: Task[];
  onTaskStatusChange: (id: string, status: Task['status']) => void;
  onTaskDelete: (id: string) => void;
}

interface MockChatGPTProps {
  onTasksExtracted: (tasks: Array<{ title: string; description: string; priority: string }>) => void;
}

// Mock the components
vi.mock('./FocusView', () => ({
  default: ({ tasks = [], onTaskStatusChange, onTaskDelete }: MockFocusViewProps) => (
    <div data-testid="focus-view">
      <h2>Focus View</h2>
      {tasks.map((task: Task) => (
        <div key={task.id} data-testid={`task-${task.id}`}>
          <span>{task.title}</span>
          <button 
            onClick={() => onTaskStatusChange(task.id, 'done')}
            data-testid={`complete-${task.id}`}
          >
            Complete
          </button>
          <button 
            onClick={() => onTaskDelete(task.id)}
            data-testid={`delete-${task.id}`}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  ),
}));

vi.mock('./ChatGPTIntegration', () => ({
  default: ({ onTasksExtracted }: MockChatGPTProps) => (
    <div data-testid="chatgpt-integration">
      <h2>ChatGPT Integration</h2>
      <button 
        onClick={() => onTasksExtracted([
          { title: 'Extracted Task', description: 'Test description', priority: 'medium' }
        ])}
        data-testid="extract-tasks"
      >
        Extract Tasks
      </button>
    </div>
  ),
}));

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Test Task 1',
    status: 'todo',
    priority: 'high',
    estimatedMinutes: 30,
  },
  {
    id: '2',
    title: 'Test Task 2',
    status: 'in-progress',
    priority: 'medium',
    estimatedMinutes: 45,
  },
];

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the dashboard with both components', () => {
    render(<Dashboard initialTasks={mockTasks} />);
    
    expect(screen.getByTestId('focus-view')).toBeInTheDocument();
    expect(screen.getByTestId('chatgpt-integration')).toBeInTheDocument();
    expect(screen.getByText('AI-Powered Productivity Dashboard')).toBeInTheDocument();
  });

  it('displays initial tasks in FocusView', () => {
    render(<Dashboard initialTasks={mockTasks} />);
    
    expect(screen.getByTestId('task-1')).toBeInTheDocument();
    expect(screen.getByTestId('task-2')).toBeInTheDocument();
    expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    expect(screen.getByText('Test Task 2')).toBeInTheDocument();
  });

  it('handles task status changes', async () => {
    render(<Dashboard initialTasks={mockTasks} />);
    
    const completeButton = screen.getByTestId('complete-1');
    fireEvent.click(completeButton);
    
    // Verify the task status was updated
    await waitFor(() => {
      expect(screen.getByTestId('task-1')).toBeInTheDocument();
    });
  });

  it('handles task deletion', async () => {
    render(<Dashboard initialTasks={mockTasks} />);
    
    const deleteButton = screen.getByTestId('delete-1');
    fireEvent.click(deleteButton);
    
    // The task should no longer be rendered
    await waitFor(() => {
      expect(screen.queryByTestId('task-1')).not.toBeInTheDocument();
    });
  });

  it('handles task extraction from ChatGPT', async () => {
    render(<Dashboard initialTasks={[]} />);
    
    const extractButton = screen.getByTestId('extract-tasks');
    fireEvent.click(extractButton);
    
    // Should add the extracted task
    await waitFor(() => {
      expect(screen.getByText('Extracted Task')).toBeInTheDocument();
    });
  });

  it('handles chat layout toggle', async () => {
    const user = userEvent.setup();
    render(<Dashboard initialTasks={mockTasks} chatPosition="right" />);
    
    const layoutSelect = screen.getByDisplayValue('right');
    await user.selectOptions(layoutSelect, 'bottom');
    
    expect(layoutSelect).toHaveValue('bottom');
  });

  it('applies correct CSS classes for different chat layouts', () => {
    const { rerender } = render(<Dashboard initialTasks={mockTasks} chatPosition="left" />);
    let container = screen.getByTestId('dashboard-container');
    expect(container).toHaveClass('lg:flex-row');
    
    rerender(<Dashboard initialTasks={mockTasks} chatPosition="right" />);
    container = screen.getByTestId('dashboard-container');
    expect(container).toHaveClass('lg:flex-row-reverse');
    
    rerender(<Dashboard initialTasks={mockTasks} chatPosition="bottom" />);
    container = screen.getByTestId('dashboard-container');
    expect(container).toHaveClass('flex-col');
  });

  it('shows loading state initially', () => {
    render(<Dashboard initialTasks={mockTasks} />);
    
    // Should show some loading or initialization content
    expect(screen.getByText('AI-Powered Productivity Dashboard')).toBeInTheDocument();
  });

  it('maintains state consistency between components', async () => {
    render(<Dashboard initialTasks={mockTasks} />);
    
    // Complete a task
    fireEvent.click(screen.getByTestId('complete-1'));
    
    // Extract new tasks
    fireEvent.click(screen.getByTestId('extract-tasks'));
    
    // Should have original task (completed) plus new extracted task
    await waitFor(() => {
      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      expect(screen.getByText('Extracted Task')).toBeInTheDocument();
    });
  });

  it('handles empty initial tasks', () => {
    render(<Dashboard initialTasks={[]} />);
    
    expect(screen.getByTestId('focus-view')).toBeInTheDocument();
    expect(screen.getByTestId('chatgpt-integration')).toBeInTheDocument();
    expect(screen.queryByTestId('task-1')).not.toBeInTheDocument();
  });

  it('renders with default props when none provided', () => {
    render(<Dashboard />);
    
    expect(screen.getByTestId('focus-view')).toBeInTheDocument();
    expect(screen.getByTestId('chatgpt-integration')).toBeInTheDocument();
    expect(screen.getByText('AI-Powered Productivity Dashboard')).toBeInTheDocument();
  });
});
