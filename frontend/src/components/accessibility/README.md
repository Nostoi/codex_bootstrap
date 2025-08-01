# Accessibility Implementation for Helmsman

## Overview

This directory contains a comprehensive accessibility implementation designed specifically for ADHD-friendly interfaces, providing WCAG 2.2 AA compliance and optimized keyboard navigation patterns.

## 🎯 Key Features

### Core Accessibility Infrastructure
- **Focus Management**: Advanced focus trapping and restoration
- **Live Announcements**: Screen reader compatible announcements
- **Keyboard Navigation**: Comprehensive keyboard support with shortcuts
- **User Preferences**: Automatic detection of motion, contrast, and other preferences

### ADHD-Optimized Features
- **Energy Level Indicators**: Visual cues for task energy requirements
- **Cognitive Load Indicators**: Feedback on mental effort required
- **Reduced Motion Support**: Respects user motion preferences
- **Progress Indicators**: Clear progress feedback to reduce anxiety

### Component Library
- **AccessibleButton**: WCAG-compliant buttons with energy indicators
- **AccessibleInput**: Form inputs with comprehensive error handling
- **Modal**: Focus-trapped modals with keyboard navigation
- **AccessibleCalendar**: Fully keyboard-navigable calendar with ARIA support

## 📁 File Structure

```
frontend/src/
├── lib/
│   ├── accessibility.ts           # Core accessibility utilities
│   ├── aria-constants.ts          # ARIA patterns and constants
│   ├── keyboard-navigation.ts     # Keyboard navigation utilities
│   └── accessibility-testing.ts   # Testing utilities
└── components/accessibility/
    ├── AccessibilityComponents.tsx # React components
    ├── AccessibleCalendar.tsx     # Calendar component
    └── README.md                  # This file
```

## 🚀 Quick Start

### 1. Wrap your app with AccessibilityProvider

```tsx
import { AccessibilityProvider } from './components/accessibility/AccessibilityComponents';

function App() {
  return (
    <AccessibilityProvider>
      <YourAppContent />
    </AccessibilityProvider>
  );
}
```

### 2. Use accessible components

```tsx
import { 
  AccessibleButton, 
  AccessibleInput, 
  EnergyIndicator 
} from './components/accessibility/AccessibilityComponents';

function TaskForm() {
  return (
    <form>
      <AccessibleInput 
        label="Task name"
        required
        hint="Enter a descriptive name for your task"
      />
      
      <AccessibleButton 
        variant="primary"
        energyLevel="medium"
        announcement="Task created successfully"
      >
        Create Task
      </AccessibleButton>
      
      <EnergyIndicator level="medium" />
    </form>
  );
}
```

### 3. Implement keyboard navigation

```tsx
import { KeyboardNavigationContainer } from './components/accessibility/AccessibilityComponents';

function TaskList() {
  return (
    <KeyboardNavigationContainer direction="vertical">
      <div tabIndex={0}>Task 1</div>
      <div tabIndex={0}>Task 2</div>
      <div tabIndex={0}>Task 3</div>
    </KeyboardNavigationContainer>
  );
}
```

## ⌨️ Keyboard Navigation

### Global Shortcuts
- `Alt+M`: Open main menu
- `Alt+S`: Focus search
- `Alt+H`: Go to home
- `Escape`: Close modal/menu
- `/`: Focus search (when not in input)

### Calendar Navigation
- `Arrow Keys`: Navigate dates
- `Home/End`: First/last day of month
- `PageUp/PageDown`: Previous/next month
- `Enter/Space`: Select date

### Task Navigation
- `j/k`: Next/previous task
- `Enter`: Open task
- `Space`: Toggle completion
- `e`: Edit task
- `d`: Delete task

## 🎨 ADHD-Friendly Features

### Energy Level System
Three energy levels help users manage their capacity:
- **High Energy** ⚡: Complex, demanding tasks
- **Medium Energy** 🔥: Standard tasks
- **Low Energy** 🌱: Simple, low-effort tasks

### Cognitive Load Indicators
Visual feedback on mental effort required:
- **Low** 🧠: Minimal cognitive load
- **Medium** 🤔: Moderate thinking required
- **High** 😵: High concentration needed

### Progress Feedback
Clear progress indicators reduce anxiety and provide motivation:
- Visual progress bars
- Percentage completion
- Task count completion
- Screen reader announcements

## 🧪 Testing

### Manual Testing Checklist
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible and clear
- [ ] Screen readers announce content changes
- [ ] High contrast mode works properly
- [ ] Reduced motion preferences are respected
- [ ] Energy indicators display correctly
- [ ] Progress announcements work

### Automated Testing
The accessibility utilities include comprehensive testing tools:

```tsx
import { expectToBeAccessible, expectKeyboardNavigation } from './lib/accessibility-testing';

// Test WCAG compliance
await expectToBeAccessible(container, {
  wcagLevel: 'AA',
  colorContrast: true,
  focus: true,
  keyboard: true
});

// Test keyboard navigation
await expectKeyboardNavigation(
  container,
  ['ArrowDown', 'Enter'],
  'Navigate and select'
);
```

## 🎯 WCAG 2.2 AA Compliance

### Level A Requirements
- ✅ Keyboard accessibility
- ✅ Text alternatives for images
- ✅ Captions for audio
- ✅ Color is not the only visual means
- ✅ Audio control
- ✅ No seizure-inducing content
- ✅ Skip links
- ✅ Page titles
- ✅ Focus order
- ✅ Link purpose
- ✅ Language of page

### Level AA Requirements
- ✅ Color contrast (4.5:1 for normal text, 3:1 for large text)
- ✅ Resize text (up to 200%)
- ✅ Images of text (avoided when possible)
- ✅ Keyboard focus visible
- ✅ Language of parts
- ✅ Focus management
- ✅ Error identification
- ✅ Labels or instructions
- ✅ Error suggestions
- ✅ Error prevention

## 🔧 Configuration

### Design Tokens
All accessibility features use CSS custom properties from the design token system:

```css
:root {
  /* Focus indicators */
  --focus-outline: 2px solid var(--color-primary);
  --focus-offset: 2px;
  
  /* Energy levels */
  --color-energy-high: hsl(0, 85%, 60%);
  --color-energy-medium: hsl(35, 85%, 55%);
  --color-energy-low: hsl(120, 45%, 50%);
  
  /* Motion preferences */
  --motion-duration: 0.2s;
  --motion-easing: ease;
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --motion-duration: 0s;
  }
}
```

### User Preferences
The system automatically detects and respects user preferences:
- `prefers-reduced-motion`
- `prefers-contrast`
- `prefers-color-scheme`
- Custom energy level preferences

## 🚨 Common Issues and Solutions

### Issue: Focus not visible
**Solution**: Ensure focus styles are properly applied
```css
.my-element:focus-visible {
  outline: var(--focus-outline);
  outline-offset: var(--focus-offset);
}
```

### Issue: Screen reader not announcing changes
**Solution**: Use live regions or the LiveAnnouncer
```tsx
const { announcer } = useAccessibilityContext();
announcer.announce('Task completed successfully');
```

### Issue: Keyboard navigation not working
**Solution**: Ensure proper tabindex and event handling
```tsx
<div 
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter') {
      handleAction();
    }
  }}
>
  Interactive element
</div>
```

## 📚 Resources

### WCAG Guidelines
- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

### ADHD Research
- [ADHD and Web Design](https://adhd-friendly-design-principles.com/)
- [Cognitive Load Theory](https://www.understood.org/en/articles/cognitive-load-theory)

### Testing Tools
- [axe-core](https://github.com/dequelabs/axe-core)
- [Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)

## 🤝 Contributing

When adding new accessibility features:
1. Follow WCAG 2.2 AA guidelines
2. Include ADHD-friendly considerations
3. Add comprehensive keyboard navigation
4. Include screen reader announcements
5. Test with actual assistive technologies
6. Document energy level and cognitive load implications

## 📄 License

This accessibility implementation is part of the Helmsman project and follows the same license terms.
