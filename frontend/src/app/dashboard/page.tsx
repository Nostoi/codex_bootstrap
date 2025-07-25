import TaskList, { Task } from '@/components/TaskList'

const sampleTasks: Task[] = [
  { id: 1, title: 'Set up project', completed: true },
  { id: 2, title: 'Connect backend API', completed: false },
  { id: 3, title: 'Write documentation', completed: false },
]

export default function DashboardPage() {
  return (
    <main className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <TaskList tasks={sampleTasks} />
    </main>
  )
}
