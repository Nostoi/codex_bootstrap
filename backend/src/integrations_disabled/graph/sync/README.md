# Calendar Event Synchronization Service

## Overview

The Calendar Event Synchronization Service provides comprehensive bidirectional synchronization between the local application database and Microsoft Graph Calendar API. This service enables real-time calendar event management with conflict resolution, delta queries for efficiency, and robust error handling.

## Features

### Core Synchronization

- **Bidirectional Sync**: Pull from Graph, push to Graph, or sync both directions
- **Delta Queries**: Efficient incremental synchronization using Microsoft Graph delta tokens
- **Conflict Detection**: Automatic detection of conflicting changes between local and remote events
- **Conflict Resolution**: Multiple strategies for resolving conflicts (prefer local, prefer remote, prefer latest, merge, manual)

### Advanced Capabilities

- **Job Management**: Track sync operations with progress monitoring
- **Sync History**: Complete audit trail of all sync operations
- **Metrics & Analytics**: Detailed sync performance and conflict statistics
- **Error Recovery**: Graceful handling of API failures and token expiration

## Architecture

### Database Models

#### CalendarEvent

Stores local calendar events with Graph metadata:

```prisma
model CalendarEvent {
  id                     String    @id @default(cuid())
  userId                 String
  graphEventId           String?   // Microsoft Graph event ID
  calendarId             String    @default("default")
  subject                String
  body                   Json?     // Rich content body
  start                  Json      // Start time with timezone
  end                    Json      // End time with timezone
  location               Json?     // Location details
  isAllDay               Boolean   @default(false)
  recurrence             Json?     // Recurrence pattern
  lastModifiedDateTime   String    // ISO string for change tracking
  createdDateTime        String    // ISO string for creation time
  syncedAt               DateTime? // Last sync timestamp
  createdAt              DateTime  @default(now())
  updatedAt              DateTime  @updatedAt
}
```

#### CalendarSyncState

Tracks synchronization metadata:

```prisma
model CalendarSyncState {
  id               String              @id @default(cuid())
  userId           String
  calendarId       String              @default("default")
  status           CalendarSyncStatus
  direction        String              // 'pull', 'push', 'bidirectional'
  deltaToken       String?             // Graph delta token
  lastSyncTime     DateTime?
  totalEvents      Int                 @default(0)
  processedEvents  Int                 @default(0)
  createdEvents    Int                 @default(0)
  updatedEvents    Int                 @default(0)
  deletedEvents    Int                 @default(0)
  conflictsDetected Int                @default(0)
  startedAt        DateTime            @default(now())
  completedAt      DateTime?
  error            String?
}
```

#### CalendarSyncConflict

Records synchronization conflicts:

```prisma
model CalendarSyncConflict {
  id             String                    @id @default(cuid())
  syncStateId    String
  eventId        String
  conflictType   CalendarConflictType
  conflictData   Json                      // Detailed conflict information
  resolution     CalendarConflictResolution
  resolvedAt     DateTime?
  resolutionData Json?
}
```

### Core Services

#### CalendarSyncService

Main orchestrator for synchronization operations:

- Manages sync jobs and their lifecycle
- Coordinates between Graph API and local database
- Handles bidirectional synchronization logic
- Provides progress tracking and status reporting

#### DeltaSyncManager

Handles Microsoft Graph delta queries:

- Manages delta tokens for incremental sync
- Processes Graph delta responses
- Handles pagination and error recovery
- Optimizes API requests for efficiency

#### ConflictResolver

Manages synchronization conflicts:

- Detects conflicts between local and remote events
- Implements multiple resolution strategies
- Records conflicts for manual review
- Provides conflict statistics and reporting

## API Endpoints

### Start Synchronization

```http
POST /calendar/sync/start
Content-Type: application/json

{
  "direction": "bidirectional",
  "calendarId": "default",
  "conflictResolution": "prefer_latest",
  "forceFull": false,
  "dateRange": {
    "start": "2025-01-01T00:00:00Z",
    "end": "2025-12-31T23:59:59Z"
  }
}
```

Response:

```json
{
  "jobId": "sync-job-123",
  "status": "started"
}
```

### Get Sync Status

```http
GET /calendar/sync/status/{jobId}
```

Response:

```json
{
  "jobId": "sync-job-123",
  "status": "IN_PROGRESS",
  "direction": "bidirectional",
  "progress": {
    "total": 100,
    "processed": 75,
    "percentage": 75
  },
  "startedAt": "2025-01-15T10:00:00Z",
  "result": {
    "totalEvents": 75,
    "createdEvents": 10,
    "updatedEvents": 60,
    "deletedEvents": 5,
    "conflictsDetected": 2
  }
}
```

### Get Sync History

```http
GET /calendar/sync/history?limit=10&offset=0
```

### Manage Conflicts

```http
GET /calendar/sync/conflicts
PUT /calendar/sync/conflicts/{conflictId}/resolve
```

### Sync Settings

```http
GET /calendar/sync/settings
PUT /calendar/sync/settings
```

### Metrics

```http
GET /calendar/sync/metrics?days=7
GET /calendar/sync/conflicts/stats?days=30
```

## Usage Examples

### Basic Synchronization

```typescript
// Start a bidirectional sync
const response = await fetch('/calendar/sync/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    direction: 'bidirectional',
    conflictResolution: 'prefer_latest',
  }),
});

const { jobId } = await response.json();

// Monitor progress
const status = await fetch(`/calendar/sync/status/${jobId}`);
const syncStatus = await status.json();
```

### Conflict Resolution

```typescript
// Get pending conflicts
const conflicts = await fetch('/calendar/sync/conflicts');
const pendingConflicts = await conflicts.json();

// Resolve a conflict manually
await fetch(`/calendar/sync/conflicts/${conflictId}/resolve`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    resolution: 'PREFER_LOCAL',
    resolvedData: {
      reason: 'User prefers local version',
    },
  }),
});
```

## Configuration

### Environment Variables

```env
# Microsoft Graph API
GRAPH_CLIENT_ID=your-client-id
GRAPH_CLIENT_SECRET=your-client-secret
GRAPH_TENANT_ID=your-tenant-id

# Sync Configuration
CALENDAR_SYNC_INTERVAL=15  # minutes
CALENDAR_MAX_EVENTS_PER_SYNC=1000
CALENDAR_DELTA_TOKEN_EXPIRY=24  # hours
```

### Sync Strategies

#### Conflict Resolution Strategies

- **prefer_local**: Always use local changes
- **prefer_remote**: Always use Graph changes
- **prefer_latest**: Use most recently modified version
- **merge**: Intelligently merge compatible changes
- **manual**: Require manual resolution

#### Sync Directions

- **pull**: Import events from Graph to local
- **push**: Export local events to Graph
- **bidirectional**: Sync in both directions

## Performance Considerations

### Delta Queries

- Delta tokens enable efficient incremental sync
- Reduces API calls and bandwidth usage
- Automatically handles pagination
- Falls back to full sync if delta token expires

### Batch Operations

- Events are processed in batches for efficiency
- Configurable batch sizes based on API limits
- Parallel processing where possible

### Rate Limiting

- Implements exponential backoff for rate limits
- Respects Microsoft Graph throttling headers
- Queues requests during high-load periods

## Error Handling

### Common Scenarios

- **Token Expiration**: Automatic token refresh
- **Delta Token Invalid**: Fallback to full sync
- **API Rate Limits**: Exponential backoff retry
- **Network Failures**: Retry with circuit breaker
- **Conflict Detection**: Structured conflict recording

### Monitoring

- Comprehensive logging for troubleshooting
- Metrics collection for performance monitoring
- Error categorization and alerting
- Health check endpoints

## Testing

### Unit Tests

```bash
npm test -- calendar-sync.service.spec.ts
npm test -- delta-sync.manager.spec.ts
npm test -- conflict-resolver.service.spec.ts
```

### Integration Tests

```bash
npm run test:e2e -- calendar-sync
```

### Mock Data

The test suite includes comprehensive mock data for:

- Graph API responses
- Delta query results
- Conflict scenarios
- Error conditions

## Security

### Authentication

- Uses OAuth 2.0 with Microsoft Graph
- Secure token storage and refresh
- User-scoped access to calendar data

### Data Privacy

- Events stored locally with encryption at rest
- Minimal data retention policies
- GDPR compliance for European users

### API Security

- JWT authentication for all endpoints
- Role-based access control
- Rate limiting and request validation

## Deployment

### Database Migration

```bash
npx prisma migrate deploy
```

### Environment Setup

1. Configure Microsoft Graph application
2. Set environment variables
3. Run database migrations
4. Start the service

### Monitoring

- Health check endpoint: `/calendar/sync/health`
- Metrics endpoint: `/calendar/sync/metrics`
- Structured logging with correlation IDs

## Future Enhancements

### Planned Features

- Multi-calendar synchronization
- Recurring event optimization
- Real-time sync with webhooks
- Advanced conflict resolution UI
- Sync rule customization
- Calendar sharing and permissions

### Performance Improvements

- Caching layer for frequently accessed events
- Background sync scheduling
- Event deduplication
- Compression for large payloads

This service provides a robust foundation for calendar synchronization with Microsoft Graph, supporting enterprise-grade requirements for reliability, performance, and user experience.
