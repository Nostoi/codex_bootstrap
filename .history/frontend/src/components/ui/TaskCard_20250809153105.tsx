import React from 'react';

// Enhanced Task interface matching Prisma schema
export interface EnhancedTask {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';
  dueDate?: string;
  // Enhanced metadata fields
  energyLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  focusType?: 'CREATIVE' | 'TECHNICAL' | 'ADMINISTRATIVE' | 'SOCIAL';
  priority?: number; // 1-5 scale
  estimatedMinutes?: number;
  softDeadline?: string;
  hardDeadline?: string;
  source?: 'SELF' | 'BOSS' | 'TEAM' | 'AI_GENERATED';
  aiSuggestion?: string;
  // Computed fields
  isOverdue?: boolean;
  isBlocked?: boolean;
  dependencyCount?: number;
}

export interface TaskCardProps {
  task: EnhancedTask;
  onClick?: () => void;
  onStatusChange?: (status: EnhancedTask['status']) => void;
  onEdit?: () => void;
  onQuickStart?: () => void;
  compact?: boolean;
  interactive?: boolean;
  className?: string;
}

// ADHD-optimized energy level indicators
const energyConfig = {
  HIGH: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: '⚡',
    label: 'High Energy',
    description: "Best tackled when you're feeling energized and focused",
  },
  MEDIUM: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: '⚖️',
    label: 'Medium Energy',
    description: 'Good for steady, moderate effort tasks',
  },
  LOW: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: '🌱',
    label: 'Low Energy',
    description: 'Perfect for when you need gentle, low-stress activities',
  },
};

// Focus type configuration with ADHD-friendly icons
const focusConfig = {
  CREATIVE: {
    icon: '🎨',
    label: 'Creative',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  TECHNICAL: {
    icon: '⚙️',
    label: 'Technical',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  ADMINISTRATIVE: {
    icon: '📋',
    label: 'Administrative',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
  },
  SOCIAL: {
    icon: '👥',
    label: 'Social',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
};

// Status configuration with clear visual indicators
const statusConfig = {
  TODO: {
    color: 'border-l-gray-400 bg-gray-50',
    badge: 'bg-gray-100 text-gray-700',
    label: 'To Do',
  },
  IN_PROGRESS: {
    color: 'border-l-blue-500 bg-blue-50',
    badge: 'bg-blue-100 text-blue-700',
    label: 'In Progress',
  },
  BLOCKED: {
    color: 'border-l-red-500 bg-red-50',
    badge: 'bg-red-100 text-red-700',
    label: 'Blocked',
  },
  DONE: {
    color: 'border-l-green-500 bg-green-50',
    badge: 'bg-green-100 text-green-700',
    label: 'Complete',
  },
};

// Source indicators for context
const sourceConfig = {
  SELF: { icon: '👤', label: 'Personal' },
  BOSS: { icon: '💼', label: 'From Boss' },
  TEAM: { icon: '👥', label: 'Team Task' },
  AI_GENERATED: { icon: '🤖', label: 'AI Suggested' },
};

export default function TaskCard({
  task,
  onClick,
  onStatusChange,
  onEdit,
  onQuickStart,
  compact = false,
  interactive = true,
  className = '',
}: TaskCardProps) {
  // Early return for null/undefined task to prevent crashes
  if (!task) {
    return (
      <div className={`rounded-lg border-2 border-gray-200 p-4 bg-gray-50 ${className}`}>
        <div className="text-gray-500 text-center">
          <p>Task data unavailable</p>
        </div>
      </div>
    );
  }

  const statusStyle = statusConfig[task.status] || statusConfig.TODO;
  const energyStyle = task.energyLevel ? energyConfig[task.energyLevel] : null;
  const focusStyle = task.focusType ? focusConfig[task.focusType] : null;
  const sourceStyle = task.source ? sourceConfig[task.source] : null;

  // Calculate urgency for deadline indicators
  const getUrgencyStyle = () => {
    if (task.isOverdue) return 'text-red-600 font-semibold';
    if (task.hardDeadline) {
      const days = Math.ceil(
        (new Date(task.hardDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      if (days <= 1) return 'text-red-600 font-semibold';
      if (days <= 3) return 'text-orange-600 font-medium';
    }
    return 'text-gray-600';
  };

  // Priority visual weight (1=lightest, 5=heaviest)
  const getPriorityBorder = () => {
    if (!task.priority) return 'border-l-4';
    return task.priority >= 4 ? 'border-l-8' : task.priority >= 3 ? 'border-l-6' : 'border-l-4';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  // Build comprehensive ARIA label for screen readers
  const buildAriaLabel = () => {
    let label = `Task: ${task.title}`;
    label += `, Status: ${statusStyle.label}`;
    if (task.energyLevel) label += `, Energy: ${energyConfig[task.energyLevel].label}`;
    if (task.focusType) label += `, Focus: ${focusConfig[task.focusType].label}`;
    if (task.priority) label += `, Priority: ${task.priority} out of 5`;
    if (task.estimatedMinutes) label += `, Estimated: ${task.estimatedMinutes} minutes`;
    if (task.isBlocked) label += `, Currently blocked`;
    if (task.dependencyCount) label += `, Has ${task.dependencyCount} dependencies`;
    return label;
  };

  return (
    <div
      data-testid="task-card"
      className={`
        relative rounded-lg border-2 border-gray-200 shadow-sm 
        transition-all duration-200 ease-in-out
        ${getPriorityBorder()} ${statusStyle.color}
        ${interactive ? 'cursor-pointer hover:shadow-md hover:border-gray-300' : ''}
        ${compact ? 'p-3' : 'p-4'}
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${className}
      `}
      tabIndex={interactive ? 0 : -1}
      role={interactive ? 'button' : 'article'}
      aria-label={buildAriaLabel()}
      onClick={interactive ? onClick : undefined}
      onKeyDown={interactive ? handleKeyDown : undefined}
    >
      {/* Header Row: Title and Status */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h3
            className={`font-semibold ${compact ? 'text-base' : 'text-lg'} text-gray-900 truncate`}
          >
            {task.title}
          </h3>
          {task.description && !compact && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
          )}
        </div>
        <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${statusStyle.badge}`}>
          {statusStyle.label}
        </span>
      </div>

      {/* Metadata Row: Energy, Focus, Priority */}
      <div className="flex flex-wrap gap-2 mb-3">
        {energyStyle && (
          <span
            className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${energyStyle.color}`}
            title={energyStyle.description}
          >
            <span className="mr-1" aria-hidden="true">
              {energyStyle.icon}
            </span>
            {energyStyle.label}
          </span>
        )}

        {focusStyle && (
          <span
            className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${focusStyle.bgColor} ${focusStyle.color}`}
          >
            <span className="mr-1" aria-hidden="true">
              {focusStyle.icon}
            </span>
            {focusStyle.label}
          </span>
        )}

        {task.priority && task.priority > 3 && (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-800">
            🔥 High Priority
          </span>
        )}

        {sourceStyle && (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
            <span className="mr-1" aria-hidden="true">
              {sourceStyle.icon}
            </span>
            {sourceStyle.label}
          </span>
        )}
      </div>

      {/* Time and Deadline Information */}
      {(task.estimatedMinutes || task.hardDeadline || task.softDeadline) && (
        <div className="flex items-center gap-4 mb-3 text-sm">
          {task.estimatedMinutes && (
            <span className="flex items-center text-gray-600">
              <span className="mr-1" aria-hidden="true">
                ⏱️
              </span>
              {task.estimatedMinutes}m
            </span>
          )}

          {task.hardDeadline && (
            <span className={`flex items-center ${getUrgencyStyle()}`}>
              <span className="mr-1" aria-hidden="true">
                🚨
              </span>
              Due: {new Date(task.hardDeadline).toLocaleDateString()}
            </span>
          )}

          {task.softDeadline && !task.hardDeadline && (
            <span className="flex items-center text-blue-600">
              <span className="mr-1" aria-hidden="true">
                📅
              </span>
              Target: {new Date(task.softDeadline).toLocaleDateString()}
            </span>
          )}
        </div>
      )}

      {/* AI Suggestion Callout */}
      {task.aiSuggestion && !compact && (
        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-start">
            <span className="text-blue-500 mr-2" aria-hidden="true">
              💡
            </span>
            <p className="text-sm text-blue-800">{task.aiSuggestion}</p>
          </div>
        </div>
      )}

      {/* Dependency and Block Indicators */}
      {(task.isBlocked || task.dependencyCount) && (
        <div className="flex items-center gap-3 mb-3">
          {task.isBlocked && (
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-700">
              🚫 Blocked
            </span>
          )}

          {task.dependencyCount && task.dependencyCount > 0 && (
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-amber-100 text-amber-700">
              🔗 {task.dependencyCount} dependencies
            </span>
          )}
        </div>
      )}

      {/* Quick Actions (visible on hover or focus) */}
      {interactive && !compact && (
        <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
          <div className="flex gap-2 pt-3 border-t border-gray-200">
            {task.status === 'TODO' && onQuickStart && (
              <button
                className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={e => {
                  e.stopPropagation();
                  onQuickStart();
                }}
              >
                Start
              </button>
            )}

            {task.status === 'IN_PROGRESS' && onStatusChange && (
              <button
                className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                onClick={e => {
                  e.stopPropagation();
                  onStatusChange('DONE');
                }}
              >
                Complete
              </button>
            )}

            {onEdit && (
              <button
                className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                onClick={e => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                Edit
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
