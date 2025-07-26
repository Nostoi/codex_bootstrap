import { create } from 'zustand'

export interface Task {
  id: number
  title: string
  completed: boolean
}

interface TasksState {
  tasks: Task[]
  addTask: (title: string) => void
  toggleTask: (id: number) => void
  removeTask: (id: number) => void
}

let nextId = 1

export const useTasksStore = create<TasksState>((set) => ({
  tasks: [],
  addTask: (title) =>
    set((state) => ({
      tasks: [
        ...state.tasks,
        { id: nextId++, title, completed: false },
      ],
    })),
  toggleTask: (id) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      ),
    })),
  removeTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    })),
}))
