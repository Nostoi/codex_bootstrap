# Codex Bootstrap AI Coding Instructions

## Project Overview

This is **Helmsman**, an AI-augmented task management system optimized for ADHD users, built as a full-stack applicati### OpenAI Service Architecture

````typescript
// Core AI service pattern
export class OpenAIService {
  async extractTasks(text: string, context?: string): Promise<ExtractedTask[]>
  async classifyTask(title: string, description?: string): Promise<TaskClassification>
  async generateProactiveSuggestions(tasks: Task[], context: InteractionLog[]): Promise<AIRecommendation[]>
  async analyzeEmailForTasks(email: GraphEmail): Promise<ExtractedTask[]>
}

// Microsoft Graph email integration
export class GraphService {
  async syncEmails(userId: string): Promise<GraphEmail[]>
  async getCalendarEvents(userId: string, dateRange: DateRange): Promise<CalendarEvent[]>
  async storeEmailContext(email: GraphEmail): Promise<void> // Store in graph DB for AI context
}

// Task extraction with structured output
const TASK_EXTRACTION_FUNCTION = {
  name: "extract_tasks",
  description: "Extract actionable tasks from unstructured text",
  // Returns tasks with energyLevel, focusType, estimatedDuration, priority metadata
};
```time collaboration features. The project uses an **agent-driven development workflow** with automated PRD creation, task management, and code implementation.

## Architecture & Key Components

### Full-Stack Structure
- **Frontend**: Next.js 14+ App Router, TypeScript, Tailwind + DaisyUI, Zustand state management
- **Backend**: NestJS with Prisma ORM, PostgreSQL, WebSocket collaboration via Yjs/y-websocket
- **Workspace**: Monorepo with shared Storybook (root), frontend/backend packages, Docker compose

### Critical Modules
- **Real-time Collaboration**: `backend/src/collaboration/` - Yjs CRDT with WebSocket gateway at `/collaboration`
- **AI Integration**: `backend/src/ai/` - Task prioritization and AI-powered suggestions
- **External APIs**: `backend/src/integrations/` - Microsoft Graph + Google APIs SDK
- **ADHD-Optimized UI**: `frontend/src/components/ui/` - Energy levels, reduced motion, cognitive load patterns

## Development Commands

### Startup & Environment
```bash
# Full environment with Docker
USE_DOCKER=true ./dev_init.sh

# Local development (auto-detects dependencies)
./dev_init.sh

# Storybook (runs from root with frontend stories)
pnpm storybook  # http://localhost:6006
````

### Testing Strategy

```bash
# Full test suite (both frontend/backend)
./run_tests.sh

# Frontend only
cd frontend && pnpm test

# Backend only
cd backend && npm run test:cov

# Storybook accessibility testing
pnpm test-storybook
```

## Code Patterns & Conventions

### State Management

- **Zustand**: Client state (`frontend/src/store/`) with devtools + persistence
- **React Query**: Server state with automatic caching/invalidation
- **Yjs**: Real-time collaborative state (documents, tasks)

### Component Architecture

```tsx
// ADHD-optimized component pattern
interface ComponentProps {
  energyLevel?: 'HIGH' | 'MEDIUM' | 'LOW'; // Visual priority indicators
  loading?: boolean; // Clear loading states
  variant?: 'primary' | 'secondary'; // Consistent variants
  compact?: boolean; // Density control for cognitive load
}

// Task component pattern with comprehensive metadata
interface TaskCardProps {
  task: Task;
  onClick?: (task: Task) => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  showDependencies?: boolean;
  compact?: boolean;
}

// Energy level color coding (WCAG 2.2 AA compliant)
const ENERGY_COLORS = {
  HIGH: 'bg-red-100 text-red-800', // Red - Requires focus
  MEDIUM: 'bg-yellow-100 text-yellow-800', // Yellow - Moderate effort
  LOW: 'bg-green-100 text-green-800', // Green - Easy tasks
};

// Focus type indicators
const FOCUS_ICONS = {
  CREATIVE: '🎨', // Writing, design, brainstorming
  TECHNICAL: '⚙️', // Coding, debugging, analysis
  ADMINISTRATIVE: '📋', // Email, reports, data entry
  SOCIAL: '👥', // Meetings, calls, collaboration
};
```

### Database & API

- **Prisma Schema**: `backend/prisma/schema.prisma` - User/Task/Project/Document models with comprehensive metadata
- **Task Model**: Enhanced with `energyLevel`, `focusType`, `estimatedMinutes`, `priority`, `source`, deadlines
- **Enums**: `TaskStatus`, `EnergyLevel` (LOW/MEDIUM/HIGH), `FocusType` (CREATIVE/TECHNICAL/ADMINISTRATIVE/SOCIAL), `TaskSource`
- **NestJS Modules**: Feature-based modules (tasks, projects, collaboration, ai)
- **API Patterns**: RESTful with `/api/ai/extract-tasks`, `/api/plans/today` for AI-powered features
- **CORS**: Configured for `http://localhost:3000` (frontend)

### ADHD-Specific Patterns

- **Energy Indicators**: RED (high focus), YELLOW (medium), GREEN (low effort) with WCAG 2.2 AA contrast
- **Motion Control**: Respect `prefers-reduced-motion` throughout, CSS transitions over complex animations
- **Cognitive Load**: Progressive disclosure, consistent layouts, minimal context switching
- **Component Library**: shadcn/ui (chosen for accessibility), @dnd-kit for drag-drop, Recharts for visualization
- **Typography**: Inter font with 1.25 type scale, 8px spacing system for visual consistency
- **Performance**: <2.5s LCP, <500KB initial bundle, virtual scrolling for large datasets

## Storybook & Testing

### Component Stories Location

- **Stories**: `frontend/src/**/*.stories.tsx` (auto-discovered)
- **Accessibility**: Comprehensive a11y testing with axe-core addon
- **Visual Testing**: Motion preferences, high contrast, keyboard navigation scenarios
- **ADHD Testing**: Reduced motion, cognitive load, energy level variations

### Testing Files

- **Frontend**: `*.test.tsx` with React Testing Library + accessibility testing
- **Backend**: `*.spec.ts` with Jest and NestJS testing utilities
- **E2E**: Playwright configuration in `frontend/playwright.config.ts`
- **Performance**: Core Web Vitals monitoring, bundle size tracking

### Key Testing Patterns

```typescript
// Accessibility-first testing
test('TaskCard supports keyboard navigation', async () => {
  render(<TaskCard task={mockTask} />);
  await user.tab();
  expect(screen.getByRole('button')).toHaveFocus();
});

// ADHD-specific scenarios
test('TaskCard respects reduced motion preference', () => {
  // Test with prefers-reduced-motion: reduce
});
```

## Environment & Dependencies

### Docker Services

- **Database**: PostgreSQL on port 5487 (dev) / 5432 (container)
- **Backend**: NestJS on port 8222 (dev) / 8000 (container)
- **Frontend**: Next.js on port 3000

### Package Managers

- **Root**: pnpm (monorepo, Storybook dependencies)
- **Frontend**: pnpm (Next.js, React, Tailwind)
- **Backend**: npm (NestJS, Prisma, WebSocket)

## File Modification Guidelines

### Always Update

- `CHANGELOG.md`: Timestamp + one-line summary for all changes
- `DEVELOPMENT.md`: Manual startup instructions when adding services

### Environment Files

- `.env.template`: Add new required environment variables
- `dev_init.sh`: Update for new dependencies/services
- `.codex/install.sh`: Update for Codex environment changes (won't take effect until next session)

## Integration Points

### Real-time Collaboration

- **WebSocket**: `/collaboration` endpoint for Yjs document sync
- **Document Model**: Prisma `Document` linked to `User` and `Project`
- **Session Management**: `CollaborationSession` tracking active users

### External API Integration

- **Microsoft Graph**: `backend/src/integrations/graph/` - Outlook email/calendar sync, email storage for AI context
- **Google APIs**: `backend/src/integrations/google/` - Workspace integration
- **AI Services**: `backend/src/ai/` - Task prioritization and recommendations

### Microsoft Graph Integration

- **Email Processing**: Sync Outlook emails to extract tasks and context for AI analysis
- **Calendar Sync**: Import calendar events for intelligent scheduling and time blocking
- **Email Storage**: Store email content in graph database for contextual AI recommendations
- **Authentication**: OAuth 2.0 flow for secure Microsoft 365 integration
- **Endpoints**: `/api/graph/emails`, `/api/graph/calendar`, `/api/graph/sync`

## AI Integration Patterns

### OpenAI Service Architecture

```typescript
// Core AI service pattern
export class OpenAIService {
  async extractTasks(text: string, context?: string): Promise<ExtractedTask[]>;
  async classifyTask(title: string, description?: string): Promise<TaskClassification>;
  async generateProactiveSuggestions(
    tasks: Task[],
    context: InteractionLog[]
  ): Promise<AIRecommendation[]>;
}

// Task extraction with structured output
const TASK_EXTRACTION_FUNCTION = {
  name: 'extract_tasks',
  description: 'Extract actionable tasks from unstructured text',
  // Returns tasks with energyLevel, focusType, estimatedDuration, priority metadata
};
```

### AI API Endpoints

- **POST /api/ai/extract-tasks**: Extract tasks from emails, notes, conversations
- **POST /api/ai/classify-task**: Auto-predict task metadata (energy, focus, duration)
- **GET /api/plans/today**: Generate optimized daily schedule with energy/focus matching
- **POST /api/graph/analyze-email**: Extract tasks and context from Outlook emails
- **GET /api/graph/email-context**: Retrieve stored email context for AI recommendations
- **AI Prompts**: Structured prompts for task extraction, classification, and planning

### Daily Planning Algorithm

- **Energy Optimization**: Match HIGH/MEDIUM/LOW energy tasks to user's daily patterns
- **Focus Batching**: Group CREATIVE/TECHNICAL/ADMINISTRATIVE/SOCIAL tasks for cognitive efficiency
- **Deadline Management**: Prioritize hard deadlines, suggest soft deadline adjustments
- **Dependency Resolution**: Block dependent tasks until prerequisites complete

Remember: This project prioritizes **ADHD-friendly UX** with predictable interactions, clear visual hierarchy, and reduced cognitive load in all implementations.
