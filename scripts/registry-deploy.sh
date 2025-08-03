#!/bin/bash

# Container Registry Integration Script for Codex Bootstrap
# Supports Docker Hub, AWS ECR, Harbor, and other registries

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$PROJECT_ROOT/.registry-config"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default values
REGISTRY_TYPE=""
REGISTRY_URL=""
NAMESPACE=""
VERSION="latest"
PUSH_LATEST=true

# Functions
log_info() {
    echo -e "${BLUE}[REGISTRY]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Load configuration if exists
load_config() {
    if [ -f "$CONFIG_FILE" ]; then
        source "$CONFIG_FILE"
        log_info "Loaded registry configuration from $CONFIG_FILE"
    fi
}

# Save configuration
save_config() {
    cat > "$CONFIG_FILE" << EOF
# Container Registry Configuration
REGISTRY_TYPE="$REGISTRY_TYPE"
REGISTRY_URL="$REGISTRY_URL"
NAMESPACE="$NAMESPACE"
EOF
    log_success "Configuration saved to $CONFIG_FILE"
}

# Docker Hub login and setup
setup_dockerhub() {
    log_info "Setting up Docker Hub registry..."
    
    read -p "Docker Hub username: " DOCKERHUB_USERNAME
    read -s -p "Docker Hub password/token: " DOCKERHUB_PASSWORD
    echo ""
    
    echo "$DOCKERHUB_PASSWORD" | docker login --username "$DOCKERHUB_USERNAME" --password-stdin
    
    REGISTRY_TYPE="dockerhub"
    REGISTRY_URL="docker.io"
    NAMESPACE="$DOCKERHUB_USERNAME"
    
    log_success "Docker Hub login successful"
    save_config
}

# AWS ECR login and setup
setup_aws_ecr() {
    log_info "Setting up AWS ECR registry..."
    
    read -p "AWS Region (e.g., us-west-2): " AWS_REGION
    read -p "AWS Account ID: " AWS_ACCOUNT_ID
    
    # Get login token and login
    aws ecr get-login-password --region "$AWS_REGION" | \
        docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
    
    # Create repositories if they don't exist
    aws ecr describe-repositories --repository-names codex-bootstrap/backend --region "$AWS_REGION" 2>/dev/null || \
        aws ecr create-repository --repository-name codex-bootstrap/backend --region "$AWS_REGION"
    
    aws ecr describe-repositories --repository-names codex-bootstrap/frontend --region "$AWS_REGION" 2>/dev/null || \
        aws ecr create-repository --repository-name codex-bootstrap/frontend --region "$AWS_REGION"
    
    REGISTRY_TYPE="ecr"
    REGISTRY_URL="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
    NAMESPACE="codex-bootstrap"
    
    log_success "AWS ECR setup successful"
    save_config
}

# Harbor registry login and setup
setup_harbor() {
    log_info "Setting up Harbor registry..."
    
    read -p "Harbor registry URL (e.g., harbor.company.com): " HARBOR_URL
    read -p "Harbor username: " HARBOR_USERNAME
    read -s -p "Harbor password: " HARBOR_PASSWORD
    echo ""
    read -p "Project namespace: " HARBOR_PROJECT
    
    echo "$HARBOR_PASSWORD" | docker login --username "$HARBOR_USERNAME" --password-stdin "$HARBOR_URL"
    
    REGISTRY_TYPE="harbor"
    REGISTRY_URL="$HARBOR_URL"
    NAMESPACE="$HARBOR_PROJECT"
    
    log_success "Harbor registry login successful"
    save_config
}

# Generic registry setup
setup_generic() {
    log_info "Setting up generic registry..."
    
    read -p "Registry URL: " GENERIC_URL
    read -p "Username: " GENERIC_USERNAME
    read -s -p "Password: " GENERIC_PASSWORD
    echo ""
    read -p "Namespace/Organization: " GENERIC_NAMESPACE
    
    echo "$GENERIC_PASSWORD" | docker login --username "$GENERIC_USERNAME" --password-stdin "$GENERIC_URL"
    
    REGISTRY_TYPE="generic"
    REGISTRY_URL="$GENERIC_URL"
    NAMESPACE="$GENERIC_NAMESPACE"
    
    log_success "Generic registry login successful"
    save_config
}

# Build production images
build_images() {
    local version=${1:-$VERSION}
    
    log_info "Building production images with version: $version"
    
    cd "$PROJECT_ROOT"
    
    # Build backend image
    log_info "Building backend image..."
    docker build \
        --build-arg NODE_ENV=production \
        --build-arg BUILD_VERSION="$version" \
        -t codex-backend:$version \
        -f Dockerfile.backend .
    
    # Build frontend image (if frontend is ready)
    log_info "Building frontend image..."
    if docker build \
        --build-arg NODE_ENV=production \
        --build-arg NEXT_TELEMETRY_DISABLED=1 \
        --build-arg BUILD_VERSION="$version" \
        -t codex-frontend:$version \
        -f Dockerfile.frontend . > /dev/null 2>&1; then
        log_success "Frontend image built successfully"
    else
        log_warning "Frontend build failed - will skip frontend push"
    fi
    
    log_success "Images built successfully"
}

# Tag images for registry
tag_images() {
    local version=${1:-$VERSION}
    
    log_info "Tagging images for registry..."
    
    # Backend image
    docker tag codex-backend:$version "$REGISTRY_URL/$NAMESPACE/codex-backend:$version"
    if [ "$PUSH_LATEST" = true ] && [ "$version" != "latest" ]; then
        docker tag codex-backend:$version "$REGISTRY_URL/$NAMESPACE/codex-backend:latest"
    fi
    
    # Frontend image (if exists)
    if docker image inspect codex-frontend:$version >/dev/null 2>&1; then
        docker tag codex-frontend:$version "$REGISTRY_URL/$NAMESPACE/codex-frontend:$version"
        if [ "$PUSH_LATEST" = true ] && [ "$version" != "latest" ]; then
            docker tag codex-frontend:$version "$REGISTRY_URL/$NAMESPACE/codex-frontend:latest"
        fi
    fi
    
    log_success "Images tagged successfully"
}

# Push images to registry
push_images() {
    local version=${1:-$VERSION}
    
    log_info "Pushing images to registry..."
    
    # Push backend
    docker push "$REGISTRY_URL/$NAMESPACE/codex-backend:$version"
    if [ "$PUSH_LATEST" = true ] && [ "$version" != "latest" ]; then
        docker push "$REGISTRY_URL/$NAMESPACE/codex-backend:latest"
    fi
    
    # Push frontend (if exists)
    if docker image inspect "$REGISTRY_URL/$NAMESPACE/codex-frontend:$version" >/dev/null 2>&1; then
        docker push "$REGISTRY_URL/$NAMESPACE/codex-frontend:$version"
        if [ "$PUSH_LATEST" = true ] && [ "$version" != "latest" ]; then
            docker push "$REGISTRY_URL/$NAMESPACE/codex-frontend:latest"
        fi
    fi
    
    log_success "Images pushed successfully"
}

# Security scan before push
security_scan() {
    log_info "Running security scan before push..."
    
    if [ -f "$PROJECT_ROOT/scripts/security-scan.sh" ]; then
        cd "$PROJECT_ROOT"
        ./scripts/security-scan.sh
        
        if [ $? -ne 0 ]; then
            log_error "Security scan failed. Aborting push."
            return 1
        fi
    else
        log_warning "Security scan script not found. Skipping security validation."
    fi
    
    log_success "Security scan passed"
}

# Generate deployment manifests
generate_manifests() {
    local version=${1:-$VERSION}
    
    log_info "Generating deployment manifests..."
    
    mkdir -p "$PROJECT_ROOT/deploy"
    
    # Generate docker-compose.production.yml with correct image references
    cat > "$PROJECT_ROOT/deploy/docker-compose.production.yml" << EOF
version: '3.8'

services:
  backend:
    image: $REGISTRY_URL/$NAMESPACE/codex-backend:$version
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    ports:
      - "3001:3001"
    networks:
      - codex-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    
  frontend:
    image: $REGISTRY_URL/$NAMESPACE/codex-frontend:$version
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - NEXT_TELEMETRY_DISABLED=1
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    ports:
      - "3000:3000"
    networks:
      - codex-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    depends_on:
      - backend

networks:
  codex-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
EOF

    # Generate Kubernetes manifests
    cat > "$PROJECT_ROOT/deploy/k8s-deployment.yaml" << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: codex-backend
  labels:
    app: codex-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: codex-backend
  template:
    metadata:
      labels:
        app: codex-backend
    spec:
      containers:
      - name: backend
        image: $REGISTRY_URL/$NAMESPACE/codex-backend:$version
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        securityContext:
          runAsNonRoot: true
          runAsUser: 1001
          readOnlyRootFilesystem: true
          allowPrivilegeEscalation: false
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: codex-frontend
  labels:
    app: codex-frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: codex-frontend
  template:
    metadata:
      labels:
        app: codex-frontend
    spec:
      containers:
      - name: frontend
        image: $REGISTRY_URL/$NAMESPACE/codex-frontend:$version
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: NEXT_TELEMETRY_DISABLED
          value: "1"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        securityContext:
          runAsNonRoot: true
          runAsUser: 1001
          readOnlyRootFilesystem: true
          allowPrivilegeEscalation: false
---
apiVersion: v1
kind: Service
metadata:
  name: codex-backend-service
spec:
  selector:
    app: codex-backend
  ports:
  - port: 3001
    targetPort: 3001
  type: ClusterIP
---
apiVersion: v1
kind: Service
metadata:
  name: codex-frontend-service
spec:
  selector:
    app: codex-frontend
  ports:
  - port: 3000
    targetPort: 3000
  type: ClusterIP
EOF

    log_success "Deployment manifests generated in deploy/ directory"
}

# Show deployment information
show_deployment_info() {
    local version=${1:-$VERSION}
    
    echo ""
    log_info "=== Deployment Information ==="
    echo "Registry: $REGISTRY_URL"
    echo "Namespace: $NAMESPACE"
    echo "Version: $version"
    echo ""
    echo "Backend Image: $REGISTRY_URL/$NAMESPACE/codex-backend:$version"
    echo "Frontend Image: $REGISTRY_URL/$NAMESPACE/codex-frontend:$version"
    echo ""
    echo "Deploy with:"
    echo "  docker-compose -f deploy/docker-compose.production.yml up -d"
    echo "  kubectl apply -f deploy/k8s-deployment.yaml"
    echo ""
}

# Show help
show_help() {
    echo "Container Registry Integration Script"
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  setup-dockerhub    - Configure Docker Hub registry"
    echo "  setup-ecr          - Configure AWS ECR registry"
    echo "  setup-harbor       - Configure Harbor registry"
    echo "  setup-generic      - Configure generic registry"
    echo "  build [version]    - Build production images"
    echo "  push [version]     - Build, tag, and push images"
    echo "  deploy [version]   - Full deployment pipeline"
    echo "  manifests [version] - Generate deployment manifests"
    echo "  info               - Show current configuration"
    echo "  clean              - Clean up local images"
    echo ""
    echo "Options:"
    echo "  --no-latest        - Don't tag/push latest"
    echo "  --skip-scan        - Skip security scanning"
    echo "  --version VERSION  - Set version tag"
    echo ""
    echo "Examples:"
    echo "  $0 setup-dockerhub"
    echo "  $0 deploy v1.0.0"
    echo "  $0 push --version v1.2.3 --no-latest"
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --no-latest)
                PUSH_LATEST=false
                shift
                ;;
            --skip-scan)
                SKIP_SCAN=true
                shift
                ;;
            --version)
                VERSION="$2"
                shift 2
                ;;
            *)
                break
                ;;
        esac
    done
}

# Clean up local images
cleanup_images() {
    log_info "Cleaning up local images..."
    
    docker image rm codex-backend:* codex-frontend:* 2>/dev/null || true
    docker image prune -f
    
    log_success "Local images cleaned up"
}

# Main execution
main() {
    local command=${1:-help}
    shift || true
    
    parse_args "$@"
    load_config
    
    case "$command" in
        "setup-dockerhub")
            setup_dockerhub
            ;;
        "setup-ecr")
            setup_aws_ecr
            ;;
        "setup-harbor")
            setup_harbor
            ;;
        "setup-generic")
            setup_generic
            ;;
        "build")
            build_images "${1:-$VERSION}"
            ;;
        "push")
            if [ -z "$REGISTRY_TYPE" ]; then
                log_error "Registry not configured. Run setup command first."
                exit 1
            fi
            
            local version="${1:-$VERSION}"
            
            if [ "$SKIP_SCAN" != true ]; then
                security_scan || exit 1
            fi
            
            build_images "$version"
            tag_images "$version"
            push_images "$version"
            generate_manifests "$version"
            show_deployment_info "$version"
            ;;
        "deploy")
            if [ -z "$REGISTRY_TYPE" ]; then
                log_error "Registry not configured. Run setup command first."
                exit 1
            fi
            
            local version="${1:-$VERSION}"
            
            log_info "Starting full deployment pipeline..."
            
            if [ "$SKIP_SCAN" != true ]; then
                security_scan || exit 1
            fi
            
            build_images "$version"
            tag_images "$version"
            push_images "$version"
            generate_manifests "$version"
            show_deployment_info "$version"
            
            log_success "Deployment pipeline completed successfully!"
            ;;
        "manifests")
            if [ -z "$REGISTRY_TYPE" ]; then
                log_error "Registry not configured. Run setup command first."
                exit 1
            fi
            generate_manifests "${1:-$VERSION}"
            ;;
        "info")
            if [ -n "$REGISTRY_TYPE" ]; then
                show_deployment_info
            else
                log_warning "No registry configured. Run setup command first."
            fi
            ;;
        "clean")
            cleanup_images
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# Run main function
main "$@"
