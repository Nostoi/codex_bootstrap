# Development Setup Guide

This document provides comprehensive development environment setup instructions for the Helmsman ADHD-optimized task management system.

## Quick Start

```bash
# 1. Clone and setup environment
git clone <repository-url>
cd codex_bootstrap
cp .env.template .env
# Edit .env with your configuration

# 2. Initialize development environment
./dev_init.sh

# 3. Access development services
# Frontend: http://localhost:3500
# Backend: http://localhost:3501
# API Docs: http://localhost:3501/api/docs
# Storybook: http://localhost:6006
```

## Prerequisites

- **Node.js**: 20+ (LTS recommended)
- **PNPM**: Latest version for frontend package management
- **NPM**: For backend NestJS dependencies
- **PostgreSQL**: 14+ (or Docker for containerized setup)
- **Docker & Docker Compose**: For containerized development

## Local Development

### Frontend Development

```bash
cd frontend
pnpm install              # Install dependencies
pnpm dev                  # Start development server (port 3500)
pnpm build                # Production build test
pnpm lint                 # ESLint validation
pnpm test                 # Run Vitest test suite
pnpm test:e2e            # Playwright E2E tests
pnpm storybook           # Component library (port 6006)
```

### Backend Development

```bash
cd backend
npm install               # Install NestJS dependencies
npm run start:dev         # Start development server (port 3501)
npm run build             # Production build test
npm run lint              # ESLint validation
npm test                  # Jest test suite
npm run test:e2e         # Integration tests
npx prisma studio        # Database admin GUI
```

### Database Management

```bash
cd backend

# Development setup
npx prisma generate       # Generate TypeScript client
npx prisma db push        # Push schema to development database
npx prisma db seed        # Optional: seed with sample data

# Production migrations
npx prisma migrate dev    # Create and apply migration
npx prisma migrate deploy # Deploy to production
```

## Module-Specific Setup

### Microsoft Graph Integration (✅ Active)

```bash
# Required environment variables
MICROSOFT_CLIENT_ID=your_azure_app_id
MICROSOFT_CLIENT_SECRET=your_azure_app_secret
MICROSOFT_TENANT_ID=your_tenant_id

# Test the integration
npm test -- --testPathPattern=graph
# Should show: 3 test suites, 17 tests passing
```

### AI Services Setup

```bash
# OpenAI integration
OPENAI_API_KEY=sk-your-openai-key

# Test AI endpoints
npm test -- --testPathPattern=ai
```

## Docker Development

```bash
# Start all services with Docker
USE_DOCKER=true ./dev_init.sh

# Individual service management
docker-compose up postgres    # Database only
docker-compose up frontend    # Frontend only
docker-compose up backend     # Backend only
docker-compose down           # Stop all services
```

## Testing Infrastructure

### Test Data Factory System

The backend includes a comprehensive test data factory system:

```bash
# Location: backend/test/
├── factories/              # Data factories for consistent test data
├── mocks/                  # Service mocks and stubs
├── utils/                  # Testing utilities
└── README.md              # Complete documentation

# Run factory tests
npm test -- --testPathPattern=factories
```

### E2E Testing

```bash
# Frontend E2E tests
cd frontend
pnpm test:e2e             # Playwright tests

# Backend integration tests
cd backend
npm run test:e2e          # NestJS integration tests
```

## Common Development Tasks

### Adding New Dependencies

```bash
# Frontend (use PNPM)
cd frontend
pnpm add <package>        # Runtime dependency
pnpm add -D <package>     # Development dependency

# Backend (use NPM)
cd backend
npm install <package>     # Runtime dependency
npm install -D <package>  # Development dependency
```

### Code Quality

```bash
# Comprehensive test suite (both frontend and backend)
./run_tests.sh

# Individual linting
cd frontend && pnpm lint
cd backend && npm run lint

# Format code
cd frontend && pnpm format
cd backend && npm run format
```

### Environment Configuration

```bash
# Copy and configure environment files
cp .env.template .env
cp frontend/.env.local.template frontend/.env.local

# Key configurations:
# - Database URLs
# - API keys (OpenAI, Microsoft, Google)
# - CORS origins
# - JWT secrets
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3500, 3501, 6006, 5432 are available
2. **Node version**: Use Node.js 20+ (check with `node --version`)
3. **Package manager mixing**: Use PNPM for frontend, NPM for backend
4. **Database connection**: Verify PostgreSQL is running and accessible

### Module Re-enabling

Several modules are temporarily disabled during WebSocket development. See [GitHub Copilot Instructions](.github/copilot-instructions.md#module-re-enabling-guidance) for detailed re-enabling procedures.

### Performance Monitoring

```bash
# Check bundle sizes
cd frontend && pnpm build && pnpm bundle-analyzer

# Backend performance
cd backend && npm run start:prod
# Monitor logs for response times and memory usage
```

For detailed architectural guidance and ADHD-specific design patterns, see [GitHub Copilot Instructions](.github/copilot-instructions.md).

For project management workflow and automated task generation, see [README.md](README.md#taskmaster).
