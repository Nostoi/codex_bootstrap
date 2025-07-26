import { create } from 'zustand'

export interface Task {
  id: number
  title: string
  completed: boolean
  dueDate: string
}

interface TasksState {
  tasks: Task[]
  addTask: (title: string) => void
  toggleTask: (id: number) => void
  removeTask: (id: number) => void
  setTasks: (tasks: Task[]) => void
}

let nextId = 1

export const useTasksStore = create<TasksState>((set) => ({
  tasks: [],
  addTask: (title) =>
    set((state) => ({
      tasks: [
        ...state.tasks,
        {
          id: nextId++,
          title,
          completed: false,
          dueDate: new Date().toISOString().slice(0, 10),
        },
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
  setTasks: (tasks) => set({ tasks }),
}))
