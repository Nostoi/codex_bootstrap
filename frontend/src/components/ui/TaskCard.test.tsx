import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { vi } from 'vitest';
import TaskCard, { EnhancedTask } from './TaskCard';

// Extend expect with accessibility matchers
expect.extend(toHaveNoViolations);

// Mock task data for testing
const mockTask: EnhancedTask = {
  id: 'test-task-1',
  title: 'Test Task Title',
  description: 'This is a test task description for testing purposes.',
  status: 'TODO',
  energyLevel: 'MEDIUM',
  focusType: 'TECHNICAL',
  priority: 3,
  estimatedMinutes: 60,
  source: 'SELF',
};

const mockTaskWithAllMetadata: EnhancedTask = {
  ...mockTask,
  softDeadline: '2025-08-01T10:00:00Z',
  hardDeadline: '2025-08-03T17:00:00Z',
  aiSuggestion: 'This task could benefit from breaking into smaller subtasks.',
  isBlocked: false,
  dependencyCount: 2,
  isOverdue: false,
};

const mockBlockedTask: EnhancedTask = {
  ...mockTask,
  title: 'Blocked Task',
  status: 'BLOCKED',
  isBlocked: true,
  dependencyCount: 1,
};

const mockOverdueTask: EnhancedTask = {
  ...mockTask,
  title: 'Overdue Task',
  hardDeadline: '2025-07-25T17:00:00Z', // Past date
  isOverdue: true,
};

describe('TaskCard Component', () => {
  describe('Basic Rendering', () => {
    it('renders task title and status correctly', () => {
      render(<TaskCard task={mockTask} />);

      expect(screen.getByText('Test Task Title')).toBeInTheDocument();
      expect(screen.getByText('To Do')).toBeInTheDocument();
    });

    it('renders task description when provided', () => {
      render(<TaskCard task={mockTask} />);

      expect(
        screen.getByText('This is a test task description for testing purposes.')
      ).toBeInTheDocument();
    });

    it('renders minimal task without optional metadata', () => {
      const minimalTask: EnhancedTask = {
        id: 'minimal',
        title: 'Minimal Task',
        status: 'TODO',
      };

      render(<TaskCard task={minimalTask} />);

      expect(screen.getByText('Minimal Task')).toBeInTheDocument();
      expect(screen.getByText('To Do')).toBeInTheDocument();
    });
  });

  describe('Metadata Display', () => {
    it('displays energy level badge with correct styling', () => {
      render(<TaskCard task={mockTask} />);

      const energyBadge = screen.getByText('Medium Energy');
      expect(energyBadge).toBeInTheDocument();
      expect(energyBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });

    it('displays focus type with correct icon', () => {
      render(<TaskCard task={mockTask} />);

      // Look for the technical focus badge that contains both icon and text
      const focusBadge = screen.getByText('Technical');
      expect(focusBadge).toBeInTheDocument();

      // The icon should be within the same element, not a sibling
      const badgeContainer = focusBadge.closest('span');
      expect(badgeContainer).toHaveTextContent('⚙️Technical');
    });

    it('displays high priority indicator for priority >= 4', () => {
      const highPriorityTask = { ...mockTask, priority: 5 };
      render(<TaskCard task={highPriorityTask} />);

      expect(screen.getByText('🔥 High Priority')).toBeInTheDocument();
    });

    it('does not display priority indicator for priority <= 3', () => {
      render(<TaskCard task={mockTask} />);

      expect(screen.queryByText('🔥 High Priority')).not.toBeInTheDocument();
    });

    it('displays estimated time when provided', () => {
      render(<TaskCard task={mockTask} />);

      expect(screen.getByText('60m')).toBeInTheDocument();
    });

    it('displays task source indicator', () => {
      const bossTask = { ...mockTask, source: 'BOSS' as const };
      render(<TaskCard task={bossTask} />);

      expect(screen.getByText('From Boss')).toBeInTheDocument();
    });
  });

  describe('Deadline and Urgency', () => {
    it('displays hard deadline with proper formatting', () => {
      render(<TaskCard task={mockTaskWithAllMetadata} />);

      expect(screen.getByText(/Due:/)).toBeInTheDocument();
    });

    it('applies urgent styling for overdue tasks', () => {
      render(<TaskCard task={mockOverdueTask} />);

      const deadlineElement = screen.getByText(/Due:/);
      expect(deadlineElement).toHaveClass('text-red-600', 'font-semibold');
    });

    it('displays soft deadline when no hard deadline exists', () => {
      const softDeadlineTask = {
        ...mockTask,
        softDeadline: '2025-08-01T10:00:00Z',
      };
      render(<TaskCard task={softDeadlineTask} />);

      expect(screen.getByText(/Target:/)).toBeInTheDocument();
    });
  });

  describe('AI Suggestions and Dependencies', () => {
    it('displays AI suggestion callout', () => {
      render(<TaskCard task={mockTaskWithAllMetadata} />);

      expect(
        screen.getByText('This task could benefit from breaking into smaller subtasks.')
      ).toBeInTheDocument();
    });

    it('displays blocked status indicator', () => {
      render(<TaskCard task={mockBlockedTask} />);

      expect(screen.getByText('🚫 Blocked')).toBeInTheDocument();
    });

    it('displays dependency count', () => {
      render(<TaskCard task={mockTaskWithAllMetadata} />);

      expect(screen.getByText('🔗 2 dependencies')).toBeInTheDocument();
    });
  });

  describe('Interactive Features', () => {
    it('calls onClick when card is clicked', () => {
      const mockOnClick = vi.fn();
      render(<TaskCard task={mockTask} onClick={mockOnClick} />);

      fireEvent.click(screen.getByRole('button'));
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('calls onStatusChange when complete button is clicked', () => {
      const mockOnStatusChange = vi.fn();
      const inProgressTask = { ...mockTask, status: 'IN_PROGRESS' as const };

      render(<TaskCard task={inProgressTask} onStatusChange={mockOnStatusChange} />);

      const completeButton = screen.getByText('Complete');
      fireEvent.click(completeButton);

      expect(mockOnStatusChange).toHaveBeenCalledWith('DONE');
    });

    it('calls onQuickStart when start button is clicked', () => {
      const mockOnQuickStart = vi.fn();

      render(<TaskCard task={mockTask} onQuickStart={mockOnQuickStart} />);

      const startButton = screen.getByText('Start');
      fireEvent.click(startButton);

      expect(mockOnQuickStart).toHaveBeenCalledTimes(1);
    });

    it('calls onEdit when edit button is clicked', () => {
      const mockOnEdit = vi.fn();

      render(<TaskCard task={mockTask} onEdit={mockOnEdit} />);

      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('prevents event propagation for action buttons', () => {
      const mockOnClick = vi.fn();
      const mockOnEdit = vi.fn();

      render(<TaskCard task={mockTask} onClick={mockOnClick} onEdit={mockOnEdit} />);

      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe('Compact Mode', () => {
    it('applies compact styling and hides description', () => {
      render(<TaskCard task={mockTaskWithAllMetadata} compact />);

      // Description should not be visible in compact mode
      expect(
        screen.queryByText('This is a test task description for testing purposes.')
      ).not.toBeInTheDocument();

      // Title should still be visible
      expect(screen.getByText('Test Task Title')).toBeInTheDocument();
    });

    it('hides AI suggestion in compact mode', () => {
      render(<TaskCard task={mockTaskWithAllMetadata} compact />);

      expect(
        screen.queryByText('This task could benefit from breaking into smaller subtasks.')
      ).not.toBeInTheDocument();
    });
  });

  describe('Non-Interactive Mode', () => {
    it('renders as article when interactive is false', () => {
      render(<TaskCard task={mockTask} interactive={false} />);

      const card = screen.getByRole('article');
      expect(card).toBeInTheDocument();
      expect(card).toHaveAttribute('tabIndex', '-1');
    });

    it('does not render action buttons when interactive is false', () => {
      render(<TaskCard task={mockTask} interactive={false} onEdit={vi.fn()} />);

      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<TaskCard task={mockTaskWithAllMetadata} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('provides comprehensive ARIA label', () => {
      render(<TaskCard task={mockTaskWithAllMetadata} />);

      const card = screen.getByRole('button');
      const ariaLabel = card.getAttribute('aria-label');

      expect(ariaLabel).toContain('Task: Test Task Title');
      expect(ariaLabel).toContain('Status: To Do');
      expect(ariaLabel).toContain('Energy: Medium Energy');
      expect(ariaLabel).toContain('Focus: Technical');
      expect(ariaLabel).toContain('Priority: 3 out of 5');
      expect(ariaLabel).toContain('Estimated: 60 minutes');
      expect(ariaLabel).toContain('Has 2 dependencies');
    });

    it('includes blocked status in ARIA label', () => {
      render(<TaskCard task={mockBlockedTask} />);

      const card = screen.getByRole('button');
      const ariaLabel = card.getAttribute('aria-label');

      expect(ariaLabel).toContain('Currently blocked');
    });

    it('supports keyboard navigation', () => {
      const mockOnClick = vi.fn();
      render(<TaskCard task={mockTask} onClick={mockOnClick} />);

      const card = screen.getByRole('button');

      // Test Enter key
      fireEvent.keyDown(card, { key: 'Enter' });
      expect(mockOnClick).toHaveBeenCalledTimes(1);

      // Test Space key
      fireEvent.keyDown(card, { key: ' ' });
      expect(mockOnClick).toHaveBeenCalledTimes(2);
    });

    it('has proper focus indicators', () => {
      render(<TaskCard task={mockTask} />);

      const card = screen.getByRole('button');
      expect(card).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500');
    });

    it('has appropriate tabIndex for interactive mode', () => {
      render(<TaskCard task={mockTask} interactive />);

      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('action buttons have proper focus management', () => {
      render(<TaskCard task={mockTask} onEdit={vi.fn()} />);

      const editButton = screen.getByText('Edit');
      expect(editButton).toHaveClass('focus:outline-none', 'focus:ring-2');
    });
  });

  describe('Visual Priority Indicators', () => {
    it('applies heavy border for high priority tasks', () => {
      const highPriorityTask = { ...mockTask, priority: 5 };
      const { container } = render(<TaskCard task={highPriorityTask} />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('border-l-8');
    });

    it('applies medium border for medium priority tasks', () => {
      const mediumPriorityTask = { ...mockTask, priority: 3 };
      const { container } = render(<TaskCard task={mediumPriorityTask} />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('border-l-6');
    });

    it('applies light border for low priority tasks', () => {
      const lowPriorityTask = { ...mockTask, priority: 1 };
      const { container } = render(<TaskCard task={lowPriorityTask} />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('border-l-4');
    });
  });

  describe('Status-Based Styling', () => {
    it('applies correct styling for TODO status', () => {
      const { container } = render(<TaskCard task={mockTask} />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('border-l-gray-400', 'bg-gray-50');
    });

    it('applies correct styling for IN_PROGRESS status', () => {
      const inProgressTask = { ...mockTask, status: 'IN_PROGRESS' as const };
      const { container } = render(<TaskCard task={inProgressTask} />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('border-l-blue-500', 'bg-blue-50');
    });

    it('applies correct styling for BLOCKED status', () => {
      const { container } = render(<TaskCard task={mockBlockedTask} />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('border-l-red-500', 'bg-red-50');
    });

    it('applies correct styling for DONE status', () => {
      const doneTask = { ...mockTask, status: 'DONE' as const };
      const { container } = render(<TaskCard task={doneTask} />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('border-l-green-500', 'bg-green-50');
    });
  });
});
