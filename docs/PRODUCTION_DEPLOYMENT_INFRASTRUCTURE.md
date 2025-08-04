# Production Deployment Infrastructure

This document describes the comprehensive production deployment infrastructure for the Codex Bootstrap (Helmsman AI) system.

## Executive Summary

The production infrastructure supports a sophisticated AI-augmented task management system with the following key capabilities:

- **Real-time WebSocket connections** for live task updates and collaboration
- **OAuth2 authentication** with Google and Microsoft Graph integration
- **AI-powered task extraction** using OpenAI GPT models
- **Calendar integration** with Google Calendar and Outlook
- **ADHD-optimized UI** with accessibility compliance
- **Enterprise-grade security** and monitoring

## Technology Stack Justification

### Container Runtime: Docker

- **Multi-stage builds** reduce image size and attack surface
- **Alpine Linux base** for minimal footprint and security
- **Non-root execution** (UID 1001) for enhanced security
- **Tini init system** for proper signal handling

### Orchestration: Kubernetes

- **Horizontal Pod Autoscaling** for demand-based scaling
- **StatefulSets** for database persistence and ordering
- **Network Policies** for micro-segmentation
- **RBAC** for fine-grained access control

### Monitoring: Prometheus + Grafana

- **Native Kubernetes integration** with service discovery
- **Custom metrics** for application-specific monitoring
- **Alert Manager** for intelligent notification routing
- **30-day retention** for trend analysis and capacity planning

## Architecture Diagrams

### High-Level System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Users/Clients │───▶│  NGINX Ingress   │───▶│   Frontend      │
│                 │    │  (SSL/TLS Term)  │    │   (Next.js)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │                         │
                              ▼                         ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   Backend API    │    │   WebSocket     │
                       │   (NestJS)       │◀──▶│   Gateway       │
                       └──────────────────┘    └─────────────────┘
                              │                         │
                              ▼                         ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   PostgreSQL     │    │   Redis Cache   │
                       │   (StatefulSet)  │    │   (Sessions)    │
                       └──────────────────┘    └─────────────────┘
```

### Monitoring Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Application   │───▶│   Prometheus     │───▶│    Grafana      │
│   Metrics       │    │   (Collection)   │    │  (Dashboards)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                       │                        │
        ▼                       ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Log Files     │    │  Alert Manager   │    │   Notification  │
│   (Structured)  │    │   (Routing)      │    │   Channels      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Overview

The production infrastructure is designed with the following principles:

- **High Availability**: Auto-scaling, load balancing, and redundancy
- **Security**: Non-root containers, network policies, secrets management
- **Observability**: Comprehensive monitoring with Prometheus and Grafana
- **Scalability**: Horizontal pod autoscaling and resource optimization
- **Resilience**: Health checks, graceful shutdowns, and failure recovery

## Environment Strategy

### Development Environment

- **Purpose**: Feature development and unit testing
- **Resources**: Minimal resource allocation (1 CPU, 2GB RAM per service)
- **Data**: Ephemeral data, reset on deployment
- **Scaling**: Fixed replicas (1 per service)
- **Monitoring**: Basic health checks only

### Staging Environment

- **Purpose**: Integration testing and pre-production validation
- **Resources**: 80% of production resources
- **Data**: Production-like dataset with anonymized PII
- **Scaling**: Auto-scaling enabled to match production behavior
- **Monitoring**: Full monitoring stack with non-critical alerting

### Production Environment

- **Purpose**: Live user traffic and production workloads
- **Resources**: Full resource allocation with overhead for scaling
- **Data**: Full persistence with backup and disaster recovery
- **Scaling**: HPA with 2-10 replicas based on CPU/memory utilization
- **Monitoring**: Complete observability with critical alerting

## Resource Allocation Plan

### Backend Service (NestJS API)

- **Development**: 100m CPU, 256Mi memory, 1 replica
- **Staging**: 200m CPU, 512Mi memory, 2-4 replicas
- **Production**: 500m CPU, 1Gi memory, 2-10 replicas
- **Limits**: 1000m CPU, 2Gi memory per pod

### Frontend Service (Next.js)

- **Development**: 50m CPU, 128Mi memory, 1 replica
- **Staging**: 100m CPU, 256Mi memory, 2-3 replicas
- **Production**: 200m CPU, 512Mi memory, 2-8 replicas
- **Limits**: 500m CPU, 1Gi memory per pod

### Database (PostgreSQL)

- **Development**: 100m CPU, 512Mi memory, 10Gi storage
- **Staging**: 250m CPU, 1Gi memory, 30Gi storage
- **Production**: 1000m CPU, 4Gi memory, 50Gi storage
- **Limits**: 2000m CPU, 8Gi memory per pod

### Monitoring Stack

- **Prometheus**: 200m CPU, 2Gi memory, 100Gi storage
- **Grafana**: 100m CPU, 512Mi memory, 10Gi storage
- **Alert Manager**: 50m CPU, 128Mi memory, 1Gi storage

## Architecture Components

### 1. Container Images

- **Backend**: Multi-stage Docker build with Alpine Linux, NestJS application
- **Frontend**: Next.js standalone build with optimized static assets
- **Security**: Non-root users (UID 1001), tini init system, minimal attack surface

### 2. Kubernetes Orchestration

- **Namespace**: `codex-bootstrap` - isolated environment for all components
- **Deployments**: Backend (2-10 replicas), Frontend (2-8 replicas) with auto-scaling
- **Services**: ClusterIP services with proper port configuration
- **Ingress**: SSL termination, rate limiting, CORS, WebSocket support

### 3. Database Layer

- **PostgreSQL StatefulSet**: Production-tuned with 50Gi storage
- **Performance Optimization**: 200 max connections, shared buffers, work memory tuning
- **Persistence**: PersistentVolumeClaim with automatic backup support

### 4. Monitoring Stack

- **Prometheus**: Metrics collection with 30-day retention, 100Gi storage
- **Grafana**: Visualization dashboards with persistent storage
- **Alerts**: Comprehensive alerting for CPU, memory, disk, and application health

### 5. Security Infrastructure

- **Network Policies**: Ingress/egress traffic control
- **RBAC**: Role-based access control for service accounts
- **Secrets Management**: OAuth credentials, API keys, database passwords
- **SSL/TLS**: Automatic certificate management with cert-manager

## File Structure

```
k8s/
├── namespace.yaml              # Namespace definition
├── configmap.yaml             # Configuration and secrets
├── backend-deployment.yaml    # Backend service deployment
├── frontend-deployment.yaml   # Frontend service deployment
├── database.yaml              # PostgreSQL StatefulSet
├── ingress.yaml               # Load balancer and SSL termination
├── monitoring.yaml            # Prometheus and Grafana deployment
└── prometheus-config.yaml     # Monitoring configuration

.github/workflows/
└── ci-cd.yml                  # Complete CI/CD pipeline

scripts/
├── deploy.sh                  # Deployment automation script
└── test-infrastructure.sh     # Infrastructure testing script
```

## Deployment Guide

### Prerequisites

1. **Kubernetes Cluster**: Production-ready cluster (GKE, EKS, AKS, or self-managed)
2. **kubectl**: Configured to access your cluster
3. **Docker**: For building container images
4. **Domain**: For SSL certificates and ingress configuration

### Quick Start

1. **Clone and Navigate**:

   ```bash
   git clone <repository>
   cd codex_bootstrap
   ```

2. **Configure Environment**:

   ```bash
   # Update k8s/configmap.yaml with your actual values
   # - Database credentials
   # - OAuth client IDs and secrets
   # - OpenAI API keys
   # - Domain names for ingress
   ```

3. **Deploy to Production**:

   ```bash
   ./scripts/deploy.sh production deploy
   ```

4. **Check Status**:
   ```bash
   ./scripts/deploy.sh production status
   ```

### Manual Deployment Steps

1. **Create Namespace**:

   ```bash
   kubectl apply -f k8s/namespace.yaml
   ```

2. **Deploy Configuration**:

   ```bash
   kubectl apply -f k8s/configmap.yaml
   ```

3. **Deploy Database**:

   ```bash
   kubectl apply -f k8s/database.yaml
   kubectl rollout status statefulset/postgresql -n codex-bootstrap
   ```

4. **Deploy Applications**:

   ```bash
   kubectl apply -f k8s/backend-deployment.yaml
   kubectl apply -f k8s/frontend-deployment.yaml
   ```

5. **Setup Ingress**:

   ```bash
   kubectl apply -f k8s/ingress.yaml
   ```

6. **Deploy Monitoring**:
   ```bash
   kubectl apply -f k8s/monitoring.yaml
   kubectl apply -f k8s/prometheus-config.yaml
   ```

## Configuration

### Environment Variables

The application supports the following environment variables:

#### Backend

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT token signing
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: OAuth credentials
- `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`: OAuth credentials
- `OPENAI_API_KEY`: API key for AI integration
- `FEATURE_CALENDAR_INTEGRATION`: Enable/disable calendar features
- `FEATURE_AI_SUGGESTIONS`: Enable/disable AI features

#### Frontend

- `NEXT_PUBLIC_API_URL`: Backend API endpoint
- `NEXT_PUBLIC_WS_URL`: WebSocket endpoint
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: OAuth client ID for frontend

### Resource Configuration

#### Backend Pods

- **Requests**: 500m CPU, 1Gi memory
- **Limits**: 1000m CPU, 2Gi memory
- **Auto-scaling**: 2-10 replicas based on CPU utilization

#### Frontend Pods

- **Requests**: 200m CPU, 256Mi memory
- **Limits**: 500m CPU, 512Mi memory
- **Auto-scaling**: 2-8 replicas based on CPU utilization

#### Database

- **Resources**: 1000m CPU, 2Gi memory
- **Storage**: 50Gi SSD with automatic expansion
- **Connections**: Max 200 concurrent connections

## Monitoring and Observability

### Prometheus Metrics

The system exposes the following metrics:

- HTTP request duration and count
- WebSocket connection metrics
- Database connection pool status
- Node.js process metrics (memory, CPU, event loop)
- Custom business metrics (task operations, user sessions)

### Grafana Dashboards

Pre-configured dashboards include:

- **Application Overview**: Response times, request rates, error rates
- **Infrastructure**: CPU, memory, disk usage across pods
- **Database**: Connection counts, query performance, replication lag
- **WebSocket**: Connection metrics, message throughput

### Alerting Rules

Configured alerts for:

- High CPU/memory usage (>80% for 5+ minutes)
- Pod crash loops
- Service unavailability
- Database connection issues
- High response times (>2 seconds)
- Disk space usage (>85%)

## Security Features

### Container Security

- **Non-root execution**: All containers run as UID 1001
- **Read-only root filesystem**: Prevents runtime modifications
- **No privileged containers**: Security context restrictions
- **Minimal base images**: Alpine Linux reduces attack surface

### Network Security

- **Network policies**: Restrict inter-pod communication
- **TLS everywhere**: End-to-end encryption
- **Rate limiting**: Prevent abuse and DoS attacks
- **CORS policies**: Secure cross-origin requests

### Secrets Management

- **Kubernetes secrets**: Encrypted at rest and in transit
- **Base64 encoding**: All sensitive data properly encoded
- **Rotation support**: Easy credential updates without downtime

## High Availability

### Load Balancing

- **NGINX Ingress**: Production-grade load balancer
- **Session affinity**: WebSocket connection stickiness
- **Health checks**: Automatic unhealthy pod removal

### Auto-scaling

- **Horizontal Pod Autoscaler**: CPU-based scaling
- **Vertical Pod Autoscaler**: Memory optimization (optional)
- **Cluster autoscaler**: Node-level scaling support

### Failure Recovery

- **Rolling updates**: Zero-downtime deployments
- **Readiness probes**: Traffic routing only to ready pods
- **Liveness probes**: Automatic restart of unhealthy pods
- **PodDisruptionBudgets**: Maintain availability during updates

## CI/CD Pipeline

### GitHub Actions Workflow

The CI/CD pipeline includes:

1. **Testing Phase**:
   - Backend unit and integration tests
   - Frontend unit and e2e tests
   - Security vulnerability scanning
   - Dependency auditing

2. **Build Phase**:
   - Multi-platform Docker image builds
   - Container registry push (GitHub Packages)
   - Image vulnerability scanning

3. **Deployment Phase**:
   - Staging deployment and smoke tests
   - Production deployment with health checks
   - Rollback capability on failure

### Environment Promotion

- **Develop Branch**: Auto-deploy to staging
- **Main Branch**: Auto-deploy to production
- **Pull Requests**: Preview deployments (future)

## Backup and Disaster Recovery

### Database Backups

- **Automated backups**: Daily full backups, WAL archiving
- **Point-in-time recovery**: Restore from any point in the last 30 days
- **Cross-region replication**: Disaster recovery setup

### Configuration Backups

- **GitOps**: All infrastructure as code in version control
- **Secrets backup**: Encrypted backup of Kubernetes secrets
- **Monitoring data**: Prometheus data retention and backup

## Performance Optimization

### Container Optimization

- **Multi-stage builds**: Minimal production images
- **Layer caching**: Optimized Docker build performance
- **Init systems**: Proper signal handling with tini

### Application Performance

- **Connection pooling**: Database connection optimization
- **Caching**: Redis integration for session and data caching
- **CDN**: Static asset delivery optimization

### Database Performance

- **Connection pooling**: PgBouncer for connection management
- **Query optimization**: Proper indexing and query planning
- **Memory tuning**: Optimized PostgreSQL configuration

## Troubleshooting

### Common Issues

1. **Pod Startup Issues**:

   ```bash
   kubectl describe pod <pod-name> -n codex-bootstrap
   kubectl logs <pod-name> -n codex-bootstrap
   ```

2. **Database Connection Problems**:

   ```bash
   kubectl exec -it postgresql-0 -n codex-bootstrap -- psql -U postgres
   ```

3. **Ingress Configuration**:
   ```bash
   kubectl describe ingress codex-ingress -n codex-bootstrap
   kubectl get certificaterequest -n codex-bootstrap
   ```

### Log Aggregation

- **Centralized logging**: ELK stack or similar for log aggregation
- **Structured logging**: JSON format for better parsing
- **Log retention**: 30-day retention with compression

## Cost Estimation and Budgeting

### Monthly Infrastructure Costs (USD)

#### Compute Resources

- **Production Cluster**: $300-500 (managed Kubernetes service)
- **Staging Cluster**: $150-250 (80% of production capacity)
- **Development**: $50-100 (minimal resources)
- **Load Balancers**: $40-80 (ingress controllers and external IPs)

#### Storage and Data

- **Database Storage**: $50-100 (persistent volumes and backups)
- **Monitoring Storage**: $30-60 (Prometheus metrics and logs)
- **Image Registry**: $20-40 (container image storage)

#### External Services

- **SSL Certificates**: $0 (Let's Encrypt free certificates)
- **DNS Management**: $10-20 (managed DNS service)
- **Backup Storage**: $30-50 (cross-region backup replication)

#### CI/CD and Automation

- **GitHub Actions**: $100-200 (build minutes and runner costs)
- **Security Scanning**: $50-100 (Trivy Pro or similar)

**Total Monthly Cost**: $840-1360 USD

### Cost Optimization Strategies

1. **Right-sizing**: Monthly resource utilization review and adjustment
2. **Spot Instances**: Use spot instances for development and CI/CD
3. **Reserved Capacity**: Reserved instances for predictable production workloads
4. **Auto-scaling**: Dynamic scaling to match actual demand patterns
5. **Image Optimization**: Minimize container image sizes to reduce transfer costs

## Performance Benchmarks and SLAs

### Service Level Objectives (SLOs)

- **Availability**: 99.9% uptime (≤ 8.77 hours downtime/year)
- **Response Time**: 95th percentile API responses under 200ms
- **WebSocket Latency**: Real-time updates delivered within 50ms
- **Throughput**: Support 1,000 concurrent active users
- **Error Rate**: < 0.1% of requests result in 5xx errors

### Performance Targets by Component

#### API Performance

- **Simple Database Queries**: < 10ms response time
- **Complex Aggregations**: < 100ms response time
- **AI Task Extraction**: < 2 seconds for GPT processing
- **Calendar Sync**: < 5 seconds for full calendar refresh

#### Frontend Performance

- **Initial Page Load**: < 2 seconds (First Contentful Paint)
- **Route Navigation**: < 500ms for client-side routing
- **Bundle Size**: < 500KB initial JavaScript bundle
- **Lighthouse Score**: > 90 for Performance, Accessibility, SEO

#### Database Performance

- **Connection Pool**: 200 max connections with connection pooling
- **Query Performance**: 95% of queries under 10ms
- **Backup Duration**: Full backup completion under 30 minutes
- **Recovery Time**: Database recovery under 4 hours (RTO)

### Monitoring Metrics and Alerts

#### Golden Signals

1. **Latency**: Request duration at 50th, 95th, 99th percentiles
2. **Traffic**: Requests per second and concurrent user count
3. **Errors**: Error rate by HTTP status code and error type
4. **Saturation**: CPU, memory, disk utilization by service

#### Business Metrics

- **User Engagement**: Daily/monthly active users
- **Task Completion**: Task creation and completion rates
- **AI Accuracy**: Task extraction accuracy and user corrections
- **Calendar Integration**: Sync success rates and conflict resolution

#### Custom Application Metrics

- **WebSocket Connections**: Active WebSocket connection count
- **OAuth Success Rate**: Authentication success/failure rates
- **Calendar Sync Status**: Google Calendar and Outlook sync health
- **AI Request Volume**: OpenAI API usage and response times

## Implementation Timeline and Milestones

### Phase 1: Foundation (Week 1)

- **Docker Configuration**: Production-ready container setup
- **Security Hardening**: Non-root users, vulnerability scanning
- **Base Infrastructure**: Core Kubernetes manifests
- **Milestone**: Secure containerized applications ready for deployment

### Phase 2: Orchestration (Week 2)

- **Kubernetes Deployment**: Production cluster configuration
- **Networking Setup**: Ingress controllers and service mesh
- **Secret Management**: Vault integration and encrypted storage
- **Milestone**: Full Kubernetes cluster operational

### Phase 3: Scalability (Week 3)

- **Auto-scaling Configuration**: HPA and VPA implementation
- **High Availability**: Multi-zone deployment and failover
- **Load Testing**: Stress testing under realistic conditions
- **Milestone**: System handles target load with auto-scaling

### Phase 4: Observability (Week 4)

- **Monitoring Stack**: Prometheus, Grafana, AlertManager deployment
- **Logging Pipeline**: Centralized log aggregation and analysis
- **Alerting Rules**: Comprehensive alert configuration
- **Milestone**: Full visibility into system health and performance

### Phase 5: Automation (Week 5)

- **CI/CD Pipeline**: Automated testing and deployment
- **Security Scanning**: Integrated vulnerability assessments
- **Rollback Procedures**: Automated rollback on deployment failures
- **Milestone**: Fully automated deployment pipeline

### Phase 6: Validation (Week 6)

- **End-to-End Testing**: Complete system validation
- **Performance Testing**: Load testing and optimization
- **Security Auditing**: Penetration testing and compliance
- **Milestone**: Production-ready infrastructure validated

## Risk Assessment and Mitigation

### High-Risk Areas

1. **Data Loss**: Database corruption or accidental deletion
   - _Mitigation_: Automated backups, point-in-time recovery, replica sets
2. **Security Breach**: Container or cluster compromise
   - _Mitigation_: Network policies, RBAC, regular security scans
3. **Service Outage**: Critical service failure
   - _Mitigation_: High availability, circuit breakers, health checks
4. **Cost Overrun**: Unexpected resource consumption
   - _Mitigation_: Resource quotas, budget alerts, regular cost reviews

### Medium-Risk Areas

1. **Performance Degradation**: Slow response times under load
   - _Mitigation_: Auto-scaling, performance monitoring, load testing
2. **Configuration Drift**: Manual changes breaking automation
   - _Mitigation_: Infrastructure as Code, change management processes
3. **Dependency Failures**: External service outages
   - _Mitigation_: Circuit breakers, graceful degradation, fallback modes

## Success Criteria

### Technical Success Metrics

- [ ] All services successfully deployed in production
- [ ] 99.9% uptime achieved over 30-day period
- [ ] API response times under 200ms (95th percentile)
- [ ] Auto-scaling responds within 2 minutes of load changes
- [ ] Zero critical security vulnerabilities in production

### Operational Success Metrics

- [ ] Deployment time reduced to under 10 minutes
- [ ] Zero-downtime deployments achieved
- [ ] Mean Time to Recovery (MTTR) under 1 hour
- [ ] Monitoring covers 100% of critical system components
- [ ] Automated alerting with <5% false positive rate

### Business Success Metrics

- [ ] Infrastructure costs within projected budget range
- [ ] Development team velocity maintained or improved
- [ ] Customer-facing incidents reduced by >80%
- [ ] Time to market for new features improved by >50%

---

**Status**: ✅ Infrastructure Architecture and Planning - COMPLETED
**Next Phase**: Production Docker Containers and Security Implementation

## Maintenance

### Regular Tasks

1. **Security Updates**: Monthly base image updates
2. **Certificate Renewal**: Automatic with cert-manager
3. **Backup Verification**: Weekly backup restoration tests
4. **Performance Review**: Monthly performance analysis

### Scaling Considerations

- **Resource monitoring**: Track usage patterns for optimization
- **Cost optimization**: Right-size resources based on actual usage
- **Performance testing**: Regular load testing to validate scaling

## Support and Documentation

### Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Prometheus Monitoring](https://prometheus.io/docs/)
- [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [cert-manager](https://cert-manager.io/docs/)

### Getting Help

- Check the troubleshooting section
- Review logs using the provided kubectl commands
- Monitor dashboards in Grafana for system health
- Use the deployment script's status command for quick health checks

---

This production infrastructure provides a robust, secure, and scalable foundation for the Codex Bootstrap application, supporting the full-featured ADHD task management system with WebSocket real-time updates, OAuth authentication, and comprehensive monitoring.
