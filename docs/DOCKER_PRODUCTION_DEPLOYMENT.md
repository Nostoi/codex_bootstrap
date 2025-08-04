# Docker Production Deployment Guide

## Overview

This guide covers the complete setup and deployment of the Codex Bootstrap application using Docker in production environments with comprehensive security hardening.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Production Docker Images](#production-docker-images)
3. [Security Configuration](#security-configuration)
4. [Container Registry Setup](#container-registry-setup)
5. [Production Deployment](#production-deployment)
6. [Security Scanning](#security-scanning)
7. [Monitoring and Logging](#monitoring-and-logging)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- Docker Engine 20.10+ or Docker Desktop
- Docker Compose 2.0+
- Minimum 4GB RAM for production deployment
- SSL certificates for HTTPS
- Container registry access (Docker Hub, AWS ECR, etc.)

### Security Tools

- Trivy vulnerability scanner
- Docker Bench for Security
- Container runtime security (AppArmor/SELinux)

### Installation

```bash
# Install Trivy
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin

# Verify installation
trivy --version
docker --version
docker-compose --version
```

## Production Docker Images

### Multi-Stage Build Architecture

Our production images use multi-stage builds for optimal security and performance:

#### Backend Image (`Dockerfile.backend`)

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
# Install only production dependencies

# Stage 2: Builder
FROM node:20-alpine AS builder
# Build the application with optimizations

# Stage 3: Production Runner
FROM node:20-alpine AS runner
# Minimal runtime with non-root user
```

**Security Features:**

- ✅ Non-root user (`nestjs:1001`)
- ✅ Multi-stage build (minimal attack surface)
- ✅ Alpine Linux base (reduced vulnerabilities)
- ✅ Tini init system (proper signal handling)
- ✅ Health checks configured
- ✅ Security labels applied
- ✅ Capability dropping
- ✅ Read-only filesystem support

#### Frontend Image (`Dockerfile.frontend`)

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
# Install build dependencies

# Stage 2: Builder
FROM node:20-alpine AS builder
# Build Next.js application

# Stage 3: Production Runner
FROM node:20-alpine AS runner
# Serve built application
```

**Security Features:**

- ✅ Non-root user (`nextjs:1001`)
- ✅ Next.js standalone output (optimized)
- ✅ Static asset optimization
- ✅ Security headers configured
- ✅ Health checks implemented

### Building Production Images

```bash
# Build backend image
docker build -t codex-backend:latest -f Dockerfile.backend .

# Build frontend image
docker build -t codex-frontend:latest -f Dockerfile.frontend .

# Build with build args for production
docker build \
  --build-arg NODE_ENV=production \
  --build-arg NEXT_TELEMETRY_DISABLED=1 \
  -t codex-frontend:production \
  -f Dockerfile.frontend .
```

## Security Configuration

### Docker Compose Security Profile

The `docker-compose.security.yml` file provides comprehensive security hardening:

```yaml
version: '3.8'

services:
  backend:
    security_opt:
      - no-new-privileges:true
      - apparmor:docker-default
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
    read_only: true
    tmpfs:
      - /tmp:rw,noexec,nosuid,size=100m
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
    user: '1001:1001'

  frontend:
    security_opt:
      - no-new-privileges:true
      - apparmor:docker-default
    cap_drop:
      - ALL
    read_only: true
    tmpfs:
      - /tmp:rw,noexec,nosuid,size=50m
      - /app/.next/cache:rw,noexec,nosuid,size=100m
    deploy:
      resources:
        limits:
          memory: 256M
          cpus: '0.25'
    user: '1001:1001'
```

### Security Features Explained

1. **no-new-privileges**: Prevents privilege escalation
2. **apparmor**: Applies AppArmor security profile
3. **cap_drop: ALL**: Removes all Linux capabilities
4. **cap_add: NET_BIND_SERVICE**: Adds only required capabilities
5. **read_only**: Makes container filesystem read-only
6. **tmpfs**: Provides writable temporary storage
7. **resource limits**: Prevents resource exhaustion attacks
8. **non-root user**: Runs processes as unprivileged user

## Container Registry Setup

### Docker Hub Setup

```bash
# Login to Docker Hub
docker login

# Tag images for registry
docker tag codex-backend:latest username/codex-backend:latest
docker tag codex-frontend:latest username/codex-frontend:latest

# Push images
docker push username/codex-backend:latest
docker push username/codex-frontend:latest
```

### AWS ECR Setup

```bash
# Get login token
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-west-2.amazonaws.com

# Create repositories
aws ecr create-repository --repository-name codex-bootstrap/backend
aws ecr create-repository --repository-name codex-bootstrap/frontend

# Tag and push
docker tag codex-backend:latest 123456789012.dkr.ecr.us-west-2.amazonaws.com/codex-bootstrap/backend:latest
docker push 123456789012.dkr.ecr.us-west-2.amazonaws.com/codex-bootstrap/backend:latest
```

### Harbor Registry Setup

```bash
# Login to Harbor
docker login harbor.company.com

# Tag images
docker tag codex-backend:latest harbor.company.com/project/codex-backend:latest
docker push harbor.company.com/project/codex-backend:latest
```

## Production Deployment

### Environment Configuration

1. **Create production environment file:**

```bash
# .env.production
NODE_ENV=production
DATABASE_URL=postgresql://user:password@db:5432/codex_prod
REDIS_URL=redis://redis:6379
JWT_SECRET=your-super-secure-jwt-secret-here
OAUTH_CLIENT_ID=your-oauth-client-id
OAUTH_CLIENT_SECRET=your-oauth-client-secret
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

2. **Deploy with Docker Compose:**

```bash
# Production deployment
docker-compose \
  -f docker-compose.yml \
  -f docker-compose.security.yml \
  -f docker-compose.production.yml \
  --env-file .env.production \
  up -d

# Scale services
docker-compose up -d --scale backend=3 --scale frontend=2
```

### Production Compose Configuration

```yaml
# docker-compose.production.yml
version: '3.8'

services:
  backend:
    image: your-registry/codex-backend:${VERSION:-latest}
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3001/health']
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    logging:
      driver: 'json-file'
      options:
        max-size: '10m'
        max-file: '3'

  frontend:
    image: your-registry/codex-frontend:${VERSION:-latest}
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - NEXT_TELEMETRY_DISABLED=1
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3000/api/health']
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    logging:
      driver: 'json-file'
      options:
        max-size: '10m'
        max-file: '3'

  nginx:
    image: nginx:alpine
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
      - frontend
    restart: unless-stopped
```

### Nginx Reverse Proxy Configuration

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3001;
    }

    upstream frontend {
        server frontend:3000;
    }

    server {
        listen 80;
        server_name yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourdomain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## Security Scanning

### Automated Security Scanning

Use the provided security scanner:

```bash
# Run complete security scan
./scripts/security-scan.sh

# Run specific scans
./scripts/security-scan.sh vulnerabilities
./scripts/security-scan.sh secrets
./scripts/security-scan.sh config
```

### Manual Trivy Scanning

```bash
# Scan images for vulnerabilities
trivy image codex-backend:latest
trivy image codex-frontend:latest

# Generate reports
trivy image --format json --output backend-scan.json codex-backend:latest
trivy image --format json --output frontend-scan.json codex-frontend:latest

# Scan for secrets
trivy fs --scanners secret .
```

### Docker Bench Security

```bash
# Run Docker Bench for Security
docker run --rm --net host --pid host --userns host --cap-add audit_control \
  -e DOCKER_CONTENT_TRUST=$DOCKER_CONTENT_TRUST \
  -v /etc:/etc:ro \
  -v /var/lib:/var/lib:ro \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -v /usr/lib/systemd:/usr/lib/systemd:ro \
  -v /etc/systemd:/etc/systemd:ro \
  docker/docker-bench-security
```

### Continuous Security Monitoring

```bash
# Set up automated scanning in CI/CD
name: Security Scan
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build images
        run: |
          docker build -t codex-backend:test -f Dockerfile.backend .
          docker build -t codex-frontend:test -f Dockerfile.frontend .

      - name: Run Trivy scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'codex-backend:test'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
```

## Monitoring and Logging

### Container Health Monitoring

```bash
# Check container health
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Monitor resource usage
docker stats

# View container logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Log Aggregation Setup

```yaml
# Add to docker-compose.yml
services:
  backend:
    logging:
      driver: 'fluentd'
      options:
        fluentd-address: 'fluentd:24224'
        tag: 'backend'

  frontend:
    logging:
      driver: 'fluentd'
      options:
        fluentd-address: 'fluentd:24224'
        tag: 'frontend'
```

### Prometheus Monitoring

```yaml
# monitoring/docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus
    ports:
      - '9090:9090'
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - '3001:3000'
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana

volumes:
  grafana-data:
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Container Won't Start

```bash
# Check logs
docker-compose logs backend

# Common fixes:
# - Check environment variables
# - Verify database connectivity
# - Check file permissions
# - Validate configuration files
```

#### 2. High Memory Usage

```bash
# Check memory usage
docker stats

# Solutions:
# - Increase memory limits
# - Optimize application code
# - Enable memory profiling
# - Check for memory leaks
```

#### 3. Security Scan Failures

```bash
# Run detailed scan
./scripts/security-scan.sh

# Common fixes:
# - Update base images
# - Remove unnecessary packages
# - Fix file permissions
# - Remove test secrets
```

#### 4. SSL/TLS Issues

```bash
# Test SSL configuration
openssl s_client -connect yourdomain.com:443

# Common fixes:
# - Check certificate validity
# - Verify certificate chain
# - Update SSL configuration
# - Check domain DNS
```

### Debugging Commands

```bash
# Enter running container
docker exec -it codex-backend sh

# Check container configuration
docker inspect codex-backend

# View container processes
docker top codex-backend

# Check port bindings
docker port codex-backend

# View container filesystem changes
docker diff codex-backend
```

### Performance Optimization

#### Image Size Optimization

```bash
# Multi-stage build optimization
# Use .dockerignore effectively
# Remove unnecessary packages
# Use Alpine Linux base images
# Combine RUN commands

# Check image sizes
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
```

#### Runtime Optimization

```bash
# Set appropriate resource limits
# Enable health checks
# Use init systems (tini)
# Configure proper logging
# Implement graceful shutdowns
```

## Security Checklist

### Pre-deployment Security Checklist

- [ ] All images scanned for vulnerabilities
- [ ] No secrets in container images
- [ ] Non-root users configured
- [ ] Security labels applied
- [ ] Health checks implemented
- [ ] Resource limits set
- [ ] Read-only filesystems where possible
- [ ] Capabilities dropped appropriately
- [ ] Security profiles applied (AppArmor/SELinux)
- [ ] Logging configured properly
- [ ] SSL/TLS certificates valid
- [ ] Network segmentation implemented
- [ ] Backup and recovery tested
- [ ] Monitoring and alerting configured

### Runtime Security Monitoring

- [ ] Container runtime security enabled
- [ ] Log aggregation and analysis
- [ ] Vulnerability scanning automated
- [ ] Security incident response plan
- [ ] Regular security updates scheduled
- [ ] Access controls implemented
- [ ] Audit logging enabled

## Conclusion

This guide provides a comprehensive approach to deploying Codex Bootstrap in production with Docker, emphasizing security hardening and operational best practices. Regular security scanning, monitoring, and updates are essential for maintaining a secure production environment.

For additional support, refer to:

- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [OWASP Container Security Guide](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html)
- [CIS Docker Benchmark](https://www.cisecurity.org/benchmark/docker)
