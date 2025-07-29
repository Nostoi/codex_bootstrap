# Calendar Component Interaction Patterns

## ADHD-Optimized Interaction Design

This document defines the interaction patterns for the calendar component, specifically designed to support users with ADHD through predictable, low-cognitive-load interactions.

## Core Interaction Principles

### 1. Predictability
- **Consistent behavior** across all similar elements
- **Clear visual feedback** for every user action
- **Obvious affordances** that suggest their function
- **Stable element positioning** to build muscle memory

### 2. Forgiveness
- **300ms drag delay** to prevent accidental operations
- **Confirmation dialogs** for destructive or significant actions
- **Undo functionality** where possible
- **Graceful error recovery** with helpful messaging

### 3. Clarity
- **Single-purpose interactions** avoid confusion
- **Immediate feedback** confirms user intent
- **Progressive disclosure** reveals complexity gradually
- **Clear state communication** through visual design

## Interaction Patterns by Component

### CalendarView (Main Container)

#### Focus Management
```typescript
// Focus enters calendar from external navigation
onFocus = () => {
  if (!this.state.hasInternalFocus) {
    this.focusFirstInteractiveElement();
  }
}

// Focus leaves calendar area
onBlur = (event) => {
  if (!this.containerRef.current?.contains(event.relatedTarget)) {
    this.setState({ hasInternalFocus: false });
  }
}
```

**Behavior:**
- **Tab into calendar**: Focus moves to first interactive element
- **Tab out of calendar**: Focus moves to next page element
- **Focus trap in modals**: Focus stays within modal until closed
- **Focus restoration**: Returns to previous element after modal closes

#### Keyboard Navigation
- **Arrow Keys**: Navigate between time slots/dates
- **Tab**: Move between major sections (header → grid → sidebar)
- **Shift+Tab**: Reverse tab order
- **Home/End**: Jump to start/end of current row
- **Page Up/Down**: Navigate between weeks/months

### CalendarHeader (Navigation Controls)

#### View Switching
```typescript
interface ViewSwitcherBehavior {
  // Radio button group pattern
  role: 'radiogroup';
  'aria-label': 'Calendar view selection';
  
  // Individual view buttons
  buttons: {
    role: 'radio';
    'aria-checked': boolean;
    onClick: (view: CalendarViewMode) => void;
    onKeyDown: (event: KeyboardEvent) => void; // Arrow key selection
  }[];
}
```

**Behavior:**
- **Click**: Immediately switch to selected view
- **Arrow Keys**: Navigate between view options
- **Enter/Space**: Activate selected view
- **Visual feedback**: Active view clearly indicated
- **Smooth transition**: Views change with gentle animation (respect reduced motion)

#### Date Navigation
```typescript
interface NavigationBehavior {
  previousButton: {
    onClick: () => void; // Go to previous period
    onKeyDown: (event: KeyboardEvent) => void; // Enter/Space
    'aria-label': string; // "Previous month" or "Previous week"
    disabled?: boolean; // If at minimum date range
  };
  
  nextButton: {
    onClick: () => void; // Go to next period
    'aria-label': string; // "Next month" or "Next week"
    disabled?: boolean; // If at maximum date range
  };
  
  todayButton: {
    onClick: () => void; // Jump to current date
    'aria-label': 'Go to today';
    disabled?: boolean; // If already viewing today
  };
}
```

**Behavior:**
- **Previous/Next**: Navigate by current view period (day/week/month)
- **Today button**: Quick return to current date
- **Keyboard shortcuts**: Left/Right arrows for prev/next
- **Visual feedback**: Loading state during navigation
- **Boundary handling**: Disable buttons at date limits

### CalendarGrid (Main Calendar Display)

#### Time Slot Selection
```typescript
interface TimeSlotBehavior {
  onClick: (date: Date, hour: number) => void;
  onDoubleClick: (date: Date, hour: number) => void; // Quick task creation
  onKeyDown: (event: KeyboardEvent) => void;
  
  // State management
  isSelected: boolean;
  isCurrentTime: boolean;
  hasEvents: boolean;
  conflictLevel: ConflictLevel;
  energyLevel: EnergyLevel;
}
```

**Interaction Patterns:**
- **Single Click**: Select time slot (show in selected state)
- **Double Click**: Open quick task creation modal
- **Enter Key**: Activate selected slot (equivalent to double-click)
- **Arrow Navigation**: Move selection between adjacent slots
- **Visual States**: Clear indication of selection, current time, conflicts

#### Grid Navigation
```typescript
interface GridNavigationBehavior {
  // Arrow key navigation
  onArrowUp: () => void;    // Previous time slot (or week in month view)
  onArrowDown: () => void;  // Next time slot (or week in month view)  
  onArrowLeft: () => void;  // Previous day
  onArrowRight: () => void; // Next day
  
  // Jump navigation
  onHome: () => void;       // First slot of current row
  onEnd: () => void;        // Last slot of current row
  onPageUp: () => void;     // Same slot, previous week
  onPageDown: () => void;   // Same slot, next week
}
```

**Navigation Logic:**
- **Day View**: Up/Down = previous/next hour, Left/Right = previous/next day
- **Week View**: Up/Down = previous/next hour, Left/Right = previous/next day
- **Month View**: All arrows navigate between date cells

### CalendarEvent (Event Display)

#### Event Interaction
```typescript
interface EventBehavior {
  // Mouse interactions
  onClick: (event: CalendarEvent) => void;
  onDoubleClick: (event: CalendarEvent) => void; // Edit mode
  onContextMenu: (event: CalendarEvent) => void; // Right-click menu
  
  // Keyboard interactions  
  onKeyDown: (keyEvent: KeyboardEvent) => void;
  onFocus: () => void;
  onBlur: () => void;
  
  // Drag and drop
  onDragStart: (event: CalendarEvent) => void;
  onDrag: (event: CalendarEvent, position: Position) => void;
  onDragEnd: (event: CalendarEvent, dropTarget?: TimeSlot) => void;
}
```

**Interaction Patterns:**

#### Basic Selection
- **Single Click**: Select event (highlight, show details in sidebar)
- **Double Click**: Open edit modal
- **Enter Key**: Open edit modal (keyboard equivalent)
- **Context Menu**: Show quick actions (edit, delete, duplicate)

#### Drag and Drop Behavior
```typescript
interface DragBehavior {
  // Drag initiation (ADHD-friendly)
  dragDelay: 300; // ms delay before drag starts
  dragThreshold: 5; // px movement before drag activates
  
  // Visual feedback
  dragGhost: {
    opacity: 0.7;
    transform: 'scale(0.95)';
    boxShadow: '0 8px 16px rgba(0,0,0,0.2)';
  };
  
  // Drop zones
  validDropZone: {
    backgroundColor: 'var(--success-bg)';
    border: '2px dashed var(--success-border)';
  };
  
  invalidDropZone: {
    backgroundColor: 'var(--error-bg)';
    border: '2px dashed var(--error-border)';
  };
}
```

**Drag and Drop Workflow:**
1. **Initiation**: Hold mouse down for 300ms or press Space key
2. **Feedback**: Visual ghost element, drop zone highlighting
3. **Validation**: Real-time conflict checking, visual warnings
4. **Confirmation**: Show dialog for significant time changes (>1 hour)
5. **Completion**: Smooth animation to new position, API update

#### Keyboard-Based Event Movement
```typescript
interface KeyboardEventMovement {
  // Movement controls
  'Ctrl+Arrow': 'Move event by 15-minute increments';
  'Ctrl+Shift+Arrow': 'Move event by 1-hour increments';
  'Ctrl+Alt+Arrow': 'Move event to different day';
  
  // Duration controls
  'Shift+Arrow': 'Extend/shrink event duration';
  'Alt+Arrow': 'Move event start time, maintaining duration';
}
```

### Modal Interactions

#### Event Detail Modal
```typescript
interface ModalBehavior {
  // Lifecycle
  onOpen: () => void;  // Trap focus, set ARIA attributes
  onClose: () => void; // Restore focus, cleanup
  
  // Interaction
  onBackdropClick: () => void; // Close modal (optional)
  onEscapeKey: () => void;     // Always close modal
  
  // Form interactions
  onSubmit: (data: EventData) => void;
  onCancel: () => void;
  onDelete: () => void; // With confirmation
}
```

**Modal Patterns:**
- **Focus Trap**: Tab navigation stays within modal
- **Escape Key**: Always closes modal and returns focus
- **Backdrop Click**: Optionally closes modal (user preference)
- **Form Validation**: Real-time feedback, clear error messages
- **Confirmation**: Required for destructive actions

#### Quick Task Creation
```typescript
interface QuickTaskBehavior {
  // Auto-population from context
  defaultStartTime: Date; // From clicked time slot
  suggestedDuration: number; // Based on energy level
  defaultEnergyLevel: EnergyLevel; // From time slot context
  
  // Rapid input
  autoFocus: boolean; // Focus title field immediately  
  enterToSubmit: boolean; // Submit on Enter key
  tabToNext: boolean; // Tab through fields efficiently
  
  // Smart defaults
  inferFocusType: boolean; // Guess from title text
  suggestDuration: boolean; // Based on energy level
  checkConflicts: boolean; // Real-time conflict detection
}
```

## Responsive Interaction Patterns

### Desktop (≥1024px)
- **Hover States**: Rich hover feedback with tooltips
- **Right-Click Menus**: Context menus for quick actions  
- **Multi-selection**: Ctrl+Click for multiple event selection
- **Precision Dragging**: Fine-grained time adjustments

### Tablet (768px - 1023px)
- **Touch Targets**: Minimum 44px for all interactive elements
- **Long Press**: Equivalent to right-click menu
- **Touch Drag**: Larger drag handles, snap-to-grid behavior
- **Simplified Navigation**: Larger buttons, clearer labels

### Mobile (≤767px)
- **Bottom Sheet Modals**: Thumb-friendly modal positioning
- **Swipe Gestures**: Swipe left/right for date navigation
- **Simplified Views**: Hide non-essential information
- **Large Touch Targets**: 48px minimum for touch elements

## Error Handling and Recovery

### Graceful Degradation
```typescript
interface ErrorRecovery {
  // Network failures
  optimisticUpdates: boolean; // Show changes immediately
  conflictResolution: 'user' | 'server' | 'merge'; // How to handle conflicts
  retryStrategy: 'exponential' | 'linear' | 'manual'; // Retry behavior
  
  // Validation errors
  inlineValidation: boolean; // Real-time field validation
  errorSummary: boolean; // List all errors at top of form
  fieldFocus: boolean; // Focus first error field
  
  // Recovery actions
  undoTimeout: number; // Time before undo option expires (10s)
  autoSave: boolean; // Prevent data loss
  draftRecovery: boolean; // Restore unsaved changes
}
```

### User-Friendly Error Messages
- **Clear Language**: Avoid technical jargon
- **Actionable Instructions**: Tell users how to fix issues
- **Context Preservation**: Maintain user's work when possible
- **Multiple Recovery Options**: Provide several ways to resolve issues

## Performance and Feedback

### Immediate Feedback
- **Visual Changes**: <16ms for smooth 60fps animations
- **State Updates**: <100ms for responsive feel
- **API Responses**: Loading indicators after 200ms
- **Error Messages**: Immediate validation feedback

### Loading States
```typescript
interface LoadingBehavior {
  // Progressive loading
  skeletonScreens: boolean; // Show layout while loading
  partialContent: boolean; // Render available content first
  lazyLoading: boolean; // Load off-screen content later
  
  // Feedback timing
  immediateLoading: 0; // Show spinner immediately
  networkIndicator: 200; // Show network activity after 200ms
  errorTimeout: 5000; // Show error if no response after 5s
}
```

This interaction design prioritizes cognitive accessibility while maintaining powerful functionality for effective task and calendar management.
