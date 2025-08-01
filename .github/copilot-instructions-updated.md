# GitHub Copilot Instructions for Helmsman

This document provides comprehensive guidance for AI coding assistants working on the Helmsman project - an ADHD-optimized task management system with intelligent assistance features.

## Project Overview

**Helmsman** is a full-stack task management application designed specifically for individuals with ADHD, featuring:
- AI-powered task extraction and prioritization
- Energy level and focus type matching  
- Real-time collaborative document editing
- Accessibility-first design (WCAG 2.2 AA)
- Microsoft Graph integration for calendar/email context
- Special AI agent workflow with automated PRD creation

### Core Technologies
- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS + DaisyUI
- **Backend**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **State Management**: Zustand (client state) + React Query (server state)
- **Real-time**: WebSocket + Yjs for collaborative editing
- **Testing**: Vitest, Playwright, Storybook Test Runner, axe-core
- **AI**: OpenAI GPT-4 for task extraction and recommendations

## Agent-Specific Commands

### Special Codex Environment Commands
When working in the Codex environment, use these special commands for automated workflows:

- **TaskMaster**: Creates a comprehensive project with PRD and task breakdown
- **CreatePrd**: Generates a Product Requirements Document from user prompt
- **CreateTasks**: Converts existing PRD into actionable task list

**Important**: These commands only work in Codex environments and reference `.project-management/` workflow files.

### PRD Generation Workflow
1. **Feature Request**: User provides feature description or refers to `.project-management/current-prd/prd-background/feature-specification.md`
2. **Clarifying Questions**: AI asks targeted questions about problem, users, functionality, acceptance criteria
3. **PRD Creation**: Generate structured PRD with goals, user stories, functional requirements, technical considerations
4. **Task Breakdown**: Convert PRD into parent tasks, then detailed sub-tasks with file references

## Development Commands

### Prerequisites Setup
```bash
# Initialize development environment (Docker optional)
./dev_init.sh

# Run comprehensive test suite
./run_tests.sh
```

### Development Workflow
```bash
# Start all services in development mode
docker-compose up  # OR manually start each service

# Frontend (Next.js on port 3000)
cd frontend && pnpm dev

# Backend (NestJS on port 8222)
cd backend && npm run start:dev

# Database (PostgreSQL on port 5487)
docker-compose up postgres

# Storybook (port 6006)
pnpm storybook
```

### Package Management
- **Root/Frontend**: Use `pnpm` for package management
- **Backend**: Use `npm` for package management
- **Monorepo Structure**: Separate package.json files for each workspace

### Database Management
```bash
# Prisma migrations
cd backend
npx prisma generate       # Generate client
npx prisma db push        # Push schema changes
npx prisma migrate dev    # Create migration
npx prisma studio        # GUI admin
```

## Key Code Patterns

### ADHD-Specific Enums & UI Colors
```typescript
// Energy level mapping to UI colors (WCAG 2.2 AA compliant)
const ENERGY_COLORS = {
  HIGH: 'bg-red-100 text-red-800',     // Red - High focus required
  MEDIUM: 'bg-yellow-100 text-yellow-800',  // Yellow - Moderate effort  
  LOW: 'bg-green-100 text-green-800'        // Green - Easy tasks
};

// Focus type indicators
const FOCUS_ICONS = {
  CREATIVE: '🎨',      // Writing, design, brainstorming
  TECHNICAL: '⚙️',     // Coding, debugging, analysis
  ADMINISTRATIVE: '📋', // Email, reports, data entry
  SOCIAL: '👥'         // Meetings, calls, collaboration
};
```

### Frontend Architecture Patterns

#### Zustand State Management
```typescript
// Store pattern with devtools and persistence
export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        theme: 'corporate',
        isLoading: false,
        user: { id: null, name: null, email: null },
        setTheme: (theme) => set({ theme }, false, 'setTheme'),
        setLoading: (isLoading) => set({ isLoading }, false, 'setLoading'),
        // ... actions with descriptive names for devtools
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

#### Component Patterns
```typescript
// Export functions for named components
export function UserMenu() {
  const { user, clearUser } = useAppStore();
  return (/* JSX */);
}

// forwardRef pattern for accessibility components
export const AccessibleButton = forwardRef<HTMLButtonElement, Props>(
  ({ children, variant = 'primary', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`btn btn-${variant}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);
```

### Backend Architecture Patterns

#### NestJS Service Structure
```typescript
@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly openai: OpenAI
  ) {}

  async extractTasks(text: string, context?: string): Promise<ExtractedTask[]> {
    // Implementation with proper error handling
  }
}

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('extract-tasks')
  async extractTasks(@Body() dto: ExtractTasksDto) {
    return this.aiService.extractTasks(dto.text, dto.context);
  }
}
```

#### Microsoft Graph Integration
```typescript
@Injectable()
export class GraphService {
  async syncEmails(userId: string): Promise<GraphEmail[]> {
    // Sync Outlook emails for AI context
  }
  
  async getCalendarEvents(userId: string, dateRange: DateRange): Promise<CalendarEvent[]> {
    // Import calendar for intelligent scheduling
  }
  
  async storeEmailContext(email: GraphEmail): Promise<void> {
    // Store email content for contextual AI recommendations
  }
}
```

### Database & API Patterns

#### Prisma Schema (ADHD-Optimized)
```prisma
model Task {
  id          String      @id @default(cuid())
  title       String
  description String?
  energyLevel EnergyLevel @default(MEDIUM)
  focusType   FocusType   @default(TECHNICAL)
  priority    Int         @default(5)
  source      TaskSource  @default(MANUAL)
  estimatedMinutes Int?
  completed   Boolean     @default(false)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

enum EnergyLevel {
  LOW    // Green - Easy tasks when tired
  MEDIUM // Yellow - Moderate focus needed
  HIGH   // Red - Peak focus required
}

enum FocusType {
  CREATIVE       // 🎨 Writing, design, brainstorming
  TECHNICAL      // ⚙️ Coding, debugging, analysis  
  ADMINISTRATIVE // 📋 Email, reports, data entry
  SOCIAL         // 👥 Meetings, calls, collaboration
}

enum TaskSource {
  MANUAL       // User-created
  AI_EXTRACTED // From emails/notes via AI
  CALENDAR     // Calendar event conversion
  EMAIL        // Email-derived task
}
```

### Accessibility Implementation Patterns

#### Core Accessibility Components
```typescript
// Comprehensive accessibility provider
export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const [reducedMotion, setReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const handleChange = () => setReducedMotion(mediaQuery.matches);
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  return (
    <AccessibilityContext.Provider value={{ 
      announcements, 
      announce: (message) => setAnnouncements(prev => [...prev, message]),
      reducedMotion 
    }}>
      {children}
      <LiveRegion messages={announcements} />
    </AccessibilityContext.Provider>
  );
}

// ADHD-specific energy indicator
export function EnergyIndicator({ 
  level, 
  size = 'sm', 
  showLabel = true,
  'aria-label': ariaLabel 
}: EnergyIndicatorProps) {
  const colors = {
    LOW: 'bg-green-100 text-green-800 border-green-200',
    MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
    HIGH: 'bg-red-100 text-red-800 border-red-200'
  };
  
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-1 ${colors[level]}`}
      aria-label={ariaLabel || `Energy level: ${level.toLowerCase()}`}
      role="img"
    >
      {showLabel && level}
    </span>
  );
}
```

#### Testing Patterns (Accessibility-First)
```typescript
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';

expect.extend(toHaveNoViolations);

test('TaskCard supports keyboard navigation', async () => {
  const user = userEvent.setup();
  render(<TaskCard task={mockTask} />);
  
  await user.tab();
  expect(screen.getByRole('button', { name: /complete task/i })).toHaveFocus();
  
  await user.keyboard('{Enter}');
  expect(mockOnToggle).toHaveBeenCalledWith(mockTask.id);
});

test('TaskCard has no accessibility violations', async () => {
  const { container } = render(<TaskCard task={mockTask} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

test('TaskCard respects reduced motion preference', () => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      addListener: jest.fn(),
      removeListener: jest.fn(),
    })),
  });
  
  render(<TaskCard task={mockTask} />);
  // Verify animations are disabled
});
```

## Storybook & Component Development

### Story Structure
```typescript
// Component story with accessibility scenarios
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
    }
  },
  argTypes: {
    level: {
      control: { type: 'select' },
      options: ['LOW', 'MEDIUM', 'HIGH']
    }
  }
};

export default meta;

export const AllLevels: StoryObj<typeof EnergyIndicator> = {
  render: () => (
    <div className="space-y-2">
      <EnergyIndicator level="LOW" />
      <EnergyIndicator level="MEDIUM" />  
      <EnergyIndicator level="HIGH" />
    </div>
  )
};

export const HighContrast: StoryObj<typeof EnergyIndicator> = {
  parameters: {
    backgrounds: { default: 'dark' }
  },
  args: { level: 'HIGH' }
};
```

### Testing Files Location
- **Frontend Tests**: `frontend/src/**/*.test.tsx` (React Testing Library + axe-core)
- **Backend Tests**: `backend/src/**/*.spec.ts` (Jest + NestJS testing utilities)
- **E2E Tests**: `frontend/tests/` (Playwright configuration)
- **Stories**: `frontend/src/**/*.stories.tsx` (auto-discovered by Storybook)

## Environment & Dependencies

### Docker Services
- **Database**: PostgreSQL on port 5487 (dev) / 5432 (container)
- **Backend**: NestJS on port 8222 (dev) / 8000 (container)  
- **Frontend**: Next.js on port 3000

### AI Integration Points

#### OpenAI Service Architecture
```typescript
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
    // Auto-predict energyLevel, focusType, estimatedDuration, priority
  }

  async generateProactiveSuggestions(tasks: Task[], context: InteractionLog[]): Promise<AIRecommendation[]> {
    // Generate daily planning recommendations
  }
}
```

#### AI API Endpoints
- **POST /api/ai/extract-tasks**: Extract tasks from emails/notes/conversations
- **POST /api/ai/classify-task**: Auto-predict task metadata (energy, focus, duration)
- **GET /api/plans/today**: Generate optimized daily schedule with energy/focus matching
- **POST /api/graph/analyze-email**: Extract tasks and context from Outlook emails
- **GET /api/graph/email-context**: Retrieve stored email context for AI recommendations

### Daily Planning Algorithm
- **Energy Optimization**: Match HIGH/MEDIUM/LOW energy tasks to user's daily patterns
- **Focus Batching**: Group CREATIVE/TECHNICAL/ADMINISTRATIVE/SOCIAL tasks for cognitive efficiency
- **Deadline Management**: Prioritize hard deadlines, suggest soft deadline adjustments
- **Dependency Resolution**: Block dependent tasks until prerequisites complete

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

### Microsoft Graph Integration
- **Email Processing**: Sync Outlook emails to extract tasks and context for AI analysis
- **Calendar Sync**: Import calendar events for intelligent scheduling and time blocking
- **Email Storage**: Store email content in graph database for contextual AI recommendations
- **Authentication**: OAuth 2.0 flow for secure Microsoft 365 integration
- **Endpoints**: `/api/graph/emails`, `/api/graph/calendar`, `/api/graph/sync`

### Performance & ADHD Optimization
- **Core Web Vitals**: <2.5s LCP, <500KB initial bundle, virtual scrolling for large datasets
- **Motion Control**: Respect `prefers-reduced-motion` throughout, CSS transitions over complex animations
- **Cognitive Load**: Progressive disclosure, consistent layouts, minimal context switching
- **Visual Hierarchy**: Inter font with 1.25 type scale, 8px spacing system for visual consistency

## Key Development Principles

1. **ADHD-First Design**: Every UI decision prioritizes cognitive load reduction and predictable interactions
2. **Accessibility by Default**: WCAG 2.2 AA compliance is non-negotiable, test with axe-core
3. **Energy-Aware UX**: Tasks are categorized by required energy/focus type for optimal scheduling
4. **AI-Augmented Workflow**: Let AI handle task extraction, classification, and daily planning
5. **Real-time Collaboration**: Support multiple users editing documents simultaneously with Yjs
6. **Performance Conscious**: Monitor bundle size, Core Web Vitals, and perceived performance

Remember: This project prioritizes **ADHD-friendly UX** with predictable interactions, clear visual hierarchy, and reduced cognitive load in all implementations.
