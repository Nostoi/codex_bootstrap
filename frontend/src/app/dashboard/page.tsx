import { useEffect } from 'react'
import TaskList from '@/components/TaskList'
import { useTasksStore } from '@/store/tasksStore'
import { useTasks, useToggleTask } from '@/hooks/useApi'

export default function DashboardPage() {
  const { tasks, setTasks } = useTasksStore()
  const { data } = useTasks()
  const toggleMutation = useToggleTask()

  const today = new Date().toISOString().slice(0, 10)

  const todaysTasks = tasks.filter((t) => t.dueDate === today)

  useEffect(() => {
    if (data) {
      setTasks(data)
    }
  }, [data, setTasks])

  return (
    <main className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <section>
        <h2 className="text-xl font-semibold mb-2">Today&apos;s Plan</h2>
        <TaskList
          tasks={todaysTasks}
          onToggle={(id) => toggleMutation.mutate(id)}
        />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">All Tasks</h2>
        <TaskList
          tasks={tasks}
          onToggle={(id) => toggleMutation.mutate(id)}
        />
      </section>
    </main>
  )
}
