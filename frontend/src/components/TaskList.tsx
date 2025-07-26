import React from 'react'

export interface Task {
  id: number
  title: string
  completed: boolean
  dueDate: string
}

interface TaskListProps {
  tasks: Task[]
  onToggle?: (id: number) => void
}

export default function TaskList({ tasks, onToggle }: TaskListProps) {
  return (
    <ul className="space-y-2">
      {tasks.map((task) => (
        <li key={task.id} className="flex items-center gap-2 p-2 rounded bg-base-200">
          <input
            type="checkbox"
            className="checkbox checkbox-primary"
            checked={task.completed}
            onChange={() => onToggle?.(task.id)}
          />
          <span className={task.completed ? 'line-through' : ''}>{task.title}</span>
          <span className="badge badge-ghost badge-sm ml-auto">
            {task.completed ? 'Done' : 'Pending'}
          </span>
          <span className="text-xs text-gray-500">{task.dueDate}</span>
        </li>
      ))}
    </ul>
  )
}
