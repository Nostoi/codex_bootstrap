import { useEffect, useState, useCallback, useRef } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  estimatedTime?: number;
  actualTime?: number;
  progress?: number;
  tags?: string[];
  projectId?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  calendarEventId?: string;
  dependencies?: string[];
  subtasks?: Task[];
}

export interface TaskUpdate {
  id: string;
  field: string;
  oldValue: any;
  newValue: any;
  updatedBy: string;
  timestamp: string;
}

export interface RealTimeTaskState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  lastSync: Date | null;
  onlineUsers: string[];
  conflictingTasks: string[];
}

export function useRealTimeTasks(projectId?: string) {
  const { 
    isConnected, 
    sendMessage, 
    subscribeToTaskUpdates, 
    unsubscribeFromTaskUpdates 
  } = useWebSocket();

  const [state, setState] = useState<RealTimeTaskState>({
    tasks: [],
    isLoading: false,
    error: null,
    lastSync: null,
    onlineUsers: [],
    conflictingTasks: [],
  });

  const taskUpdatesRef = useRef<Map<string, TaskUpdate[]>>(new Map());
  const optimisticUpdatesRef = useRef<Map<string, Partial<Task>>>(new Map());

  // Load initial tasks
  const loadTasks = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const url = projectId 
        ? `/api/tasks?projectId=${projectId}` 
        : '/api/tasks';
        
      const response = await fetch(url, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load tasks');
      }

      const tasks = await response.json();
      
      setState(prev => ({
        ...prev,
        tasks,
        isLoading: false,
        lastSync: new Date(),
      }));

      // Subscribe to real-time updates for all loaded tasks
      tasks.forEach((task: Task) => {
        subscribeToTaskUpdates(task.id);
      });

    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, [projectId, subscribeToTaskUpdates]);

  // Handle real-time task updates
  useEffect(() => {
    const handleTaskUpdate = (event: CustomEvent) => {
      const { taskId, updates, updatedBy, timestamp } = event.detail;
      
      // Store update history
      const currentUpdates = taskUpdatesRef.current.get(taskId) || [];
      const newUpdate: TaskUpdate = {
        id: taskId,
        field: updates.field,
        oldValue: updates.oldValue,
        newValue: updates.newValue,
        updatedBy,
        timestamp,
      };
      taskUpdatesRef.current.set(taskId, [...currentUpdates, newUpdate]);

      // Apply update to local state
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.map(task => {
          if (task.id === taskId) {
            return { ...task, ...updates, updatedAt: timestamp };
          }
          return task;
        }),
        lastSync: new Date(),
      }));

      // Clear optimistic update if it exists
      optimisticUpdatesRef.current.delete(taskId);
    };

    const handleTaskCreated = (event: CustomEvent) => {
      const newTask: Task = event.detail;
      
      setState(prev => ({
        ...prev,
        tasks: [...prev.tasks, newTask],
        lastSync: new Date(),
      }));

      // Subscribe to updates for the new task
      subscribeToTaskUpdates(newTask.id);
    };

    const handleTaskDeleted = (event: CustomEvent) => {
      const { taskId } = event.detail;
      
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.filter(task => task.id !== taskId),
        lastSync: new Date(),
      }));

      // Unsubscribe from updates
      unsubscribeFromTaskUpdates(taskId);
      taskUpdatesRef.current.delete(taskId);
      optimisticUpdatesRef.current.delete(taskId);
    };

    // Listen for WebSocket events
    window.addEventListener('task-updated', handleTaskUpdate as EventListener);
    window.addEventListener('task-created', handleTaskCreated as EventListener);
    window.addEventListener('task-deleted', handleTaskDeleted as EventListener);

    return () => {
      window.removeEventListener('task-updated', handleTaskUpdate as EventListener);
      window.removeEventListener('task-created', handleTaskCreated as EventListener);
      window.removeEventListener('task-deleted', handleTaskDeleted as EventListener);
    };
  }, [subscribeToTaskUpdates, unsubscribeFromTaskUpdates]);

  // Load tasks when connection is established
  useEffect(() => {
    if (isConnected) {
      loadTasks();
    }
  }, [isConnected, loadTasks]);

  // Optimistic task updates
  const updateTaskOptimistically = useCallback((taskId: string, updates: Partial<Task>) => {
    // Store optimistic update
    optimisticUpdatesRef.current.set(taskId, updates);

    // Apply immediately to UI
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(task => {
        if (task.id === taskId) {
          return { ...task, ...updates };
        }
        return task;
      }),
    }));

    // Send update to server
    sendMessage('update-task', { taskId, updates });

    // Set timeout to revert if no confirmation received
    setTimeout(() => {
      const stillPending = optimisticUpdatesRef.current.has(taskId);
      if (stillPending) {
        // Revert optimistic update
        setState(prev => ({
          ...prev,
          tasks: prev.tasks.map(task => {
            if (task.id === taskId) {
              const optimisticUpdate = optimisticUpdatesRef.current.get(taskId);
              if (optimisticUpdate) {
                // Remove optimistic changes
                const revertedTask = { ...task };
                Object.keys(optimisticUpdate).forEach(key => {
                  // This is a simplified revert - in production you'd want to store original values
                  delete (revertedTask as any)[key];
                });
                return revertedTask;
              }
            }
            return task;
          }),
          error: 'Failed to sync task update',
        }));
        optimisticUpdatesRef.current.delete(taskId);
      }
    }, 5000); // 5 second timeout
  }, [sendMessage]);

  // Create new task
  const createTask = useCallback(async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        throw new Error('Failed to create task');
      }

      const newTask = await response.json();
      
      // The task will be added via WebSocket event, so no need to update state here
      return newTask;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create task',
      }));
      throw error;
    }
  }, []);

  // Delete task
  const deleteTask = useCallback(async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      // The task will be removed via WebSocket event
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to delete task',
      }));
      throw error;
    }
  }, []);

  // Update task status with real-time sync
  const updateTaskStatus = useCallback((taskId: string, status: Task['status']) => {
    updateTaskOptimistically(taskId, { status });
  }, [updateTaskOptimistically]);

  // Update task progress with real-time sync
  const updateTaskProgress = useCallback((taskId: string, progress: number) => {
    updateTaskOptimistically(taskId, { progress });
  }, [updateTaskOptimistically]);

  // Batch update multiple tasks
  const batchUpdateTasks = useCallback((updates: Array<{ taskId: string; updates: Partial<Task> }>) => {
    updates.forEach(({ taskId, updates: taskUpdates }) => {
      updateTaskOptimistically(taskId, taskUpdates);
    });
  }, [updateTaskOptimistically]);

  // Get task update history
  const getTaskHistory = useCallback((taskId: string): TaskUpdate[] => {
    return taskUpdatesRef.current.get(taskId) || [];
  }, []);

  // Check for conflicts (multiple users editing same task)
  const checkForConflicts = useCallback(() => {
    const conflicts: string[] = [];
    
    state.tasks.forEach(task => {
      const history = getTaskHistory(task.id);
      const recentUpdates = history.filter(update => {
        const updateTime = new Date(update.timestamp);
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        return updateTime > fiveMinutesAgo;
      });

      const uniqueUsers = new Set(recentUpdates.map(update => update.updatedBy));
      if (uniqueUsers.size > 1) {
        conflicts.push(task.id);
      }
    });

    setState(prev => ({ ...prev, conflictingTasks: conflicts }));
    return conflicts;
  }, [state.tasks, getTaskHistory]);

  // Sync with server (force refresh)
  const syncWithServer = useCallback(async () => {
    await loadTasks();
    sendMessage('request-full-sync', { projectId });
  }, [loadTasks, sendMessage, projectId]);

  // Clean up subscriptions on unmount
  useEffect(() => {
    return () => {
      state.tasks.forEach(task => {
        unsubscribeFromTaskUpdates(task.id);
      });
    };
  }, [state.tasks, unsubscribeFromTaskUpdates]);

  return {
    // State
    tasks: state.tasks,
    isLoading: state.isLoading,
    error: state.error,
    lastSync: state.lastSync,
    onlineUsers: state.onlineUsers,
    conflictingTasks: state.conflictingTasks,
    isConnected,

    // Actions
    createTask,
    deleteTask,
    updateTaskStatus,
    updateTaskProgress,
    updateTaskOptimistically,
    batchUpdateTasks,

    // Utilities
    getTaskHistory,
    checkForConflicts,
    syncWithServer,
    refreshTasks: loadTasks,
  };
}

// Hook for drag-and-drop with real-time sync
export function useRealTimeDragAndDrop(tasks: Task[]) {
  const { updateTaskOptimistically } = useRealTimeTasks();

  const handleDragEnd = useCallback((event: any) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }

    const activeTask = tasks.find(task => task.id === active.id);
    if (!activeTask) {
      return;
    }

    // Determine new status based on drop zone
    let newStatus: Task['status'] = activeTask.status;
    if (over.id === 'pending') newStatus = 'pending';
    else if (over.id === 'in-progress') newStatus = 'in-progress';
    else if (over.id === 'completed') newStatus = 'completed';

    // Update task status in real-time
    if (newStatus !== activeTask.status) {
      updateTaskOptimistically(activeTask.id, { status: newStatus });
    }
  }, [tasks, updateTaskOptimistically]);

  return { handleDragEnd };
}
