import { Injectable } from '@nestjs/common'

export interface Task {
  id: number
  title: string
  completed: boolean
}

@Injectable()
export class TasksService {
  private tasks: Task[] = [
    { id: 1, title: 'Set up project', completed: false },
    { id: 2, title: 'Connect backend API', completed: false },
    { id: 3, title: 'Write documentation', completed: false },
  ]
  private nextId = 4

  findAll(): Task[] {
    return this.tasks
  }

  toggle(id: number): Task | undefined {
    const task = this.tasks.find((t) => t.id === id)
    if (task) {
      task.completed = !task.completed
    }
    return task
  }
}
