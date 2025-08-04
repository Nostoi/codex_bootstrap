# Calendar Component Accessibility Checklist

## WCAG 2.2 AA Compliance Requirements

### ✅ Color and Contrast

- [ ] All text has contrast ratio ≥4.5:1 (normal text) or ≥3:1 (large text 18px+)
- [ ] Energy level colors maintain accessibility contrast ratios
- [ ] Focus type colors are distinguishable for colorblind users
- [ ] Information is not conveyed by color alone (use icons, text, patterns)
- [ ] High contrast mode overrides are implemented
- [ ] Colorblind-friendly alternatives available (deuteranopia, protanopia, tritanopia)

### ✅ Keyboard Navigation

- [ ] All interactive elements are reachable via keyboard
- [ ] Tab order is logical and predictable
- [ ] Arrow keys navigate between calendar cells
- [ ] Enter/Space activate buttons and links
- [ ] Escape cancels operations and closes modals
- [ ] Home/End jump to beginning/end of rows
- [ ] Page Up/Down navigate between weeks/months
- [ ] Focus indicators are clearly visible (3px blue outline)
- [ ] Focus traps work correctly in modals
- [ ] Skip links allow bypassing repetitive navigation

### ✅ Screen Reader Support

- [ ] Semantic HTML structure (nav, main, section, article)
- [ ] ARIA roles correctly implemented (grid, gridcell, button, etc.)
- [ ] ARIA labels provide context for all interactive elements
- [ ] ARIA live regions announce dynamic content changes
- [ ] Calendar structure is announced correctly
- [ ] Event details are read in logical order
- [ ] Date navigation is clearly announced
- [ ] Loading states are announced to screen readers
- [ ] Error messages are associated with relevant fields

### ✅ Motion and Animation

- [ ] Respects `prefers-reduced-motion` media query
- [ ] Animations can be disabled via user settings
- [ ] Essential motion (drag feedback) has static alternatives
- [ ] Transition durations are reasonable (≤500ms)
- [ ] No flashing content that could trigger seizures
- [ ] Parallax and auto-playing animations are optional

## ADHD-Specific Accessibility

### ✅ Cognitive Load Management

- [ ] Maximum 3 colors per view to prevent overwhelm
- [ ] Consistent visual patterns across all components
- [ ] Clear visual hierarchy with appropriate font sizing
- [ ] Progressive disclosure prevents information overload
- [ ] Error messages are clear and actionable
- [ ] Instructions are concise and scannable
- [ ] Related information is grouped visually

### ✅ Interaction Predictability

- [ ] 300ms drag delay prevents accidental operations
- [ ] Confirmation dialogs for significant changes
- [ ] Consistent button placement across views
- [ ] Clear affordances for all interactive elements
- [ ] Undo functionality for reversible actions
- [ ] Gentle feedback for user actions
- [ ] Predictable response to user input

### ✅ Customization Options

- [ ] Font size adjustment (12px-24px range)
- [ ] High contrast mode toggle
- [ ] Reduced motion preference setting
- [ ] Color customization for energy levels
- [ ] Audio feedback enable/disable
- [ ] Drag delay customization (100ms-1000ms)
- [ ] Event density control (max events per view)

## Component-Specific Requirements

### CalendarView (Main Container)

```typescript
// Required ARIA attributes
<div
  role="application"
  aria-label="Calendar view for task and event management"
  aria-describedby="calendar-instructions"
>
  <div id="calendar-instructions" className="sr-only">
    Use arrow keys to navigate between dates, Enter to select, Tab to move between sections
  </div>
</div>
```

**Checklist:**

- [ ] Main container has application role
- [ ] Instructions provided for screen readers
- [ ] Keyboard shortcuts documented
- [ ] Focus management on view changes

### CalendarHeader (Navigation)

```typescript
<nav aria-label="Calendar navigation">
  <button
    aria-label="Previous month"
    aria-describedby="nav-hint"
  >
    Previous
  </button>
  <h2 aria-live="polite">July 2025</h2>
  <button aria-label="Next month">Next</button>
</nav>
```

**Checklist:**

- [ ] Navigation landmark role
- [ ] Descriptive button labels
- [ ] Current date announced with aria-live
- [ ] View switcher uses radio button group pattern

### CalendarGrid (Main Calendar)

```typescript
<div
  role="grid"
  aria-label="Calendar grid showing July 2025"
  aria-rowcount={6}
  aria-colcount={7}
>
  <div role="rowgroup">
    <div role="row" aria-rowindex={1}>
      <div
        role="columnheader"
        aria-label="Sunday"
      >
        Sun
      </div>
    </div>
  </div>
</div>
```

**Checklist:**

- [ ] Grid role with row/column structure
- [ ] Row and column headers properly labeled
- [ ] Row and column indices provided
- [ ] Cell selection state announced

### TimeSlot Components

```typescript
<div
  role="gridcell"
  aria-label="9:00 AM, July 29th, 2 events"
  aria-selected={isSelected}
  aria-expanded={hasEvents}
  tabIndex={isSelected ? 0 : -1}
  onClick={onSlotClick}
  onKeyDown={onKeyDown}
>
```

**Checklist:**

- [ ] Gridcell role for time slots
- [ ] Descriptive labels with time and date
- [ ] Selection state communicated
- [ ] Event count announced
- [ ] Roving tabindex for keyboard navigation

### CalendarEvent Components

```typescript
<div
  role="button"
  aria-label="Team meeting, 9:00 AM to 10:00 AM, High energy, Google Calendar"
  aria-describedby="event-details"
  draggable={true}
  aria-grabbed={isDragging}
  onDragStart={onDragStart}
>
  <div id="event-details" className="sr-only">
    Press Enter to edit, or drag to reschedule
  </div>
</div>
```

**Checklist:**

- [ ] Button role for interactive events
- [ ] Complete event information in aria-label
- [ ] Drag state communicated with aria-grabbed
- [ ] Instructions provided for interaction

### Modal Dialogs

```typescript
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Event Details</h2>
  <p id="modal-description">Edit or delete this calendar event</p>
</div>
```

**Checklist:**

- [ ] Dialog role with aria-modal
- [ ] Title and description properly associated
- [ ] Focus trap implemented
- [ ] Escape key closes modal
- [ ] Focus returns to trigger element

## Testing Requirements

### Automated Testing

- [ ] axe-core accessibility tests pass
- [ ] Jest unit tests for keyboard navigation
- [ ] Playwright E2E tests include accessibility checks
- [ ] Color contrast validation in CI/CD
- [ ] ARIA attribute validation

### Manual Testing

- [ ] Screen reader testing (NVDA, JAWS, VoiceOver)
- [ ] Keyboard-only navigation testing
- [ ] High contrast mode verification
- [ ] Reduced motion testing
- [ ] Mobile accessibility testing
- [ ] Cognitive load assessment with ADHD users

### Performance Requirements

- [ ] Tab navigation latency <100ms
- [ ] Screen reader announcement delays appropriate
- [ ] Focus indicators render within 16ms
- [ ] No layout shifts during navigation
- [ ] Smooth animations maintain 60fps

## Validation Tools

### Automated Tools

- **axe-core**: Comprehensive accessibility testing
- **lighthouse**: Performance and accessibility audit
- **pa11y**: Command line accessibility tester
- **Color Oracle**: Colorblind simulation
- **WAVE**: Web accessibility evaluation

### Browser Extensions

- **axe DevTools**: Real-time accessibility testing
- **Accessibility Insights**: Microsoft accessibility testing
- **Colour Contrast Analyser**: Manual contrast checking
- **HeadingsMap**: Document structure validation

### Screen Readers

- **NVDA** (Windows): Primary testing target
- **JAWS** (Windows): Enterprise screen reader
- **VoiceOver** (macOS/iOS): Apple ecosystem testing
- **TalkBack** (Android): Mobile accessibility testing

## Implementation Notes

### CSS Considerations

```css
/* Focus indicators must be clearly visible */
.calendar-element:focus {
  outline: 3px solid var(--focus-color);
  outline-offset: 2px;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .calendar-animation {
    animation: none;
    transition: none;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .calendar-grid {
    border: 2px solid;
    background: ButtonFace;
    color: ButtonText;
  }
}
```

### JavaScript Considerations

```typescript
// Respect user preferences
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const animationDuration = prefersReducedMotion ? 0 : 200;

// Announce changes to screen readers
const announceToScreenReader = (message: string) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  document.body.appendChild(announcement);
  setTimeout(() => document.body.removeChild(announcement), 1000);
};
```

This checklist ensures comprehensive accessibility coverage for the calendar component, with special attention to ADHD-friendly design patterns and cognitive accessibility requirements.
