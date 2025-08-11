'use client';

import { useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import ResponsiveLayout from '@/components/layout/ResponsiveLayout';
import { useTasksStore } from '@/store/tasksStore';
import { useTasks } from '@/hooks/useApi';
import { Loader2, Brain } from 'lucide-react';

// Lazy load the dashboard for better initial page performance
const Dashboard = dynamic(() => import('@/components/ui/Dashboard'), {
  loading: () => (
    <div className="flex items-center justify-center min-h-[600px] bg-base-100 rounded-lg border border-base-300">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Brain className="w-12 h-12 text-primary" />
          <Loader2 className="w-6 h-6 absolute -top-1 -right-1 animate-spin text-secondary" />
        </div>
        <div className="text-center">
          <p className="text-base-content/70 font-medium">Setting up your ADHD dashboard...</p>
          <p className="text-xs text-base-content/50 mt-1">
            Optimizing for focus and energy management
          </p>
        </div>
      </div>
    </div>
  ),
  ssr: false, // Client-side only for better performance
});

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
    <ResponsiveLayout maxWidth="2xl">
      {/* ADHD-Optimized Dashboard with Mobile Support */}
      <div className="space-y-4 sm:space-y-6">
        {/* Mobile-Optimized Header */}
        <div className="text-center lg:text-left">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-base-content mb-2">
            🧠 Your ADHD Dashboard
          </h1>
          <p className="text-base-content/70 text-sm sm:text-base">
            Optimized for focus, energy, and productivity
          </p>
        </div>

        {/* AI-Powered Dashboard with Lazy Loading */}
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[600px] bg-base-100 rounded-lg border border-base-300">
              <div className="flex flex-col items-center gap-4">
                <Brain className="w-12 h-12 text-primary animate-pulse" />
                <div className="text-center">
                  <p className="text-base-content/70 font-medium">Preparing your workspace...</p>
                  <p className="text-xs text-base-content/50 mt-1">
                    ADHD-optimized interface loading
                  </p>
                </div>
              </div>
            </div>
          }
        >
          <Dashboard
            initialTasks={convertedTasks}
            onTaskUpdate={(taskId: string, updates) =>
              console.log('Task updated:', taskId, updates)
            }
            onTaskAdd={task => console.log('Create task:', task)}
            onTaskDelete={(taskId: string) => console.log('Delete task:', taskId)}
          />
        </Suspense>
      </div>
    </ResponsiveLayout>
  );
}
