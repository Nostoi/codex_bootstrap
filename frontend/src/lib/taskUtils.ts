// Task-related utility functions and constants

import { Task } from '@/components/ui/Dashboard';

export const TASK_PRIORITIES = {
  1: { label: 'Very Low', color: 'info', weight: 1 },
  2: { label: 'Low', color: 'info', weight: 2 },
  3: { label: 'Medium', color: 'warning', weight: 3 },
  4: { label: 'High', color: 'error', weight: 4 },
  5: { label: 'Very High', color: 'error', weight: 5 },
} as const;

export const TASK_STATUSES = {
  TODO: { label: 'To Do', color: 'neutral' },
  IN_PROGRESS: { label: 'In Progress', color: 'primary' },
  BLOCKED: { label: 'Blocked', color: 'warning' },
  DONE: { label: 'Done', color: 'success' },
} as const;

/**
 * Sorts tasks by priority and due date
 */
export function sortTasksByPriority(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    // First sort by priority (higher number = higher priority)
    const priorityA = a.priority || 3;
    const priorityB = b.priority || 3;
    const priorityDiff =
      (TASK_PRIORITIES[priorityB as keyof typeof TASK_PRIORITIES]?.weight || 0) -
      (TASK_PRIORITIES[priorityA as keyof typeof TASK_PRIORITIES]?.weight || 0);
    if (priorityDiff !== 0) return priorityDiff;

    // Then by due date (earliest first)
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;

    // Finally by creation order (assuming id order)
    return a.id.localeCompare(b.id);
  });
}

/**
 * Checks if a task is overdue
 */
export function isTaskOverdue(task: Task): boolean {
  if (!task.dueDate) return false;
  return new Date(task.dueDate) < new Date();
}

/**
 * Gets tasks due today
 */
export function getTasksDueToday(tasks: Task[]): Task[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return tasks.filter(task => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    return dueDate >= today && dueDate < tomorrow;
  });
}

/**
 * Calculates task completion percentage
 */
export function calculateTaskProgress(tasks: Task[]): {
  total: number;
  completed: number;
  inProgress: number;
  percentage: number;
} {
  const total = tasks.length;
  const completed = tasks.filter(task => task.status === 'DONE').length;
  const inProgress = tasks.filter(task => task.status === 'IN_PROGRESS').length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, completed, inProgress, percentage };
}

/**
 * Estimates total time for remaining tasks
 */
export function estimateRemainingTime(tasks: Task[]): number {
  return tasks
    .filter(task => task.status !== 'DONE')
    .reduce((total, task) => total + (task.estimatedMinutes || 0), 0);
}

/**
 * Generates a new task ID
 */
export function generateTaskId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Formats time duration in minutes to human-readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

/**
 * Formats date to relative time (e.g., "2 days ago", "in 3 hours")
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const targetDate = new Date(date);
  const diffMs = targetDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 0) return `In ${diffDays} days`;
  return `${Math.abs(diffDays)} days ago`;
}

/**
 * Validates task data
 */
export function validateTask(task: Partial<Task>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!task.title?.trim()) {
    errors.push('Title is required');
  }

  if (task.title && task.title.length > 200) {
    errors.push('Title must be less than 200 characters');
  }

  if (task.priority && !(task.priority in TASK_PRIORITIES)) {
    errors.push('Invalid priority value');
  }

  if (task.status && !(task.status in TASK_STATUSES)) {
    errors.push('Invalid status value');
  }

  if (task.estimatedMinutes && (task.estimatedMinutes < 1 || task.estimatedMinutes > 1440)) {
    errors.push('Estimated time must be between 1 minute and 24 hours');
  }

  if (task.dueDate) {
    const dueDate = new Date(task.dueDate);
    if (isNaN(dueDate.getTime())) {
      errors.push('Invalid due date format');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Creates a default task with sensible defaults
 */
export function createDefaultTask(overrides: Partial<Task> = {}): Task {
  return {
    id: generateTaskId(),
    title: '',
    status: 'TODO',
    priority: 3,
    estimatedMinutes: 30,
    ...overrides,
  };
}

/**
 * Groups tasks by status
 */
export function groupTasksByStatus(tasks: Task[]): Record<Task['status'], Task[]> {
  return tasks.reduce(
    (groups, task) => {
      if (!groups[task.status]) {
        groups[task.status] = [];
      }
      groups[task.status].push(task);
      return groups;
    },
    {} as Record<Task['status'], Task[]>
  );
}

/**
 * Filters tasks by search query
 */
export function filterTasks(tasks: Task[], query: string): Task[] {
  if (!query.trim()) return tasks;

  const lowercaseQuery = query.toLowerCase();
  return tasks.filter(
    task =>
      task.title.toLowerCase().includes(lowercaseQuery) ||
      task.aiSuggestion?.toLowerCase().includes(lowercaseQuery)
  );
}

/**
 * Gets color class for priority
 */
export function getPriorityColor(priority: Task['priority']): string {
  return TASK_PRIORITIES[(priority || 3) as keyof typeof TASK_PRIORITIES]?.color || 'info';
}

/**
 * Gets color class for status
 */
export function getStatusColor(status: Task['status']): string {
  return TASK_STATUSES[status].color;
}
