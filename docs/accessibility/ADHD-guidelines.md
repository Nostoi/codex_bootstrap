# ADHD-Friendly Design Guidelines

## 🧠 Understanding ADHD & Design

ADHD (Attention Deficit Hyperactivity Disorder) affects executive function, attention regulation, and information processing. Our design principles acknowledge these neurological differences and create interfaces that work with ADHD brains, not against them.

### Core ADHD Challenges in Digital Interfaces

1. **Executive Function**: Difficulty with planning, organization, and task prioritization
2. **Attention Regulation**: Challenges with sustained focus and filtering distractions
3. **Working Memory**: Limited capacity for holding information while processing
4. **Hyperfocus vs. Distractibility**: Extreme focus states alternating with attention scatter
5. **Time Perception**: Difficulty estimating time and managing schedules
6. **Sensory Processing**: Sensitivity to visual, auditory, and motion stimuli

## 🎯 ADHD-Optimized Design Principles

### 1. Minimize Cognitive Load

**Principle**: Reduce the mental effort required to process information and make decisions.

#### Implementation:

- **Progressive Disclosure**: Show only essential information initially, with details available on demand
- **Clear Visual Hierarchy**: Use typography, spacing, and color to guide attention
- **Consistent Patterns**: Maintain predictable layouts and interaction patterns
- **Chunking**: Group related information into digestible sections

#### Examples:

```tsx
// ❌ Cognitive overload
<TaskCard>
  <Title>{task.title}</Title>
  <Description>{task.description}</Description>
  <EnergyLevel>{task.energyLevel}</EnergyLevel>
  <FocusType>{task.focusType}</FocusType>
  <Priority>{task.priority}</Priority>
  <Deadline>{task.deadline}</Deadline>
  <Tags>{task.tags.join(', ')}</Tags>
  <Dependencies>{task.dependencies}</Dependencies>
  <CreatedDate>{task.createdAt}</CreatedDate>
  <UpdatedDate>{task.updatedAt}</UpdatedDate>
</TaskCard>

// ✅ Progressive disclosure
<TaskCard>
  <Title>{task.title}</Title>
  <PrimaryMetadata>
    <EnergyBadge level={task.energyLevel} />
    <PriorityIndicator level={task.priority} />
    <DeadlineWarning date={task.deadline} />
  </PrimaryMetadata>
  <SecondaryMetadata expandable>
    <FocusType>{task.focusType}</FocusType>
    <Tags>{task.tags}</Tags>
    <Dependencies>{task.dependencies}</Dependencies>
  </SecondaryMetadata>
</TaskCard>
```

### 2. Provide Immediate and Clear Feedback

**Principle**: Give instant visual feedback for all user actions to maintain engagement and confirm task completion.

#### Implementation:

- **Loading States**: Show progress indicators for any action taking >100ms
- **Success Confirmation**: Clear visual/haptic feedback for completed actions
- **Error Prevention**: Validation and guidance before errors occur
- **State Changes**: Obvious visual changes for status updates

#### Examples:

```tsx
// Task completion feedback
const handleTaskComplete = async (taskId: string) => {
  setTaskStatus(taskId, 'completing'); // Immediate optimistic update

  try {
    await updateTask(taskId, { status: 'done' });
    showToast('Task completed! 🎉', { type: 'success' });
    setTaskStatus(taskId, 'done');
  } catch (error) {
    setTaskStatus(taskId, 'pending'); // Revert on error
    showToast('Failed to complete task', { type: 'error' });
  }
};
```

### 3. Reduce Distractions and Visual Noise

**Principle**: Create calm, focused interfaces that don't compete for attention.

#### Implementation:

- **Limited Color Palette**: Use 3-4 colors maximum per view
- **Meaningful Animation**: Motion that serves a purpose, not decoration
- **White Space**: Generous spacing to separate content areas
- **Subtle Borders**: Gentle separation without harsh visual breaks

#### Color System:

```css
/* ADHD-optimized color palette */
:root {
  /* Primary palette - maximum 3 colors per view */
  --color-energy-high: #10b981; /* Green - positive energy */
  --color-energy-medium: #f59e0b; /* Amber - moderate energy */
  --color-energy-low: #6366f1; /* Indigo - calm energy */

  /* Neutral palette - backgrounds and text */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f9fafb;
  --color-text-primary: #111827;
  --color-text-secondary: #6b7280;

  /* Semantic colors - used sparingly */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
}
```

### 4. Support Time Awareness and Management

**Principle**: Help users understand time requirements and manage their energy throughout the day.

#### Implementation:

- **Time Estimates**: Show realistic time requirements for tasks
- **Energy Mapping**: Visual indicators for energy levels and optimal timing
- **Progress Indicators**: Clear completion status and remaining work
- **Calendar Integration**: Visual time blocking and schedule awareness

#### Examples:

```tsx
<TaskCard task={task}>
  <TimeInfo>
    <EstimatedTime>{task.estimatedMinutes}min</EstimatedTime>
    <BestTime energyLevel={task.energyLevel}>Best: {getOptimalTimeSlot(task.energyLevel)}</BestTime>
    <DeadlineCountdown deadline={task.deadline} />
  </TimeInfo>
</TaskCard>
```

### 5. Implement Gentle Notifications

**Principle**: Provide helpful reminders without overwhelming or interrupting focus states.

#### Implementation:

- **Batched Notifications**: Group similar notifications to reduce interruptions
- **Priority-Based Timing**: Urgent items can interrupt, others wait for natural breaks
- **User Control**: Easy to dismiss, snooze, or disable notifications
- **Focus Mode**: Respect "do not disturb" states during deep work

### 6. Enable Hyperfocus Support

**Principle**: When users are in deep focus, don't break their flow unnecessarily.

#### Implementation:

- **Session Detection**: Identify when users are in focused work sessions
- **Minimal Interruptions**: Queue non-urgent notifications during focus
- **Quick Actions**: Enable task updates without leaving current context
- **Auto-Save**: Prevent work loss during focus sessions

```tsx
// Focus session detection
const useFocusSession = () => {
  const [inFocusSession, setInFocusSession] = useState(false);
  const [sessionStart, setSessionStart] = useState(null);

  useEffect(() => {
    const detectFocus = () => {
      const recentActivity = getRecentTaskActivity();
      const consecutiveActivity = recentActivity.duration;

      if (consecutiveActivity > FOCUS_THRESHOLD) {
        setInFocusSession(true);
        if (!sessionStart) setSessionStart(Date.now());
      } else {
        setInFocusSession(false);
        setSessionStart(null);
      }
    };

    const interval = setInterval(detectFocus, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [sessionStart]);

  return { inFocusSession, sessionDuration: sessionStart ? Date.now() - sessionStart : 0 };
};
```

## 🎨 Visual Design Guidelines

### Typography Hierarchy

```css
/* Clear, scannable text hierarchy */
.heading-1 {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
}
.heading-2 {
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.3;
}
.heading-3 {
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.4;
}
.body {
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.6;
}
.caption {
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.5;
}
```

### Spacing System

```css
/* 8px grid system for predictable layouts */
:root {
  --space-xs: 4px; /* Tight spacing */
  --space-sm: 8px; /* Small gaps */
  --space-md: 16px; /* Standard spacing */
  --space-lg: 24px; /* Section separation */
  --space-xl: 32px; /* Major sections */
  --space-2xl: 48px; /* Page sections */
}
```

### Motion Guidelines

```css
/* Reduced motion by default, enhanced when preferred */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Gentle animations for enhanced motion users */
@media (prefers-reduced-motion: no-preference) {
  .task-card {
    transition:
      transform 150ms ease,
      box-shadow 150ms ease;
  }

  .task-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
}
```

## 🔧 Implementation Patterns

### Focus Management

```tsx
const FocusProvider = ({ children }) => {
  const [focusMode, setFocusMode] = useState(false);
  const [focusStartTime, setFocusStartTime] = useState(null);

  const enterFocusMode = useCallback(() => {
    setFocusMode(true);
    setFocusStartTime(Date.now());
    // Suppress non-critical notifications
    notificationService.setMode('focus');
  }, []);

  const exitFocusMode = useCallback(() => {
    setFocusMode(false);
    setFocusStartTime(null);
    notificationService.setMode('normal');
    // Show queued notifications
    notificationService.flushQueue();
  }, []);

  return (
    <FocusContext.Provider
      value={{
        focusMode,
        focusStartTime,
        enterFocusMode,
        exitFocusMode,
      }}
    >
      {children}
    </FocusContext.Provider>
  );
};
```

### Energy-Aware Scheduling

```tsx
const useEnergyOptimization = (tasks, userEnergyPattern) => {
  return useMemo(() => {
    const currentHour = new Date().getHours();
    const currentEnergyLevel = getUserEnergyLevel(currentHour, userEnergyPattern);

    // Sort tasks by energy match
    const optimizedTasks = tasks.sort((a, b) => {
      const aMatch = getEnergyMatch(a.energyLevel, currentEnergyLevel);
      const bMatch = getEnergyMatch(b.energyLevel, currentEnergyLevel);
      return bMatch - aMatch;
    });

    return {
      recommendedTasks: optimizedTasks.slice(0, 3),
      currentEnergyLevel,
      nextEnergyShift: getNextEnergyShift(userEnergyPattern),
    };
  }, [tasks, userEnergyPattern]);
};
```

### Cognitive Load Measurement

```tsx
const useCognitiveLoad = () => {
  const [loadLevel, setLoadLevel] = useState('low');

  useEffect(() => {
    const calculateLoad = () => {
      const factors = {
        taskCount: getVisibleTaskCount(),
        openModals: getOpenModalCount(),
        notifications: getUnreadNotificationCount(),
        activeFilters: getActiveFilterCount(),
      };

      const totalLoad = Object.values(factors).reduce((sum, count) => sum + count, 0);

      if (totalLoad > 10) setLoadLevel('high');
      else if (totalLoad > 5) setLoadLevel('medium');
      else setLoadLevel('low');
    };

    calculateLoad();
    const interval = setInterval(calculateLoad, 2000);
    return () => clearInterval(interval);
  }, []);

  return loadLevel;
};
```

## 🧪 Testing ADHD-Friendly Features

### Cognitive Load Testing

```tsx
describe('Cognitive Load Management', () => {
  test('limits visible information per view', () => {
    render(<TaskList tasks={largeMockTaskList} />);

    // Should not show more than 7±2 items initially (Miller's Rule)
    const visibleTasks = screen.getAllByRole('article');
    expect(visibleTasks.length).toBeLessThanOrEqual(9);
  });

  test('provides progressive disclosure for details', () => {
    render(<TaskCard task={complexTask} />);

    // Essential info visible immediately
    expect(screen.getByText(complexTask.title)).toBeVisible();
    expect(screen.getByLabelText(/energy level/i)).toBeVisible();

    // Additional details hidden initially
    expect(screen.queryByText(complexTask.description)).not.toBeVisible();

    // Details revealed on interaction
    fireEvent.click(screen.getByLabelText(/show details/i));
    expect(screen.getByText(complexTask.description)).toBeVisible();
  });
});
```

### Focus State Testing

```tsx
describe('Focus Management', () => {
  test('maintains focus during task interactions', () => {
    render(<TaskCard task={mockTask} />);

    const taskElement = screen.getByRole('article');
    taskElement.focus();

    // Perform action that updates task
    fireEvent.click(screen.getByLabelText(/complete task/i));

    // Focus should remain on task after update
    expect(document.activeElement).toBe(taskElement);
  });

  test('provides skip links for keyboard navigation', () => {
    render(<Dashboard />);

    // Tab to first element should reveal skip links
    fireEvent.keyDown(document.body, { key: 'Tab' });

    expect(screen.getByText(/skip to main content/i)).toBeVisible();
    expect(screen.getByText(/skip to navigation/i)).toBeVisible();
  });
});
```

### Energy Pattern Testing

```tsx
describe('Energy-Aware Features', () => {
  test('suggests appropriate tasks for current energy level', () => {
    const highEnergyTime = setMockTime('09:00'); // Morning
    render(<TaskRecommendations userEnergyPattern={defaultPattern} />);

    const recommendations = screen.getAllByTestId('recommended-task');
    const highEnergyTasks = recommendations.filter(task => task.dataset.energyLevel === 'HIGH');

    expect(highEnergyTasks.length).toBeGreaterThan(0);
  });

  test('provides energy level indicators', () => {
    render(<TaskCard task={{ ...mockTask, energyLevel: 'HIGH' }} />);

    const energyBadge = screen.getByLabelText(/high energy/i);
    expect(energyBadge).toHaveClass('energy-high');
    expect(energyBadge).toHaveStyle({ backgroundColor: '#10b981' });
  });
});
```

## 📊 Measuring ADHD-Friendly Success

### Key Metrics

1. **Task Completion Rate**: Higher completion rates indicate better focus support
2. **Session Duration**: Longer engaged sessions suggest reduced distractibility
3. **Error Rate**: Lower errors indicate clearer interfaces and feedback
4. **User Satisfaction**: Specific feedback on cognitive load and focus support

### Analytics Implementation

```tsx
const useADHDMetrics = () => {
  const trackFocusSession = useCallback((duration, tasksCompleted) => {
    analytics.track('focus_session_completed', {
      duration_minutes: duration / 60000,
      tasks_completed: tasksCompleted,
      average_task_time: duration / tasksCompleted,
    });
  }, []);

  const trackCognitiveLoad = useCallback((loadLevel, userAction) => {
    analytics.track('cognitive_load_measurement', {
      load_level: loadLevel,
      user_action: userAction,
      timestamp: Date.now(),
    });
  }, []);

  return { trackFocusSession, trackCognitiveLoad };
};
```

## 🎯 Conclusion

ADHD-friendly design isn't just about accommodation—it creates better experiences for all users. By reducing cognitive load, providing clear feedback, and supporting natural attention patterns, we build interfaces that are more intuitive, efficient, and inclusive.

### Key Takeaways:

1. **Simplify ruthlessly**: Every element should have a clear purpose
2. **Provide immediate feedback**: Never leave users wondering about system state
3. **Respect attention patterns**: Work with natural focus cycles, not against them
4. **Test with real users**: Include neurodivergent users in design validation
5. **Measure what matters**: Track engagement and completion, not just usage

Remember: An interface that works well for ADHD brains tends to work exceptionally well for neurotypical brains too. Good ADHD-friendly design is simply good design.
