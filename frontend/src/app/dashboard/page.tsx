import { useEffect } from 'react'
import TaskList from '@/components/TaskList'
import { useTasksStore } from '@/store/tasksStore'

const initialTasks = [
  'Set up project',
  'Connect backend API',
  'Write documentation',
]

export default function DashboardPage() {
  const { tasks, addTask, toggleTask } = useTasksStore()

  useEffect(() => {
    if (tasks.length === 0) {
      initialTasks.forEach((t) => addTask(t))
    }
  }, [tasks.length, addTask])

  return (
    <main className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <TaskList tasks={tasks} onToggle={toggleTask} />
    </main>
  )
}
