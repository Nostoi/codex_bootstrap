# Calendar Component Wireframes

## Overview
This document provides visual wireframes for the CalendarView component system, showing the layout and interaction patterns for each view mode with ADHD-friendly design principles.

## Design Principles Applied
- **Visual Hierarchy**: Clear information prioritization
- **Cognitive Load Reduction**: Maximum 3 colors per view
- **Predictable Interactions**: Consistent element placement
- **Accessibility First**: High contrast, clear focus indicators

---

## Desktop Layout (≥1024px)

### Daily View Wireframe
```
┌─────────────────────────────────────────────────────────────────┐
│ CalendarHeader                                                  │
│ ┌─────────────┐ ┌─────────┐ ┌─────────────────┐ ┌──────────────┐ │
│ │[Day][Week]  │ │ ← July → │ │   July 29, 2025 │ │ [+] Settings │ │
│ │   [Month]   │ │ [Today] │ │                 │ │              │ │
│ └─────────────┘ └─────────┘ └─────────────────┘ └──────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ CalendarGrid (Daily View)                                       │
│ ┌─────┬───────────────────────────────────────────────────────┐ │
│ │ 6AM │ ░░░░░░░░░░░░░░░░░░░ LOW ENERGY ZONE ░░░░░░░░░░░░░░░░░░ │ │
│ │ 7AM │ ██████████████████████████████████████████████████████ │ │
│ │ 8AM │ [    Morning Standup Meeting - SOCIAL    ] HIGH ENR. │ │
│ │ 9AM │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ HIGH ENERGY ZONE ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │ │
│ │10AM │ [    Deep Work Block - TECHNICAL      ]              │ │
│ │11AM │ [                                     ]              │ │
│ │12PM │ ░░░░░░░░░░░░░░░░░░░ MEDIUM ENERGY ░░░░░░░░░░░░░░░░░░░░ │ │
│ │ 1PM │ [ Lunch Break ] [Outlook] Google Cal Event           │ │
│ │ 2PM │ ⚠️  [CONFLICT: Two meetings scheduled]                │ │
│ │ 3PM │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │
│ │ 4PM │ [ Available for Scheduling - Click to Add Task ]    │ │
│ │ 5PM │ ░░░░░░░░░░░░░░░░░░░ LOW ENERGY ZONE ░░░░░░░░░░░░░░░░░░ │ │
│ └─────┴───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Key Elements:**
- **Time Axis**: Left column with hourly slots
- **Energy Zones**: Background colors indicating user's energy patterns
- **Events**: Draggable blocks with source indicators
- **Conflicts**: Clear visual warnings for scheduling issues
- **Current Time**: Bold line indicator (when applicable)

### Weekly View Wireframe
```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ CalendarHeader                                                                      │
│ ┌─────────────┐ ┌─────────┐ ┌─────────────────┐ ┌──────────────┐                   │
│ │[Day] Week   │ │ ← Week → │ │ July 28 - Aug 3 │ │ [+] Settings │                   │
│ │    [Month]  │ │ [Today] │ │      2025       │ │              │                   │
│ └─────────────┘ └─────────┘ └─────────────────┘ └──────────────┘                   │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ CalendarGrid (Weekly View)                                                          │
│ ┌─────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐       │
│ │     │   Mon   │   Tue   │   Wed   │   Thu   │   Fri   │   Sat   │   Sun   │       │
│ │     │  Jul 28 │  Jul 29 │  Jul 30 │  Jul 31 │  Aug 1  │  Aug 2  │  Aug 3  │       │
│ ├─────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤       │
│ │ 8AM │ ░░░░░░░ │[Meeting]│ ░░░░░░░ │ ░░░░░░░ │[Standup]│ ░░░░░░░ │ ░░░░░░░ │       │
│ │ 9AM │ ░░░░░░░ │[▓▓▓▓▓▓▓]│ ░░░░░░░ │ ░░░░░░░ │[▓▓▓▓▓▓▓]│ ░░░░░░░ │ ░░░░░░░ │       │
│ │10AM │[Task A] │[▓▓▓▓▓▓▓]│[Task B] │ ░░░░░░░ │[▓▓▓▓▓▓▓]│ ░░░░░░░ │ ░░░░░░░ │       │
│ │11AM │ ░░░░░░░ │ ░░░░░░░ │ ░░░░░░░ │ ░░░░░░░ │ ░░░░░░░ │ ░░░░░░░ │ ░░░░░░░ │       │
│ │12PM │ ▓▓▓▓▓▓▓ │ ▓▓▓▓▓▓▓ │ ▓▓▓▓▓▓▓ │ ▓▓▓▓▓▓▓ │ ▓▓▓▓▓▓▓ │ ▓▓▓▓▓▓▓ │ ▓▓▓▓▓▓▓ │       │
│ │ 1PM │[Lunch]  │[Lunch]  │[Lunch]  │[Lunch]  │[Lunch]  │ ░░░░░░░ │ ░░░░░░░ │       │
│ │ 2PM │ ▓▓▓▓▓▓▓ │ ▓▓▓▓▓▓▓ │ ▓▓▓▓▓▓▓ │ ▓▓▓▓▓▓▓ │ ▓▓▓▓▓▓▓ │ ░░░░░░░ │ ░░░░░░░ │       │
│ │ 3PM │ ▓▓▓▓▓▓▓ │ ⚠️[❌] │ ▓▓▓▓▓▓▓ │ ▓▓▓▓▓▓▓ │ ▓▓▓▓▓▓▓ │ ░░░░░░░ │ ░░░░░░░ │       │
│ │ 4PM │ ░░░░░░░ │ ░░░░░░░ │ ░░░░░░░ │ ░░░░░░░ │ ░░░░░░░ │ ░░░░░░░ │ ░░░░░░░ │       │
│ └─────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘       │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

**Key Elements:**
- **7-Day Grid**: Monday-Sunday columns
- **Hourly Rows**: Compressed time view
- **Multi-Day Events**: Spanning across columns
- **Weekend Differentiation**: Subtle visual distinction
- **Conflict Indicators**: Clear warning symbols

### Monthly View Wireframe
```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ CalendarHeader                                                                      │
│ ┌─────────────┐ ┌─────────┐ ┌─────────────────┐ ┌──────────────┐                   │
│ │[Day][Week]  │ │ ← Month →│ │   July 2025     │ │ [+] Settings │                   │
│ │   Month     │ │ [Today] │ │                 │ │              │                   │
│ └─────────────┘ └─────────┘ └─────────────────┘ └──────────────┘                   │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ CalendarGrid (Monthly View)                                                         │
│ ┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐             │
│ │   Sun   │   Mon   │   Tue   │   Wed   │   Thu   │   Fri   │   Sat   │             │
│ ├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤             │
│ │  ░ 29 ░ │  ░ 30 ░ │   1     │   2     │   3     │   4     │   5     │             │
│ │         │         │ •Event  │         │ •••••   │ •Event  │         │             │
│ │         │         │         │         │ Tasks   │         │         │             │
│ ├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤             │
│ │   6     │   7     │   8     │   9     │  10     │  11     │  12     │             │
│ │         │ •Event  │ •••••   │ •Event  │         │ •••••   │         │             │
│ │         │         │ Tasks   │         │         │ Tasks   │         │             │
│ ├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤             │
│ │  13     │  14     │  15     │  16     │  17     │  18     │  19     │             │
│ │ •Event  │         │ •••••   │ ⚠️ ••   │ •Event  │         │ •••••   │             │
│ │         │         │ Tasks   │ Conf.   │         │         │ Tasks   │             │
│ ├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤             │
│ │  20     │  21     │  22     │  23     │  24     │  25     │  26     │             │
│ │         │ •Event  │         │ •••••   │ •Event  │         │ •••••   │             │
│ │         │         │         │ Tasks   │         │         │ Tasks   │             │
│ ├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤             │
│ │  27     │  28     │ ▓▓ 29 ▓▓│  30     │  31     │  ░ 1 ░  │  ░ 2 ░  │             │
│ │ •Event  │ •••••   │ TODAY   │ •Event  │         │         │         │             │
│ │         │ Tasks   │ •••••   │         │         │         │         │             │
│ └─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘             │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

**Key Elements:**
- **Date Cells**: Large, clickable date areas
- **Event Indicators**: Dots and mini-bars for events
- **Today Highlight**: Bold outline or background
- **Previous/Next Month**: Muted styling
- **Overflow Indicators**: "+" when too many events

---

## Mobile Layout (≤767px)

### Mobile Daily View
```
┌─────────────────────────┐
│ ┌─[Day] Week Month─┐    │
│ │  ← July 29, 2025 →   │
│ │     [Today]          │
│ └─────────────────────┘ │
├─────────────────────────┤
│ 8AM ░░░░░░░░░░░░░░░░░░░ │
│ ┌─────────────────────┐ │
│ │ Morning Standup     │ │
│ │ SOCIAL • HIGH       │ │
│ │ 8:30 - 9:00 AM      │ │
│ └─────────────────────┘ │
│                         │
│ 9AM ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│ ┌─────────────────────┐ │
│ │ Deep Work Block     │ │
│ │ TECHNICAL • HIGH    │ │
│ │ 9:00 - 11:00 AM     │ │
│ │ [📧 Outlook]        │ │
│ └─────────────────────┘ │
│                         │
│ 11AM ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│ ┌─────────────────────┐ │
│ │ + Add Task          │ │
│ │ Available slot      │ │
│ └─────────────────────┘ │
│                         │
│ 12PM ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│ ┌─────────────────────┐ │
│ │ Lunch Break         │ │
│ │ 12:00 - 1:00 PM     │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

### Mobile Weekly View (Compressed)
```
┌─────────────────────────┐
│ ┌─Day [Week] Month─┐    │
│ │  ← Week of Jul 28 →   │
│ │     [Today]           │
│ └─────────────────────┘ │
├─────────────────────────┤
│ Mon 28  Tue 29  Wed 30  │
│ ┌─────┐ ┌─────┐ ┌─────┐ │
│ │ •   │ │ ▓▓▓ │ │ •   │ │
│ │ • • │ │ ▓▓▓ │ │ • • │ │
│ │ •   │ │ ▓▓▓ │ │     │ │
│ └─────┘ └─────┘ └─────┘ │
│                         │
│ Thu 31  Fri 1   Sat 2   │
│ ┌─────┐ ┌─────┐ ┌─────┐ │
│ │ • • │ │ ▓▓▓ │ │     │ │
│ │ •   │ │ ▓▓▓ │ │     │ │
│ │     │ │ ▓▓▓ │ │     │ │
│ └─────┘ └─────┘ └─────┘ │
│                         │
│ Sun 3                   │
│ ┌─────┐                 │
│ │     │                 │
│ │     │                 │
│ │     │                 │
│ └─────┘                 │
└─────────────────────────┘
```

---

## Interactive States

### Drag and Drop Visual Feedback
```
┌─────────────────────────────────┐
│ 9AM ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│ ┌─────────────────────────────┐ │ ← Original Position (Semi-transparent)
│ │ 👻 Deep Work Block (Ghost)  │ │
│ │ TECHNICAL • HIGH            │ │
│ └─────────────────────────────┘ │
│                                 │
│ 10AM ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│ ╔═════════════════════════════╗ │ ← Drop Zone (Highlighted)
│ ║ ✅ Valid Drop Zone           ║ │
│ ║ 10:00 - 12:00 AM Available  ║ │
│ ╚═════════════════════════════╝ │
│                                 │
│ 11AM ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│ ┌─────────────────────────────┐ │
│ │ Existing Meeting            │ │
│ │ Cannot drop here            │ │
│ └─────────────────────────────┘ │
│                                 │
│ 12PM ░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ╔═════════════════════════════╗ │ ← Invalid Drop Zone
│ ║ ❌ Conflict with Meeting     ║ │
│ ║ Would overlap 12:00-1:00    ║ │
│ ╚═════════════════════════════╝ │
└─────────────────────────────────┘
```

### Focus States (Keyboard Navigation)
```
┌─────────────────────────────────┐
│ 9AM ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│ ╔═══════════════════════════╗   │ ← Focused Element
│ ║ 🔵 Deep Work Block        ║   │   (3px Blue Outline)
│ ║ TECHNICAL • HIGH          ║   │
│ ║ Press Enter to edit       ║   │
│ ╚═══════════════════════════╝   │
│                                 │
│ 10AM ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│ ┌─────────────────────────────┐ │ ← Not Focused
│ │ Available Slot              │ │
│ │ Click to add task           │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### High Contrast Mode
```
┌─────────────────────────────────┐
│ 9AM ████████████████████████████ │ ← Black background
│ ┌─────────────────────────────┐ │
│ │ ████ DEEP WORK BLOCK ████   │ │ ← White text on black
│ │ ████ TECHNICAL • HIGH ████  │ │
│ └─────────────────────────────┘ │
│                                 │
│ 10AM ███████████████████████████ │
│ ┌─────────────────────────────┐ │
│ │ ████ AVAILABLE SLOT ████    │ │
│ │ ████ CLICK TO ADD ████      │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

---

## Component Integration Flow

### Existing Integration with CalendarEvents.tsx
```
Dashboard Layout
├── CalendarEvents (List View) ← Existing component
│   ├── Today's events as cards
│   ├── Source indicators
│   └── Energy/Focus badges
│
└── CalendarView (Grid View) ← New component
    ├── Visual calendar grid
    ├── Drag-and-drop scheduling  
    ├── Time slot visualization
    └── Same data source (/api/plans/calendar-events)
```

### Modal Integration
```
CalendarView Click/Double-Click
├── Time Slot Click → QuickTaskModal
│   ├── Pre-filled start time
│   ├── Suggested duration
│   └── Energy level from context
│
├── Event Click → EventDetailsModal  
│   ├── View/edit event details
│   ├── Move to different time
│   └── Delete confirmation
│
└── Drag Complete → ConfirmationModal (if significant change)
    ├── Show old vs new time
    ├── Conflict warnings
    └── Confirm/Cancel actions
```

## Design Token Application

### Color Coding Legend
- **▓▓▓** = HIGH Energy (Green) - Morning peak performance
- **░░░** = MEDIUM Energy (Amber) - Steady afternoon work  
- **▓▓▓** = LOW Energy (Indigo) - Evening wind-down
- **⚠️** = Conflict Warning (Red) - Scheduling conflicts
- **🔵** = Focus Indicator (Blue) - Current keyboard focus

### Interaction Symbols
- **📅** = Google Calendar source
- **📧** = Outlook Calendar source  
- **🗓️** = Task/Internal source
- **👻** = Drag ghost element
- **✅** = Valid drop zone
- **❌** = Invalid drop zone
- **•** = Small event indicator (mobile/month view)

This wireframe system provides comprehensive visual guidance for implementing the ADHD-friendly calendar component with clear interaction patterns and responsive design considerations.
