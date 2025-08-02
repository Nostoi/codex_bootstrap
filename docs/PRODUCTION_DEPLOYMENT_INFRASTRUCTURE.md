# Production Deployment Infrastructure

This document describes the comprehensive production deployment infrastructure for the Codex Bootstrap (Helmsman AI) system.

## Overview

The production infrastructure is designed with the following principles:
- **High Availability**: Auto-scaling, load balancing, and redundancy
- **Security**: Non-root containers, network policies, secrets management
- **Observability**: Comprehensive monitoring with Prometheus and Grafana
- **Scalability**: Horizontal pod autoscaling and resource optimization
- **Resilience**: Health checks, graceful shutdowns, and failure recovery

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
