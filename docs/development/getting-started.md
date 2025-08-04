# Getting Started - Developer Guide

## 🚀 Quick Start

Welcome to Helmsman development! This guide will get you up and running with the full development environment in under 10 minutes.

### Prerequisites

- **Node.js**: 18.x or higher
- **pnpm**: 8.x or higher (recommended package manager)
- **PostgreSQL**: 14.x or higher
- **Redis**: 6.x or higher (for rate limiting and caching)
- **Git**: Latest version

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd codex_bootstrap

# Install dependencies for all workspaces
pnpm install

# Set up environment variables
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit environment files with your configuration
# See "Environment Configuration" section below
```

### Database Setup

```bash
# Start PostgreSQL and Redis (using Docker)
docker-compose up -d postgres redis

# Initialize database
cd backend
pnpm prisma migrate dev
pnpm prisma db seed

# Generate Prisma client
pnpm prisma generate
```

### Development Servers

```bash
# Terminal 1: Backend (NestJS)
cd backend
pnpm dev
# Runs on http://localhost:3001

# Terminal 2: Frontend (Next.js)
cd frontend
pnpm dev
# Runs on http://localhost:3000

# Terminal 3: Storybook (Component Library)
cd frontend
pnpm storybook
# Runs on http://localhost:6006
```

## 🏗️ Project Architecture

### Monorepo Structure

```
codex_bootstrap/
├── backend/          # NestJS API server
│   ├── src/
│   │   ├── app.module.ts
│   │   ├── auth/      # Authentication module
│   │   ├── tasks/     # Task management
│   │   ├── users/     # User management
│   │   ├── ai/        # OpenAI integration
│   │   ├── integrations/
│   │   │   ├── google/    # Google Calendar/Gmail
│   │   │   └── graph/     # Microsoft Graph
│   │   ├── planning/  # Daily planning algorithm
│   │   └── prisma/    # Database schema
│   └── package.json
├── frontend/         # Next.js application
│   ├── src/
│   │   ├── app/       # Next.js 14 app router
│   │   ├── components/
│   │   │   ├── ui/        # Reusable components
│   │   │   ├── layout/    # Layout components
│   │   │   └── pages/     # Page components
│   │   ├── hooks/     # React hooks
│   │   ├── lib/       # Utilities and services
│   │   └── styles/    # Global styles and tokens
│   └── package.json
├── docs/             # Documentation
├── k8s/              # Kubernetes manifests
└── package.json      # Root workspace config
```

### Technology Stack

#### Backend

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with OAuth 2.0 integrations
- **AI Services**: OpenAI GPT-4 with structured outputs
- **Integrations**: Google Calendar, Microsoft Graph, Gmail
- **Caching**: Redis for sessions and rate limiting
- **Testing**: Jest with integration tests

#### Frontend

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**:
  - React Query (TanStack Query) for server state
  - Zustand for client state
- **Components**: Custom library with Storybook
- **Testing**: Jest + React Testing Library + Playwright

## 🔧 Environment Configuration

### Backend Environment (backend/.env)

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/helmsman_dev"

# Authentication
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# OpenAI Integration
OPENAI_API_KEY="sk-your-openai-api-key"
OPENAI_MODEL="gpt-4"
OPENAI_MAX_TOKENS=2000

# Google Integration
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3001/auth/google/callback"

# Microsoft Graph Integration
MICROSOFT_CLIENT_ID="your-microsoft-client-id"
MICROSOFT_CLIENT_SECRET="your-microsoft-client-secret"
MICROSOFT_TENANT_ID="your-tenant-id"

# Redis
REDIS_URL="redis://localhost:6379"

# Security
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100

# Development
NODE_ENV="development"
PORT=3001
```

### Frontend Environment (frontend/.env.local)

```bash
# API Configuration
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_WS_URL="ws://localhost:3001"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# Feature Flags
NEXT_PUBLIC_ENABLE_AI_FEATURES="true"
NEXT_PUBLIC_ENABLE_CALENDAR_INTEGRATION="true"
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING="true"

# Analytics (optional)
NEXT_PUBLIC_ANALYTICS_ID=""

# Development
NODE_ENV="development"
```

## 🏃 Development Workflow

### 1. Feature Development Process

```bash
# Create a feature branch
git checkout -b feature/task-ai-suggestions

# Make changes to backend and/or frontend
# Follow TDD: write tests first, then implementation

# Run tests continuously during development
cd backend && pnpm test:watch
cd frontend && pnpm test:watch

# Check code quality
pnpm lint
pnpm type-check
```

### 2. Database Migrations

```bash
# Create a new migration
cd backend
pnpm prisma migrate dev --name add_task_metadata

# Reset database (development only)
pnpm prisma migrate reset

# Deploy migrations (production)
pnpm prisma migrate deploy
```

### 3. API Development

#### Creating a New Endpoint

```typescript
// backend/src/tasks/tasks.controller.ts
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createTask(
    @Body() createTaskDto: CreateTaskDto,
    @User() user: UserEntity
  ): Promise<TaskEntity> {
    return this.tasksService.create(createTaskDto, user.id);
  }
}

// backend/src/tasks/dto/create-task.dto.ts
export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(EnergyLevel)
  energyLevel?: EnergyLevel;

  @IsOptional()
  @IsEnum(FocusType)
  focusType?: FocusType;
}
```

#### Testing the Endpoint

```typescript
// backend/src/tasks/tasks.controller.spec.ts
describe('TasksController', () => {
  let controller: TasksController;
  let service: TasksService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
    service = module.get<TasksService>(TasksService);
  });

  it('should create a task', async () => {
    const createTaskDto = {
      title: 'Test Task',
      energyLevel: EnergyLevel.HIGH,
    };
    const user = { id: 'user-123' } as UserEntity;
    const expectedTask = { id: 'task-123', ...createTaskDto };

    jest.spyOn(service, 'create').mockResolvedValue(expectedTask);

    const result = await controller.createTask(createTaskDto, user);

    expect(service.create).toHaveBeenCalledWith(createTaskDto, user.id);
    expect(result).toEqual(expectedTask);
  });
});
```

### 4. Frontend Component Development

#### Creating a New Component

```tsx
// frontend/src/components/ui/EnergyBadge.tsx
import { cn } from '@/lib/utils';

interface EnergyBadgeProps {
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  className?: string;
}

export const EnergyBadge = ({ level, className }: EnergyBadgeProps) => {
  const variants = {
    HIGH: 'bg-green-100 text-green-900 border-green-600',
    MEDIUM: 'bg-amber-100 text-amber-900 border-amber-600',
    LOW: 'bg-indigo-100 text-indigo-900 border-indigo-600',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-1 border rounded-md text-sm font-medium',
        variants[level],
        className
      )}
      aria-label={`${level.toLowerCase()} energy level`}
    >
      {level} Energy
    </span>
  );
};
```

#### Component Story

```tsx
// frontend/src/components/ui/EnergyBadge.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { EnergyBadge } from './EnergyBadge';

const meta: Meta<typeof EnergyBadge> = {
  title: 'UI/EnergyBadge',
  component: EnergyBadge,
  parameters: {
    docs: {
      description: {
        component: 'Displays energy level with ADHD-friendly color coding',
      },
    },
  },
  argTypes: {
    level: {
      control: 'select',
      options: ['HIGH', 'MEDIUM', 'LOW'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof EnergyBadge>;

export const High: Story = {
  args: {
    level: 'HIGH',
  },
};

export const Medium: Story = {
  args: {
    level: 'MEDIUM',
  },
};

export const Low: Story = {
  args: {
    level: 'LOW',
  },
};
```

#### Component Tests

```tsx
// frontend/src/components/ui/EnergyBadge.test.tsx
import { render, screen } from '@testing-library/react';
import { EnergyBadge } from './EnergyBadge';

describe('EnergyBadge', () => {
  it('renders high energy badge with correct styling', () => {
    render(<EnergyBadge level="HIGH" />);

    const badge = screen.getByText('HIGH Energy');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-green-100', 'text-green-900');
    expect(badge).toHaveAttribute('aria-label', 'high energy level');
  });

  it('applies custom className', () => {
    render(<EnergyBadge level="MEDIUM" className="custom-class" />);

    const badge = screen.getByText('MEDIUM Energy');
    expect(badge).toHaveClass('custom-class');
  });
});
```

## 🧪 Testing Guidelines

### Testing Strategy

1. **Unit Tests**: 80%+ coverage for business logic
2. **Integration Tests**: API endpoints and database operations
3. **E2E Tests**: Critical user journeys with Playwright
4. **Accessibility Tests**: Automated axe-core validation
5. **Performance Tests**: Core Web Vitals monitoring

### Running Tests

```bash
# Backend tests
cd backend
pnpm test                 # Run all tests
pnpm test:watch          # Watch mode
pnpm test:cov            # With coverage
pnpm test:e2e            # Integration tests

# Frontend tests
cd frontend
pnpm test                # Unit tests
pnpm test:watch          # Watch mode
pnpm test:e2e            # Playwright E2E tests
pnpm test:a11y           # Accessibility tests

# Full test suite
pnpm test:all            # All tests across workspaces
```

### Test Writing Guidelines

#### Backend Unit Test Example

```typescript
describe('DailyPlannerService', () => {
  let service: DailyPlannerService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        DailyPlannerService,
        {
          provide: PrismaService,
          useValue: {
            task: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<DailyPlannerService>(DailyPlannerService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('generateDailyPlan', () => {
    it('should generate optimized plan for user tasks', async () => {
      const mockTasks = [
        { id: '1', title: 'High energy task', energyLevel: 'HIGH', priority: 5 },
        { id: '2', title: 'Low energy task', energyLevel: 'LOW', priority: 3 },
      ];

      jest.spyOn(prismaService.task, 'findMany').mockResolvedValue(mockTasks);

      const plan = await service.generateDailyPlan('user-123', new Date());

      expect(plan.scheduleBlocks).toBeDefined();
      expect(plan.energyOptimization).toBeGreaterThan(0);
      expect(plan.scheduleBlocks[0].task.energyLevel).toBe('HIGH');
    });
  });
});
```

#### Frontend Component Test Example

```tsx
describe('TaskCard', () => {
  const mockTask = {
    id: '1',
    title: 'Test Task',
    energyLevel: 'HIGH' as const,
    priority: 4,
    status: 'pending' as const,
  };

  it('handles task completion', async () => {
    const mockOnStatusChange = jest.fn();
    render(<TaskCard task={mockTask} onStatusChange={mockOnStatusChange} interactive />);

    const completeButton = screen.getByLabelText(/mark as complete/i);
    fireEvent.click(completeButton);

    expect(mockOnStatusChange).toHaveBeenCalledWith(mockTask.id, 'done');
  });

  it('is accessible', async () => {
    const { container } = render(<TaskCard task={mockTask} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

## 🎨 Styling Guidelines

### Design Token Usage

```tsx
// Use design tokens from the system
import { tokens } from '@/lib/design-tokens';

const TaskCard = styled.div`
  padding: ${tokens.spacing.md};
  border-radius: ${tokens.borderRadius.lg};
  background: ${tokens.colors.surface.primary};
  border: 1px solid ${tokens.colors.border.subtle};
`;

// Or use Tailwind classes that map to tokens
<div className="p-md rounded-lg bg-surface-primary border border-subtle">{/* Content */}</div>;
```

### Component Styling Best Practices

1. **Mobile-first responsive design**
2. **Use design tokens consistently**
3. **Follow ADHD-friendly color guidelines**
4. **Ensure WCAG contrast compliance**
5. **Respect `prefers-reduced-motion`**

## 🚢 Deployment

### Development Deployment

```bash
# Build applications
pnpm build

# Start production servers locally
cd backend && pnpm start:prod
cd frontend && pnpm start

# Run with Docker
docker-compose up --build
```

### Production Deployment

```bash
# Using Kubernetes
kubectl apply -f k8s/

# Or using Docker Swarm
docker stack deploy -c docker-compose.prod.yml helmsman
```

## 🐛 Debugging

### Backend Debugging

```bash
# Debug mode with inspector
cd backend
pnpm start:debug

# Connect VSCode debugger to localhost:9229
```

### Frontend Debugging

```bash
# Next.js debug mode
cd frontend
DEBUG=* pnpm dev

# Storybook debugging
pnpm storybook --debug-webpack
```

### Database Debugging

```bash
# Prisma Studio (visual database editor)
cd backend
pnpm prisma studio

# View generated SQL
pnpm prisma db execute --schema=./prisma/schema.prisma --stdin < query.sql
```

## 📊 Performance Monitoring

### Core Web Vitals

- **LCP**: < 2.5 seconds
- **FID**: < 100 milliseconds
- **CLS**: < 0.1

### Monitoring Tools

```bash
# Lighthouse CI
npm install -g @lhci/cli
lhci autorun

# Bundle analyzer
cd frontend
pnpm analyze

# Performance profiling
pnpm dev --profile
```

## 🔧 Common Issues

### Issue: Database Connection Errors

```bash
# Solution: Check PostgreSQL is running
docker-compose ps
docker-compose up -d postgres

# Reset database if corrupted
cd backend
pnpm prisma migrate reset
```

### Issue: Module Resolution Errors

```bash
# Solution: Clear node_modules and reinstall
rm -rf node_modules */node_modules
pnpm install
```

### Issue: Port Already in Use

```bash
# Solution: Kill processes on ports
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

## 📚 Additional Resources

### Documentation

- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Tools

- [Prisma Studio](https://www.prisma.io/studio) - Database GUI
- [Storybook](https://storybook.js.org/) - Component development
- [Postman](https://www.postman.com/) - API testing

### Community

- [GitHub Discussions](repository-discussions-url)
- [Discord Server](discord-server-url)
- [Contribution Guidelines](../CONTRIBUTING.md)

---

Happy coding! 🚀 If you run into any issues, check the troubleshooting section or reach out to the team.
