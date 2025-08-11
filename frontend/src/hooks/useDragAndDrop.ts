import { useState, useCallback, useRef } from 'react';
import { DragItem, DropTarget } from '../components/ui/DragWrapper';
import { CalendarEvent, TaskWithMetadata, ADHDCalendarSettings } from '../types/calendar';

export interface DragAndDropState {
  isDragging: boolean;
  draggedItem: DragItem | null;
  dropTarget: DropTarget | null;
  isValidDrop: boolean;
  originalPosition: { x: number; y: number } | null;
}

export interface DragAndDropHandlers {
  handleDragStart: (item: DragItem) => void;
  handleDragEnd: (item: DragItem, target?: DropTarget) => Promise<void>;
  handleDragCancel: () => void;
  resetDragState: () => void;
}

export interface UseDragAndDropOptions {
  adhdSettings?: ADHDCalendarSettings;
  onEventMove?: (eventId: string, newStartTime: Date, newEndTime: Date) => Promise<void>;
  onTaskSchedule?: (taskId: string, scheduledTime: Date, duration: number) => Promise<void>;
  onConflictDetected?: (
    conflicts: Array<{ id: string; title: string; severity: 'minor' | 'major' | 'critical' }>
  ) => void;
}

export const useDragAndDrop = (options: UseDragAndDropOptions = {}) => {
  const { adhdSettings, onEventMove, onTaskSchedule, onConflictDetected } = options;

  const [dragState, setDragState] = useState<DragAndDropState>({
    isDragging: false,
    draggedItem: null,
    dropTarget: null,
    isValidDrop: false,
    originalPosition: null,
  });

  const dragStartTimeRef = useRef<number>(0);

  const resetDragState = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedItem: null,
      dropTarget: null,
      isValidDrop: false,
      originalPosition: null,
    });
  }, []);

  const handleDragStart = useCallback(
    (item: DragItem) => {
      dragStartTimeRef.current = Date.now();

      setDragState(prev => ({
        ...prev,
        isDragging: true,
        draggedItem: item,
        originalPosition: null, // Will be set by the draggable component
      }));

      // Add global drag state class for styling
      document.documentElement.classList.add('calendar-dragging');

      // Visual feedback for ADHD users
      if (adhdSettings?.enableSounds) {
        // Play subtle sound feedback if available
        try {
          const audioContext = new AudioContext();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.1);
        } catch (error) {
          // Fallback - audio context might not be available
          console.debug('Audio feedback not available:', error);
        }
      }
    },
    [adhdSettings]
  );

  const detectConflicts = useCallback(
    (
      newStartTime: Date,
      newEndTime: Date,
      excludeId: string,
      existingEvents: CalendarEvent[] = []
    ) => {
      const conflicts: Array<{
        id: string;
        title: string;
        severity: 'minor' | 'major' | 'critical';
      }> = [];

      for (const event of existingEvents) {
        if (event.id === excludeId) continue;

        const eventStart = new Date(event.startTime);
        const eventEnd = new Date(event.endTime);

        // Check for overlap
        if (
          (newStartTime < eventEnd && newEndTime > eventStart) ||
          (eventStart < newEndTime && eventEnd > newStartTime)
        ) {
          // Calculate conflict severity based on overlap percentage
          const overlapStart = new Date(Math.max(newStartTime.getTime(), eventStart.getTime()));
          const overlapEnd = new Date(Math.min(newEndTime.getTime(), eventEnd.getTime()));
          const overlapDuration = overlapEnd.getTime() - overlapStart.getTime();
          const eventDuration = eventEnd.getTime() - eventStart.getTime();
          const newEventDuration = newEndTime.getTime() - newStartTime.getTime();

          const overlapPercentage = Math.max(
            overlapDuration / eventDuration,
            overlapDuration / newEventDuration
          );

          let severity: 'minor' | 'major' | 'critical';
          if (overlapPercentage >= 0.8) severity = 'critical';
          else if (overlapPercentage >= 0.5) severity = 'major';
          else severity = 'minor';

          conflicts.push({
            id: event.id,
            title: event.title,
            severity,
          });
        }
      }

      return conflicts;
    },
    []
  );

  const calculateNewEventTimes = useCallback(
    (originalEvent: CalendarEvent, dropStartTime: Date) => {
      const originalStart = new Date(originalEvent.startTime);
      const originalEnd = new Date(originalEvent.endTime);
      const duration = originalEnd.getTime() - originalStart.getTime();

      const newStartTime = new Date(dropStartTime);
      const newEndTime = new Date(dropStartTime.getTime() + duration);

      return { newStartTime, newEndTime };
    },
    []
  );

  const calculateTaskScheduleTime = useCallback((task: TaskWithMetadata, dropStartTime: Date) => {
    const scheduledTime = new Date(dropStartTime);
    const duration = task.estimatedDuration || 30; // Default 30 minutes

    return { scheduledTime, duration };
  }, []);

  const handleDragEnd = useCallback(
    async (item: DragItem, target?: DropTarget) => {
      // Clean up global state
      document.documentElement.classList.remove('calendar-dragging');

      if (!target || !target.isValid) {
        // Invalid drop or no target
        resetDragState();
        return;
      }

      try {
        if (item.type === 'event' && onEventMove) {
          const event = item.data as CalendarEvent;
          const { newStartTime, newEndTime } = calculateNewEventTimes(event, target.startTime);

          // Check for conflicts if enabled
          if (adhdSettings?.confirmTimeChanges) {
            // Note: In a real implementation, you'd pass existing events here
            const conflicts = detectConflicts(newStartTime, newEndTime, event.id, []);
            if (conflicts.length > 0) {
              onConflictDetected?.(conflicts);
              const confirmMove = confirm(
                `This will conflict with ${conflicts.length} other event(s). Continue?`
              );
              if (!confirmMove) {
                resetDragState();
                return;
              }
            }
          }

          await onEventMove(event.id, newStartTime, newEndTime);
        } else if (item.type === 'task' && onTaskSchedule) {
          const task = item.data as TaskWithMetadata;
          const { scheduledTime, duration } = calculateTaskScheduleTime(task, target.startTime);

          await onTaskSchedule(task.id, scheduledTime, duration);
        }

        // Success feedback
        if (adhdSettings?.enableSounds) {
          try {
            const audioContext = new AudioContext();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
          } catch (error) {
            console.debug('Audio feedback not available:', error);
          }
        }
      } catch (error) {
        console.error('Failed to handle drop:', error);

        // Error feedback
        if (adhdSettings?.enableSounds) {
          try {
            const audioContext = new AudioContext();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
          } catch (error) {
            console.debug('Audio feedback not available:', error);
          }
        }
      }

      resetDragState();
    },
    [
      adhdSettings,
      onEventMove,
      onTaskSchedule,
      onConflictDetected,
      calculateNewEventTimes,
      calculateTaskScheduleTime,
      detectConflicts,
      resetDragState,
    ]
  );

  const handleDragCancel = useCallback(() => {
    document.documentElement.classList.remove('calendar-dragging');

    // Cancel feedback
    if (adhdSettings?.enableSounds) {
      try {
        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
      } catch (error) {
        console.debug('Audio feedback not available:', error);
      }
    }

    resetDragState();
  }, [adhdSettings, resetDragState]);

  const handlers: DragAndDropHandlers = {
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
    resetDragState,
  };

  return {
    dragState,
    handlers,
  };
};

export default useDragAndDrop;
