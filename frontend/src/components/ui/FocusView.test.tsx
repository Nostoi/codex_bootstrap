import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FocusView, { Task } from './FocusView';

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Test task',
    status: 'todo',
    priority: 'high',
    estimatedMinutes: 60,
  },
  {
    id: '2',
    title: 'Completed task',
    status: 'done',
    priority: 'medium',
    estimatedMinutes: 30,
  },
];

describe('FocusView', () => {
  it('renders today\'s date', () => {
    render(<FocusView todaysTasks={mockTasks} />);
    
    const today = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    expect(screen.getByText(today)).toBeInTheDocument();
  });

  it('displays task completion percentage', () => {
    render(<FocusView todaysTasks={mockTasks} />);
    
    // 1 of 2 tasks completed = 50%
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('1 of 2 tasks')).toBeInTheDocument();
  });

  it('shows focus goal input', () => {
    render(<FocusView todaysTasks={mockTasks} />);
    
    const input = screen.getByPlaceholderText(/complete user onboarding feature/i);
    expect(input).toBeInTheDocument();
  });

  it('calls onFocusGoalChange when focus is set', () => {
    const onFocusGoalChange = vi.fn();
    render(
      <FocusView 
        todaysTasks={mockTasks} 
        onFocusGoalChange={onFocusGoalChange}
      />
    );
    
    const input = screen.getByPlaceholderText(/complete user onboarding feature/i);
    const setButton = screen.getByText('Set Focus');
    
    fireEvent.change(input, { target: { value: 'Test focus goal' } });
    fireEvent.click(setButton);
    
    expect(onFocusGoalChange).toHaveBeenCalledWith('Test focus goal');
  });

  it('displays AI recommendation when provided', () => {
    const aiRecommendation = 'Focus on high priority tasks first';
    render(
      <FocusView 
        todaysTasks={mockTasks} 
        aiRecommendation={aiRecommendation}
      />
    );
    
    expect(screen.getByText(aiRecommendation)).toBeInTheDocument();
  });

  it('shows loading state for AI recommendations', () => {
    render(
      <FocusView 
        todaysTasks={mockTasks} 
        isLoadingAI={true}
      />
    );
    
    expect(screen.getByText('Analyzing your tasks...')).toBeInTheDocument();
  });

  it('renders empty state when no tasks', () => {
    render(<FocusView todaysTasks={[]} />);
    
    expect(screen.getByText('No tasks scheduled for today')).toBeInTheDocument();
    expect(screen.getByText('+ Add Your First Task')).toBeInTheDocument();
  });

  it('calls onTaskClick when task is clicked', () => {
    const onTaskClick = vi.fn();
    render(
      <FocusView 
        todaysTasks={mockTasks} 
        onTaskClick={onTaskClick}
      />
    );
    
    const taskButton = screen.getByRole('button', { name: /Task: Test task/i });
    fireEvent.click(taskButton);
    
    expect(onTaskClick).toHaveBeenCalledWith('1');
  });

  it('sorts tasks by priority and status', () => {
    const tasks: Task[] = [
      { id: '1', title: 'Low priority todo', status: 'todo', priority: 'low' },
      { id: '2', title: 'High priority done', status: 'done', priority: 'high' },
      { id: '3', title: 'High priority in-progress', status: 'in-progress', priority: 'high' },
      { id: '4', title: 'Medium priority todo', status: 'todo', priority: 'medium' },
    ];
    
    render(<FocusView todaysTasks={tasks} />);
    
    const taskButtons = screen.getAllByRole('button', { name: /Task:/ });
    
    // Should be sorted: high in-progress, high done, medium todo, low todo
    expect(taskButtons[0]).toHaveAccessibleName(/High priority in-progress/);
    expect(taskButtons[1]).toHaveAccessibleName(/High priority done/);
    expect(taskButtons[2]).toHaveAccessibleName(/Medium priority todo/);
    expect(taskButtons[3]).toHaveAccessibleName(/Low priority todo/);
  });

  it('calculates estimated time correctly', () => {
    render(<FocusView todaysTasks={mockTasks} />);
    
    // Only incomplete tasks: 60 minutes (1 task, other is done)
    expect(screen.getByText('1h')).toBeInTheDocument();
    expect(screen.getByText('0m remaining')).toBeInTheDocument();
  });

  it('displays priority indicators for tasks', () => {
    render(<FocusView todaysTasks={mockTasks} />);
    
    // High priority should show fire emoji
    expect(screen.getByTitle('high priority')).toBeInTheDocument();
    // Medium priority should show lightning emoji  
    expect(screen.getByTitle('medium priority')).toBeInTheDocument();
  });
});
