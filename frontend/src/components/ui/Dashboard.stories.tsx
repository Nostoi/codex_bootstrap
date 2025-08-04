import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import Dashboard from './Dashboard';
import type { DashboardProps, Task } from './Dashboard';

const meta: Meta<typeof Dashboard> = {
  title: 'UI/Dashboard',
  component: Dashboard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Complete AI-powered productivity dashboard combining FocusView and ChatGPT Integration for seamless task management and AI assistance.',
      },
    },
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'keyboard-navigation', enabled: true },
          { id: 'focus-management', enabled: true },
        ],
      },
    },
  },
  argTypes: {
    initialTasks: {
      description: 'Initial task list for the dashboard',
      control: { type: 'object' },
    },
    onTaskUpdate: {
      description: 'Callback when a task is updated',
      action: 'task updated',
    },
    onTaskAdd: {
      description: 'Callback when a task is added',
      action: 'task added',
    },
    onTaskDelete: {
      description: 'Callback when a task is deleted',
      action: 'task deleted',
    },
    layout: {
      description: 'Dashboard layout orientation',
      control: { type: 'select' },
      options: ['horizontal', 'vertical'],
    },
    chatPosition: {
      description: 'Position of the chat interface',
      control: { type: 'select' },
      options: ['left', 'right', 'bottom'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Dashboard>;

const sampleTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Complete quarterly business review',
    status: 'IN_PROGRESS',
    priority: 5,
    dueDate: '2025-07-28',
    estimatedMinutes: 180,
  },
  {
    id: 'task-2',
    title: 'Review AI integration proposal',
    status: 'TODO',
    priority: 5,
    dueDate: '2025-07-27',
    estimatedMinutes: 90,
  },
  {
    id: 'task-3',
    title: 'Update team on project progress',
    status: 'TODO',
    priority: 3,
    estimatedMinutes: 30,
  },
  {
    id: 'task-4',
    title: 'Research competitor analysis',
    status: 'TODO',
    priority: 3,
    estimatedMinutes: 120,
  },
  {
    id: 'task-5',
    title: 'Organize workspace documentation',
    status: 'DONE',
    priority: 2,
    estimatedMinutes: 45,
  },
];

const emptyTasks: Task[] = [];

const largeTasks: Task[] = [
  ...sampleTasks,
  {
    id: 'task-6',
    title: 'Prepare client presentation',
    status: 'TODO',
    priority: 5,
    dueDate: '2025-07-29',
    estimatedMinutes: 150,
  },
  {
    id: 'task-7',
    title: 'Code review for new features',
    status: 'IN_PROGRESS',
    priority: 3,
    estimatedMinutes: 60,
  },
  {
    id: 'task-8',
    title: 'Budget planning for next quarter',
    status: 'TODO',
    priority: 5,
    dueDate: '2025-07-30',
    estimatedMinutes: 120,
  },
  {
    id: 'task-9',
    title: 'Team retrospective meeting',
    status: 'TODO',
    priority: 2,
    estimatedMinutes: 60,
  },
];

// Mock handlers
const mockHandlers = {
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => {
    console.log('Task updated:', taskId, updates);
  },
  onTaskAdd: (task: Omit<Task, 'id'>) => {
    console.log('Task added:', task);
  },
  onTaskDelete: (taskId: string) => {
    console.log('Task deleted:', taskId);
  },
};

export const Default: Story = {
  args: {
    initialTasks: sampleTasks,
    layout: 'horizontal',
    chatPosition: 'right',
    ...mockHandlers,
  },
};

export const EmptyState: Story = {
  args: {
    initialTasks: emptyTasks,
    layout: 'horizontal',
    chatPosition: 'right',
    ...mockHandlers,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Dashboard with no tasks - shows empty state and encourages user to add tasks through AI chat.',
      },
    },
  },
};

export const VerticalLayout: Story = {
  args: {
    initialTasks: sampleTasks,
    layout: 'vertical',
    chatPosition: 'bottom',
    ...mockHandlers,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Vertical layout with chat positioned at the bottom - ideal for mobile or portrait screens.',
      },
    },
  },
};

export const ChatOnLeft: Story = {
  args: {
    initialTasks: sampleTasks,
    layout: 'horizontal',
    chatPosition: 'left',
    ...mockHandlers,
  },
  parameters: {
    docs: {
      description: {
        story: 'Horizontal layout with chat interface on the left side.',
      },
    },
  },
};

export const ManyTasks: Story = {
  args: {
    initialTasks: largeTasks,
    layout: 'horizontal',
    chatPosition: 'right',
    ...mockHandlers,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Dashboard with many tasks showing how the interface handles larger datasets and scrolling.',
      },
    },
  },
};

export const HighPriorityFocus: Story = {
  args: {
    initialTasks: sampleTasks.map(task => ({
      ...task,
      priority: (task.priority || 3) >= 4 ? 5 : 2,
    })),
    layout: 'horizontal',
    chatPosition: 'right',
    ...mockHandlers,
  },
  parameters: {
    docs: {
      description: {
        story: 'Dashboard emphasizing high-priority tasks with clear visual distinction.',
      },
    },
  },
};

export const CompletedTasksView: Story = {
  args: {
    initialTasks: sampleTasks.map(task => ({
      ...task,
      status: Math.random() > 0.3 ? ('DONE' as const) : task.status,
    })),
    layout: 'horizontal',
    chatPosition: 'right',
    ...mockHandlers,
  },
  parameters: {
    docs: {
      description: {
        story: 'Dashboard showing a productive day with many completed tasks.',
      },
    },
  },
};

export const Interactive: Story = {
  args: {
    initialTasks: sampleTasks,
    layout: 'horizontal',
    chatPosition: 'right',
    ...mockHandlers,
  },
  render: function InteractiveStory(args: DashboardProps) {
    const [tasks, setTasks] = React.useState<Task[]>(args.initialTasks || []);

    const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
      setTasks(prev => prev.map(task => (task.id === taskId ? { ...task, ...updates } : task)));
      args.onTaskUpdate?.(taskId, updates);
    };

    const handleTaskAdd = (newTask: Omit<Task, 'id'>) => {
      const task: Task = {
        ...newTask,
        id: `task-${Date.now()}`,
      };
      setTasks(prev => [...prev, task]);
      args.onTaskAdd?.(newTask);
    };

    const handleTaskDelete = (taskId: string) => {
      setTasks(prev => prev.filter(task => task.id !== taskId));
      args.onTaskDelete?.(taskId);
    };

    return (
      <Dashboard
        {...args}
        initialTasks={tasks}
        onTaskUpdate={handleTaskUpdate}
        onTaskAdd={handleTaskAdd}
        onTaskDelete={handleTaskDelete}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Fully interactive dashboard - try clicking tasks to change status and chatting with AI to extract new tasks!',
      },
    },
  },
};
