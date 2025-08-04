# Google Calendar Integration Architecture Design

## Overview

This document outlines the architecture for integrating Google Calendar with the Helmsman Daily Planning Algorithm. The integration will enable intelligent scheduling around existing calendar commitments while maintaining the existing daily planner functionality.

## Current State Analysis

### Existing Components

1. **DailyPlannerService** (`backend/src/planning/daily-planner.service.ts`)
   - Generates optimized daily plans
   - Has TODO comment: "Get existing commitments from calendar integration"
   - Currently uses empty `existingCommitments: TimeSlot[]` array

2. **GoogleService** (`backend/src/integrations/google/google.service.ts`)
   - OAuth2 authentication with Google APIs
   - `getCalendarEvents()` method already implemented
   - `createCalendarEvent()` method available

3. **Planning Types** (`backend/src/planning/types.ts`)
   - `TimeSlot` interface defined
   - `PlanningInput` includes `existingCommitments` field

## Architecture Design

### 1. Integration Interface

```typescript
// New interface for calendar integration
interface CalendarIntegration {
  getExistingCommitments(userId: string, date: Date): Promise<TimeSlot[]>;
  parseCalendarEvent(event: GoogleCalendarEvent): TimeSlot;
  inferEnergyLevel(event: GoogleCalendarEvent): EnergyLevel;
  handleApiFailure(error: Error): TimeSlot[];
}
```

### 2. Data Flow Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│ DailyPlanner    │    │ GoogleService    │    │ Google Calendar API │
│ Service         │────│                  │────│                     │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
        │                        │                         │
        │ getExistingCommitments │                         │
        │──────────────────────→ │                         │
        │                        │ getCalendarEvents       │
        │                        │────────────────────────→│
        │                        │                         │
        │                        │ ← calendar events       │
        │                        │←────────────────────────│
        │                        │                         │
        │ ← TimeSlot[]           │                         │
        │←──────────────────────── │                         │
```

### 3. Error Handling Strategy

```typescript
// Error handling patterns
enum CalendarErrorType {
  API_UNAVAILABLE = 'api_unavailable',
  AUTH_EXPIRED = 'auth_expired',
  RATE_LIMITED = 'rate_limited',
  NETWORK_ERROR = 'network_error',
  PERMISSION_DENIED = 'permission_denied',
}

interface CalendarErrorHandler {
  handleError(error: CalendarErrorType): Promise<TimeSlot[]>;
  shouldRetry(error: CalendarErrorType): boolean;
  getRetryDelay(attempt: number): number;
}
```

## Implementation Specifications

### 1. DailyPlannerService Integration

#### Method: `getExistingCommitments(userId: string, date: Date): Promise<TimeSlot[]>`

**Location**: `backend/src/planning/daily-planner.service.ts`

**Dependencies**:

- Inject `GoogleService` in constructor
- Import Google Calendar types

**Implementation**:

```typescript
private async getExistingCommitments(userId: string, date: Date): Promise<TimeSlot[]> {
  try {
    // Get calendar events for the target date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const calendarData = await this.googleService.getCalendarEvents(
      userId,
      'primary',
      startOfDay,
      endOfDay
    );

    // Parse calendar events to TimeSlots
    const timeSlots = calendarData.items
      ?.filter(event => this.isValidEvent(event))
      .map(event => this.parseCalendarEventToTimeSlot(event))
      || [];

    this.logger.log(`Retrieved ${timeSlots.length} calendar commitments for ${date.toISOString()}`);
    return timeSlots;

  } catch (error) {
    this.logger.warn(`Calendar integration failed: ${error.message}`);
    return this.handleCalendarFailure(error);
  }
}
```

### 2. Calendar Event Parsing Logic

#### Energy Level Inference Rules

```typescript
private inferEnergyLevel(event: GoogleCalendarEvent): EnergyLevel {
  // Meeting type analysis
  if (event.summary?.toLowerCase().includes('focus') ||
      event.summary?.toLowerCase().includes('deep work')) {
    return EnergyLevel.HIGH;
  }

  // Large meetings (drain energy)
  if (event.attendees && event.attendees.length > 5) {
    return EnergyLevel.LOW;
  }

  // 1:1 meetings or small groups
  if (event.attendees && event.attendees.length <= 3) {
    return EnergyLevel.MEDIUM;
  }

  // All-day events
  if (event.start?.date && event.end?.date) {
    return EnergyLevel.LOW;
  }

  // Default for regular meetings
  return EnergyLevel.MEDIUM;
}
```

#### Event Type to Focus Type Mapping

```typescript
private inferPreferredFocusTypes(event: GoogleCalendarEvent): FocusType[] {
  const summary = event.summary?.toLowerCase() || '';
  const description = event.description?.toLowerCase() || '';

  if (summary.includes('standup') || summary.includes('sync') ||
      summary.includes('meeting')) {
    return [FocusType.SOCIAL];
  }

  if (summary.includes('review') || summary.includes('planning')) {
    return [FocusType.ADMINISTRATIVE];
  }

  if (summary.includes('workshop') || summary.includes('brainstorm')) {
    return [FocusType.CREATIVE];
  }

  if (summary.includes('technical') || summary.includes('coding')) {
    return [FocusType.TECHNICAL];
  }

  // Default for unknown meetings
  return [FocusType.SOCIAL];
}
```

### 3. Time Zone Handling

```typescript
private parseEventDateTime(
  dateTime: GoogleCalendarDateTime,
  userTimezone: string
): Date {
  if (dateTime.dateTime) {
    // Timed event
    return new Date(dateTime.dateTime);
  } else if (dateTime.date) {
    // All-day event
    const date = new Date(dateTime.date);
    // Convert to user's timezone
    return new Date(date.toLocaleString('en-US', { timeZone: userTimezone }));
  }

  throw new Error('Invalid calendar event date format');
}
```

### 4. Integration Points with generateTimeSlots()

```typescript
private generateTimeSlots(
  date: Date,
  userSettings: UserSettings,
  existingCommitments: TimeSlot[]
): TimeSlot[] {
  // Generate base time slots
  const baseSlots = this.generateBaseTimeSlots(date, userSettings);

  // Remove conflicting slots
  const availableSlots = this.removeConflictingSlots(baseSlots, existingCommitments);

  // Add buffer time around meetings
  const bufferedSlots = this.addMeetingBuffers(availableSlots, existingCommitments);

  return bufferedSlots;
}

private removeConflictingSlots(
  baseSlots: TimeSlot[],
  commitments: TimeSlot[]
): TimeSlot[] {
  return baseSlots.filter(slot => {
    return !commitments.some(commitment =>
      this.slotsOverlap(slot, commitment)
    );
  });
}

private slotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
  return slot1.startTime < slot2.endTime && slot2.startTime < slot1.endTime;
}
```

## Performance Optimization

### 1. Caching Strategy

```typescript
interface CalendarCache {
  userId: string;
  date: string;
  events: TimeSlot[];
  expiresAt: Date;
}

// Cache calendar data for 15 minutes
private readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes
private calendarCache = new Map<string, CalendarCache>();
```

### 2. API Rate Limiting

```typescript
// Implement exponential backoff for Google Calendar API
private async getCalendarEventsWithRetry(
  userId: string,
  maxRetries = 3
): Promise<any> {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      return await this.googleService.getCalendarEvents(userId);
    } catch (error) {
      if (this.isRetryableError(error) && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        await this.sleep(delay);
        attempt++;
        continue;
      }
      throw error;
    }
  }
}
```

## Testing Strategy

### 1. Mock Data Structures

```typescript
const mockGoogleCalendarEvent = {
  id: 'test-event-1',
  summary: 'Team Standup',
  description: 'Daily team sync meeting',
  start: {
    dateTime: '2025-07-28T09:00:00-07:00',
    timeZone: 'America/Los_Angeles',
  },
  end: {
    dateTime: '2025-07-28T09:30:00-07:00',
    timeZone: 'America/Los_Angeles',
  },
  attendees: [
    { email: 'user1@example.com', responseStatus: 'accepted' },
    { email: 'user2@example.com', responseStatus: 'accepted' },
  ],
};

const expectedTimeSlot: TimeSlot = {
  startTime: new Date('2025-07-28T09:00:00-07:00'),
  endTime: new Date('2025-07-28T09:30:00-07:00'),
  energyLevel: EnergyLevel.MEDIUM,
  preferredFocusTypes: [FocusType.SOCIAL],
  isAvailable: false,
};
```

### 2. Test Cases

1. **Unit Tests**
   - Calendar event parsing for different event types
   - Energy level inference accuracy
   - Time zone conversion correctness
   - Error handling scenarios

2. **Integration Tests**
   - End-to-end calendar integration with real Google API
   - OAuth token refresh scenarios
   - Large calendar dataset performance

3. **Error Handling Tests**
   - API unavailable scenarios
   - Network timeout handling
   - Invalid calendar data parsing

## Security Considerations

### 1. Data Privacy

- Calendar event titles and descriptions should be treated as sensitive data
- Implement proper logging that doesn't expose private calendar information
- Support calendar privacy settings (free/busy only vs full details)

### 2. OAuth Token Management

- Implement proper token refresh logic
- Handle token expiration gracefully
- Store tokens securely in encrypted format

### 3. API Access Control

- Respect Google Calendar API rate limits
- Implement proper scope restrictions (read-only calendar access)
- Add audit logging for calendar data access

## Deployment Considerations

### 1. Feature Flags

```typescript
// Feature flag for calendar integration
const CALENDAR_INTEGRATION_ENABLED = process.env.ENABLE_CALENDAR_INTEGRATION === 'true';

if (CALENDAR_INTEGRATION_ENABLED) {
  existingCommitments = await this.getExistingCommitments(userId, date);
} else {
  existingCommitments = [];
}
```

### 2. Monitoring

- Track calendar API response times
- Monitor calendar integration success/failure rates
- Alert on high error rates or API quota issues

### 3. Graceful Degradation

- Daily planning continues to work when calendar integration fails
- Clear user messaging about calendar sync status
- Fallback to manual calendar input when needed

## Success Metrics

1. **Functional Metrics**
   - Calendar event parsing accuracy (>95%)
   - Energy level inference accuracy (user feedback)
   - API response time (<500ms p95)

2. **User Experience Metrics**
   - Daily plan generation success rate with calendar integration
   - User satisfaction with calendar-aware scheduling
   - Reduction in manual schedule conflicts

3. **Technical Metrics**
   - Google Calendar API error rate (<1%)
   - Calendar integration uptime (>99.5%)
   - Cache hit rate for calendar data (>80%)

## Next Steps

This design document provides the foundation for implementing Google Calendar integration. The next phase will involve:

1. Implementing the `getExistingCommitments()` method
2. Adding GoogleService dependency injection to DailyPlannerService
3. Creating comprehensive test coverage
4. Implementing error handling and monitoring
5. Performance optimization and caching

The design ensures minimal impact on existing daily planning functionality while adding powerful calendar integration capabilities.
