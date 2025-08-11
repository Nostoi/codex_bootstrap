'use client';

import React from 'react';
import { EnhancedTask } from '../ui/TaskCard';
import {
  Clock,
  Battery,
  AlertCircle,
  CheckCircle2,
  Play,
  Lightbulb,
  MoreVertical,
  Calendar,
  Timer,
} from 'lucide-react';

interface MobileTaskCardProps {
  task: EnhancedTask;
  onClick?: () => void;
  onStatusChange?: (status: EnhancedTask['status']) => void;
  onEdit?: () => void;
  onQuickStart?: () => void;
  className?: string;
}

// ADHD-optimized energy level indicators for mobile
const energyConfig = {
  HIGH: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: '⚡',
    label: 'High',
    bgClass: 'bg-red-50',
    textClass: 'text-red-700',
  },
  MEDIUM: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: '⚖️',
    label: 'Medium',
    bgClass: 'bg-yellow-50',
    textClass: 'text-yellow-700',
  },
  LOW: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: '🌱',
    label: 'Low',
    bgClass: 'bg-green-50',
    textClass: 'text-green-700',
  },
};

const focusConfig = {
  CREATIVE: { icon: '🎨', label: 'Creative', color: 'text-purple-600' },
  TECHNICAL: { icon: '⚙️', label: 'Technical', color: 'text-blue-600' },
  ADMINISTRATIVE: { icon: '📋', label: 'Admin', color: 'text-gray-600' },
  SOCIAL: { icon: '👥', label: 'Social', color: 'text-green-600' },
};

const statusConfig = {
  TODO: {
    icon: <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />,
    color: 'text-gray-500',
  },
  IN_PROGRESS: { icon: <Play className="w-6 h-6 text-blue-500" />, color: 'text-blue-500' },
  BLOCKED: { icon: <AlertCircle className="w-6 h-6 text-red-500" />, color: 'text-red-500' },
  DONE: { icon: <CheckCircle2 className="w-6 h-6 text-green-500" />, color: 'text-green-500' },
};

export function MobileTaskCard({
  task,
  onClick,
  onStatusChange,
  onEdit,
  onQuickStart,
  className = '',
}: MobileTaskCardProps) {
  const energyInfo = energyConfig[task.energyLevel || 'MEDIUM'];
  const focusInfo = focusConfig[task.focusType || 'TECHNICAL'];
  const statusInfo = statusConfig[task.status];

  const handleStatusToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onStatusChange) {
      const nextStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
      onStatusChange(nextStatus);
    }
  };

  const handleQuickStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onQuickStart?.();
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.();
  };

  return (
    <div
      className={`
        card bg-base-100 shadow-sm border border-base-300 
        active:scale-[0.98] transition-transform duration-150
        ${task.status === 'DONE' ? 'opacity-70' : ''}
        ${energyInfo.bgClass}
        ${className}
      `}
      onClick={onClick}
    >
      <div className="card-body p-4">
        {/* Header Row with Status and Actions */}
        <div className="flex items-start justify-between gap-3 mb-3">
          {/* Status Toggle - Large Touch Target */}
          <button
            onClick={handleStatusToggle}
            className="btn btn-circle btn-sm min-h-[44px] min-w-[44px] flex-shrink-0"
            aria-label={`Mark task as ${task.status === 'DONE' ? 'incomplete' : 'complete'}`}
          >
            {statusInfo.icon}
          </button>

          {/* Task Title - Larger font for mobile */}
          <div className="flex-1 min-w-0">
            <h3
              className={`text-lg font-semibold leading-tight ${
                task.status === 'DONE' ? 'line-through text-base-content/60' : 'text-base-content'
              }`}
            >
              {task.title}
            </h3>
            {task.description && (
              <p className="text-sm text-base-content/70 mt-1 line-clamp-2">{task.description}</p>
            )}
          </div>

          {/* More Actions Menu */}
          <div className="dropdown dropdown-end">
            <button
              tabIndex={0}
              className="btn btn-ghost btn-circle btn-sm min-h-[44px] min-w-[44px]"
              aria-label="Task options"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            <ul
              tabIndex={0}
              className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 z-10"
            >
              <li>
                <button onClick={handleEdit} className="flex items-center gap-2 p-3">
                  <span>✏️</span>
                  Edit Task
                </button>
              </li>
              {task.status !== 'IN_PROGRESS' && (
                <li>
                  <button onClick={handleQuickStart} className="flex items-center gap-2 p-3">
                    <span>▶️</span>
                    Start Focus Session
                  </button>
                </li>
              )}
              <li>
                <button className="flex items-center gap-2 p-3 text-red-600">
                  <span>🗑️</span>
                  Delete
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Metadata Row - Optimized for Mobile */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {/* Energy Level Badge */}
          <div className={`badge ${energyInfo.color} gap-1 p-3`}>
            <span className="text-base">{energyInfo.icon}</span>
            <span className="text-sm font-medium">{energyInfo.label}</span>
          </div>

          {/* Focus Type Badge */}
          <div className={`badge badge-outline gap-1 p-3 ${focusInfo.color}`}>
            <span className="text-base">{focusInfo.icon}</span>
            <span className="text-sm">{focusInfo.label}</span>
          </div>

          {/* Priority Indicator */}
          {task.priority && task.priority > 3 && (
            <div className="badge badge-warning gap-1 p-3">
              <span>🔥</span>
              <span className="text-sm">High Priority</span>
            </div>
          )}
        </div>

        {/* Time and Due Date Row */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-base-content/70">
          {task.estimatedMinutes && (
            <div className="flex items-center gap-1">
              <Timer className="w-4 h-4" />
              <span>{task.estimatedMinutes}m</span>
            </div>
          )}

          {task.dueDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date(task.dueDate).toLocaleDateString()}</span>
            </div>
          )}

          {task.isOverdue && (
            <div className="flex items-center gap-1 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">Overdue</span>
            </div>
          )}
        </div>

        {/* AI Suggestion Banner */}
        {task.aiSuggestion && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800 mb-1">AI Suggestion</p>
                <p className="text-sm text-blue-700">{task.aiSuggestion}</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Action Buttons - Large Touch Targets */}
        {task.status !== 'DONE' && (
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleQuickStart}
              className="btn btn-primary btn-sm flex-1 min-h-[44px] gap-2"
            >
              <Play className="w-4 h-4" />
              Start Focus
            </button>
            <button
              onClick={handleEdit}
              className="btn btn-outline btn-sm min-h-[44px] min-w-[44px]"
              aria-label="Edit task"
            >
              ✏️
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default MobileTaskCard;
