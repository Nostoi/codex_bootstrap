'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Dashboard from '@/components/ui/Dashboard';
import { useTasksStore } from '@/store/tasksStore';
import { useTasks } from '@/hooks/useApi';

export default function DashboardPage() {
  const { tasks, setTasks } = useTasksStore();
  const { data } = useTasks();

  useEffect(() => {
    if (data) {
      setTasks(data);
    }
  }, [data, setTasks]);

  // Convert tasks to the format expected by Dashboard component
  const convertedTasks = tasks.map(task => ({
    id: task.id.toString(),
    title: task.title,
    status: task.completed ? ('DONE' as const) : ('TODO' as const),
    dueDate: task.dueDate,
    priority: 3, // Default priority (medium)
    estimatedMinutes: 30, // Default estimate
  }));

  return (
    <main className="min-h-screen bg-base-100">
      {/* Navigation */}
      <div className="navbar bg-primary text-primary-content">
        <div className="flex-1">
          <Link href="/" className="btn btn-ghost text-xl">
            Codex Bootstrap
          </Link>
        </div>
        <div className="flex-none">
          <ul className="menu menu-horizontal px-1">
            <li>
              <Link href="/dashboard" className="text-accent">
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/projects">Projects</Link>
            </li>
            <li>
              <Link href="/reflection">Reflection</Link>
            </li>
            <li>
              <Link href="/settings">Settings</Link>
            </li>
          </ul>
        </div>
      </div>

      {/* AI-Powered Dashboard */}
      <div className="container mx-auto px-4 py-8">
        <Dashboard
          initialTasks={convertedTasks}
          onTaskUpdate={(taskId: string, updates) => console.log('Task updated:', taskId, updates)}
          onTaskAdd={task => console.log('Create task:', task)}
          onTaskDelete={(taskId: string) => console.log('Delete task:', taskId)}
        />
      </div>
    </main>
  );
}
