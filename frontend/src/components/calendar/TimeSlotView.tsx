import React, { useState, useCallback, useMemo } from 'react';
import { useDailyPlan, useCalendarEvents } from '../../hooks/useApi';

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  task?: {
    id: string;
    title: string;
    energyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    focusType: 'CREATIVE' | 'TECHNICAL' | 'ADMINISTRATIVE' | 'SOCIAL';
    estimatedMinutes: number;
  };
  calendarEvent?: {
    id: string;
    summary: string;
    source: 'google' | 'outlook';
  };
  energyOptimal?: boolean;
  conflicted?: boolean;
}

interface TimeSlotViewProps {
  date?: string;
  className?: string;
  onTaskMove?: (taskId: string, newTimeSlot: string) => void;
  onSlotClick?: (timeSlot: TimeSlot) => void;
  adhdOptimized?: boolean;
  showEnergyIndicators?: boolean;
}

const TimeSlotView: React.FC<TimeSlotViewProps> = ({
  date,
  className = '',
  onTaskMove,
  onSlotClick,
  adhdOptimized = true,
  showEnergyIndicators = true,
}) => {
  const { data: dailyPlan, isLoading, error } = useDailyPlan(date);
  const { data: calendarData } = useCalendarEvents(date);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  // Generate time slots from daily plan data
  const timeSlots = useMemo(() => {
    if (!dailyPlan) return [];

    const slots: TimeSlot[] = [];
    const workdayStart = 8; // 8 AM
    const workdayEnd = 18; // 6 PM
    const slotDuration = 30; // 30-minute slots

    // Create base time slots
    for (let hour = workdayStart; hour < workdayEnd; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const endMinute = minute + slotDuration;
        const endHour = endMinute >= 60 ? hour + 1 : hour;
        const endTimeMinute = endMinute >= 60 ? endMinute - 60 : endMinute;
        const endTime = `${endHour.toString().padStart(2, '0')}:${endTimeMinute.toString().padStart(2, '0')}`;

        slots.push({
          id: `slot-${hour}-${minute}`,
          startTime,
          endTime,
        });
      }
    }

    // Fill slots with scheduled tasks
    dailyPlan.scheduleBlocks.forEach(block => {
      const blockStart = new Date(block.startTime);
      const slotStart = blockStart.getHours() * 60 + blockStart.getMinutes();
      const slotIndex = Math.floor((slotStart - workdayStart * 60) / slotDuration);

      if (slotIndex >= 0 && slotIndex < slots.length) {
        slots[slotIndex] = {
          ...slots[slotIndex],
          task: {
            id: block.task.id,
            title: block.task.title,
            energyLevel: block.task.energyLevel as 'LOW' | 'MEDIUM' | 'HIGH',
            focusType: block.task.focusType as
              | 'CREATIVE'
              | 'TECHNICAL'
              | 'ADMINISTRATIVE'
              | 'SOCIAL',
            estimatedMinutes: block.task.estimatedMinutes || 30,
          },
          energyOptimal: block.energyMatch > 0.8, // High energy match
        };
      }
    });

    // Fill slots with calendar events
    calendarData?.events?.forEach(event => {
      const eventStart = new Date(event.startTime);
      const slotStart = eventStart.getHours() * 60 + eventStart.getMinutes();
      const slotIndex = Math.floor((slotStart - workdayStart * 60) / slotDuration);

      if (slotIndex >= 0 && slotIndex < slots.length && !slots[slotIndex].task) {
        slots[slotIndex] = {
          ...slots[slotIndex],
          calendarEvent: {
            id: event.id,
            summary: event.title || 'Calendar Event',
            source: event.source,
          },
        };
      }
    });

    return slots;
  }, [dailyPlan, calendarData]);

  // Energy level color coding for ADHD optimization
  const getEnergySlotColor = (energyLevel?: 'LOW' | 'MEDIUM' | 'HIGH', isOptimal?: boolean) => {
    if (!energyLevel) return 'bg-base-200 hover:bg-base-300';

    const baseColors = {
      HIGH: isOptimal ? 'bg-red-100 border-red-300' : 'bg-red-50 border-red-200',
      MEDIUM: isOptimal ? 'bg-yellow-100 border-yellow-300' : 'bg-yellow-50 border-yellow-200',
      LOW: isOptimal ? 'bg-green-100 border-green-300' : 'bg-green-50 border-green-200',
    };

    return `${baseColors[energyLevel]} hover:shadow-sm transition-all duration-200`;
  };

  // Focus type icons for visual clarity
  const getFocusIcon = (focusType?: 'CREATIVE' | 'TECHNICAL' | 'ADMINISTRATIVE' | 'SOCIAL') => {
    switch (focusType) {
      case 'CREATIVE':
        return '🎨';
      case 'TECHNICAL':
        return '⚙️';
      case 'ADMINISTRATIVE':
        return '📋';
      case 'SOCIAL':
        return '👥';
      default:
        return '📅';
    }
  };

  // Calendar source icons
  const getSourceIcon = (source?: 'google' | 'outlook') => {
    switch (source) {
      case 'google':
        return '🟦';
      case 'outlook':
        return '🟧';
      default:
        return '⚪';
    }
  };

  // Drag and drop handlers with ADHD-friendly delays
  const handleDragStart = useCallback((taskId: string) => {
    // 300ms delay to prevent accidental drags (ADHD-friendly)
    setTimeout(() => {
      setDraggedTask(taskId);
    }, 300);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedTask(null);
  }, []);

  const handleDrop = useCallback(
    (slotId: string) => {
      if (draggedTask && onTaskMove) {
        onTaskMove(draggedTask, slotId);
      }
      setDraggedTask(null);
    },
    [draggedTask, onTaskMove]
  );

  if (isLoading) {
    return (
      <div className={`card bg-base-100 shadow-sm ${className}`}>
        <div className="card-body">
          <div className="flex items-center space-x-2">
            <span className="loading loading-spinner loading-sm"></span>
            <span className="text-sm text-base-content/70">Loading daily schedule...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`card bg-base-100 shadow-sm border-warning ${className}`}>
        <div className="card-body">
          <div className="text-warning">⚠️ Unable to load schedule</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`card bg-base-100 shadow-sm ${className}`}>
      <div className="card-body">
        {/* Header with energy optimization summary */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="card-title text-base-content flex items-center space-x-2">
            <span>⏰</span>
            <span>Energy-Optimized Schedule</span>
          </h3>

          {dailyPlan && (
            <div className="flex items-center space-x-2 text-xs">
              <div className="badge badge-success badge-sm">
                {Math.round((dailyPlan.energyOptimization || 0) * 100)}% energy optimized
              </div>
            </div>
          )}
        </div>

        {/* Energy level legend for ADHD awareness */}
        {showEnergyIndicators && (
          <div className="flex items-center space-x-4 mb-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
              <span>High Energy</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
              <span>Medium Energy</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
              <span>Low Energy</span>
            </div>
            <div className="text-base-content/60">✨ = Optimal energy match</div>
          </div>
        )}

        {/* Time slot grid with ADHD-optimized layout */}
        <div className="grid grid-cols-1 gap-1 max-h-96 overflow-y-auto">
          {timeSlots.map(slot => (
            <div
              key={slot.id}
              className={`
                p-3 rounded border-l-4 cursor-pointer min-h-[60px]
                ${getEnergySlotColor(slot.task?.energyLevel, slot.energyOptimal)}
                ${slot.conflicted ? 'border-r-4 border-r-error' : ''}
                ${adhdOptimized ? 'hover:scale-[1.02] transition-transform' : ''}
              `}
              onClick={() => onSlotClick?.(slot)}
              onDrop={() => handleDrop(slot.id)}
              onDragOver={e => e.preventDefault()}
              role="button"
              tabIndex={0}
              aria-label={`Time slot ${slot.startTime} to ${slot.endTime}`}
            >
              {/* Time indicator */}
              <div className="text-xs font-medium text-base-content/70 mb-1">
                {slot.startTime} - {slot.endTime}
              </div>

              {/* Task content */}
              {slot.task && (
                <div
                  draggable
                  onDragStart={() => handleDragStart(slot.task!.id)}
                  onDragEnd={handleDragEnd}
                  className="bg-white/50 rounded p-2 border border-base-300"
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm">{getFocusIcon(slot.task.focusType)}</span>
                    {slot.energyOptimal && <span className="text-xs">✨</span>}
                    <span className="text-xs font-medium text-base-content">
                      {slot.task.energyLevel}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-base-content line-clamp-2">
                    {slot.task.title}
                  </div>
                  <div className="text-xs text-base-content/60 mt-1">
                    {slot.task.estimatedMinutes}min
                  </div>
                </div>
              )}

              {/* Calendar event content */}
              {slot.calendarEvent && (
                <div className="bg-blue-50 rounded p-2 border border-blue-200">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm">{getSourceIcon(slot.calendarEvent.source)}</span>
                    <span className="text-xs text-blue-600 font-medium">Calendar</span>
                  </div>
                  <div className="text-sm font-medium text-blue-800 line-clamp-2">
                    {slot.calendarEvent.summary}
                  </div>
                </div>
              )}

              {/* Empty slot indicator */}
              {!slot.task && !slot.calendarEvent && (
                <div className="text-center text-base-content/40 text-xs py-2">
                  Available for scheduling
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Unscheduled tasks panel */}
        {dailyPlan?.unscheduledTasks && dailyPlan.unscheduledTasks.length > 0 && (
          <div className="mt-4 pt-4 border-t border-base-300">
            <h4 className="text-sm font-medium text-base-content mb-2">
              Unscheduled Tasks ({dailyPlan.unscheduledTasks.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {dailyPlan.unscheduledTasks.map(task => (
                <div
                  key={task.id}
                  className="p-2 bg-base-200 rounded border cursor-move"
                  draggable
                  onDragStart={() => handleDragStart(task.id)}
                  onDragEnd={handleDragEnd}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm">{getFocusIcon(task.focusType as any)}</span>
                    <span className="text-xs badge badge-outline">{task.energyLevel}</span>
                  </div>
                  <div className="text-sm font-medium text-base-content line-clamp-1">
                    {task.title}
                  </div>
                  <div className="text-xs text-base-content/60">{task.estimatedMinutes}min</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeSlotView;
