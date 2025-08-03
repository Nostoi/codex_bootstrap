#!/bin/bash

# Production Deployment Script for Codex Bootstrap
# Secure deployment with security validation

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[DEPLOY]${NC} $1"
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

# Pre-deployment security validation
run_security_gate() {
    log_info "Running production security gate..."
    
    if [ -f "$PROJECT_ROOT/scripts/production-security-gate.sh" ]; then
        if "$PROJECT_ROOT/scripts/production-security-gate.sh"; then
            log_success "Security gate passed - proceeding with deployment"
        else
            log_error "Security gate failed - deployment aborted"
            exit 1
        fi
    else
        log_warning "Production security gate script not found - proceeding without validation"
    fi
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking deployment prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose not installed"
        exit 1
    fi
    
    # Check production environment file
    if [ ! -f "$PROJECT_ROOT/backend/.env.production" ]; then
        log_error "Production environment file not found"
        echo "Please create backend/.env.production based on backend/.env.production.example"
        exit 1
    fi
    
    # Check secrets
    if [ ! -f "$PROJECT_ROOT/secrets/db_user.txt" ] || [ ! -f "$PROJECT_ROOT/secrets/db_password.txt" ]; then
        log_error "Database secrets not configured"
        echo "Please create secrets/db_user.txt and secrets/db_password.txt"
        exit 1
    fi
    
    # Check SSL certificates (optional)
    if [ ! -d "$PROJECT_ROOT/certs" ]; then
        log_warning "SSL certificates not found - HTTPS will not work"
        log_info "Create certs/ directory with cert.pem and key.pem for HTTPS"
    fi
    
    log_success "Prerequisites check completed"
}

# Deploy production environment
deploy_production() {
    log_info "Deploying production environment..."
    
    cd "$PROJECT_ROOT"
    
    # Pull latest images (if using registry)
    log_info "Pulling latest images..."
    docker-compose -f docker-compose.production-secure.yml pull || log_warning "Could not pull images - will build locally"
    
    # Build images
    log_info "Building production images..."
    docker-compose -f docker-compose.production-secure.yml build --no-cache
    
    # Start services
    log_info "Starting production services..."
    docker-compose -f docker-compose.production-secure.yml up -d
    
    # Wait for services to be ready
    log_info "Waiting for services to start..."
    sleep 30
    
    # Health check
    log_info "Performing health checks..."
    
    local health_check_failed=0
    
    # Check backend health
    if docker-compose -f docker-compose.production-secure.yml exec -T backend curl -f http://localhost:8000/health >/dev/null 2>&1; then
        log_success "Backend health check passed"
    else
        log_error "Backend health check failed"
        health_check_failed=1
    fi
    
    # Check frontend health (if running)
    if docker-compose -f docker-compose.production-secure.yml ps frontend | grep -q "Up"; then
        if docker-compose -f docker-compose.production-secure.yml exec -T frontend curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
            log_success "Frontend health check passed"
        else
            log_warning "Frontend health check failed"
        fi
    else
        log_warning "Frontend service not running"
    fi
    
    # Check database connectivity
    if docker-compose -f docker-compose.production-secure.yml exec -T db pg_isready -U helmsman_production >/dev/null 2>&1; then
        log_success "Database health check passed"
    else
        log_error "Database health check failed"
        health_check_failed=1
    fi
    
    if [ $health_check_failed -eq 0 ]; then
        log_success "🎉 Production deployment completed successfully!"
        echo ""
        echo "Services available at:"
        echo "  - Application: http://localhost (via Nginx)"
        echo "  - Backend API: http://localhost/api"
        echo "  - WebSocket: http://localhost/socket.io"
        echo ""
        echo "To monitor:"
        echo "  docker-compose -f docker-compose.production-secure.yml logs -f"
        echo ""
        echo "To stop:"
        echo "  docker-compose -f docker-compose.production-secure.yml down"
    else
        log_error "Production deployment completed with health check failures"
        echo "Check logs: docker-compose -f docker-compose.production-secure.yml logs"
        exit 1
    fi
}

# Show deployment status
show_status() {
    log_info "Production deployment status:"
    echo ""
    
    cd "$PROJECT_ROOT"
    docker-compose -f docker-compose.production-secure.yml ps
    
    echo ""
    log_info "Container resource usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" $(docker-compose -f docker-compose.production-secure.yml ps -q) 2>/dev/null || echo "No containers running"
}

# Stop production environment
stop_production() {
    log_info "Stopping production environment..."
    
    cd "$PROJECT_ROOT"
    docker-compose -f docker-compose.production-secure.yml down
    
    log_success "Production environment stopped"
}

# Main deployment function
main() {
    case "${1:-deploy}" in
        "deploy"|"start")
            check_prerequisites
            run_security_gate
            deploy_production
            ;;
        "stop"|"down")
            stop_production
            ;;
        "status"|"ps")
            show_status
            ;;
        "security")
            run_security_gate
            ;;
        "health")
            log_info "Running health checks..."
            cd "$PROJECT_ROOT"
            docker-compose -f docker-compose.production-secure.yml exec backend curl -f http://localhost:8000/health || log_error "Backend health check failed"
            docker-compose -f docker-compose.production-secure.yml exec frontend curl -f http://localhost:3000/api/health || log_warning "Frontend health check failed"
            docker-compose -f docker-compose.production-secure.yml exec db pg_isready -U helmsman_production || log_error "Database health check failed"
            ;;
        "logs")
            cd "$PROJECT_ROOT"
            docker-compose -f docker-compose.production-secure.yml logs -f "${2:-}"
            ;;
        "help"|"--help")
            echo "Production Deployment Script for Codex Bootstrap"
            echo ""
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  deploy    - Deploy production environment (default)"
            echo "  start     - Same as deploy"
            echo "  stop      - Stop production environment"
            echo "  down      - Same as stop"
            echo "  status    - Show deployment status"
            echo "  ps        - Same as status"
            echo "  security  - Run security gate only"
            echo "  health    - Run health checks"
            echo "  logs      - Show logs (optionally for specific service)"
            echo "  help      - Show this help"
            echo ""
            echo "Examples:"
            echo "  $0 deploy          # Deploy production"
            echo "  $0 logs backend    # Show backend logs"
            echo "  $0 status          # Check status"
            exit 0
            ;;
        *)
            echo "Unknown command: $1"
            echo "Use '$0 help' for usage information."
            exit 1
            ;;
    esac
}

main "$@"
