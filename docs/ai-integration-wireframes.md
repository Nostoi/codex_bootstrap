# AI Integration Component Wireframes

## Overview

This document provides visual wireframes for the AI Integration component system in Helmsman, designed to support task extraction, AI-powered assistance, and seamless integration with the ADHD-friendly dashboard environment.

## Design Principles Applied

- **ADHD-Friendly Interaction**: Clear visual hierarchy, minimal cognitive load, predictable patterns
- **Accessibility First**: WCAG 2.2 AA compliance, keyboard navigation, screen reader support
- **Progressive Disclosure**: Show features incrementally to prevent overwhelming users
- **Energy-Aware Design**: Visual cues that respect user's current energy level and focus state

---

## Component Architecture

### Primary AI Integration Card (Dashboard Sidebar)

```
┌─────────────────────────────────────────────────────────────────┐
│ AI Integration Component                                        │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🤖 AI Assistant                               [●] Connected │ │ ← Header with Status
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Chat History (Scrollable)                    Max Height: 200px│ │ ← Chat Messages Area
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │ User: I need to finish the documentation by Friday      │ │ │
│ │ │ and schedule a team meeting next week.                  │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │ 🤖 AI: I've identified 2 actionable tasks from your    │ │ │
│ │ │ message. Would you like me to extract them?             │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 💭 Ask AI to help plan your day or extract tasks...        │ │ ← Input Textarea
│ │                                                             │ │   (3 rows, auto-resize)
│ │                                              [📤 Send]     │ │ ← Send Button
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────┐ ┌─────────────────────────┐ │
│ │ 📋 Extract Tasks               │ │ 🗑️ Clear Chat          │ │ ← Action Buttons
│ └─────────────────────────────────┘ └─────────────────────────┘ │
│                                                                 │
│ {Task Extraction Results - Conditional Display}                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📝 Extracted Tasks (2)                                      │ │ ← Results Header
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │ ✅ Finish documentation                    [+] Add Task │ │ │ ← Task Item
│ │ │ 📅 Friday • 📚 Administrative • ⚖️ Medium Energy       │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │ ✅ Schedule team meeting                   [+] Add Task │ │ │
│ │ │ 📅 Next week • 👥 Social • 🌱 Low Energy              │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Connection States & Visual Feedback

### 1. Connected State (AI Service Available)

```
┌─────────────────────────────────────────────────────────────────┐
│ 🤖 AI Assistant                               [●] Connected     │ ← Green indicator
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 💭 Ask AI to help plan your day or extract tasks...        │ │ ← Enabled input
│ │                                              [📤 Send]     │ │ ← Enabled button
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ [📋 Extract Tasks]    [🗑️ Clear Chat]                         │ ← Enabled actions
└─────────────────────────────────────────────────────────────────┘
```

### 2. Disconnected State (AI Service Unavailable)

```
┌─────────────────────────────────────────────────────────────────┐
│ 🤖 AI Assistant                              [○] Disconnected   │ ← Gray indicator
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ AI Assistant is disconnected...                             │ │ ← Disabled input
│ │                                           [📤 Send] (disabled)│ │ ← Disabled button
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ [📋 Extract Tasks] (disabled)  [🗑️ Clear Chat]               │ ← Partial disabling
│                                                                 │
│ ⚠️ AI features are temporarily unavailable. You can still      │ ← Status message
│ create tasks manually using the "New Task" button.             │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Processing State (AI Working)

```
┌─────────────────────────────────────────────────────────────────┐
│ 🤖 AI Assistant                               [⟳] Processing    │ ← Animated spinner
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Processing your request...                                   │ │ ← Processing message
│ │                                           [📤 Send] (disabled)│ │ ← Disabled during work
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ [📋 Extract Tasks] (disabled)  [🗑️ Clear Chat]               │ ← Extract disabled
│                                                                 │
│ ⏳ AI is analyzing your input and extracting tasks...          │ ← Live status update
└─────────────────────────────────────────────────────────────────┘
```

---

## New Task Button Integration

### Dashboard Header Integration

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ Helmsman Dashboard                                                                   │
│ ┌─────────────────────┐ ┌─────────────────┐ ┌─────────────────────────────────────┐ │
│ │ 📋 Grid  🎯 Focus  │ │ 🔄 Refresh Plan │ │           [➕ New Task]            │ │ ← Primary CTA
│ └─────────────────────┘ └─────────────────┘ └─────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ Main Dashboard Content                                                               │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Sidebar Quick Actions Integration

```
┌─────────────────────────────────────────────────────────────────┐
│ 🚀 Quick Actions                                                │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                    [➕ New Task]                            │ │ ← Primary action
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │              [📋 Extract from Text]                         │ │ ← AI shortcut
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │              [📊 View Daily Plan]                           │ │ ← Planning action
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Responsive Design Patterns

### Mobile Layout (≤768px)

```
┌─────────────────────────────────────┐
│ 🤖 AI Assistant       [●] Connected │ ← Compact header
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 💭 Ask AI...                   │ │ ← Smaller input
│ │                       [📤]     │ │ ← Icon-only send
│ └─────────────────────────────────┘ │
│                                     │
│ [📋] Extract  [🗑️] Clear          │ ← Icon buttons
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Chat history collapsed          │ │ ← Collapsible
│ │ [▼] Show Messages (3)           │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Tablet Layout (768px-1024px)

```
┌─────────────────────────────────────────────────────────┐
│ 🤖 AI Assistant                        [●] Connected    │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Chat History (Medium Height: 150px)                 │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 💭 Ask AI to help plan your day...      [📤 Send] │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ [📋 Extract Tasks]              [🗑️ Clear Chat]       │
└─────────────────────────────────────────────────────────┘
```

---

## Interaction Flow Diagrams

### Task Extraction Workflow

```
User Input
    ↓
[Send Message] → AI Processing → Show Loading State
    ↓
AI Response Generated
    ↓
[Extract Tasks Button] Enabled
    ↓
User Clicks Extract → Processing Animation
    ↓
Tasks Displayed → Individual [Add Task] Buttons
    ↓
Task Added to Dashboard → Success Feedback
```

### Error Recovery Patterns

```
AI Connection Lost
    ↓
Switch to Disconnected State → Show Status Message
    ↓
User Can Still: [Clear Chat] + [New Task] (Manual)
    ↓
Auto-Retry Connection (Background) → Success → Re-enable
```

---

## Accessibility Implementation

### ARIA Labels and Roles

```html
<!-- Component Container -->
<section aria-label="AI Assistant" role="region">
  <!-- Status Indicator -->
  <div aria-live="polite" aria-label="AI connection status">
    <span role="img" aria-label="Connected">●</span> Connected
  </div>

  <!-- Chat Input -->
  <textarea
    aria-label="Type your message to AI Assistant"
    placeholder="Ask AI to help plan your day or extract tasks..."
    aria-describedby="ai-input-help"
  ></textarea>
  <div id="ai-input-help" class="sr-only">
    Enter text to get AI assistance with task planning and extraction
  </div>

  <!-- Action Buttons -->
  <button aria-label="Extract tasks from conversation">📋 Extract Tasks</button>

  <!-- Live Region for Status Updates -->
  <div aria-live="polite" aria-atomic="true" class="sr-only">AI is processing your request...</div>
</section>
```

### Keyboard Navigation Flow

```
Tab Order:
1. Chat History (scrollable with arrow keys)
2. Message Input Textarea (Enter to send)
3. Send Button
4. Extract Tasks Button
5. Clear Chat Button
6. Individual Add Task Buttons (when results shown)

Keyboard Shortcuts:
- Ctrl/Cmd + Enter: Send message
- Escape: Clear current input
- Ctrl/Cmd + K: Focus on input area
```

---

## Visual Design Tokens

### Colors (ADHD-Friendly)

```css
/* AI Assistant Status */
.ai-connected {
  color: #10b981;
} /* Green - calming success */
.ai-disconnected {
  color: #6b7280;
} /* Gray - neutral inactive */
.ai-processing {
  color: #f59e0b;
} /* Amber - gentle activity */
.ai-error {
  color: #ef4444;
} /* Red - clear but not harsh */

/* Input States */
.ai-input-enabled {
  border-color: #3b82f6;
  background: #ffffff;
}
.ai-input-disabled {
  border-color: #d1d5db;
  background: #f9fafb;
  cursor: not-allowed;
}

/* Focus Indicators (WCAG 2.2 AA) */
.ai-focus-visible {
  outline: 3px solid #3b82f6;
  outline-offset: 2px;
}
```

### Spacing (8px Grid System)

```css
.ai-component-padding {
  padding: 16px;
} /* 2 grid units */
.ai-element-spacing {
  margin-bottom: 12px;
} /* 1.5 grid units */
.ai-button-padding {
  padding: 8px 16px;
} /* 1x2 grid units */
.ai-input-padding {
  padding: 12px;
} /* 1.5 grid units */
```

### Typography (Inter Font Family)

```css
.ai-header {
  font-size: 1.125rem; /* 18px */
  font-weight: 600;
  line-height: 1.25;
}
.ai-body {
  font-size: 0.875rem; /* 14px */
  line-height: 1.5;
}
.ai-caption {
  font-size: 0.75rem; /* 12px */
  line-height: 1.333;
  color: #6b7280;
}
```

---

## Testing Specifications

### E2E Test Selectors

```typescript
export const aiIntegrationSelectors = {
  container: '[data-testid="ai-integration"]',
  statusIndicator: '[data-testid="ai-status"]',
  chatHistory: '[data-testid="ai-chat-history"]',
  textInput: 'textarea[placeholder*="AI Assistant"]',
  sendButton: 'button[aria-label*="Send message"]',
  extractButton: 'button[aria-label*="Extract tasks"]',
  clearButton: 'button[aria-label*="Clear chat"]',
  taskResults: '[data-testid="ai-extracted-tasks"]',
  addTaskButtons: 'button[aria-label*="Add task"]',
  statusMessage: '[aria-live="polite"]',
};
```

### Expected States for Testing

```typescript
interface AIComponentStates {
  connected: {
    inputEnabled: true;
    extractEnabled: true;
    statusText: 'Connected';
    placeholder: 'Ask AI to help plan your day or extract tasks...';
  };

  disconnected: {
    inputEnabled: false;
    extractEnabled: false;
    statusText: 'Disconnected';
    placeholder: 'AI Assistant is disconnected...';
  };

  processing: {
    inputEnabled: false;
    extractEnabled: false;
    statusText: 'Processing';
    showSpinner: true;
  };
}
```

---

## Implementation Notes

### Component Integration Points

1. **Dashboard Layout**: Integrate into existing sidebar grid system
2. **State Management**: Connect to global task store and AI service status
3. **Event Handling**: Emit task creation events to parent dashboard
4. **Error Boundaries**: Graceful degradation when AI service fails
5. **Performance**: Debounced input, lazy loading of chat history

### Development Priorities

1. **Phase 1**: Basic UI structure with mock AI responses
2. **Phase 2**: Real AI service integration with loading states
3. **Phase 3**: Advanced features (chat history, task suggestions)
4. **Phase 4**: Mobile optimization and advanced accessibility

This wireframe system provides comprehensive guidance for implementing an ADHD-friendly, accessible AI integration component that meets the test requirements and aligns with Helmsman's design principles.
