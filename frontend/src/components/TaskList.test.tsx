import { render, screen } from '@testing-library/react';
import TaskList, { Task } from './TaskList';

const tasks: Task[] = [
  { id: 1, title: 'First task', completed: false, dueDate: '2024-01-01' },
  { id: 2, title: 'Second task', completed: true, dueDate: '2024-01-02' },
];

describe('TaskList', () => {
  it('renders provided tasks', () => {
    render(<TaskList tasks={tasks} />);
    expect(screen.getByText('First task')).toBeInTheDocument();
    expect(screen.getByText('Second task')).toBeInTheDocument();
    expect(screen.getByText('2024-01-01')).toBeInTheDocument();
  });
});
