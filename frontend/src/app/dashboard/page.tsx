import { useEffect } from 'react'
import TaskList from '@/components/TaskList'
import { useTasksStore } from '@/store/tasksStore'
import { useTasks, useToggleTask } from '@/hooks/useApi'

export default function DashboardPage() {
  const { tasks, setTasks } = useTasksStore()
  const { data } = useTasks()
  const toggleMutation = useToggleTask()

  useEffect(() => {
    if (data) {
      setTasks(data)
    }
  }, [data, setTasks])

  return (
    <main className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <TaskList
        tasks={tasks}
        onToggle={(id) => toggleMutation.mutate(id)}
      />
    </main>
  )
}
