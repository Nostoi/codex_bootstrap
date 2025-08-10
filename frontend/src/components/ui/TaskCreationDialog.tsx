import React, { useState, useCallback } from 'react';
import { Task } from './Dashboard';

export interface TaskCreationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: (task: Omit<Task, 'id'>) => void;
  className?: string;
}

export interface TaskFormData {
  title: string;
  description: string;
  priority: number;
  energyLevel: 'low' | 'medium' | 'high';
  focusType: 'creative' | 'technical' | 'analytical' | 'social';
  estimatedMinutes: number;
  complexity: number;
  dueDate?: string;
}

const TaskCreationDialog: React.FC<TaskCreationDialogProps> = ({
  isOpen,
  onClose,
  onCreateTask,
  className = '',
}) => {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: 3,
    energyLevel: 'medium',
    focusType: 'analytical',
    estimatedMinutes: 30,
    complexity: 3,
    dueDate: '',
  });

  const [isClassifying, setIsClassifying] = useState(false);

  const handleInputChange = useCallback((field: keyof TaskFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleAIClassify = useCallback(async () => {
    if (!formData.title.trim()) return;

    setIsClassifying(true);
    try {
      // Call the actual AI classification API
      const response = await fetch('/api/ai/classify-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI classification failed: ${response.status}`);
      }

      const classification = await response.json();

      // Update form with AI classification results
      setFormData(prev => ({
        ...prev,
        energyLevel: classification.energyLevel || prev.energyLevel,
        focusType: classification.focusType || prev.focusType,
        estimatedMinutes: classification.estimatedDuration || prev.estimatedMinutes,
        complexity: classification.complexity || prev.complexity,
        priority: classification.priority || prev.priority,
      }));

      // Show success feedback
      const successElement = document.createElement('div');
      successElement.textContent = 'AI Classification Complete';
      successElement.style.position = 'fixed';
      successElement.style.top = '20px';
      successElement.style.right = '20px';
      successElement.style.background = '#10b981';
      successElement.style.color = 'white';
      successElement.style.padding = '8px 16px';
      successElement.style.borderRadius = '4px';
      successElement.style.zIndex = '9999';
      document.body.appendChild(successElement);

      setTimeout(() => {
        document.body.removeChild(successElement);
      }, 3000);
    } catch (error) {
      console.error('AI classification failed:', error);
      // Show error feedback
      const errorElement = document.createElement('div');
      errorElement.textContent = 'AI Classification Failed';
      errorElement.style.position = 'fixed';
      errorElement.style.top = '20px';
      errorElement.style.right = '20px';
      errorElement.style.background = '#ef4444';
      errorElement.style.color = 'white';
      errorElement.style.padding = '8px 16px';
      errorElement.style.borderRadius = '4px';
      errorElement.style.zIndex = '9999';
      document.body.appendChild(errorElement);

      setTimeout(() => {
        if (document.body.contains(errorElement)) {
          document.body.removeChild(errorElement);
        }
      }, 3000);
    } finally {
      setIsClassifying(false);
    }
  }, [formData.title, formData.description]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!formData.title.trim()) return;

      const newTask: Omit<Task, 'id'> = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: 'TODO',
        // Convert lowercase form values back to uppercase enum values
        energyLevel: formData.energyLevel.toUpperCase() as Task['energyLevel'],
        focusType:
          formData.focusType === 'analytical'
            ? 'ADMINISTRATIVE'
            : (formData.focusType.toUpperCase() as Task['focusType']),
        estimatedMinutes: formData.estimatedMinutes,
        completed: false,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      onCreateTask(newTask);

      // Reset form
      setFormData({
        title: '',
        description: '',
        priority: 3,
        energyLevel: 'medium',
        focusType: 'analytical',
        estimatedMinutes: 30,
        complexity: 3,
        dueDate: '',
      });

      onClose();
    },
    [formData, onCreateTask, onClose]
  );

  const handleCancel = useCallback(() => {
    // Reset form on cancel
    setFormData({
      title: '',
      description: '',
      priority: 3,
      energyLevel: 'medium',
      focusType: 'analytical',
      estimatedMinutes: 30,
      complexity: 3,
      dueDate: '',
    });
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={handleCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div
          className={`bg-base-100 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto ${className}`}
          role="dialog"
          aria-labelledby="task-dialog-title"
          aria-describedby="task-dialog-description"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-base-300">
            <h2 id="task-dialog-title" className="text-xl font-semibold">
              Create New Task
            </h2>
            <button
              onClick={handleCancel}
              className="btn btn-ghost btn-sm btn-circle"
              aria-label="Close dialog"
            >
              ✕
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div id="task-dialog-description" className="sr-only">
              Create a new task with optional AI-powered classification and metadata suggestions
            </div>

            {/* Task Title */}
            <div className="form-control">
              <label className="label" htmlFor="task-title">
                <span className="label-text font-medium">Task Title *</span>
              </label>
              <input
                id="task-title"
                type="text"
                value={formData.title}
                onChange={e => handleInputChange('title', e.target.value)}
                className="input input-bordered w-full"
                placeholder="Enter task title..."
                aria-label="Task title"
                required
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="form-control">
              <label className="label" htmlFor="task-description">
                <span className="label-text font-medium">Description</span>
              </label>
              <textarea
                id="task-description"
                value={formData.description}
                onChange={e => handleInputChange('description', e.target.value)}
                className="textarea textarea-bordered w-full h-20 resize-none"
                placeholder="Optional task description..."
                aria-label="Task description in dialog"
              />
            </div>

            {/* AI Classification Button */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleAIClassify}
                disabled={!formData.title.trim() || isClassifying}
                className="btn btn-outline btn-primary btn-sm"
                aria-label="AI classify task metadata"
              >
                {isClassifying ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    Classifying...
                  </>
                ) : (
                  <>🤖 AI Classify</>
                )}
              </button>
            </div>

            {/* Task Metadata */}
            <div className="grid grid-cols-2 gap-4">
              {/* Energy Level */}
              <div className="form-control">
                <label className="label" htmlFor="energy-level">
                  <span className="label-text font-medium">Energy Level</span>
                </label>
                <select
                  id="energy-level"
                  value={formData.energyLevel}
                  onChange={e => handleInputChange('energyLevel', e.target.value)}
                  className="select select-bordered select-sm"
                  aria-label="Energy level"
                  data-testid="task-energy-level-select"
                >
                  <option value="low">🌱 Low</option>
                  <option value="medium">⚖️ Medium</option>
                  <option value="high">🔥 High</option>
                </select>
              </div>

              {/* Focus Type */}
              <div className="form-control">
                <label className="label" htmlFor="focus-type">
                  <span className="label-text font-medium">Focus Type</span>
                </label>
                <select
                  id="focus-type"
                  value={formData.focusType}
                  onChange={e => handleInputChange('focusType', e.target.value)}
                  className="select select-bordered select-sm"
                  aria-label="Focus type"
                  data-testid="task-focus-type-select"
                >
                  <option value="creative">🎨 Creative</option>
                  <option value="technical">⚙️ Technical</option>
                  <option value="analytical">📋 Analytical</option>
                  <option value="social">👥 Social</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Priority */}
              <div className="form-control">
                <label className="label" htmlFor="priority">
                  <span className="label-text font-medium">Priority</span>
                </label>
                <input
                  id="priority"
                  type="range"
                  min="1"
                  max="10"
                  value={formData.priority}
                  onChange={e => handleInputChange('priority', parseInt(e.target.value))}
                  className="range range-primary range-sm"
                  aria-label="Priority"
                />
                <div className="w-full flex justify-between text-xs px-2 text-base-content/60">
                  <span>Low</span>
                  <span className="font-medium">{formData.priority}</span>
                  <span>High</span>
                </div>
              </div>

              {/* Complexity */}
              <div className="form-control">
                <label className="label" htmlFor="complexity">
                  <span className="label-text font-medium">Complexity</span>
                </label>
                <input
                  id="complexity"
                  type="range"
                  min="1"
                  max="10"
                  value={formData.complexity}
                  onChange={e => handleInputChange('complexity', parseInt(e.target.value))}
                  className="range range-secondary range-sm"
                  aria-label="Complexity"
                  data-testid="task-complexity-input"
                />
                <div className="w-full flex justify-between text-xs px-2 text-base-content/60">
                  <span>Simple</span>
                  <span className="font-medium">{formData.complexity}</span>
                  <span>Complex</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* Estimated Duration */}
              <div className="form-control">
                <label className="label" htmlFor="estimated-duration">
                  <span className="label-text font-medium">Duration (min)</span>
                </label>
                <input
                  id="estimated-duration"
                  type="number"
                  min="5"
                  max="480"
                  step="5"
                  value={formData.estimatedMinutes}
                  onChange={e =>
                    handleInputChange('estimatedMinutes', parseInt(e.target.value) || 30)
                  }
                  className="input input-bordered input-sm"
                  aria-label="Estimated duration"
                  data-testid="task-estimated-duration-input"
                />
              </div>
            </div>

            {/* Due Date */}
            <div className="form-control">
              <label className="label" htmlFor="due-date">
                <span className="label-text font-medium">Due Date (Optional)</span>
              </label>
              <input
                id="due-date"
                type="date"
                value={formData.dueDate}
                onChange={e => handleInputChange('dueDate', e.target.value)}
                className="input input-bordered input-sm"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={handleCancel} className="btn btn-ghost flex-1">
                Cancel
              </button>
              <button
                type="submit"
                disabled={!formData.title.trim()}
                className="btn btn-primary flex-1"
              >
                Create Task
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default TaskCreationDialog;
