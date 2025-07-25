import { render, screen } from '@testing-library/react'
import TaskList, { Task } from './TaskList'

const tasks: Task[] = [
  { id: 1, title: 'First task', completed: false },
  { id: 2, title: 'Second task', completed: true },
]

describe('TaskList', () => {
  it('renders provided tasks', () => {
    render(<TaskList tasks={tasks} />)
    expect(screen.getByText('First task')).toBeInTheDocument()
    expect(screen.getByText('Second task')).toBeInTheDocument()
  })
})
