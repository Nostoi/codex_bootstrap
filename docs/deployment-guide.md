# Helmsman Deployment Guide

This guide covers the deployment infrastructure and feature flag management for the Helmsman AI-Augmented Task Management system.

## Table of Contents

1. [Overview](#overview)
2. [Feature Flags](#feature-flags)
3. [Deployment Phases](#deployment-phases)
4. [Local Development](#local-development)
5. [Staging Deployment](#staging-deployment)
6. [Production Deployment](#production-deployment)
7. [Kubernetes Deployment](#kubernetes-deployment)
8. [Rollback Procedures](#rollback-procedures)
9. [Monitoring](#monitoring)
10. [Troubleshooting](#troubleshooting)

## Overview

The Helmsman deployment infrastructure is designed for safe, gradual rollout of features using:

- **Feature Flags**: Control feature availability without code deployment
- **Gradual Rollout**: Phase-based deployment from 5% to 100% user base
- **Environment Separation**: Development, staging, and production environments
- **Health Checks**: Automated service health monitoring
- **Rollback Capabilities**: Quick recovery from deployment issues

## Feature Flags

### Available Flags

| Flag | Description | Status | Dependencies |
|------|-------------|---------|--------------|
| `FF_ENHANCED_TASK_METADATA` | Enhanced task fields (energy level, focus type) | ✅ Stable | None |
| `FF_AI_TASK_EXTRACTION` | OpenAI integration for task parsing | ✅ Stable | None |
| `FF_DAILY_PLANNING` | Intelligent scheduling algorithm | 🚧 Development | ENHANCED_TASK_METADATA |
| `FF_MEM0_INTEGRATION` | Semantic memory with Mem0 | 🚧 Development | None |
| `FF_ADVANCED_AI_FEATURES` | Proactive suggestions and learning | 🚧 Development | AI_TASK_EXTRACTION, MEM0_INTEGRATION |

### Configuration Methods

#### Environment Variables (Global)
```bash
# Enable/disable globally for all users
export FF_ENHANCED_TASK_METADATA=true
export FF_AI_TASK_EXTRACTION=true
export FF_DAILY_PLANNING=false
```

#### API (User-specific)
```bash
# Enable for specific user
curl -X POST http://localhost:8000/feature-flags/DAILY_PLANNING/user/123 \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'
```

#### Percentage Rollout
Features can be rolled out to a percentage of users based on user ID hash.

### Feature Flag Service

Check flag status:
```bash
# Get all flags for a user
curl "http://localhost:8000/feature-flags?userId=123"

# Check specific flag
curl "http://localhost:8000/feature-flags/AI_TASK_EXTRACTION?userId=123"

# Get service health
curl "http://localhost:8000/feature-flags/health"
```

## Deployment Phases

### Phase 0: Infrastructure Only
- All feature flags disabled
- Basic infrastructure deployment
- Database migrations only

### Phase 1: Enhanced Metadata (5% rollout)
- `FF_ENHANCED_TASK_METADATA=true`
- Limited user base testing
- Monitor for issues

### Phase 2: AI Task Extraction (25% rollout)  
- `FF_AI_TASK_EXTRACTION=true`
- Expanded testing group
- AI functionality validation

### Phase 3: Daily Planning (50% rollout)
- `FF_DAILY_PLANNING=true` 
- Half user base deployment
- Performance monitoring

### Phase 4: Full Deployment (100% rollout)
- All stable features enabled
- Full production deployment

## Local Development

### Quick Start
```bash
# Start development environment
./dev_init.sh

# Or with Docker
USE_DOCKER=true ./dev_init.sh
```

### Manual Setup
```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Setup environment
cp backend/.env.example backend/.env
cp .env.template .env

# Run database migrations
cd backend && npx prisma migrate dev

# Start services
npm run start:dev  # Backend
cd ../frontend && npm run dev  # Frontend
```

## Staging Deployment

### Prerequisites
- Docker and Docker Compose installed
- Environment variables configured
- Database accessible

### Deploy to Staging
```bash
# Run pre-deployment validation
./scripts/pre-deploy-validation.sh

# Deploy to staging with phase 1 rollout
./scripts/gradual-deploy.sh staging 1

# Or manually with docker-compose
docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d
```

### Staging Environment Configuration
- Conservative feature flag settings
- Staging database
- Extended logging enabled
- Performance monitoring

## Production Deployment

### Prerequisites Checklist
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Performance testing passed
- [ ] Database migration tested in staging
- [ ] Feature flags configured
- [ ] Monitoring alerts configured
- [ ] Rollback plan documented

### Production Deployment Process

#### Step 1: Pre-deployment Validation
```bash
./scripts/pre-deploy-validation.sh
```

#### Step 2: Database Migration
```bash
cd backend
npx prisma migrate deploy
```

#### Step 3: Deploy Infrastructure (Phase 0)
```bash
./scripts/gradual-deploy.sh production 0
```

#### Step 4: Gradual Feature Rollout
```bash
# Phase 1: 5% rollout
./scripts/gradual-deploy.sh production 1

# Monitor metrics, then proceed
./scripts/gradual-deploy.sh production 2  # 25%
./scripts/gradual-deploy.sh production 3  # 50%  
./scripts/gradual-deploy.sh production 4  # 100%
```

### Production Monitoring

Monitor these metrics during rollout:
- Error rates
- Response times
- Database performance
- Feature flag usage
- User feedback

## Kubernetes Deployment

### Setup
```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Deploy secrets and config
kubectl apply -f k8s/configmap.yaml

# Deploy services
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
```

### Update Feature Flags
```bash
# Update feature flag without redeployment
kubectl patch configmap feature-flags-config -n codex-bootstrap \
  --patch '{"data":{"daily-planning":"true"}}'
```

### Scale Services
```bash
# Scale backend
kubectl scale deployment codex-backend --replicas=3 -n codex-bootstrap
```

## Rollback Procedures

### Docker Compose Rollback
```bash
# Use generated rollback script
./rollback-production-phase2.sh

# Or manual rollback
docker-compose down
git checkout HEAD~1
docker-compose up -d --build
```

### Kubernetes Rollback
```bash
# Rollback deployment
kubectl rollout undo deployment/codex-backend -n codex-bootstrap

# Rollback to specific revision
kubectl rollout undo deployment/codex-backend --to-revision=2 -n codex-bootstrap
```

### Feature Flag Rollback
```bash
# Disable problematic feature
curl -X PUT http://localhost:8000/feature-flags/DAILY_PLANNING \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'
```

## Monitoring

### Health Checks
- Backend: `http://localhost:8000/health`
- Frontend: `http://localhost:3000/api/health`
- Feature Flags: `http://localhost:8000/feature-flags/health`

### Key Metrics
- Response time (< 200ms p95)
- Error rate (< 1%)
- Database connections
- Feature flag evaluation time
- User adoption rates

### Alerting Rules
```yaml
# Example Prometheus alerts
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.01
  
- alert: FeatureFlagServiceDown
  expr: up{job="feature-flags"} == 0
```

## Troubleshooting

### Common Issues

#### Feature Flag Not Working
1. Check environment variables: `printenv | grep FF_`
2. Verify service health: `curl /feature-flags/health`
3. Check user hash: `curl "/feature-flags/FLAG_NAME?userId=123"`

#### Database Migration Errors
1. Check database connectivity
2. Verify migration files
3. Check database user permissions
4. Run `npx prisma migrate status`

#### Container Health Check Failures
1. Check service logs: `docker-compose logs backend`
2. Verify port configuration
3. Check dependency services
4. Validate environment variables

#### Performance Issues
1. Monitor database queries
2. Check memory usage
3. Verify feature flag overhead
4. Analyze response times

### Support Contacts
- DevOps: devops@company.com
- Backend: backend-team@company.com
- Frontend: frontend-team@company.com

### Emergency Procedures
1. **Immediate Rollback**: Use rollback scripts
2. **Disable Features**: Turn off feature flags
3. **Scale Down**: Reduce problematic services
4. **Incident Response**: Follow incident management procedures

## References
- [Feature Flag Service API Documentation](http://localhost:8000/api/docs#feature-flags)
- [Monitoring Dashboard](http://localhost:9090)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
