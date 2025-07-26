import { Injectable } from '@nestjs/common'
import { NotificationsGateway } from '../notifications/notifications.gateway'

export interface Task {
  id: number
  title: string
  completed: boolean
  dueDate: string
}

@Injectable()
export class TasksService {
  constructor(private readonly notifications: NotificationsGateway) {}

  private tasks: Task[] = [
    {
      id: 1,
      title: 'Set up project',
      completed: false,
      dueDate: new Date().toISOString().slice(0, 10),
    },
    {
      id: 2,
      title: 'Connect backend API',
      completed: false,
      dueDate: new Date().toISOString().slice(0, 10),
    },
    {
      id: 3,
      title: 'Write documentation',
      completed: false,
      dueDate: new Date().toISOString().slice(0, 10),
    },
  ]
  private nextId = 4

  findAll(): Task[] {
    return this.tasks
  }

  toggle(id: number): Task | undefined {
    const task = this.tasks.find((t) => t.id === id)
    if (task) {
      task.completed = !task.completed
      this.notifications.sendReminder(
        `Task "${task.title}" marked ${task.completed ? 'complete' : 'pending'}`,
      )
    }
    return task
  }
}
