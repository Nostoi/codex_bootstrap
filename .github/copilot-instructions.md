# GitHub Copilot Instructions for Helmsman

This document provides comprehensive guidance for AI coding assistants working on the Helmsman project - an ADHD-optimized task management system with intelligent assistance features and automated development workflows.

## Project Overview

**Helmsman** is a full-stack task management application designed specifically for individuals with ADHD, featuring:
- AI-powered task extraction and prioritization with OpenAI GPT-4 integration
- Energy level and focus type matching with intelligent daily planning algorithm
- Dual calendar integration (Google Calendar + Microsoft Outlook)
- Real-time collaborative document editing with Yjs CRDT
- Accessibility-first design (WCAG 2.2 AA compliant)
- Automated PRD creation and task management workflow via agent commands

### Core Technologies & Architecture
- **Frontend**: Next.js 14.2.30 (App Router), React 18.3.1, TypeScript 5.4+
- **Backend**: NestJS 10+ with TypeScript, Express platform
- **Database**: PostgreSQL with Prisma ORM 5.9+ (SQLite for development)
- **State Management**: Zustand 4.5+ (client) + React Query/TanStack Query 5.28+ (server)
- **Real-time**: y-websocket + Yjs for collaborative editing, WebSocket support
- **Styling**: Tailwind CSS 3.4+ + DaisyUI component library
- **Testing**: Vitest 3.2+, Playwright 1.54+, Storybook 9.0.18, Jest 29.7+, axe-core
- **AI Services**: OpenAI GPT-4, structured task processing with function calling
- **Package Management**: PNPM (frontend), NPM (backend)
- **Containerization**: Docker multi-stage builds with Alpine Linux

## Memory Use Policy (Cipher MCP)

You are a coding assistant with access to Cipher’s long-term memory via the following tools:

### At Task Start
- Use `cipher_memory_search` or `ask_cipher` to retrieve relevant patterns, prior tasks, and lessons learned.
- Use the retrieved guidance to shape your approach and verify assumptions.

### During Tasks
- Re-check memory midway through multi-step operations (e.g., different files or component layers).
- Use `cipher_memory_search` or `cipher_search_reasoning_patterns` to find relevant knowledge.

### When Discovering Something Worth Remembering
- If you fix a recurring error, solve a complex issue, or define a new reusable pattern:
  → Use `cipher_store_reasoning_memory` with a clear description of what, why, and where it should be reused.
- Alternatively, use `ask_cipher` to both reflect and persist.

### At Task End
- Use `cipher_store_reasoning_memory` or `ask_cipher` to store a summary of what was learned.

You are expected to use these tools throughout the task, not just at the beginning.

## Agent-Specific Commands & Automated Workflows


**Directory Structure**:
```
.project-management/
├── create-prd.md              # PRD generation rules and templates
├── generate-tasks.md          # Task generation process
├── process-tasks-local.md     # Local task execution workflow  
├── process-tasks-cloud.md     # Cloud agent task execution
├── close-prd.md              # PRD completion and archiving
├── current-prd/              # Active PRD and tasks
│   ├── prd-[feature].md      # Generated PRD documents
│   ├── tasks-prd-[feature].md # Generated task lists
│   └── prd-background/       # Supporting specifications
├── closed-prd/               # Completed PRDs and tasks
└── archive-prd/              # Historical archive
```



### Module Re-enabling Guidance

Several NestJS backend modules are temporarily disabled during WebSocket development. Here's the systematic re-enabling strategy based on task analysis:

#### Currently Disabled Modules Status

**AuthModule - OAuth2 Authentication System**
- **Status**: ✅ IMPLEMENTED - Ready for re-enabling
- **Task Reference**: Task ID `e1ab7f1d-c868-4289-97be-4f4b78eb9f4c` (COMPLETED)
- **Priority**: 🔥 HIGH - Production authentication required
- **Dependencies**: User management, session handling, JWT middleware
- **Implementation**: Complete OAuth2 flows, database schema, JWT token management
- **Re-enabling Steps**:
  1. Update `AppModule` imports to include `AuthModule`
  2. Verify OAuth2 database migrations are applied
  3. Test Google and Microsoft OAuth flows with valid credentials
  4. Enable authentication middleware on protected routes
  5. Validate JWT token refresh and session management
  
**AiModule - OpenAI Integration**  
- **Status**: ✅ IMPLEMENTED - Ready for re-enabling
- **Task Reference**: Task ID `ff2682c3-caac-46ed-8026-f2bd4c7b7d77` (COMPLETED)
- **Priority**: 🔥 HIGH - Core AI functionality required
- **Dependencies**: OpenAI API configuration, JSON schema validation
- **Implementation**: Complete AI service, task extraction, classification schemas
- **Re-enabling Steps**:
  1. Configure `OPENAI_API_KEY` in environment variables
  2. Re-enable `AiModule` in main application module imports
  3. Test `/api/ai/extract-tasks` and `/api/ai/classify-task` endpoints
  4. Verify JSON schema validation and error handling
  5. Connect frontend AI components to real backend services

**GraphModule - Microsoft Graph Integration**
- **Status**: ✅ IMPLEMENTED - Ready for re-enabling  
- **Task Reference**: Task ID `d57b65d4-2a9e-456a-80a1-da65ffe0f16a` (COMPLETED)
- **Priority**: 🔥 HIGH - Calendar integration core feature
- **Dependencies**: Microsoft OAuth authentication, Graph API credentials
- **Implementation**: Complete Graph service, calendar/email APIs, database schema
- **Re-enabling Steps**:
  1. Configure Microsoft Graph credentials in environment
  2. Re-enable `GraphModule` with proper dependency injection
  3. Test Outlook calendar and email access permissions
  4. Integrate with daily planning service for calendar events
  5. Update frontend calendar components for dual-provider support

**GoogleModule - Google Services Integration**
- **Status**: ✅ IMPLEMENTED - Ready for re-enabling
- **Task Reference**: Task ID `d6d49499-dc6d-4756-8765-4ecd0c8f4fed` (COMPLETED) 
- **Priority**: 🔥 HIGH - Calendar integration core feature
- **Dependencies**: Google OAuth authentication, Calendar/Gmail API access
- **Implementation**: Complete Google service, calendar integration, daily planning
- **Re-enabling Steps**:
  1. Configure Google API credentials and OAuth scopes
  2. Re-enable `GoogleModule` with calendar service integration
  3. Test Google Calendar API access and event fetching
  4. Verify integration with daily planning algorithm
  5. Enable Gmail API for task extraction (if feature flag enabled)

**UsersModule - User Management System**
- **Status**: ✅ IMPLEMENTED - Ready for re-enabling
- **Task Reference**: Related to multi-user support (Task ID `26c53161-b883-4926-9d3a-f9f7db67f294`)
- **Priority**: 🔥 HIGH - User session management required
- **Dependencies**: Authentication system, user preferences, data isolation
- **Implementation**: User CRUD operations, preferences management, session handling
- **Re-enabling Steps**:
  1. Re-enable `UsersModule` with proper authentication integration
  2. Test user registration and profile management
  3. Verify user preference storage and retrieval
  4. Implement user-scoped data access patterns
  5. Test user session lifecycle and cleanup

**CollaborationModule - Real-time Collaborative Editing**
- **Status**: ⚠️ PARTIAL - Y.js integration in progress
- **Task Reference**: Task ID `6f23784c-b722-4598-be3b-18fdd2540300` (85% COMPLETE)
- **Priority**: 🟡 MEDIUM - Advanced collaboration features
- **Dependencies**: WebSocket gateway, Y.js document synchronization
- **Implementation**: Partial Y.js setup, needs document persistence
- **Re-enabling Steps**:
  1. Complete Y.js document synchronization implementation
  2. Integrate with existing WebSocket notification system
  3. Add collaborative editing UI components
  4. Test multi-user document editing scenarios
  5. Implement conflict resolution and document persistence

**ProjectsModule - Project Organization**
- **Status**: ⚠️ PARTIAL - Basic implementation exists
- **Task Reference**: Multi-user project sharing (Task ID `26c53161-b883-4926-9d3a-f9f7db67f294`)
- **Priority**: 🟢 LOW - Advanced organizational features
- **Dependencies**: User management, task organization, sharing permissions
- **Implementation**: Basic project CRUD, needs sharing and permissions
- **Re-enabling Steps**:
  1. Complete project sharing and permission system
  2. Integrate with task organization and filtering
  3. Add project-based user access control
  4. Implement collaborative project management features
  5. Test project isolation and data security

#### Module Re-enabling Checklist

For each module re-enabling, follow this systematic approach:

**Pre-enablement Verification**:
- [ ] Check module implementation completeness in `/backend/src/[module]/`
- [ ] Verify database schema migrations are applied
- [ ] Confirm environment variables are configured
- [ ] Review feature flag settings for module dependencies

**Re-enabling Process**:
- [ ] Update `AppModule` imports to include the target module
- [ ] Check for circular dependencies in module imports
- [ ] Verify dependency injection and provider configuration
- [ ] Run module-specific unit tests: `npm test -- [module]`
- [ ] Test integration with currently active modules

**Post-enablement Validation**:
- [ ] Run comprehensive test suite: `./run_tests.sh`
- [ ] Test API endpoints with Postman/Thunder Client
- [ ] Verify frontend integration points work correctly
- [ ] Check logging and error handling functions properly
- [ ] Validate feature flag compatibility and toggling

**Common Re-enabling Issues**:
1. **Import Cycles**: Modules may have circular dependencies - use `forwardRef()` or refactor
2. **Schema Mismatches**: Database schema may need updates - run `npx prisma migrate dev`
3. **Missing Environment Variables**: Check `.env.template` for required configuration
4. **Authentication Dependencies**: Some modules require AuthModule to be enabled first
5. **Feature Flag Conflicts**: Ensure feature flags are properly configured for dependencies

### Development Commands & Workflow

#### Prerequisites Setup
```bash
# Initialize development environment (runs both setup scripts)
./dev_init.sh

# Comprehensive test suite
./run_tests.sh
```

#### Development Servers
```bash
# Option 1: Docker Compose (recommended)
docker-compose up

# Option 2: Manual startup
# Backend (NestJS on port 8000, API docs on 8000/api/docs)
cd backend && npm run start:dev

# Frontend (Next.js on port 3000)
cd frontend && pnpm dev

# Storybook component library (port 6006)
cd frontend && pnpm storybook
```

#### Package Management Conventions
- **Frontend**: Use `pnpm` exclusively (faster, more efficient)
- **Backend**: Use `npm` exclusively (NestJS ecosystem compatibility)
- **Docker**: Multi-stage Alpine builds with frozen lockfiles for reproducible builds

#### Database Management & Prisma
```bash
# Core Prisma workflow
cd backend
npx prisma generate        # Generate TypeScript client after schema changes
npx prisma db push         # Push schema changes to database (development)
npx prisma migrate dev     # Create and apply migration (production-ready)
npx prisma studio         # Launch database admin GUI
npx prisma db seed         # Run seed data (optional)

# Backfill scripts for task metadata
npm run migration:backfill-tasks        # Apply task metadata backfill
npm run migration:backfill-tasks:dry-run # Preview changes
npm run migration:backfill-tasks:rollback # Rollback if needed
```

## Key Code Patterns & Architecture

### ADHD-Specific Design System
```typescript
// Energy level mapping to WCAG 2.2 AA compliant colors
const ENERGY_COLORS = {
  HIGH: 'bg-red-100 text-red-800 border-red-200',       // Red - Peak focus required
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200', // Yellow - Moderate effort
  LOW: 'bg-green-100 text-green-800 border-green-200'        // Green - Easy when tired
};

// Focus type indicators with semantic meaning
const FOCUS_ICONS = {
  CREATIVE: '🎨',       // Writing, design, brainstorming
  TECHNICAL: '⚙️',      // Coding, debugging, analysis
  ADMINISTRATIVE: '📋', // Email, reports, data entry
  SOCIAL: '👥'          // Meetings, calls, collaboration
};

// Usage in components
export function EnergyIndicator({ level, showLabel = true, ...props }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-1 ${ENERGY_COLORS[level]}`}
      aria-label={`Energy level: ${level.toLowerCase()}`}
      role="img"
      {...props}
    >
      {showLabel && level}
    </span>
  );
}
```

### Frontend Architecture Patterns

#### Next.js 14.2.30 App Router Structure
```
frontend/src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Home page
│   ├── dashboard/         # Dashboard routes
│   ├── projects/          # Project management
│   └── auth/              # Authentication pages
├── components/
│   ├── ui/                # Reusable UI components
│   ├── auth/              # Authentication components  
│   ├── layout/            # Layout components
│   └── *.stories.tsx      # Storybook stories
├── contexts/              # React contexts (Auth, WebSocket)
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and services
└── store/                 # Zustand state management
```

#### Zustand State Management Pattern
```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface AppState {
  theme: string;
  user: User | null;
  isLoading: boolean;
  setTheme: (theme: string) => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        theme: 'corporate',
        user: null,
        isLoading: false,
        setTheme: (theme) => set({ theme }, false, 'setTheme'),
        setUser: (user) => set({ user }, false, 'setUser'),
        setLoading: (isLoading) => set({ isLoading }, false, 'setLoading'),
      }),
      {
        name: 'app-storage',
        partialize: (state) => ({ theme: state.theme, user: state.user }),
      }
    ),
    { name: 'app-store' }
  )
);
```

#### Component Export Pattern
```typescript
// Use named exports for better tree-shaking and debugging
export function TaskCard({ task, onToggle, onEdit, ...props }) {
  return (/* JSX */);
}

// forwardRef pattern for accessibility-focused components
export const AccessibleButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', ...props }, ref) => {
    return (
      <button ref={ref} className={`btn btn-${variant}`} {...props}>
        {children}
      </button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';
```

### Backend Architecture Patterns

#### NestJS Service & Controller Structure
```typescript
// Service pattern with proper dependency injection
@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly openaiService: OpenAIService
  ) {}

  async extractTasks(text: string, context?: string): Promise<ExtractedTask[]> {
    const completion = await this.openaiService.createChatCompletion({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'Extract actionable tasks from text...' },
        { role: 'user', content: text }
      ],
      functions: [TASK_EXTRACTION_FUNCTION],
      function_call: { name: 'extract_tasks' }
    });
    
    return this.parseExtractedTasks(completion.choices[0].message.function_call);
  }

  async classifyTask(title: string, description?: string): Promise<TaskClassification> {
    // Auto-predict energyLevel, focusType, estimatedDuration, priority
  }
}

@Controller('ai')
@UseGuards(JwtAuthGuard) // Authentication required
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('extract-tasks')
  @HttpCode(HttpStatus.OK)
  async extractTasks(@Body() dto: ExtractTasksDto): Promise<ExtractedTask[]> {
    return this.aiService.extractTasks(dto.text, dto.context);
  }
}
```

#### Current Module Status (Many Temporarily Disabled)
```typescript
// backend/src/app.module.ts - Current active modules
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    TasksModule,                    // ✅ Active
    NotificationsModule,           // ✅ Active
    // UsersModule,                // 🚧 Temporarily disabled for WebSocket testing
    // AuthModule,                 // 🚧 Disabled due to compilation errors
    // AiModule,                   // 🚧 Disabled for WebSocket testing
    // CollaborationModule,        // 🚧 Disabled for WebSocket testing
    // GraphModule,                // 🚧 Disabled due to compilation errors
    // GoogleModule,               // 🚧 Disabled for WebSocket testing
  ],
  // ...
})
```

### Database Schema (ADHD-Optimized)
```prisma
// Enhanced task model with ADHD-specific features
model Task {
  id               String      @id @default(cuid())
  title            String
  description      String?
  energyLevel      EnergyLevel @default(MEDIUM)
  focusType        FocusType   @default(TECHNICAL)
  priority         Int         @default(5)
  source           TaskSource  @default(MANUAL)
  estimatedMinutes Int?
  completed        Boolean     @default(false)
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt
  
  // AI-enhanced fields
  aiClassification Json?       // Store AI analysis results
  complexity       Int?        // 1-10 complexity score
  dependencies     String[]    // Task dependencies
}

enum EnergyLevel {
  LOW     // Green - Easy tasks when tired/low energy
  MEDIUM  // Yellow - Moderate focus needed
  HIGH    // Red - Peak focus and energy required
}

enum FocusType {
  CREATIVE       // 🎨 Writing, design, brainstorming
  TECHNICAL      // ⚙️ Coding, debugging, analysis  
  ADMINISTRATIVE // 📋 Email, reports, data entry
  SOCIAL         // 👥 Meetings, calls, collaboration
}

enum TaskSource {
  MANUAL       // User-created tasks
  AI_EXTRACTED // Generated from emails/notes via AI
  CALENDAR     // Imported from calendar events
  EMAIL        // Derived from email content
  PRD          // Generated from PRD workflow
}
```

## Docker Build System & Production Configuration

### Multi-Stage Alpine Build Pattern
```dockerfile
# frontend/Dockerfile.frontend
FROM node:20-alpine AS deps
WORKDIR /app
RUN npm install -g pnpm
COPY frontend/package*.json frontend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY --from=deps /app/node_modules ./node_modules
COPY frontend/ ./
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build

FROM node:20-alpine AS runner
WORKDIR /app
# Security: Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
USER nextjs
```

### Next.js Production Configuration
```javascript
// next.config.js - Key production optimizations
const nextConfig = {
  output: 'standalone',                    // Docker-optimized output
  eslint: { ignoreDuringBuilds: true },   // Skip linting in production
  typescript: { ignoreBuildErrors: true }, // Skip TS checking for faster builds
  
  experimental: {
    optimizeCss: true,                     // CSS optimization
    optimizePackageImports: ['@/components', '@/lib'],
  },
  
  // Bundle optimization with webpack
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        cacheGroups: {
          vendor: { test: /[\\/]node_modules[\\/]/, name: 'vendors' },
          react: { test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/, name: 'react' },
          ui: { test: /[\\/]src[\\/]components[\\/]/, name: 'ui' },
        },
      };
    }
    return config;
  },
};
```

## Testing & Quality Assurance

### Testing Strategy Overview
```bash
# Frontend testing (Vitest + React Testing Library)
cd frontend
pnpm test                 # Run all tests  
pnpm test:watch          # Watch mode
pnpm test:cov            # Coverage report
pnpm test:accessibility  # Accessibility tests
pnpm test:e2e            # Playwright E2E tests

# Backend testing (Jest + NestJS utilities)
cd backend  
npm test                 # Unit tests
npm run test:cov         # Coverage report
npm run test:e2e         # Integration tests

# Comprehensive test suite
./run_tests.sh           # Run all tests across both frontend/backend
```

### Accessibility Testing Pattern
```typescript
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';

expect.extend(toHaveNoViolations);

test('TaskCard supports keyboard navigation and is accessible', async () => {
  const user = userEvent.setup();
  const { container } = render(<TaskCard task={mockTask} />);
  
  // Test keyboard navigation
  await user.tab();
  expect(screen.getByRole('button', { name: /complete task/i })).toHaveFocus();
  
  await user.keyboard('{Enter}');
  expect(mockOnToggle).toHaveBeenCalledWith(mockTask.id);
  
  // Test accessibility compliance
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Storybook Component Development
```typescript
// Component story with accessibility and responsive testing
import type { Meta, StoryObj } from '@storybook/react';
import { EnergyIndicator } from './EnergyIndicator';

const meta: Meta<typeof EnergyIndicator> = {
  title: 'Components/EnergyIndicator',
  component: EnergyIndicator,
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'keyboard-navigation', enabled: true }
        ]
      }
    },
    docs: {
      description: {
        component: 'ADHD-friendly energy level indicator with semantic colors'
      }
    }
  },
  argTypes: {
    level: { control: 'select', options: ['LOW', 'MEDIUM', 'HIGH'] }
  }
};

export default meta;
type Story = StoryObj<typeof EnergyIndicator>;

export const AllLevels: Story = {
  render: () => (
    <div className="space-y-2">
      <EnergyIndicator level="LOW" />
      <EnergyIndicator level="MEDIUM" />  
      <EnergyIndicator level="HIGH" />
    </div>
  )
};

export const HighContrast: Story = {
  parameters: { backgrounds: { default: 'dark' } },
  args: { level: 'HIGH' }
};
```

## Environment Configuration & Services

### Service Ports & Docker Setup
```bash
# Development services
Frontend (Next.js):       http://localhost:3000
Backend (NestJS):         http://localhost:8000  
API Documentation:        http://localhost:8000/api/docs
Storybook:               http://localhost:6006
PostgreSQL:              localhost:5432 (container) / 5487 (dev)
WebSocket (y-websocket): ws://localhost:8001/collaboration

# Docker Compose services
docker-compose up         # All services
docker-compose up postgres # Database only
docker-compose build frontend # Rebuild frontend image
```

### Key Environment Variables
```bash
# Backend (.env)
DATABASE_URL="postgresql://user:pass@localhost:5432/helmsman"
OPENAI_API_KEY="sk-..."
CORS_ORIGIN="http://localhost:3000"
JWT_SECRET="your-secret-key"
MICROSOFT_CLIENT_ID="..."
GOOGLE_CLIENT_ID="..."

# Frontend (.env.local)  
NEXT_PUBLIC_API_URL="http://localhost:8000"
NEXT_PUBLIC_WS_URL="ws://localhost:8001"
```

### File Structure & Key Locations
```
codex_bootstrap/
├── .github/copilot-instructions.md    # This file - AI agent guidance
├── .project-management/               # Automated workflow files
│   ├── create-prd.md                 # PRD generation instructions
│   ├── generate-tasks.md             # Task list creation
│   ├── process-tasks-cloud.md        # TaskMaster workflow
│   └── current-prd/                  # Active development artifacts
├── backend/src/
│   ├── app.module.ts                 # NestJS root module  
│   ├── tasks/                        # Task management (ACTIVE)
│   ├── notifications/                # Notification system (ACTIVE)
│   ├── prisma/                       # Database schema & migrations
│   └── main.ts                       # Server entry point
├── frontend/src/
│   ├── app/                          # Next.js App Router pages
│   ├── components/ui/                # Reusable components
│   ├── contexts/                     # React contexts (Auth, WebSocket)
│   └── store/                        # Zustand state management
├── docs/                             # Comprehensive documentation
└── dev_init.sh                       # Development setup script
```
## AI Integration & Service Architecture

### OpenAI Service Implementation
```typescript
@Injectable()
export class OpenAIService {
  async extractTasks(text: string, context?: string): Promise<ExtractedTask[]> {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'Extract actionable tasks from text...' },
        { role: 'user', content: text }
      ],
      functions: [TASK_EXTRACTION_FUNCTION],
      function_call: { name: 'extract_tasks' }
    });
    
    return this.parseExtractedTasks(completion.choices[0].message.function_call);
  }

  async classifyTask(title: string, description?: string): Promise<TaskClassification> {
    // Auto-predict energyLevel, focusType, estimatedDuration, priority using GPT-4
    // Returns structured classification for ADHD optimization
  }

  async generateProactiveSuggestions(
    tasks: Task[], 
    context: InteractionLog[]
  ): Promise<AIRecommendation[]> {
    // Generate daily planning recommendations based on energy patterns
  }
}
```

### API Endpoints (Current & Planned)
```typescript
// Active endpoints
POST /api/tasks              # Create new task
GET  /api/tasks              # List tasks with filtering
PUT  /api/tasks/:id          # Update task
DELETE /api/tasks/:id        # Delete task

// AI endpoints (some disabled during WebSocket development)
POST /api/ai/extract-tasks   # Extract tasks from text
POST /api/ai/classify-task   # Auto-predict task metadata
GET  /api/plans/today        # Generate optimized daily schedule

// Integration endpoints (temporarily disabled)
POST /api/graph/analyze-email      # Extract tasks from Outlook emails
GET  /api/graph/email-context      # Retrieve stored email context
GET  /api/graph/calendar-events    # Sync calendar events
```

### Daily Planning Algorithm
The system implements ADHD-optimized scheduling with:
- **Energy Matching**: HIGH/MEDIUM/LOW energy tasks aligned to user's daily energy patterns
- **Focus Batching**: Group CREATIVE/TECHNICAL/ADMINISTRATIVE/SOCIAL tasks for cognitive efficiency  
- **Deadline Management**: Prioritize hard deadlines, suggest soft deadline adjustments
- **Dependency Resolution**: Block dependent tasks until prerequisites complete
- **Complexity Balancing**: Mix simple and complex tasks to prevent cognitive overload

## File Modification Guidelines & Development Standards

### Always Update When Making Changes
- **CHANGELOG.md**: Add timestamped one-line summary for all significant changes
- **DEVELOPMENT.md**: Update manual startup instructions when adding new services/dependencies
- **.env.template**: Add new required environment variables with example values
- **dev_init.sh**: Update for new dependencies, services, or setup requirements
- **.codex/install.sh**: Update for Codex environment changes (takes effect in next session)

### Code Quality Standards
```bash
# Frontend linting & formatting
cd frontend
pnpm lint                    # ESLint with Next.js rules
pnpm build                   # Verify production build works

# Backend linting & formatting  
cd backend
npm run lint                 # ESLint with NestJS rules
npm run format               # Prettier formatting

# Comprehensive quality check
./run_tests.sh               # All tests must pass before commits
```

### SSR & Production Build Considerations
```typescript
// Pages with dynamic content must export dynamic config
// frontend/src/app/auth/success/page.tsx
export const dynamic = 'force-dynamic'; // Prevents static generation

// Avoid hydration mismatches with proper SSR guards
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
if (!mounted) return null; // Prevent hydration issues
```

## Integration Points & Real-time Features

### WebSocket & Collaboration (y-websocket + Yjs)
```typescript
// Real-time document collaboration setup
const doc = new Y.Doc();
const wsProvider = new WebsocketProvider(
  'ws://localhost:8001', 
  'document-room-id', 
  doc
);

// Document sync with conflict resolution
const yText = doc.getText('content');
yText.observe((event) => {
  // Handle collaborative text changes
});
```

### Microsoft Graph Integration (Currently Disabled)
```typescript
// Will be re-enabled after WebSocket development
interface GraphService {
  syncEmails(userId: string): Promise<GraphEmail[]>;
  getCalendarEvents(userId: string, dateRange: DateRange): Promise<CalendarEvent[]>;  
  storeEmailContext(email: GraphEmail): Promise<void>;
}

// Endpoints: /api/graph/emails, /api/graph/calendar, /api/graph/sync
```

### Performance Optimization for ADHD Users
- **Core Web Vitals**: Target <2.5s LCP, <500KB initial bundle
- **Service Worker**: Aggressive caching for offline-first experience (`frontend/public/sw.js`)
- **Motion Control**: Respect `prefers-reduced-motion` throughout application
- **Cognitive Load**: Progressive disclosure, consistent layouts, minimal context switching
- **Visual Hierarchy**: Inter font, 1.25 type scale, 8px spacing system

### ADHD-Specific Performance Monitoring

**Performance Targets Optimized for ADHD Users**:
- **Largest Contentful Paint (LCP)**: < 2.0s (stricter than standard 2.5s to reduce frustration)
- **First Input Delay (FID)**: < 50ms (faster than standard 100ms for immediate feedback)
- **Cumulative Layout Shift (CLS)**: < 0.05 (lower than standard 0.1 to prevent visual anxiety)
- **Time to Interactive (TTI)**: < 3.0s (reduced cognitive wait time)

**ADHD-Optimized Metrics**:
- **Task Load Time**: < 1.5s for task list rendering (prevents abandonment)
- **Calendar Paint Time**: < 800ms for calendar view switching (maintains focus flow)
- **AI Response Time**: < 3.0s for task extraction (acceptable wait for AI processing)
- **Real-time Update Latency**: < 200ms for WebSocket notifications (immediate feedback)

**Performance Monitoring Implementation**:
```typescript
// Web Vitals tracking with ADHD thresholds
import { getCLS, getFID, getLCP } from 'web-vitals';

const sendToAnalytics = (metric) => {
  // ADHD-specific threshold warnings
  const adhdThresholds = {
    LCP: 2000,  // 2s instead of 2.5s
    FID: 50,    // 50ms instead of 100ms  
    CLS: 0.05   // 0.05 instead of 0.1
  };
  
  if (metric.value > adhdThresholds[metric.name]) {
    console.warn(`${metric.name} exceeds ADHD-friendly threshold:`, metric.value);
  }
};

// Backend response time monitoring
@Injectable()
export class PerformanceMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      
      // ADHD-specific response time alerts
      if (duration > 1000) {
        this.logger.warn(`Slow response: ${req.path} took ${duration}ms`);
      }
      
      this.metricsService.recordResponseTime(req.path, duration);
    });
    
    next();
  }
}
```

**Monitoring Dashboard Configuration**:
```yaml
# Grafana dashboard panels for ADHD optimization
panels:
  - title: "ADHD User Experience Metrics"
    metrics: [LCP, FID, CLS]
    thresholds:
      LCP: { warning: 1500, critical: 2000 }
      FID: { warning: 30, critical: 50 }
      CLS: { warning: 0.03, critical: 0.05 }
      
  - title: "Task Management Performance"  
    metrics: [task_load_time, task_create_latency, task_update_latency]
    thresholds:
      task_load_time: { warning: 1000, critical: 1500 }
      
  - title: "AI Service Performance"
    metrics: [openai_response_time, ai_success_rate, token_usage]
    thresholds:
      openai_response_time: { warning: 3000, critical: 5000 }
      
  - title: "Real-time Communication Health"
    metrics: [websocket_latency, connection_stability, message_throughput]
    thresholds:
      websocket_latency: { warning: 200, critical: 500 }
```

**Performance Regression Detection**:
```typescript
// Automated performance testing for ADHD thresholds
test('task loading performance meets ADHD standards', async ({ page }) => {
  const startTime = Date.now();
  
  await page.goto('/dashboard');
  await page.waitForSelector('[data-testid="task-list"]');
  
  const loadTime = Date.now() - startTime;
  expect(loadTime).toBeLessThan(1500); // ADHD-friendly threshold
});

// Lighthouse CI with ADHD-specific budgets
test('lighthouse scores meet ADHD requirements', async ({ page }) => {
  const audit = await lighthouse(page.url());
  
  expect(audit.lhr.audits['largest-contentful-paint'].numericValue)
    .toBeLessThan(2000); // ADHD threshold
  expect(audit.lhr.audits['cumulative-layout-shift'].numericValue)
    .toBeLessThan(0.05);  // ADHD threshold
});
```

**Bundle Optimization for Cognitive Load Reduction**:
```javascript
// webpack.config.js - Optimized for ADHD users
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // Critical ADHD UI components - load first
        adhd: {
          test: /[\\/]src[\\/](components[\\/]ui|lib[\\/]accessibility)/,
          name: 'adhd-ui',
          priority: 30
        },
        // AI and advanced features - load later
        ai: {
          test: /[\\/]src[\\/]ai[\\/]/,
          name: 'ai-features', 
          priority: 10
        }
      }
    }
  },
  // Bundle size alerts for ADHD performance
  performance: {
    maxAssetSize: 400000,    // 400KB instead of 500KB
    maxEntrypointSize: 400000,
    hints: 'error'
  }
};
```

## Key Development Principles

1. **ADHD-First Design**: Every UI decision prioritizes cognitive load reduction and predictable interactions
2. **Accessibility by Default**: WCAG 2.2 AA compliance is non-negotiable - test with axe-core
3. **Energy-Aware UX**: Tasks categorized by required energy/focus type for optimal scheduling
4. **AI-Augmented Workflow**: AI handles task extraction, classification, and daily planning optimization
5. **Real-time Collaboration**: Support multiple users editing documents simultaneously with Yjs CRDT
6. **Performance Conscious**: Monitor bundle size, Core Web Vitals, perceived performance
7. **Production Ready**: Docker builds must succeed, all tests must pass, SSR compatibility required

**Remember**: This project prioritizes **ADHD-friendly UX** with predictable interactions, clear visual hierarchy, and reduced cognitive load in all implementations. Current focus is on WebSocket integration with many modules temporarily disabled for stability.
