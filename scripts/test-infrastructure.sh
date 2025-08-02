#!/bin/bash

# Infrastructure Testing Script for Codex Bootstrap
# Tests Docker containers, Kubernetes deployments, and overall system health

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
NAMESPACE="codex-bootstrap"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
PASSED=0
FAILED=0
TESTS=()

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

test_pass() {
    local test_name=$1
    echo -e "${GREEN}✓${NC} $test_name"
    PASSED=$((PASSED + 1))
    TESTS+=("PASS: $test_name")
}

test_fail() {
    local test_name=$1
    local error_msg=$2
    echo -e "${RED}✗${NC} $test_name"
    if [ -n "$error_msg" ]; then
        echo -e "  ${RED}Error:${NC} $error_msg"
    fi
    FAILED=$((FAILED + 1))
    TESTS+=("FAIL: $test_name - $error_msg")
}

# Docker tests
test_docker_build() {
    log_info "Testing Docker builds..."
    
    cd "$PROJECT_ROOT"
    
    # Test backend build
    if docker build -t codex-backend:test -f Dockerfile.backend . > /dev/null 2>&1; then
        test_pass "Backend Docker build"
    else
        test_fail "Backend Docker build" "Failed to build backend image"
        return 1
    fi
    
    # Test frontend build
    if docker build -t codex-frontend:test -f Dockerfile.frontend . > /dev/null 2>&1; then
        test_pass "Frontend Docker build"
    else
        test_fail "Frontend Docker build" "Failed to build frontend image"
        return 1
    fi
}

test_docker_security() {
    log_info "Testing Docker security configurations..."
    
    # Test backend image security
    local backend_user=$(docker run --rm codex-backend:test id -u 2>/dev/null || echo "0")
    if [ "$backend_user" != "0" ]; then
        test_pass "Backend runs as non-root user"
    else
        test_fail "Backend runs as non-root user" "Container runs as root (UID 0)"
    fi
    
    # Test frontend image security
    local frontend_user=$(docker run --rm codex-frontend:test id -u 2>/dev/null || echo "0")
    if [ "$frontend_user" != "0" ]; then
        test_pass "Frontend runs as non-root user"
    else
        test_fail "Frontend runs as non-root user" "Container runs as root (UID 0)"
    fi
    
    # Test for common vulnerabilities
    if command -v trivy &> /dev/null; then
        if trivy image --exit-code 1 --severity HIGH,CRITICAL codex-backend:test > /dev/null 2>&1; then
            test_pass "Backend image vulnerability scan"
        else
            test_fail "Backend image vulnerability scan" "High/Critical vulnerabilities found"
        fi
        
        if trivy image --exit-code 1 --severity HIGH,CRITICAL codex-frontend:test > /dev/null 2>&1; then
            test_pass "Frontend image vulnerability scan"
        else
            test_fail "Frontend image vulnerability scan" "High/Critical vulnerabilities found"
        fi
    else
        log_warning "Trivy not installed, skipping vulnerability scans"
    fi
}

test_docker_compose() {
    log_info "Testing Docker Compose setup..."
    
    cd "$PROJECT_ROOT"
    
    # Start services
    if docker-compose up -d > /dev/null 2>&1; then
        test_pass "Docker Compose startup"
        
        # Wait for services to be ready
        sleep 30
        
        # Test backend health
        if curl -f http://localhost:8000/health > /dev/null 2>&1; then
            test_pass "Backend health check via Docker Compose"
        else
            test_fail "Backend health check via Docker Compose" "Health endpoint not responding"
        fi
        
        # Test frontend
        if curl -f http://localhost:3000 > /dev/null 2>&1; then
            test_pass "Frontend accessibility via Docker Compose"
        else
            test_fail "Frontend accessibility via Docker Compose" "Frontend not responding"
        fi
        
        # Test database connection
        if docker-compose exec -T postgres pg_ready > /dev/null 2>&1; then
            test_pass "Database connectivity via Docker Compose"
        else
            test_fail "Database connectivity via Docker Compose" "Database not ready"
        fi
        
        # Clean up
        docker-compose down > /dev/null 2>&1
    else
        test_fail "Docker Compose startup" "Failed to start services"
    fi
}

test_kubernetes_manifests() {
    log_info "Testing Kubernetes manifest validation..."
    
    local k8s_dir="$PROJECT_ROOT/k8s"
    
    # Test each manifest file for basic YAML syntax first
    for manifest in "$k8s_dir"/*.yaml; do
        local filename=$(basename "$manifest")
        
        # Basic YAML syntax validation (handle multi-document YAML)
        if python3 -c "import yaml; list(yaml.safe_load_all(open('$manifest')))" > /dev/null 2>&1; then
            # Try kubectl validation if cluster is available
            if kubectl cluster-info > /dev/null 2>&1; then
                if kubectl apply --dry-run=client -f "$manifest" > /dev/null 2>&1; then
                    test_pass "Kubernetes manifest validation: $filename"
                else
                    test_fail "Kubernetes manifest validation: $filename" "Invalid Kubernetes resources"
                fi
            else
                # Just validate YAML structure and basic k8s fields
                if grep -q "apiVersion\|kind\|metadata" "$manifest"; then
                    test_pass "YAML syntax validation: $filename"
                else
                    test_fail "YAML syntax validation: $filename" "Missing required Kubernetes fields"
                fi
            fi
        else
            test_fail "YAML syntax validation: $filename" "Invalid YAML syntax"
        fi
    done
}

test_kubernetes_deployment() {
    log_info "Testing Kubernetes deployment..."
    
    # Check if kubectl is configured
    if ! kubectl cluster-info > /dev/null 2>&1; then
        log_warning "Kubernetes cluster not accessible, skipping deployment tests"
        return 0
    fi
    
    local test_namespace="codex-test-$(date +%s)"
    
    # Create test namespace
    if kubectl create namespace "$test_namespace" > /dev/null 2>&1; then
        test_pass "Test namespace creation"
        
        # Update manifests for test namespace
        local temp_dir=$(mktemp -d)
        cp -r "$PROJECT_ROOT/k8s" "$temp_dir/"
        
        # Replace namespace in all manifests
        find "$temp_dir/k8s" -name "*.yaml" -exec sed -i "s/namespace: codex-bootstrap/namespace: $test_namespace/g" {} \;
        find "$temp_dir/k8s" -name "*.yaml" -exec sed -i "s/codex-bootstrap/$test_namespace/g" {} \;
        
        # Deploy to test namespace
        if kubectl apply -f "$temp_dir/k8s/" > /dev/null 2>&1; then
            test_pass "Kubernetes deployment to test namespace"
            
            # Wait for deployments
            sleep 60
            
            # Check deployment status
            if kubectl get pods -n "$test_namespace" --field-selector=status.phase=Running | grep -q "codex-backend"; then
                test_pass "Backend pod running in Kubernetes"
            else
                test_fail "Backend pod running in Kubernetes" "Backend pod not in running state"
            fi
            
            if kubectl get pods -n "$test_namespace" --field-selector=status.phase=Running | grep -q "codex-frontend"; then
                test_pass "Frontend pod running in Kubernetes"
            else
                test_fail "Frontend pod running in Kubernetes" "Frontend pod not in running state"
            fi
            
        else
            test_fail "Kubernetes deployment to test namespace" "Failed to deploy manifests"
        fi
        
        # Clean up test namespace
        kubectl delete namespace "$test_namespace" > /dev/null 2>&1
        rm -rf "$temp_dir"
    else
        test_fail "Test namespace creation" "Failed to create test namespace"
    fi
}

test_security_configurations() {
    log_info "Testing security configurations..."
    
    local k8s_dir="$PROJECT_ROOT/k8s"
    
    # Check for security contexts
    if grep -r "securityContext" "$k8s_dir"/*.yaml > /dev/null 2>&1; then
        test_pass "Security contexts configured"
    else
        test_fail "Security contexts configured" "No security contexts found in manifests"
    fi
    
    # Check for non-root users
    if grep -r "runAsNonRoot: true" "$k8s_dir"/*.yaml > /dev/null 2>&1; then
        test_pass "Non-root user configuration"
    else
        test_fail "Non-root user configuration" "Containers may be running as root"
    fi
    
    # Check for resource limits
    if grep -r "resources:" "$k8s_dir"/*.yaml > /dev/null 2>&1; then
        test_pass "Resource limits configured"
    else
        test_fail "Resource limits configured" "No resource limits found"
    fi
    
    # Check for network policies
    if grep -r "NetworkPolicy" "$k8s_dir"/*.yaml > /dev/null 2>&1; then
        test_pass "Network policies configured"
    else
        test_fail "Network policies configured" "No network policies found"
    fi
}

test_monitoring_setup() {
    log_info "Testing monitoring configuration..."
    
    local k8s_dir="$PROJECT_ROOT/k8s"
    
    # Check for Prometheus configuration
    if [ -f "$k8s_dir/monitoring.yaml" ] && [ -f "$k8s_dir/prometheus-config.yaml" ]; then
        test_pass "Monitoring manifests present"
    else
        test_fail "Monitoring manifests present" "Missing monitoring configuration files"
    fi
    
    # Check for Prometheus annotations
    if grep -r "prometheus.io/scrape" "$k8s_dir"/*.yaml > /dev/null 2>&1; then
        test_pass "Prometheus scrape annotations"
    else
        test_fail "Prometheus scrape annotations" "Missing Prometheus scrape configurations"
    fi
    
    # Check for Grafana dashboards
    if grep -r "grafana" "$k8s_dir"/*.yaml > /dev/null 2>&1; then
        test_pass "Grafana configuration present"
    else
        test_fail "Grafana configuration present" "Missing Grafana configuration"
    fi
}

test_database_configuration() {
    log_info "Testing database configuration..."
    
    local k8s_dir="$PROJECT_ROOT/k8s"
    
    # Check for database StatefulSet
    if grep -r "StatefulSet" "$k8s_dir/database.yaml" > /dev/null 2>&1; then
        test_pass "Database StatefulSet configuration"
    else
        test_fail "Database StatefulSet configuration" "Database not configured as StatefulSet"
    fi
    
    # Check for persistent volumes
    if grep -r "PersistentVolumeClaim" "$k8s_dir/database.yaml" > /dev/null 2>&1; then
        test_pass "Database persistent storage"
    else
        test_fail "Database persistent storage" "No persistent storage configured for database"
    fi
    
    # Check for database performance tuning
    if grep -r "shared_buffers\|max_connections\|work_mem" "$k8s_dir/database.yaml" > /dev/null 2>&1; then
        test_pass "Database performance tuning"
    else
        test_fail "Database performance tuning" "No performance tuning parameters found"
    fi
}

test_ingress_configuration() {
    log_info "Testing ingress configuration..."
    
    local k8s_dir="$PROJECT_ROOT/k8s"
    
    # Check for ingress manifest
    if [ -f "$k8s_dir/ingress.yaml" ]; then
        test_pass "Ingress manifest present"
        
        # Check for SSL/TLS configuration
        if grep -r "cert-manager\|tls:" "$k8s_dir/ingress.yaml" > /dev/null 2>&1; then
            test_pass "SSL/TLS configuration"
        else
            test_fail "SSL/TLS configuration" "No SSL/TLS configuration found"
        fi
        
        # Check for rate limiting
        if grep -r "rate-limit" "$k8s_dir/ingress.yaml" > /dev/null 2>&1; then
            test_pass "Rate limiting configuration"
        else
            test_fail "Rate limiting configuration" "No rate limiting found"
        fi
        
        # Check for CORS configuration
        if grep -r "cors" "$k8s_dir/ingress.yaml" > /dev/null 2>&1; then
            test_pass "CORS configuration"
        else
            test_fail "CORS configuration" "No CORS configuration found"
        fi
    else
        test_fail "Ingress manifest present" "ingress.yaml not found"
    fi
}

test_autoscaling() {
    log_info "Testing autoscaling configuration..."
    
    local k8s_dir="$PROJECT_ROOT/k8s"
    
    # Check for HPA configuration
    if grep -r "HorizontalPodAutoscaler" "$k8s_dir"/*.yaml > /dev/null 2>&1; then
        test_pass "Horizontal Pod Autoscaler configured"
    else
        test_fail "Horizontal Pod Autoscaler configured" "No HPA configuration found"
    fi
    
    # Check for resource requests (required for HPA)
    if grep -r "requests:" "$k8s_dir"/*.yaml > /dev/null 2>&1; then
        test_pass "Resource requests configured for autoscaling"
    else
        test_fail "Resource requests configured for autoscaling" "Resource requests required for HPA"
    fi
}

test_ci_cd_pipeline() {
    log_info "Testing CI/CD pipeline configuration..."
    
    # Check for GitHub Actions workflow
    if [ -f "$PROJECT_ROOT/.github/workflows/ci-cd.yml" ]; then
        test_pass "GitHub Actions workflow present"
        
        # Check for security scanning
        if grep -r "trivy\|security" "$PROJECT_ROOT/.github/workflows/ci-cd.yml" > /dev/null 2>&1; then
            test_pass "Security scanning in CI/CD"
        else
            test_fail "Security scanning in CI/CD" "No security scanning configured"
        fi
        
        # Check for multi-stage deployment
        if grep -r "staging\|production" "$PROJECT_ROOT/.github/workflows/ci-cd.yml" > /dev/null 2>&1; then
            test_pass "Multi-stage deployment"
        else
            test_fail "Multi-stage deployment" "No staging/production deployment found"
        fi
    else
        test_fail "GitHub Actions workflow present" "ci-cd.yml not found"
    fi
}

run_performance_tests() {
    log_info "Running basic performance tests..."
    
    # This would typically include load testing, but for now we'll do basic checks
    cd "$PROJECT_ROOT"
    
    # Check if Docker Compose is running
    if docker-compose ps | grep -q "Up"; then
        # Simple load test with curl
        local response_time=$(curl -o /dev/null -s -w '%{time_total}' http://localhost:8000/health 2>/dev/null || echo "999")
        if (( $(echo "$response_time < 2.0" | bc -l) )); then
            test_pass "Backend response time under 2 seconds ($response_time s)"
        else
            test_fail "Backend response time under 2 seconds" "Response time: ${response_time}s"
        fi
    else
        log_warning "Docker Compose not running, skipping performance tests"
    fi
}

# Main test runner
run_all_tests() {
    log_info "Starting comprehensive infrastructure tests..."
    echo ""
    
    # Docker tests
    test_docker_build
    test_docker_security
    test_docker_compose
    
    # Kubernetes tests
    test_kubernetes_manifests
    test_kubernetes_deployment
    
    # Security tests
    test_security_configurations
    
    # Configuration tests
    test_monitoring_setup
    test_database_configuration
    test_ingress_configuration
    test_autoscaling
    
    # CI/CD tests
    test_ci_cd_pipeline
    
    # Performance tests
    run_performance_tests
}

show_results() {
    echo ""
    echo "======================================"
    echo "TEST RESULTS SUMMARY"
    echo "======================================"
    echo ""
    
    for test in "${TESTS[@]}"; do
        if [[ $test == PASS:* ]]; then
            echo -e "${GREEN}✓${NC} ${test#PASS: }"
        else
            echo -e "${RED}✗${NC} ${test#FAIL: }"
        fi
    done
    
    echo ""
    echo "======================================"
    echo -e "Total Tests: $((PASSED + FAILED))"
    echo -e "${GREEN}Passed: $PASSED${NC}"
    echo -e "${RED}Failed: $FAILED${NC}"
    
    if [ $FAILED -eq 0 ]; then
        echo -e "${GREEN}All tests passed! Infrastructure is ready for deployment.${NC}"
        exit 0
    else
        echo -e "${RED}Some tests failed. Please address the issues before deploying.${NC}"
        exit 1
    fi
}

# Cleanup function
cleanup() {
    log_info "Cleaning up test resources..."
    docker-compose down > /dev/null 2>&1 || true
    docker rmi codex-backend:test codex-frontend:test > /dev/null 2>&1 || true
}

# Main execution
main() {
    trap cleanup EXIT
    
    run_all_tests
    show_results
}

# Handle script arguments
case "${1:-all}" in
    "docker")
        test_docker_build
        test_docker_security
        test_docker_compose
        show_results
        ;;
    "kubernetes"|"k8s")
        test_kubernetes_manifests
        test_kubernetes_deployment
        show_results
        ;;
    "security")
        test_security_configurations
        show_results
        ;;
    "monitoring")
        test_monitoring_setup
        show_results
        ;;
    "all"|"")
        main
        ;;
    *)
        echo "Usage: $0 [docker|kubernetes|k8s|security|monitoring|all]"
        exit 1
        ;;
esac
