# codex-bootstrap

codex-bootstrap is a starter template for a modern full-stack web application built with Node.js NestJS backend and Next.js TypeScript frontend, featuring real-time collaboration and external API integrations, with Codex agent task support.

## Features

- PRD and Task file creation within Codex via local IDE agent
- Task orchestration and managment in Codex or local IDE agent
- Agent managed local dev setup and application start up script `dev-init.sh`
- Agent maintenance of dependencies, Codex environment startup script.
    - Changes to `.codex/install.sh` must be manually propogated to teh Codex environment setup configuration, but required environment changes are saved to this file by the Codex agent.
- Backend: Node.js, NestJS, Prisma ORM, y-websocket (CRDT collaboration)
- Frontend: Next.js 14+ with App Router, TypeScript, Tailwind CSS + DaisyUI, Zustand, React Query
- Real-time collaboration with y-websocket and Yjs CRDT technology
- External API integrations: Microsoft Graph SDK, Google APIs SDK
- Pre-configured linting and testing scripts
# TaskMaster
Starting with any description of a feature, this project supplies tooling to automate creation of PRD and Task List files, and then Codex agent (or local IDE agent) will manage work from this list, updating it as needed. There are four phases:

## PRD file creation

- Add feature specs and background to `.project-management/current-prd/prd-background/`:
    - `feature-specification.md` containing feature specs with as much or little detail as needed.  Mandatory for running PRD creation in Codex.  For local IDE agent feature specs can be delivered via copilot.
    - `design-mock.html` Optional design mockup file.
    - `api-documentation.md` Optional documentation for feature techinical assistance.
- Create the PRD:
    - Codex: Start task in *Code* mode with just the phrase **CreatePrd**
    - *or*
    - Local IDE agent: Give focus to `create-prd.md` file, enter specs (or just  'go' if background has full feature specs).
- There will be Q&A with the Agent, On Codex answer questions and resume in *Code* mode (Environment is spun up again)
- Result should be a PRD file in `.project-management/current-prd/`
- Merge PR to target branch

## Task list file creation
- Create Task List File:
    - Codex: Start task in *Code* mode with just the phrase **CreateTasks**
    - *or*
    - Local IDE agent: Give focus to `generate-tasks.md` file and send **go** message
- Q&A, answer and click code
- Result should be a task list file at `.project-management/current-prd/`
- Merge PR to target branch

## TaskMaster

- Once `.project-management/tasks/current-tasks.md` is created, the TaskMaster message can be used.  This will allow the agent to commit to one or more tasks in a session.  The task list file will be updated as part of the PR, with completed tasks checked off and relevant files updated as needed.
- Start Codex in Code mode using the phrase *TaskMaster*.  This will corece the agent to reference `process-tasks-cloud.md' which picks one or more tasks to complete in the session.
- *Alternatively, tasks can be executed by local agent with focus on `process-tasks-local.md' which will run one task at a time*

## Feature Close
- Perform final feature review
    - Codex: Start task in *Code* mode with just the phrase **ClosePrd**
    - *or*
    - Local IDE agent: Give focus to `close-prd.md` file and send **go** message
- Review will either:
    - Result in flagged changes - review and resubmit the close out
    - Pass review and close the PRD - feature files are moved from `current-prd` to `closed-prd`

# Project Notes
## Structure

- `AGENTS.md`: Instructions for Codex agents
*These files are under control and watch by the Codex agent and will be updated as project tasks demand.*
- `CHANGELOG.md`: Project change history
- `DEVELOPMENT.md`: Developer setup and local testing instructions
- `README.md`: Project overview and file descriptions
- `dev_init.sh`: Script to initialize development environment and start services
- `.codex/install.sh`: Codex Environment Setup script for dependencies and environment
- `run_tests.sh`: Initial script to run tests across backend and frontend
- `backend/requirements.txt`: Python dependencies with initial common pacakges
- `frontend/`
    - `package.json`: npm dependencies and scripts for frontend
    - `eslint.config.js`: ESLint configuration(e.g., .NET)
- `.flake8` python flake8 configuration for linting

*Project managment instruction prompts derived from [snarktank/ai-dev-tasks](https://github.com/snarktank/ai-dev-tasks) under Apache License 2.0*
- `.project-management/` 
    - `create-prd.md`: Instructions and rules for generating a Product Requirements Document (PRD) via AI, including clarifying questions and output location.
    - `generate-tasks.md`: Instructions for generating a step-by-step task list from a PRD, including process and file naming conventions.
    - `process-tasks-cloud.md`: TaskMaster module rules for managing and marking tasks as committed or completed in a cloud workflow.
    - `process-tasks-local.md`: TaskMaster module rules for local task management, including sub-task completion protocol and user confirmation steps.
    - `close-prd.md`: Instructions and rules for generating a final PRD feature review, to either provide final cleanup or closeout.
    - `prd-background/`: Feature background and html design mockups for current feature
        - `archive-prd/`: Archived PRDs and Task lists
        - `close-prd/`: Closed PRDs and Task lists, but reviewed during subsequent PRD creation to provide previously completed dev context
        - `current-prd/`: Current PRD and Task list for the feature under active development
            - `prd-background/`: feature background `design-mock.html`, `api-document.md` etc... If using Codex-cloud PRD creation, feature specification should be found at `feature-specification.md`

## Target Technologies

 - Node.js 20+
- NestJS
- Prisma ORM
- PostgreSQL (SQLite for development)
- y-websocket + Yjs (CRDT collaboration)
- Microsoft Graph SDK
- Google APIs SDK
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS + DaisyUI
- Zustand (state management)
- React Query (data fetching)

## Codex Environment Setup
Go to https://chatgpt.com/codex/settings/environments, select or create your github-connected environment then Edit -> Advanced and copy-paste install.sh into the startup script textbox. Save

## Architecture Overview

This project implements a modern full-stack architecture:

### Backend (NestJS)
- **Framework**: NestJS with TypeScript
- **Database**: Prisma ORM with PostgreSQL (SQLite for development)
- **Real-time**: y-websocket server for collaborative document editing
- **APIs**: Microsoft Graph SDK and Google APIs integration
- **Testing**: Jest with NestJS testing utilities

### Frontend (Next.js)
- **Framework**: Next.js 14+ with App Router and TypeScript
- **Styling**: Tailwind CSS with DaisyUI component library
- **State**: Zustand for client state, React Query for server state
- **Real-time**: y-websocket client for collaborative features
- **Testing**: Jest with React Testing Library

### Development Workflow
1. Copy `.env.template` to `.env` and update any secrets
2. Run `./dev_init.sh` to start both servers (set `USE_DOCKER=true` to use Docker)
3. Frontend: http://localhost:3000
4. Backend API: http://localhost:8000
5. API Documentation: http://localhost:8000/api/docs
6. Collaboration WebSocket: ws://localhost:8001/collaboration
7. Install git hooks with `npm install` in the project root

### Database Setup
The project uses Prisma with PostgreSQL in production and SQLite for development:
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npx prisma db seed  # Optional: seed with sample data
```
### Pre-commit Hooks
Run `npm install` in the project root to install Husky. The `pre-commit` hook runs ESLint and Jest tests for both backend and frontend.



### Docker Workflow
For a containerized setup, ensure Docker is installed and running. Start all services using docker-compose with:
```bash
USE_DOCKER=true ./dev_init.sh
```
This command builds the images and launches the database, backend, and frontend containers defined in `docker-compose.yml`.
To stop the containers when finished, run:
```bash
docker compose down
```

### Authentication
The backend provides a simple JWT-based authentication module.
1. Set `JWT_SECRET` in your `.env` file.
2. Send a POST request to `/auth/login` with `{ "email": "user@example.com" }` to receive an access token.
3. Include `Authorization: Bearer <token>` when calling protected routes.
*End of document*
