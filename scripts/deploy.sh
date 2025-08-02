#!/bin/bash

# Codex Bootstrap Deployment Script
# Usage: ./deploy.sh [environment] [action]
# Environment: local, staging, production
# Action: deploy, rollback, status, logs

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
K8S_DIR="$PROJECT_ROOT/k8s"
NAMESPACE="codex-bootstrap"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
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

check_dependencies() {
    log_info "Checking dependencies..."
    
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed. Please install kubectl first."
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        log_error "docker is not installed. Please install Docker first."
        exit 1
    fi
    
    log_success "All dependencies are installed."
}

build_images() {
    local environment=$1
    log_info "Building Docker images for $environment..."
    
    cd "$PROJECT_ROOT"
    
    # Build backend image
    log_info "Building backend image..."
    docker build -t "codex-backend:$environment" -f Dockerfile.backend .
    
    # Build frontend image
    log_info "Building frontend image..."
    docker build -t "codex-frontend:$environment" -f Dockerfile.frontend ./frontend
    
    log_success "Docker images built successfully."
}

deploy_local() {
    log_info "Deploying to local environment..."
    
    # Start Docker Compose
    cd "$PROJECT_ROOT"
    docker-compose down || true
    docker-compose up -d --build
    
    log_info "Waiting for services to be ready..."
    sleep 30
    
    # Health checks
    if curl -f http://localhost:8000/health &> /dev/null; then
        log_success "Backend is healthy at http://localhost:8000"
    else
        log_error "Backend health check failed"
        return 1
    fi
    
    if curl -f http://localhost:3000 &> /dev/null; then
        log_success "Frontend is healthy at http://localhost:3000"
    else
        log_error "Frontend health check failed"
        return 1
    fi
    
    log_success "Local deployment completed successfully!"
    echo ""
    echo "Services available at:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend:  http://localhost:8000"
    echo "  Database: localhost:5432"
}

deploy_kubernetes() {
    local environment=$1
    log_info "Deploying to Kubernetes ($environment)..."
    
    # Check if kubectl is configured
    if ! kubectl cluster-info &> /dev/null; then
        log_error "kubectl is not configured or cluster is not accessible"
        exit 1
    fi
    
    # Create namespace if it doesn't exist
    kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
    
    # Apply configurations in order
    log_info "Applying namespace configuration..."
    kubectl apply -f "$K8S_DIR/namespace.yaml"
    
    log_info "Applying ConfigMaps..."
    kubectl apply -f "$K8S_DIR/configmap.yaml"
    kubectl apply -f "$K8S_DIR/prometheus-config.yaml"
    
    log_info "Deploying database..."
    kubectl apply -f "$K8S_DIR/database.yaml"
    
    # Wait for database to be ready
    log_info "Waiting for database to be ready..."
    kubectl rollout status statefulset/postgresql -n $NAMESPACE --timeout=300s
    
    log_info "Deploying backend..."
    kubectl apply -f "$K8S_DIR/backend-deployment.yaml"
    
    log_info "Deploying frontend..."
    kubectl apply -f "$K8S_DIR/frontend-deployment.yaml"
    
    log_info "Setting up ingress..."
    kubectl apply -f "$K8S_DIR/ingress.yaml"
    
    log_info "Deploying monitoring stack..."
    kubectl apply -f "$K8S_DIR/monitoring.yaml"
    
    # Wait for deployments to be ready
    log_info "Waiting for deployments to be ready..."
    kubectl rollout status deployment/codex-backend -n $NAMESPACE --timeout=300s
    kubectl rollout status deployment/codex-frontend -n $NAMESPACE --timeout=300s
    kubectl rollout status deployment/prometheus -n $NAMESPACE --timeout=300s
    kubectl rollout status deployment/grafana -n $NAMESPACE --timeout=300s
    
    log_success "Kubernetes deployment completed successfully!"
    
    # Show service URLs
    show_service_urls
}

show_service_urls() {
    log_info "Service URLs:"
    
    # Get ingress information
    if kubectl get ingress codex-ingress -n $NAMESPACE &> /dev/null; then
        INGRESS_HOST=$(kubectl get ingress codex-ingress -n $NAMESPACE -o jsonpath='{.spec.rules[0].host}' 2>/dev/null || echo "localhost")
        echo "  Frontend: https://$INGRESS_HOST"
        echo "  Backend:  https://$INGRESS_HOST/api"
        echo "  Grafana:  https://$INGRESS_HOST/grafana"
    fi
    
    # Port forward instructions
    echo ""
    echo "For local access, you can use port forwarding:"
    echo "  kubectl port-forward -n $NAMESPACE svc/codex-frontend 3000:80"
    echo "  kubectl port-forward -n $NAMESPACE svc/codex-backend 8000:8000"
    echo "  kubectl port-forward -n $NAMESPACE svc/grafana 3001:3000"
}

rollback() {
    local environment=$1
    log_info "Rolling back $environment deployment..."
    
    if [ "$environment" = "local" ]; then
        cd "$PROJECT_ROOT"
        docker-compose down
        log_success "Local environment stopped."
        return
    fi
    
    # Kubernetes rollback
    kubectl rollout undo deployment/codex-backend -n $NAMESPACE
    kubectl rollout undo deployment/codex-frontend -n $NAMESPACE
    
    # Wait for rollback to complete
    kubectl rollout status deployment/codex-backend -n $NAMESPACE --timeout=300s
    kubectl rollout status deployment/codex-frontend -n $NAMESPACE --timeout=300s
    
    log_success "Rollback completed successfully!"
}

show_status() {
    local environment=$1
    log_info "Showing status for $environment environment..."
    
    if [ "$environment" = "local" ]; then
        cd "$PROJECT_ROOT"
        docker-compose ps
        return
    fi
    
    # Kubernetes status
    echo ""
    echo "=== Namespace Status ==="
    kubectl get all -n $NAMESPACE
    
    echo ""
    echo "=== Pod Status ==="
    kubectl get pods -n $NAMESPACE -o wide
    
    echo ""
    echo "=== Service Status ==="
    kubectl get services -n $NAMESPACE
    
    echo ""
    echo "=== Ingress Status ==="
    kubectl get ingress -n $NAMESPACE
    
    echo ""
    echo "=== Recent Events ==="
    kubectl get events -n $NAMESPACE --sort-by='.lastTimestamp' | tail -10
}

show_logs() {
    local environment=$1
    local service=${2:-backend}
    
    log_info "Showing logs for $service in $environment environment..."
    
    if [ "$environment" = "local" ]; then
        cd "$PROJECT_ROOT"
        if [ "$service" = "backend" ]; then
            docker-compose logs -f codex-backend
        elif [ "$service" = "frontend" ]; then
            docker-compose logs -f codex-frontend
        else
            docker-compose logs -f "$service"
        fi
        return
    fi
    
    # Kubernetes logs
    if [ "$service" = "backend" ]; then
        kubectl logs -f deployment/codex-backend -n $NAMESPACE
    elif [ "$service" = "frontend" ]; then
        kubectl logs -f deployment/codex-frontend -n $NAMESPACE
    else
        kubectl logs -f deployment/"$service" -n $NAMESPACE
    fi
}

cleanup() {
    local environment=$1
    log_info "Cleaning up $environment environment..."
    
    if [ "$environment" = "local" ]; then
        cd "$PROJECT_ROOT"
        docker-compose down -v
        docker system prune -f
        log_success "Local environment cleaned up."
        return
    fi
    
    # Kubernetes cleanup
    kubectl delete namespace $NAMESPACE --ignore-not-found=true
    log_success "Kubernetes resources cleaned up."
}

run_tests() {
    log_info "Running tests..."
    
    cd "$PROJECT_ROOT"
    
    # Run backend tests
    log_info "Running backend tests..."
    cd backend
    npm test
    
    # Run frontend tests
    log_info "Running frontend tests..."
    cd ../frontend
    npm test
    
    cd "$PROJECT_ROOT"
    log_success "All tests passed!"
}

show_help() {
    echo "Codex Bootstrap Deployment Script"
    echo ""
    echo "Usage: $0 [environment] [action] [options]"
    echo ""
    echo "Environments:"
    echo "  local      - Deploy using Docker Compose"
    echo "  staging    - Deploy to staging Kubernetes cluster"
    echo "  production - Deploy to production Kubernetes cluster"
    echo ""
    echo "Actions:"
    echo "  deploy     - Deploy the application"
    echo "  rollback   - Rollback to previous version"
    echo "  status     - Show deployment status"
    echo "  logs       - Show service logs (specify service as 3rd argument)"
    echo "  cleanup    - Clean up deployment"
    echo "  test       - Run tests"
    echo ""
    echo "Examples:"
    echo "  $0 local deploy"
    echo "  $0 production status"
    echo "  $0 staging logs backend"
    echo "  $0 local cleanup"
    echo ""
}

# Main script logic
main() {
    local environment=${1:-}
    local action=${2:-}
    
    if [ -z "$environment" ] || [ -z "$action" ]; then
        show_help
        exit 1
    fi
    
    case "$action" in
        "deploy")
            check_dependencies
            if [ "$environment" = "local" ]; then
                deploy_local
            else
                build_images "$environment"
                deploy_kubernetes "$environment"
            fi
            ;;
        "rollback")
            rollback "$environment"
            ;;
        "status")
            show_status "$environment"
            ;;
        "logs")
            show_logs "$environment" "$3"
            ;;
        "cleanup")
            cleanup "$environment"
            ;;
        "test")
            run_tests
            ;;
        *)
            log_error "Unknown action: $action"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
