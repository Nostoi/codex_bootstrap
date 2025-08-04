import TaskCard from '../../components/ui/TaskCard';

const mockTasks = [
  { id: '1', title: 'Finish onboarding flow', status: 'in-progress', dueDate: '2025-07-28' },
  { id: '2', title: 'Review AI suggestions', status: 'todo' },
  { id: '3', title: 'Sync calendar', status: 'done', dueDate: '2025-07-25' },
];

export default function DashboardPage() {
  return (
    <section>
      <h1 className="text-xl font-bold mb-4">Today’s Plan</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockTasks.map(task => (
          <TaskCard key={task.id} {...task} />
        ))}
      </div>
    </section>
  );
}
