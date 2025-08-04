# SPEC-1-Helmsman: AI-Augmented Personal Command System

## Background

Modern professionals face increasingly complex workloads, fragmented across multiple projects, contexts, and communication channels. Traditional productivity tools often exacerbate stress by relying on linear task lists that don’t match human cognitive patterns. There’s a critical need for an intelligent, personalized command center that reduces cognitive load, organizes tasks in alignment with mental workflows, and proactively guides users towards the right actions at the right times.

Helmsman aims to meet this need by combining cutting-edge AI with intuitive task management, helping users effortlessly track projects, manage priorities, and sustain emotional clarity in their daily workflows. The system is specifically designed for cognitive offloading, memory reinforcement, and emotional regulation by reflecting the layered, adaptive nature of human cognition rather than forcing users into rigid task frameworks.

## Requirements

The following requirements are prioritized using the MoSCoW method:

### Functional Requirements

**Must Have:**
• Project and Task Management:
• Group tasks intelligently into projects and layered contexts (Project → Area → Purpose).
• Tasks include optional metadata: estimated time, energy level (low/med/high), focus type (creative/admin/social), deadlines, assignment source (self/boss/team), and dependencies.
• Daily/Weekly Focus View:
• Automatically generate “Today’s Plan” based on user energy, time availability, and task priority.
• Clearly indicate blocked and unblocked tasks.
• AI Assistant Integration:
• ChatGPT API integration for task extraction from notes/emails.
• Suggest subtasks and summarize projects.
• Classify tasks and estimate task durations automatically.
• Proactively suggest tasks and follow-ups based on user interaction history.
• Semantic Memory Integration:
• Record interactions and context using Mem0.
• Allow user queries across multiple data sources (emails, tasks, notes).
• Retrieval-Augmented Generation (RAG) for contextually enriched responses.

**Should Have:**
• Reflection & Feedback Loop:
• Daily activity logging.
• Reflective prompts (“Was this aligned with your priorities?”).
• Optional journaling feature for deeper reflection.
• Notifications and Reminders:
• Real-time reminders for critical tasks and deadlines.
• Customizable notification settings based on user preferences.

### Technical Requirements

Must Have:
• Frontend: Next.js, Tailwind (DaisyUI).
• Authentication & Authorization:
– JWT-based auth for API access  
 – OAuth2 / Microsoft Graph & Google OAuth for calendar/email sync  
 – Role-based permissions (e.g. personal vs. shared projects)
• Backend: Node.js, PostgreSQL, Prisma.
• AI Integration: ChatGPT API for initial implementation, later iteration to include local GPT (LM Studio/Ollama), LangChain for local agent memory chaining.
• Memory: Local semantic memory integration using Mem0 for natural-language queries and Retrieval-Augmented Generation (RAG).
• Sync: Local-first operation with optional remote synchronization.
• Interoperability: Data import/export support from Outlook Calendar and Email, Gmail, Google Calendar, with multiple account support.

Should Have:
• Desktop Application: Optional Tauri or Electron integration.
• Analytics Dashboard:
• Visual insights into task completion rates, productivity trends, and bottlenecks.

Constraints
• Cognitive Load: The system must reduce cognitive stress.

### Non-Functional Requirements

• **Performance & Scalability**  
 – API p95 tail latency \<200 ms under 100 RPS  
 – Horizontal scaling via Kubernetes and autoscaling  
 – Caching layer (Redis) for hot reads (e.g. “Today’s Plan”)
– Soft-delete + 30-day auto-purge for archived records

• **Security & Privacy**  
 – TLS everywhere, encrypt Postgres at rest, secure SQLite file  
 – OAuth scopes locked to minimum privileges  
 – Rate-limit LLM calls to avoid runaway costs

• **Observability**  
 – OpenTelemetry traces end-to-end (UI → LLM → DB)  
 – Prometheus metrics + Grafana dashboards for key SLIs  
 – Sentry for error reporting with user context

• **Maintainability**  
 – 80%+ unit‐test coverage (Jest for front + back)  
 – Contract tests (OpenAPI or ts-rest) to keep API & types in sync  
 – Prettier/ESLint + Husky pre-commit checks

## Method

### Architecture Overview

The Helmsman system will adopt a modular, full-stack architecture divided into three main components: Frontend, Backend, and AI Services.

### Components & Technologies

**Frontend**
• Next.js + TypeScript
• Tailwind CSS + DaisyUI
• Zustand + React Query

**Backend**
• Node.js + NestJS
• Prisma ORM (SQLite & Postgres)
• y-websocket (Yjs) for CRDT sync
• Microsoft Graph & Google SDKs.

**AI Services**
• OpenAI ChatGPT API
• Chroma vector store (local)
• Mem0 for semantic memory
• LangChain (Node.js) for RAG pipelines

**Desktop**
• Tauri wrapper

**CI/CD & Infra**
• GitHub Actions for build+test
• Docker Compose for local dev (SQLite, NestJS, y-websocket)
• Kubernetes or DigitalOcean App Platform for prod Postgres + API

**Configuration**

    . • `.env` for local dev, Vault/Parameter Store in prod
      • Feature flags via LaunchDarkly (or simple DB-backed toggles)

## Detailed Database Schema

### Users:

    CREATE TABLE Users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      display_name VARCHAR(255),
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

### OAuth

    -- Store linked Graph/Google tokens for sync
    CREATE TABLE OAuthAccounts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES Users(id) ON DELETE CASCADE,
      provider VARCHAR(50) NOT NULL,           -- e.g. 'google', 'microsoft'
      provider_account_id VARCHAR(255) NOT NULL,
      access_token TEXT NOT NULL,
      refresh_token TEXT,
      expires_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

### Projects:

    CREATE TABLE Projects (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255),
      area VARCHAR(255),        -- Higher-level grouping (Area)
      purpose VARCHAR(255),     -- Highest-level purpose grouping
      owner_id INTEGER REFERENCES Users(id) NOT NULL,
      created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,
      updated\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP
      deleted_at timestamptz;
    );

### Tasks:

    CREATE TABLE Tasks (
      id SERIAL PRIMARY KEY,
      project\_id INTEGER REFERENCES Projects(id),
      parent\_task\_id INTEGER REFERENCES Tasks(id), -- for subtasks
      name VARCHAR(255),
      description TEXT,
      estimated\_time INTEGER, -- minutes
      energy\_level VARCHAR(10), -- low/med/high
      focus\_type VARCHAR(20), -- creative/admin/social
      soft\_deadline TIMESTAMP, -- Desired completion date
      hard\_deadline TIMESTAMP, -- Mandatory completion date
      source VARCHAR(50), -- self/boss/team
      status VARCHAR(20), -- blocked/unblocked/done
      priority INTEGER, -- numerical priority
      created_by INTEGER REFERENCES Users(id) NOT NULL,
      assigned_to INTEGER REFERENCES Users(id),
      created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,
      updated\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP
      deleted_at timestamptz;
    );

### TaskDependencies:

    CREATE TABLE TaskDependencies (
      id SERIAL PRIMARY KEY,
      task\_id INTEGER REFERENCES Tasks(id),
      depends\_on\_task\_id INTEGER REFERENCES Tasks(id),
      created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP
      deleted_at timestamptz;
    );

### Notifications:

    CREATE TABLE Notifications (
      id SERIAL PRIMARY KEY,
      task\_id INTEGER REFERENCES Tasks(id),
      message TEXT,
      notify\_at TIMESTAMP,
      delivered BOOLEAN DEFAULT FALSE,
      created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP
    );

### InteractionLogs (Mem0):

    CREATE TABLE InteractionLogs (
      id SERIAL PRIMARY KEY,
      interaction TEXT,
      context JSONB,
      source VARCHAR(255), -- email, note, etc.
      timestamp TIMESTAMP DEFAULT CURRENT\_TIMESTAMP
    );

### UserSettings

    CREATE TABLE UserSettings (
      user_id                 INTEGER PRIMARY KEY REFERENCES Users(id) ON DELETE CASCADE,
      timezone                VARCHAR(50)    NOT NULL DEFAULT 'UTC',
      language                VARCHAR(10)    NOT NULL DEFAULT 'en',
      theme                   VARCHAR(20)    NOT NULL DEFAULT 'light',
      notification_preferences JSONB         NOT NULL DEFAULT '{}',
      created_at              timestamptz    DEFAULT now(),
      updated_at              timestamptz    DEFAULT now()
    );

### Tags

    CREATE TABLE Tags (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER REFERENCES Users(id) ON DELETE CASCADE,
      name       VARCHAR(50) NOT NULL,
      created_at timestamptz DEFAULT now()
    );

    CREATE TABLE TaskTags (
      task_id INTEGER REFERENCES Tasks(id) ON DELETE CASCADE,
      tag_id  INTEGER REFERENCES Tags(id)  ON DELETE CASCADE,
      PRIMARY KEY (task_id, tag_id)
    );

### RecurrenceRules

    CREATE TABLE RecurrenceRules (
      id              SERIAL PRIMARY KEY,
      task_id         INTEGER       REFERENCES Tasks(id) ON DELETE CASCADE,
      rrule           TEXT          NOT NULL,            -- iCal RRULE string
      next_occurrence timestamptz,
      created_at      timestamptz   DEFAULT now()
    );

### AuditLogs

    CREATE TABLE AuditLogs (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER REFERENCES Users(id),
      entity      VARCHAR(50) NOT NULL,     -- e.g. 'Task', 'Project'
      entity_id   INTEGER       NOT NULL,
      action      VARCHAR(20)  NOT NULL,     -- 'create','update','delete'
      changes     JSONB         NOT NULL,    -- diff or full payload
      timestamp   timestamptz   DEFAULT now()
    );

## Algorithms & Flow

**Task Generation & Classification** 1. Task Extraction:
• Use ChatGPT API to process input (emails, notes).
• Generate structured tasks (name, description, metadata). 2. Classification & Proactive Suggestions:
• Analyze interaction logs using Mem0 semantic memory.
• Suggest proactive tasks and follow-ups.

**Daily/Weekly Planner** 1. Fetch tasks with metadata (energy, priority, deadlines). 2. Use priority-based scheduling algorithm to generate daily task suggestions considering:
• Task priority
• Energy level
• Available time
• Task dependencies

**Reflection & Feedback Loop**
• Log daily task completion status.
• Prompt reflective questions based on priorities alignment.
• Optional journaling input integrated with Mem0 for enriched context.

### PlantUML Component Diagram

    @startuml
    component "Frontend (Next.js/Tailwind)" as Frontend
    component "Backend (NestJS)" as Backend

    component "Database (PostgreSQL)" as DB
    component "Mem0 (Semantic Memory & RAG)" as Mem0
    component "ChatGPT API" as GPT
    component "Vector DB (Chroma/FAISS)" as VectorDB

    Frontend --> Backend
    Backend --> DB
    Backend --> Mem0
    Backend --> GPT
    Mem0 --> VectorDB
    @enduml

## Implementation

The Helmsman system will be developed in clearly defined steps to ensure smooth execution by the implementation team:

### Step 1: Setup Project Infrastructure

    •	Initialize Repositories: Create repositories for frontend, backend, and AI services.
    •	CI/CD: Set up Continuous Integration and Continuous Deployment pipelines (GitHub Actions).
    •	Environments: Configure development, staging, and production environments.

### Step 2: Database Configuration

    •	Database Setup: Install PostgreSQL.
    •	Schema Definition: Use Prisma ORM to define and migrate schemas (Projects, Tasks, Notifications, InteractionLogs).

### Step 3: Backend Development

    •	API Development: Develop CRUD APIs for Projects, Tasks, Dependencies, Notifications, and InteractionLogs using NestJS (Node.js + TypeScript).
    •	Authentication: Implement secure user authentication and authorization (JWT or OAuth).

### Step 4: AI Services Integration

    •	ChatGPT API Integration: Implement endpoints for task generation, summarization, and proactive suggestions.
    •	Mem0 Integration: Set up semantic memory and retrieval-augmented generation (RAG) capabilities.
    •	Semantic Search: Configure Chroma or FAISS for enhanced search functionality within Mem0.

### Step 5: Frontend Development

    •	UI/UX Design: Design and implement user interfaces using Next.js and Tailwind CSS.
    •	State Management: Implement frontend state management using Zustand or Redux Toolkit.
    •	API Integration: Connect frontend to backend APIs and test interactions.

### Step 6: Sync and Notifications

    •	Local-first Sync: Implement CRDTs or operational transforms for robust synchronization.
    •	Real-time Notifications: Set up notification system and test delivery mechanisms.

### Step 7: Containerization with Docker

    •	Docker Setup: Create Dockerfiles for backend, frontend, AI services, and database.
    •	Docker Compose: Configure Docker Compose files to orchestrate containers locally and for production deployment.
    •	Testing: Test Docker-based deployment in development and staging environments.

### Step 8: Testing and Quality Assurance

    •	Unit & Integration Testing: Write comprehensive tests for backend and frontend.
    •	End-to-End Testing: Conduct thorough E2E testing using Cypress or Playwright.
    •	User Feedback: Gather initial user feedback through controlled beta releases.

### Step 9: Deployment and Monitoring

    •	Deployment: Deploy the Dockerized system to cloud or private servers (AWS, Azure, DigitalOcean).
    •	Monitoring & Analytics: Set up monitoring tools (Prometheus, Grafana, Sentry) for tracking system performance and user engagement metrics.

## Milestones

The following milestones will ensure clear tracking and progress visibility throughout the Helmsman system development:

### Milestone 1: Infrastructure and Setup

Complete repositories and CI/CD pipelines setup.Successful environment configurations for development and staging.

### Milestone 2: Database and Backend API

Fully implemented and tested database schemas.CRUD operations for Projects, Tasks, Dependencies, Notifications, InteractionLogs operational.

### Milestone 3: AI Integration

ChatGPT API fully integrated for task processing and proactive suggestions. Mem0 semantic memory integration with RAG capabilities operational.

### Milestone 4: Frontend Implementation

User interface and frontend fully implemented.Successful frontend-backend API integration tested.

### Milestone 5: Sync, Notifications, and Docker

Robust synchronization logic implemented and tested.Real-time notifications system operational.Docker containerization complete and validated in development and staging environments.

### Milestone 6: Testing and Quality Assurance

Completion of unit, integration, and end-to-end tests.Successful beta testing and initial user feedback collection.

### Milestone 7: Deployment and Monitoring

Deployment of the Dockerized Helmsman system to production environment.Monitoring, analytics, and performance tracking tools configured and operational.

## Gathering Results

To ensure Helmsman meets its intended goals and delivers measurable value, the following evaluation methods will be used post-implementation:

### Functional Validation

Feature Checklist: Confirm all “Must Have” and “Should Have” requirements from the Requirements section are implemented and functioning.Cross-Platform Tests: Validate consistent behavior across desktop and web environments.Data Interoperability: Verify successful import/export with Gmail, Outlook, and calendar integrations.

### Usability & Cognitive Impact

User Feedback Surveys: Collect structured feedback on usability, clarity, and perceived stress reduction.Cognitive Load Comparison: Conduct before-and-after surveys to assess perceived decision fatigue and clarity.Task Planning Success: Evaluate if daily/weekly planning improves task completion rates and satisfaction.

### AI Accuracy and Helpfulness

Proactive Suggestions Relevance: Measure the quality and actionability of AI-generated tasks and nudges.RAG Contextual Precision: Assess whether responses using Mem0 and vector search improve contextual awareness.Reflection Prompts Engagement: Track user interaction with journaling and reflective tools.

### Technical Stability

Bug Tracking Metrics: Monitor post-deployment bugs, downtime, and performance bottlenecks.System Monitoring: Use Prometheus/Grafana/Sentry to ensure system uptime and resource usage remain within targets.

### Adoption Metrics

Active Users: Track daily/weekly/monthly active usage.Retention Rate: Analyze usage patterns and returning users.Time-to-First-Task: Measure onboarding effectiveness from installation to first completed task.
