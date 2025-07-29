import React, { useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  useSensor,
  useSensors,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  DragOverlay,
} from '@dnd-kit/core';
import {
  restrictToParentElement,
} from '@dnd-kit/modifiers';
import { CalendarEvent, TaskWithMetadata, ADHDCalendarSettings } from '../../types/calendar';

export interface DragItem {
  id: string;
  type: 'event' | 'task';
  data: CalendarEvent | TaskWithMetadata;
}

export interface DropTarget {
  id: string;
  type: 'timeslot';
  startTime: Date;
  endTime: Date;
  isValid: boolean;
}

interface DragWrapperProps {
  children: React.ReactNode;
  adhdSettings?: ADHDCalendarSettings;
  onDragStart?: (item: DragItem) => void;
  onDragEnd?: (item: DragItem, target?: DropTarget) => Promise<void>;
  onDragCancel?: () => void;
  className?: string;
}

export const DragWrapper: React.FC<DragWrapperProps> = ({
  children,
  adhdSettings,
  onDragStart,
  onDragEnd,
  onDragCancel,
  className = '',
}) => {
  const [activeDragItem, setActiveDragItem] = useState<DragItem | null>(null);
  const [isValidDrop, setIsValidDrop] = useState(false);

  // Configure sensors with ADHD-friendly settings
  const sensors = useSensors(
    // Pointer sensor with delay to prevent accidental drags
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: adhdSettings?.dragDelay || 300,
        tolerance: 5,
      },
    }),
    // Keyboard sensor for accessibility
    useSensor(KeyboardSensor, {
      coordinateGetter: (event, { context: { active, collisionRect } }) => {
        if (!active || !collisionRect) return;
        
        const { code } = event;
        const { left, top } = collisionRect;
        
        switch (code) {
          case 'ArrowDown':
            return { x: left, y: top + 30 }; // Move down one time slot (30 minutes)
          case 'ArrowUp':
            return { x: left, y: top - 30 }; // Move up one time slot
          case 'ArrowLeft':
            return { x: left - 100, y: top }; // Move left (for weekly view)
          case 'ArrowRight':
            return { x: left + 100, y: top }; // Move right (for weekly view)
          default:
            return;
        }
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    
    if (!active.data.current) return;
    
    const dragItem: DragItem = {
      id: active.id as string,
      type: active.data.current.type,
      data: active.data.current.data,
    };
    
    setActiveDragItem(dragItem);
    onDragStart?.(dragItem);
    
    // Add dragging class to body for global styles
    document.body.classList.add('dragging-calendar-item');
    
    // Announce drag start to screen readers
    if (adhdSettings?.enableSounds && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(`Started dragging ${dragItem.data.title}`);
      utterance.volume = 0.3;
      speechSynthesis.speak(utterance);
    }
  }, [onDragStart, adhdSettings]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    
    if (!over || !activeDragItem) {
      setIsValidDrop(false);
      return;
    }
    
    const dropData = over.data.current;
    const isValid = dropData?.canAccept?.(activeDragItem) ?? true;
    
    setIsValidDrop(isValid);
  }, [activeDragItem]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { over } = event;
    
    document.body.classList.remove('dragging-calendar-item');
    
    if (!activeDragItem) return;
    
    if (!over) {
      // Drag cancelled - no drop target
      onDragCancel?.();
      setActiveDragItem(null);
      setIsValidDrop(false);
      return;
    }
    
    const dropTarget: DropTarget = {
      id: over.id as string,
      type: 'timeslot',
      startTime: over.data.current?.startTime || new Date(),
      endTime: over.data.current?.endTime || new Date(),
      isValid: isValidDrop,
    };
    
    if (!isValidDrop) {
      // Invalid drop - show warning if ADHD confirmations enabled
      if (adhdSettings?.confirmTimeChanges) {
        alert('Cannot drop item here. Please try a different time slot.');
      }
      onDragCancel?.();
      setActiveDragItem(null);
      setIsValidDrop(false);
      return;
    }
    
    // Show confirmation for significant time changes if enabled
    if (adhdSettings?.confirmTimeChanges && activeDragItem) {
      const originalTime = 'startTime' in activeDragItem.data 
        ? activeDragItem.data.startTime 
        : activeDragItem.data.scheduledTime;
        
      if (originalTime) {
        const timeDiff = Math.abs(dropTarget.startTime.getTime() - originalTime.getTime());
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        if (hoursDiff > 2) {
          const confirmed = confirm(
            `This will move "${activeDragItem.data.title}" by ${Math.round(hoursDiff)} hours. Continue?`
          );
          
          if (!confirmed) {
            onDragCancel?.();
            setActiveDragItem(null);
            setIsValidDrop(false);
            return;
          }
        }
      }
    }
    
    try {
      await onDragEnd?.(activeDragItem, dropTarget);
      
      // Success feedback
      if (adhdSettings?.enableSounds && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(`Moved ${activeDragItem.data.title}`);
        utterance.volume = 0.3;
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error('Failed to handle drag end:', error);
      
      // Error feedback
      if (adhdSettings?.enableSounds && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance('Failed to move item');
        utterance.volume = 0.3;
        speechSynthesis.speak(utterance);
      }
    } finally {
      setActiveDragItem(null);
      setIsValidDrop(false);
    }
  }, [activeDragItem, isValidDrop, onDragEnd, onDragCancel, adhdSettings]);

  // Render drag overlay with appropriate styling
  const renderDragOverlay = () => {
    if (!activeDragItem) return null;
    
    const item = activeDragItem.data;
    
    return (
      <div 
        className={`
          drag-overlay
          bg-primary/90 
          text-primary-content 
          p-2 
          rounded-lg 
          shadow-lg 
          border-2 
          border-primary
          max-w-xs
          transform 
          ${adhdSettings?.reducedMotion ? '' : 'animate-pulse'}
        `}
        style={{
          cursor: 'grabbing',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        <div className="text-sm font-medium truncate">
          {item.title}
        </div>
        {activeDragItem.type === 'event' && 'startTime' in item && (
          <div className="text-xs opacity-80">
            {item.startTime.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            })}
          </div>
        )}
        {activeDragItem.type === 'task' && 'estimatedDuration' in item && (
          <div className="text-xs opacity-80">
            {item.estimatedDuration} min
          </div>
        )}
      </div>
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToParentElement]}
    >
      <div className={`drag-wrapper ${className}`}>
        {children}
      </div>
      
      <DragOverlay
        dropAnimation={{
          duration: adhdSettings?.reducedMotion ? 0 : 200,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}
      >
        {renderDragOverlay()}
      </DragOverlay>
    </DndContext>
  );
};
