## Pre-Feature Development Project Tree
```text
    .
    ./AGENTS.md
    ./CHANGELOG.md
    ./DEVELOPMENT.md
    ./LICENSE
    ./README.md
    ./backend
    ./backend/nest-cli.json
    ./backend/package.json
    ./backend/pnpm-lock.yaml
    ./backend/prisma
    ./backend/requirements.txt
    ./backend/src
    ./backend/tsconfig.build.json
    ./backend/tsconfig.json
    ./dev_init.sh
    ./frontend
    ./frontend/eslint.config.js
    ./frontend/jest.config.js
    ./frontend/jest.setup.js
    ./frontend/next-env.d.ts
    ./frontend/next.config.js
    ./frontend/package.json
    ./frontend/pnpm-lock.yaml
    ./frontend/postcss.config.js
    ./frontend/src
    ./frontend/tailwind.config.js
    ./frontend/tsconfig.json
    ./run_tests.sh
    backend/src
    backend/src/app.controller.spec.ts
    backend/src/app.controller.ts
    backend/src/app.module.ts
    backend/src/app.service.ts
    backend/src/collaboration
    backend/src/collaboration/collaboration.gateway.ts
    backend/src/collaboration/collaboration.module.ts
    backend/src/collaboration/collaboration.service.ts
    backend/src/collaboration/documents.controller.ts
    backend/src/collaboration/documents.service.ts
    backend/src/collaboration/dto
    backend/src/integrations
    backend/src/integrations/google
    backend/src/integrations/graph
    backend/src/main.ts
    backend/src/prisma
    backend/src/prisma/prisma.module.ts
    backend/src/prisma/prisma.service.ts
    backend/src/users
    backend/src/users/dto
    backend/src/users/users.controller.ts
    backend/src/users/users.module.ts
    backend/src/users/users.service.spec.ts
    backend/src/users/users.service.ts
    frontend/src
    frontend/src/app
    frontend/src/app/globals.css
    frontend/src/app/layout.tsx
    frontend/src/app/page.test.tsx
    frontend/src/app/page.tsx
    frontend/src/app/providers.tsx
    frontend/src/hooks
    frontend/src/hooks/useApi.ts
    frontend/src/lib
    frontend/src/lib/api.ts
    frontend/src/store
    frontend/src/store/useAppStore.test.ts
    frontend/src/store/useAppStore.ts
```

## Relevant Files
- Reference *existing* project files here
### Proposed New Files
- `backend/src/projects/projects.module.ts` - NestJS module to manage projects
- `backend/src/projects/projects.controller.ts` - CRUD endpoints for projects
- `backend/src/projects/projects.service.ts` - Business logic for projects
- `backend/src/projects/dto/project.dto.ts` - DTOs for project creation and update
- `backend/src/projects/projects.service.spec.ts` - Tests for project service
- `backend/src/tasks/tasks.module.ts` - Module for task management
- `backend/src/tasks/tasks.controller.ts` - CRUD endpoints for tasks
- `backend/src/tasks/tasks.service.ts` - Logic for tasks and metadata
- `backend/src/auth/auth.module.ts` - JWT and OAuth2 authentication
- `backend/src/auth/auth.service.ts` - Auth helpers
- `backend/src/auth/auth.controller.ts` - Login endpoint
- `backend/src/auth/jwt.util.ts` - Lightweight JWT helper
- `backend/src/notifications/notifications.module.ts` - Real-time notifications
- `backend/src/notifications/notifications.gateway.ts` - WebSocket gateway
- `backend/prisma/migrations/001_init/migration.sql` - Initial schema migration
- `backend/src/ai/ai.module.ts` - ChatGPT and Mem0 integration
- `backend/src/ai/ai.service.ts` - AI interaction logic
- `backend/src/ai/ai.service.spec.ts` - Tests for AI service
- `backend/src/ai/mem0.service.ts` - Mem0 integration service
- `backend/src/ai/mem0.service.spec.ts` - Tests for Mem0 service
- `backend/src/tasks/tasks.controller.spec.ts` - Tests for tasks controller
- `backend/src/projects/projects.controller.spec.ts` - Tests for projects controller
- `backend/src/users/users.controller.spec.ts` - Tests for users controller
- `backend/src/auth/auth.controller.spec.ts` - Tests for auth controller
- `frontend/src/app/dashboard/page.tsx` - Main dashboard view
- `frontend/src/components/TaskList.tsx` - Task list component
- `frontend/src/store/tasksStore.ts` - Zustand store for tasks
- `frontend/src/store/tasksStore.test.ts` - Unit tests for tasks store
- `docker-compose.yml` - Local development environment
- `Dockerfile.backend` - Backend container
- `Dockerfile.frontend` - Frontend container
- `.env.template` - Example environment variables
- `frontend/src/components/TaskList.test.tsx` - Unit tests for `TaskList`
- `frontend/playwright.config.ts` - Playwright configuration for E2E tests
- `frontend/tests/home.e2e.ts` - Basic end-to-end test for homepage
- `backend/src/tasks/tasks.service.spec.ts` - Tests for task service
- `backend/src/integrations/graph/graph.service.spec.ts` - Tests for Microsoft Graph service
- `backend/src/integrations/graph/graph.controller.spec.ts` - Tests for Microsoft Graph controller
- `k8s/namespace.yaml` - Namespace definition for Kubernetes deployment
- `k8s/backend-deployment.yaml` - Deployment and Service for backend container
- `k8s/frontend-deployment.yaml` - Deployment and Service for frontend container
- `.github/workflows/ci.yml` - GitHub Actions pipeline running lint and tests
### Existing Files Modified
- `dev_init.sh` - Include database and services setup commands
- `backend/prisma/schema.prisma` - Add new tables according to PRD
- `backend/package.json` - Add dependencies like @nestjs/jwt, @prisma/client
- `frontend/package.json` - Add Zustand and React Query
- `frontend/jest.config.js` - Enable coverage thresholds
 - `frontend/src/app/dashboard/page.tsx` - Display today's plan and all tasks
 - `frontend/src/components/TaskList.tsx` - Show due dates and status badges
 - `frontend/src/hooks/useApi.ts` - Add ApiTask dueDate property
 - `frontend/src/store/tasksStore.ts` - Handle tasks with due dates
 - `frontend/src/store/tasksStore.test.ts` - Unit tests for tasks store
 - `frontend/src/components/TaskList.test.tsx` - Tests for TaskList component
- `backend/src/tasks/tasks.service.ts` - Provide tasks with due dates
- `backend/src/tasks/tasks.service.spec.ts` - Updated tests for due dates
- `backend/src/tasks/tasks.module.ts` - Inject notifications gateway
- `backend/src/app.module.ts` - Register TasksModule, ProjectsModule, AuthModule, and AiModule
- `backend/src/prisma/prisma.service.ts` - Run migrations at startup
- `backend/src/ai/ai.module.ts` - Register Mem0Service
- `backend/src/ai/ai.service.ts` - Use Mem0Service for context
- `backend/src/ai/ai.service.spec.ts` - Updated tests for Mem0 integration
- `README.md` - Update setup instructions
- `.gitignore` - Ignore local environment files
- `.project-management/current-prd/tasks-feature-specification.md` - Task list
- `run_tests.sh` - Test runner script with coverage and e2e support
- `CHANGELOG.md` - Record of changes for tasks progress
- `frontend/playwright.config.ts` - Restrict Playwright to e2e tests directory

### Notes
- **Tech Stack**: Next.js 14+ with App Router, TypeScript, Tailwind CSS + DaisyUI, Zustand state management, React Query for API data, NestJS backend with Prisma ORM, y-websocket for collaboration.
- **Security & Performance**: TLS, JWT/OAuth2, rate limiting for AI calls, API p95 latency <200ms under 100 RPS, Redis caching.
- **AI Services**: ChatGPT API for task extraction, Mem0 for semantic memory, retrieval-augmented generation.
- **Testing**: Target >80% unit test coverage using Jest for both frontend and backend with pre-commit linting.

## Tasks
- [x] **1.0 Infrastructure & Setup**
  - [x] 1.1 Initialize frontend and backend repositories with GitHub Actions pipelines
  - [x] 1.2 Configure development and staging environments via `dev_init.sh` and docker-compose
  - [x] 1.3 Establish environment variable templates and secrets management
- [x] **2.0 Database & Backend API**
  - [x] 2.1 Extend `schema.prisma` to include Users, Projects, Tasks, TaskDependencies, Notifications, InteractionLogs, UserSettings, Tags, and related tables
  - [x] 2.2 Generate Prisma migrations and update `prisma.service.ts`
  - [x] 2.3 Implement NestJS modules, controllers, and services for Users, Projects, Tasks, and Notifications
  - [x] 2.4 Add JWT authentication and OAuth2 (Google/Microsoft) using `auth` module
  - [x] 2.5 Write unit tests for each service and controller
- [x] **3.0 AI Integration**
  - [x] 3.1 Create AI module to interface with ChatGPT API for task generation and summarization
  - [x] 3.2 Integrate Mem0 for semantic memory storage and retrieval-augmented responses
  - [x] 3.3 Implement proactive suggestion logic leveraging interaction history
  - [x] 3.4 Add tests for AI services and stub external API calls
- [x] **4.0 Frontend Implementation**
  - [x] 4.1 Scaffold dashboard page and task list component with DaisyUI styling
  - [x] 4.2 Connect frontend to backend APIs using React Query hooks
  - [x] 4.3 Manage client state with Zustand stores
  - [x] 4.4 Display Today’s Plan with task metadata and status indicators
  - [x] 4.5 Write unit tests for components and stores
- [x] **5.0 Sync, Notifications & Docker**
  - [x] 5.1 Implement real-time sync using y-websocket and Yjs
  - [x] 5.2 Set up WebSocket notifications for task reminders
  - [x] 5.3 Create Dockerfiles and docker-compose configuration for full stack
  - [x] 5.4 Document Docker workflow in README and `dev_init.sh`
- [x] **6.0 Testing & Quality Assurance**
  - [x] 6.1 Configure Jest and ESLint pre-commit hooks
  - [x] 6.2 Achieve >80% unit test coverage across frontend and backend
  - [x] 6.3 Implement end-to-end tests using Playwright or Cypress
    - [x] 6.3.1 Add initial Playwright configuration and sample home page test
- [ ] **7.0 Deployment & Monitoring**
  - [x] 7.1 Deploy containers to cloud environment (Kubernetes or DO App Platform)
  - [ ] 7.2 Set up OpenTelemetry traces, Prometheus metrics, Grafana dashboards, and Sentry error reporting
  - [ ] 7.3 Monitor user adoption metrics and bug reports
