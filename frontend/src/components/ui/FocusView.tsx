import React, { useState } from 'react';
import TaskCard from './TaskCard';

// Import the enhanced Task interface from TaskCard
import { EnhancedTask as Task } from './TaskCard';

export interface FocusViewProps {
  todaysTasks: Task[];
  focusGoal?: string;
  aiRecommendation?: string;
  // totalFocusMinutes?: number; // Removed unused parameter
  onTaskClick?: (taskId: string) => void;
  onFocusGoalChange?: (goal: string) => void;
  onRefreshAI?: () => void;
  isLoadingAI?: boolean;
}

const priorityColors: Record<number, string> = {
  1: 'bg-success',
  2: 'bg-success',
  3: 'bg-warning',
  4: 'bg-error',
  5: 'bg-error',
};

const priorityIcons: Record<number, string> = {
  1: '✨',
  2: '✨',
  3: '⚡',
  4: '🔥',
  5: '🔥',
};

export default function FocusView({
  todaysTasks = [],
  focusGoal = '',
  aiRecommendation = '',
  onTaskClick,
  onFocusGoalChange,
  onRefreshAI,
  isLoadingAI = false,
}: FocusViewProps) {
  const [localFocusGoal, setLocalFocusGoal] = useState(focusGoal);

  // Calculate time and priority metrics
  const completedTasks = todaysTasks.filter(task => task.status === 'DONE');
  const inProgressTasks = todaysTasks.filter(task => task.status === 'IN_PROGRESS');
  const highPriorityTasks = todaysTasks.filter(task => (task.priority || 0) >= 4);

  const totalEstimatedMinutes = todaysTasks
    .filter(task => task.status !== 'DONE')
    .reduce((total, task) => total + (task.estimatedMinutes || 30), 0);

  const completionPercentage =
    todaysTasks.length > 0 ? Math.round((completedTasks.length / todaysTasks.length) * 100) : 0;

  const handleFocusGoalSubmit = () => {
    if (onFocusGoalChange) {
      onFocusGoalChange(localFocusGoal);
    }
  };

  const sortedTasks = [...todaysTasks].sort((a, b) => {
    // Sort by priority (high -> medium -> low), then by status (in-progress -> todo -> done)
    const priorityA = a.priority || 0;
    const priorityB = b.priority || 0;
    const statusOrder = { IN_PROGRESS: 0, TODO: 1, BLOCKED: 2, DONE: 3 };

    if (priorityA !== priorityB) {
      return priorityB - priorityA; // Higher priority first
    }
    return statusOrder[a.status] - statusOrder[b.status];
  });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">Today&apos;s Focus</h1>
        <p className="text-secondary">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Focus Goal Section */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="card-title text-xl mb-4">🎯 What&apos;s your main focus today?</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g., Complete user onboarding feature"
              className="input input-bordered flex-1"
              value={localFocusGoal}
              onChange={e => setLocalFocusGoal(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleFocusGoalSubmit()}
              aria-label="Today's focus goal"
            />
            <button
              className="btn btn-primary"
              onClick={handleFocusGoalSubmit}
              disabled={!localFocusGoal.trim()}
            >
              Set Focus
            </button>
          </div>
          {focusGoal && (
            <div className="mt-3 p-3 bg-primary/10 rounded-lg">
              <p className="text-primary font-medium">Your focus: {focusGoal}</p>
            </div>
          )}
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat bg-base-100 rounded-lg shadow">
          <div className="stat-title">Completion</div>
          <div className="stat-value text-primary">{completionPercentage}%</div>
          <div className="stat-desc">
            {completedTasks.length} of {todaysTasks.length} tasks
          </div>
        </div>

        <div className="stat bg-base-100 rounded-lg shadow">
          <div className="stat-title">High Priority</div>
          <div className="stat-value text-error">{highPriorityTasks.length}</div>
          <div className="stat-desc">urgent tasks</div>
        </div>

        <div className="stat bg-base-100 rounded-lg shadow">
          <div className="stat-title">In Progress</div>
          <div className="stat-value text-info">{inProgressTasks.length}</div>
          <div className="stat-desc">active tasks</div>
        </div>

        <div className="stat bg-base-100 rounded-lg shadow">
          <div className="stat-title">Estimated Time</div>
          <div className="stat-value text-warning">{Math.round(totalEstimatedMinutes / 60)}h</div>
          <div className="stat-desc">{totalEstimatedMinutes % 60}m remaining</div>
        </div>
      </div>

      {/* AI Recommendation */}
      {(aiRecommendation || isLoadingAI) && (
        <div className="card bg-gradient-to-r from-purple-50 to-blue-50 shadow-lg">
          <div className="card-body">
            <div className="flex justify-between items-start">
              <h3 className="card-title text-lg">🤖 AI Recommendations</h3>
              <button
                className={`btn btn-sm btn-outline ${isLoadingAI ? 'loading' : ''}`}
                onClick={onRefreshAI}
                disabled={isLoadingAI}
                aria-label="Refresh AI recommendations"
              >
                {!isLoadingAI && '🔄'}
                Refresh
              </button>
            </div>

            {isLoadingAI ? (
              <div className="flex items-center gap-2">
                <span className="loading loading-spinner loading-sm"></span>
                <span>Analyzing your tasks...</span>
              </div>
            ) : (
              <p className="text-base-content/80">{aiRecommendation}</p>
            )}
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h3 className="card-title text-xl mb-4">📋 Today&apos;s Tasks</h3>

          {sortedTasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-secondary mb-4">No tasks scheduled for today</p>
              <button className="btn btn-primary btn-outline">+ Add Your First Task</button>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedTasks.map(task => (
                <div key={task.id} className="relative">
                  {/* Priority Badge */}
                  <div
                    className={`absolute -left-2 top-2 w-4 h-4 rounded-full ${priorityColors[task.priority || 1]} flex items-center justify-center z-10`}
                  >
                    <span className="text-xs text-white" title={`Priority ${task.priority || 1}`}>
                      {priorityIcons[task.priority || 1]}
                    </span>
                  </div>

                  {/* Task Card */}
                  <div className="ml-4">
                    <TaskCard
                      task={task}
                      onStatusChange={newStatus => {
                        // Handle status change if needed - could integrate with parent component
                        console.log(`Task ${task.id} status changed to ${newStatus}`);
                      }}
                      onClick={() => onTaskClick?.(task.id)}
                    />

                    {/* Task Metadata */}
                    <div className="mt-2 ml-4 flex gap-4 text-xs text-secondary">
                      {task.estimatedMinutes && <span>⏱️ {task.estimatedMinutes}m</span>}
                      {task.aiSuggestion && (
                        <span title={task.aiSuggestion}>🤖 AI insight available</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h3 className="card-title text-lg mb-4">⚡ Quick Actions</h3>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-sm btn-outline">+ Add Task</button>
            <button className="btn btn-sm btn-outline">📅 Schedule Review</button>
            <button className="btn btn-sm btn-outline">🎯 Update Focus</button>
            <button className="btn btn-sm btn-outline">📊 View Analytics</button>
          </div>
        </div>
      </div>
    </div>
  );
}
