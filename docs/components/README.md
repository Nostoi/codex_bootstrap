# Component Library Documentation

## 🧩 Overview

The Helmsman component library is built with ADHD-friendly design principles, ensuring consistent interactions, minimal cognitive load, and excellent accessibility. All components follow our design token system and are tested for WCAG 2.2 AA compliance.

## 🎨 Design Principles

### ADHD-Optimized Patterns
- **Predictable Interactions**: Consistent button behaviors, form patterns, and navigation
- **Clear Visual Hierarchy**: Progressive disclosure and logical information organization
- **Minimal Cognitive Load**: Simplified interfaces with essential information prioritized
- **Fast Performance**: Optimized for quick load times and smooth interactions

### Accessibility-First
- **Keyboard Navigation**: Full keyboard support with visible focus indicators
- **Screen Reader Compatibility**: Semantic HTML with comprehensive ARIA labels
- **High Contrast Support**: 4.5:1 minimum contrast ratios with theme support
- **Motion Sensitivity**: Respect for `prefers-reduced-motion` user preferences

## 📦 Core Components

### Layout Components

#### AppShell
Main application layout with ADHD-friendly navigation patterns.

```tsx
import { AppShell } from '@/components/layout/AppShell';

<AppShell
  user={currentUser}
  sidebarCollapsed={false}
  onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
  aiPanelOpen={false}
  onAIPanelToggle={() => setAIPanelOpen(!aiPanelOpen)}
>
  <Dashboard />
</AppShell>
```

**Props:**
- `user`: Current user object with name and avatar
- `sidebarCollapsed`: Boolean for sidebar state
- `onSidebarToggle`: Function to toggle sidebar
- `aiPanelOpen`: Boolean for AI panel state
- `onAIPanelToggle`: Function to toggle AI panel
- `children`: Main content area

**Accessibility:**
- ARIA landmarks (main, nav, complementary)
- Keyboard shortcuts (Alt+S for sidebar, Alt+A for AI panel)
- Focus management between panels
- Skip links for quick navigation

#### Dashboard
Main dashboard component integrating task cards, filtering, and real-time planning.

```tsx
import { Dashboard } from '@/components/pages/Dashboard';

<Dashboard />
```

**Features:**
- Grid layout with responsive task cards
- FilterBar integration with URL synchronization
- Real-time plan updates via WebSocket
- Energy optimization display
- Drag-and-drop task scheduling

**ADHD Optimizations:**
- F-pattern layout (important info top-left)
- Consistent card patterns
- Clear loading states
- Minimal visual noise

### UI Components

#### TaskCard
Enhanced task display with comprehensive metadata and ADHD-friendly design.

```tsx
import { TaskCard } from '@/components/ui/TaskCard';

<TaskCard
  task={task}
  onClick={handleTaskClick}
  onStatusChange={handleStatusChange}
  onEdit={handleEdit}
  compact={false}
  interactive={true}
/>
```

**Props:**
- `task`: Task object with full metadata
- `onClick`: Handler for task selection
- `onStatusChange`: Handler for status updates
- `onEdit`: Handler for task editing
- `compact`: Boolean for condensed display
- `interactive`: Boolean for click/hover interactions

**Metadata Display:**
- Energy level badges (High=green, Medium=amber, Low=indigo)
- Focus type icons (🎨Creative, ⚙️Technical, 📋Admin, 👥Social)
- Priority indicators (visual border weight)
- Time estimates and deadline urgency
- AI suggestions with dismissible interface

**Accessibility:**
- Comprehensive ARIA labels with full context
- Keyboard navigation (Tab/Enter/Space)
- Screen reader friendly metadata announcements
- High contrast focus indicators

#### FilterBar
Comprehensive filtering component with ADHD-friendly controls.

```tsx
import { FilterBar } from '@/components/ui/FilterBar';

<FilterBar
  filters={currentFilters}
  onFiltersChange={handleFiltersChange}
  onClear={handleClear}
  onReset={handleReset}
  loading={isLoading}
  compact={isMobile}
/>
```

**Props:**
- `filters`: Current filter state object
- `onFiltersChange`: Handler for filter updates
- `onClear`: Handler for clearing all filters
- `onReset`: Handler for resetting to defaults
- `loading`: Boolean for loading state
- `compact`: Boolean for mobile layout

**Filter Types:**
- Search input with 300ms debouncing
- Energy level multi-select
- Focus type checkboxes
- Priority range slider
- Date range picker
- Status toggles

**ADHD Features:**
- Sticky positioning for always-accessible filtering
- Clear visual grouping of related filters
- Immediate feedback on changes
- Easy reset/clear options

#### Button Variants
Consistent button system with clear interaction patterns.

```tsx
import { Button } from '@/components/ui/Button';

// Primary action button
<Button variant="primary" size="medium" loading={isSubmitting}>
  Create Task
</Button>

// Secondary action button
<Button variant="secondary" size="medium" disabled={!canSave}>
  Save Draft
</Button>

// Destructive action button
<Button variant="destructive" size="small">
  Delete
</Button>
```

**Variants:**
- `primary`: Main call-to-action buttons
- `secondary`: Secondary actions
- `ghost`: Subtle actions
- `destructive`: Delete/remove actions

**Sizes:**
- `small`: Compact interfaces
- `medium`: Standard size
- `large`: Prominent actions

**States:**
- `loading`: Shows spinner with loading text
- `disabled`: Non-interactive state with clear visual indication

#### Badge System
Status and metadata indicators with consistent color coding.

```tsx
import { Badge } from '@/components/ui/Badge';

// Energy level badge
<Badge variant="energy" value="HIGH">
  High Energy
</Badge>

// Status badge
<Badge variant="status" value="in-progress">
  In Progress
</Badge>

// Confidence badge for AI suggestions
<Badge variant="confidence" value={0.85}>
  85% Confident
</Badge>
```

**Badge Types:**
- `energy`: Energy level indicators (HIGH/MEDIUM/LOW)
- `status`: Task status (pending/in-progress/blocked/done)
- `confidence`: AI confidence scores
- `priority`: Priority level indicators
- `focus`: Focus type categories

**Color System:**
- Energy: High=green, Medium=amber, Low=indigo
- Status: Pending=gray, Progress=blue, Blocked=red, Done=green
- Priority: 1-2=red, 3=amber, 4-5=green

### Form Components

#### Input Components
Accessible form inputs with clear validation patterns.

```tsx
import { Input, TextArea, Select } from '@/components/ui/form';

<Input
  label="Task Title"
  placeholder="Enter task title..."
  value={title}
  onChange={setTitle}
  error={titleError}
  required
/>

<TextArea
  label="Task Description"
  placeholder="Describe the task..."
  value={description}
  onChange={setDescription}
  rows={4}
/>

<Select
  label="Energy Level"
  value={energyLevel}
  onChange={setEnergyLevel}
  options={energyOptions}
  placeholder="Select energy level..."
/>
```

**Accessibility Features:**
- Clear label associations
- Error message announcements
- Keyboard navigation support
- Focus indicators
- Screen reader instructions

#### Modal System
Accessible modal dialogs with proper focus management.

```tsx
import { Modal } from '@/components/ui/Modal';

<Modal
  isOpen={isModalOpen}
  onClose={handleClose}
  title="Create New Task"
  size="medium"
>
  <TaskForm onSubmit={handleSubmit} onCancel={handleClose} />
</Modal>
```

**Features:**
- Focus trap within modal
- Backdrop click to close
- Escape key support
- Scroll lock on body
- ARIA modal role

### Data Display Components

#### LazyWrapper
Performance-optimized lazy loading with ADHD-friendly loading states.

```tsx
import { LazyWrapper } from '@/components/ui/LazyWrapper';

<LazyWrapper
  threshold={0.1}
  fallback={<TaskCardSkeleton />}
  errorBoundary={<TaskCardError />}
>
  <TaskCard task={task} />
</LazyWrapper>
```

**Props:**
- `threshold`: Intersection observer threshold
- `fallback`: Loading state component
- `errorBoundary`: Error state component
- `children`: Content to lazy load

**ADHD Optimizations:**
- Smooth loading transitions
- Predictable skeleton states
- Error boundaries with retry options
- Non-jarring appearance animations

## 🎯 Usage Guidelines

### Composition Patterns
Components are designed to work together seamlessly:

```tsx
// Dashboard composition
<AppShell user={user}>
  <Dashboard>
    <FilterBar filters={filters} onFiltersChange={setFilters} />
    <div className="task-grid">
      {tasks.map(task => (
        <LazyWrapper key={task.id}>
          <TaskCard
            task={task}
            onClick={selectTask}
            onStatusChange={updateTaskStatus}
          />
        </LazyWrapper>
      ))}
    </div>
  </Dashboard>
</AppShell>
```

### Performance Optimization
- Use `LazyWrapper` for content below the fold
- Implement proper memoization with `React.memo`
- Leverage Next.js Image optimization
- Follow bundle splitting best practices

### Accessibility Checklist
- [ ] Proper heading hierarchy (h1 → h2 → h3)
- [ ] Descriptive alt text for images
- [ ] Keyboard navigation support
- [ ] Focus indicators visible
- [ ] Error messages announced
- [ ] High contrast compliance
- [ ] Motion preferences respected

## 🧪 Testing Components

### Unit Testing
```tsx
import { render, screen } from '@testing-library/react';
import { TaskCard } from '@/components/ui/TaskCard';

test('renders task card with metadata', () => {
  const task = {
    id: '1',
    title: 'Test Task',
    energyLevel: 'HIGH',
    focusType: 'TECHNICAL',
    priority: 4
  };

  render(<TaskCard task={task} />);
  
  expect(screen.getByText('Test Task')).toBeInTheDocument();
  expect(screen.getByText('High Energy')).toBeInTheDocument();
  expect(screen.getByLabelText(/technical focus/i)).toBeInTheDocument();
});
```

### Accessibility Testing
```tsx
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('task card has no accessibility violations', async () => {
  const { container } = render(<TaskCard task={mockTask} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Storybook Integration
All components include comprehensive Storybook stories:

```tsx
// TaskCard.stories.tsx
export default {
  title: 'Components/TaskCard',
  component: TaskCard,
  parameters: {
    docs: {
      description: {
        component: 'Enhanced task card with ADHD-friendly metadata display'
      }
    }
  }
};

export const Default = {
  args: {
    task: mockTask,
    interactive: true
  }
};

export const HighPriority = {
  args: {
    task: { ...mockTask, priority: 5 },
    interactive: true
  }
};
```

## 📱 Responsive Design

All components follow mobile-first responsive design:

### Breakpoints
- `sm`: 640px (mobile)
- `md`: 768px (tablet)
- `lg`: 1024px (desktop)
- `xl`: 1280px (large desktop)

### Responsive Patterns
- Grid layouts that stack on mobile
- Touch-friendly interaction targets (44px minimum)
- Readable font sizes at all breakpoints
- Optimized image loading per device

## 🔧 Customization

### Theme Support
Components support light/dark themes via CSS custom properties:

```css
:root {
  --color-primary: #3b82f6;
  --color-secondary: #6b7280;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
}

[data-theme="dark"] {
  --color-primary: #60a5fa;
  --color-secondary: #9ca3af;
  /* ... */
}
```

### Design Token Override
Customize spacing, colors, and typography through design tokens:

```ts
// design-tokens.ts
export const tokens = {
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  },
  colors: {
    energy: {
      high: '#10b981',
      medium: '#f59e0b', 
      low: '#6366f1'
    }
  }
};
```

## 🚀 Performance Tips

### Bundle Optimization
- Import components individually to enable tree shaking
- Use dynamic imports for large components
- Implement proper code splitting

### Memory Management
- Clean up event listeners in useEffect cleanup
- Avoid creating new objects in render functions
- Use React.memo for expensive components

### Network Optimization
- Implement proper caching strategies
- Use React Query for server state management
- Optimize image loading with Next.js Image

---

For more detailed information, see individual component documentation in Storybook or explore the source code with comprehensive TypeScript types and JSDoc comments.
