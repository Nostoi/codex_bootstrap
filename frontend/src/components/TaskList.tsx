import React from 'react'

export interface Task {
  id: number
  title: string
  completed: boolean
}

interface TaskListProps {
  tasks: Task[]
}

export default function TaskList({ tasks }: TaskListProps) {
  return (
    <ul className="space-y-2">
      {tasks.map((task) => (
        <li key={task.id} className="flex items-center gap-2 p-2 rounded bg-base-200">
          <input
            type="checkbox"
            className="checkbox checkbox-primary"
            checked={task.completed}
            readOnly
          />
          <span className={task.completed ? 'line-through' : ''}>{task.title}</span>
        </li>
      ))}
    </ul>
  )
}
