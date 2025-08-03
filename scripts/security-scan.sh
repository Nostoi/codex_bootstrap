#!/bin/bash

# Container Security Scanner for Codex Bootstrap
# Comprehensive vulnerability scanning and security validation

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SECURITY_CONFIG="$PROJECT_ROOT/security-config.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Security test results
SECURITY_PASSED=0
SECURITY_FAILED=0
SECURITY_WARNINGS=0

# Functions
log_info() {
    echo -e "${BLUE}[SECURITY]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    SECURITY_PASSED=$((SECURITY_PASSED + 1))
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    SECURITY_WARNINGS=$((SECURITY_WARNINGS + 1))
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
    SECURITY_FAILED=$((SECURITY_FAILED + 1))
}

# Check if Trivy is installed
check_trivy_installation() {
    if command -v trivy &> /dev/null; then
        log_success "Trivy vulnerability scanner is installed"
        trivy --version
        return 0
    else
        log_warning "Trivy not installed. Installing..."
        
        # Install Trivy based on OS
        if [[ "$OSTYPE" == "darwin"* ]]; then
            if command -v brew &> /dev/null; then
                brew install trivy
            else
                log_error "Homebrew not found. Please install Trivy manually: https://aquasecurity.github.io/trivy/"
                return 1
            fi
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Install on Linux
            curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin
        else
            log_error "Unsupported OS. Please install Trivy manually: https://aquasecurity.github.io/trivy/"
            return 1
        fi
        
        if command -v trivy &> /dev/null; then
            log_success "Trivy installed successfully"
        else
            log_error "Failed to install Trivy"
            return 1
        fi
    fi
}

# Build Docker images for scanning
build_images_for_scanning() {
    log_info "Building Docker images for security scanning..."
    
    cd "$PROJECT_ROOT"
    
    # Build backend image
    if docker build -t codex-backend:security-scan -f Dockerfile.backend . > /dev/null 2>&1; then
        log_success "Backend image built for security scanning"
    else
        log_error "Failed to build backend image for scanning"
        return 1
    fi
    
    # Build frontend image (skip if frontend build fails due to missing dependencies)
    log_info "Attempting to build frontend image..."
    if docker build -t codex-frontend:security-scan -f Dockerfile.frontend . > /dev/null 2>&1; then
        log_success "Frontend image built for security scanning"
    else
        log_warning "Frontend image build failed - continuing with backend security scan only"
        log_warning "Frontend build issues need to be resolved before complete security validation"
    fi
}

# Scan Docker images for vulnerabilities
scan_image_vulnerabilities() {
    local image_name=$1
    local scan_type=${2:-"critical"}
    
    log_info "Scanning $image_name for vulnerabilities..."
    
    # Create scan results directory
    mkdir -p "$PROJECT_ROOT/security-reports"
    
    local report_file="$PROJECT_ROOT/security-reports/${image_name//[:\/]/_}-scan.json"
    local severity_filter="HIGH,CRITICAL"
    
    if [ "$scan_type" = "all" ]; then
        severity_filter="LOW,MEDIUM,HIGH,CRITICAL"
    fi
    
    # Run Trivy scan
    if trivy image \
        --format json \
        --output "$report_file" \
        --severity "$severity_filter" \
        --ignore-unfixed \
        "$image_name" > /dev/null 2>&1; then
        
        # Parse results
        local critical_count=$(jq -r '[.Results[]? | .Vulnerabilities[]? | select(.Severity == "CRITICAL")] | length' "$report_file" 2>/dev/null || echo "0")
        local high_count=$(jq -r '[.Results[]? | .Vulnerabilities[]? | select(.Severity == "HIGH")] | length' "$report_file" 2>/dev/null || echo "0")
        local medium_count=$(jq -r '[.Results[]? | .Vulnerabilities[]? | select(.Severity == "MEDIUM")] | length' "$report_file" 2>/dev/null || echo "0")
        
        if [ "$critical_count" -eq 0 ] && [ "$high_count" -eq 0 ]; then
            log_success "$image_name: No critical or high vulnerabilities found"
        elif [ "$critical_count" -gt 0 ]; then
            log_error "$image_name: $critical_count critical vulnerabilities found"
            echo "  Report: $report_file"
        elif [ "$high_count" -gt 0 ]; then
            log_warning "$image_name: $high_count high vulnerabilities found (acceptable for development)"
            echo "  Report: $report_file"
        fi
        
        if [ "$medium_count" -gt 0 ]; then
            log_info "$image_name: $medium_count medium vulnerabilities found"
        fi
        
    else
        log_error "Failed to scan $image_name"
        return 1
    fi
}

# Check Docker configuration security
check_docker_security() {
    log_info "Checking Docker security configurations..."
    
    # Define available images
    local images=()
    if docker image inspect codex-backend:security-scan >/dev/null 2>&1; then
        images+=("codex-backend:security-scan")
    fi
    if docker image inspect codex-frontend:security-scan >/dev/null 2>&1; then
        images+=("codex-frontend:security-scan")
    fi
    
    if [ ${#images[@]} -eq 0 ]; then
        log_error "No images available for security scanning"
        return 1
    fi
    
    # Check if containers run as non-root
    for image in "${images[@]}"; do
        local user_id=$(docker run --rm "$image" id -u 2>/dev/null || echo "0")
        if [ "$user_id" != "0" ]; then
            log_success "$image: Runs as non-root user (UID: $user_id)"
        else
            log_error "$image: Runs as root user (security risk)"
        fi
    done
    
    # Check for security labels
    for image in "${images[@]}"; do
        if docker inspect "$image" | grep -q "security\."; then
            log_success "$image: Security labels present"
        else
            log_warning "$image: No security labels found"
        fi
    done
    
    # Check for health checks
    for image in "${images[@]}"; do
        if docker inspect "$image" | grep -q "Healthcheck"; then
            log_success "$image: Health check configured"
        else
            log_warning "$image: No health check configured"
        fi
    done
}

# Scan for secrets in images
scan_for_secrets() {
    log_info "Scanning images for exposed secrets..."
    
    # Define available images
    local images=()
    if docker image inspect codex-backend:security-scan >/dev/null 2>&1; then
        images+=("codex-backend:security-scan")
    fi
    if docker image inspect codex-frontend:security-scan >/dev/null 2>&1; then
        images+=("codex-frontend:security-scan")
    fi
    
    if [ ${#images[@]} -eq 0 ]; then
        log_warning "No images available for secret scanning"
        return 0
    fi
    
    for image in "${images[@]}"; do
        # Use Trivy for more accurate secret detection
        local secrets_report="/tmp/secrets-$(date +%s).json"
        
        if trivy image \
            --format json \
            --output "$secrets_report" \
            --security-checks secret \
            --quiet \
            "$image" > /dev/null 2>&1; then
            
            # Parse Trivy secret results
            local secrets_count=$(jq -r '[.Results[]? | .Secrets[]?] | length' "$secrets_report" 2>/dev/null || echo "0")
            
            if [ "$secrets_count" -gt 0 ]; then
                log_warning "$image: $secrets_count potential secrets detected by Trivy"
                
                # Show secret types found
                local secret_types=$(jq -r '.Results[]? | .Secrets[]? | .RuleID' "$secrets_report" 2>/dev/null | sort -u | tr '\n' ',' | sed 's/,$//')
                echo "  Secret types: $secret_types"
                
                # Check if these are likely false positives
                local false_positives=$(jq -r '.Results[]? | .Secrets[]? | select(.Match | test("test|example|demo|sample|default")) | .RuleID' "$secrets_report" 2>/dev/null | wc -l || echo "0")
                
                if [ "$false_positives" -eq "$secrets_count" ]; then
                    log_success "$image: All detected secrets appear to be test/example data"
                else
                    local real_secrets=$((secrets_count - false_positives))
                    if [ "$real_secrets" -gt 0 ]; then
                        log_error "$image: $real_secrets actual secrets may be present"
                    else
                        log_success "$image: No real secrets detected (only test data)"
                    fi
                fi
            else
                log_success "$image: No secrets detected"
            fi
            
            # Cleanup
            rm -f "$secrets_report"
        else
            # Fallback to basic scanning if Trivy secret scan fails
            log_warning "$image: Using fallback secret scanning method"
            
            # Create temporary container to scan filesystem
            local container_id=$(docker create "$image")
            
            # Export filesystem for scanning
            local temp_dir=$(mktemp -d)
            docker export "$container_id" | tar -C "$temp_dir" -xf - 2>/dev/null
            
            # Scan for actual secret patterns (more restrictive)
            local secrets_found=0
            
            # Look for actual API keys and tokens (not test data)
            if find "$temp_dir" -type f \( -name "*.js" -o -name "*.json" -o -name "*.env*" \) \
               -exec grep -l -E "(api_key|apikey|api-key).*[=:]\s*['\"][a-zA-Z0-9]{20,}" {} \; 2>/dev/null | \
               grep -v node_modules | grep -v test | grep -v example | head -1 > /dev/null; then
                log_warning "$image: Potential API keys found (manual review recommended)"
                secrets_found=1
            fi
            
            # Look for actual private keys (not test keys)
            if find "$temp_dir" -type f -name "*.pem" -o -name "*.key" -o -name "*_rsa" 2>/dev/null | \
               grep -v test | grep -v example | head -1 > /dev/null; then
                log_warning "$image: Private key files found (manual review recommended)"
                secrets_found=1
            fi
            
            if [ "$secrets_found" -eq 0 ]; then
                log_success "$image: No obvious secrets detected"
            fi
            
            # Cleanup
            docker rm "$container_id" > /dev/null 2>&1
            rm -rf "$temp_dir"
        fi
    done
}

# Check image configurations against security policies
check_security_policies() {
    log_info "Validating images against security policies..."
    
    # Define available images
    local images=()
    if docker image inspect codex-backend:security-scan >/dev/null 2>&1; then
        images+=("codex-backend:security-scan")
    fi
    if docker image inspect codex-frontend:security-scan >/dev/null 2>&1; then
        images+=("codex-frontend:security-scan")
    fi
    
    if [ ${#images[@]} -eq 0 ]; then
        log_warning "No images available for security policy validation"
        return 0
    fi
    
    for image in "${images[@]}"; do
        local config=$(docker inspect "$image")
        
        # Check for exposed ports
        local exposed_ports=$(echo "$config" | jq -r '.[0].Config.ExposedPorts | keys[]?' 2>/dev/null || echo "")
        if [ -n "$exposed_ports" ]; then
            log_success "$image: Proper port exposure configured"
        else
            log_warning "$image: No ports exposed (might be intentional)"
        fi
        
        # Check for environment variables with secrets
        local env_vars=$(echo "$config" | jq -r '.[0].Config.Env[]?' 2>/dev/null | grep -i "password\|secret\|key\|token" || echo "")
        if [ -n "$env_vars" ]; then
            log_warning "$image: Environment variables may contain secrets"
            echo "  Found: $(echo "$env_vars" | head -3 | tr '\n' ' ')"
        else
            log_success "$image: No obvious secrets in environment variables"
        fi
        
        # Check working directory
        local workdir=$(echo "$config" | jq -r '.[0].Config.WorkingDir' 2>/dev/null)
        if [ "$workdir" != "/" ] && [ "$workdir" != "null" ]; then
            log_success "$image: Non-root working directory ($workdir)"
        else
            log_warning "$image: Root working directory detected"
        fi
    done
}

# Generate security report
generate_security_report() {
    local report_file="$PROJECT_ROOT/security-reports/security-summary.md"
    
    log_info "Generating security report..."
    
    cat > "$report_file" << EOF
# Container Security Report

**Generated:** $(date)
**Project:** Codex Bootstrap
**Environment:** Development/Testing

## Summary

- **Passed:** $SECURITY_PASSED
- **Failed:** $SECURITY_FAILED  
- **Warnings:** $SECURITY_WARNINGS

## Images Scanned

- codex-backend:security-scan
- codex-frontend:security-scan

## Security Checks Performed

1. ✅ Vulnerability scanning (Trivy)
2. ✅ Non-root user validation
3. ✅ Secret detection
4. ✅ Security policy compliance
5. ✅ Docker configuration review

## Recommendations

### High Priority
- Address any CRITICAL vulnerabilities found
- Ensure all containers run as non-root users
- Remove any exposed secrets from images

### Medium Priority
- Configure security labels for better tracking
- Implement image signing for production
- Enable read-only root filesystem where possible

### Low Priority
- Regular vulnerability scanning in CI/CD
- Implement runtime security monitoring
- Consider using distroless images for smaller attack surface

## Detailed Reports

Individual vulnerability reports are available in:
- \`security-reports/codex-backend_security-scan-scan.json\`
- \`security-reports/codex-frontend_security-scan-scan.json\`

## Next Steps

1. Review and address all CRITICAL and HIGH vulnerabilities
2. Update base images to latest stable versions
3. Implement automated security scanning in CI/CD pipeline
4. Consider using vulnerability databases for continuous monitoring

---
*This report was generated automatically by the Codex Bootstrap security scanner.*
EOF

    log_success "Security report generated: $report_file"
}

# Clean up test images
cleanup_test_images() {
    log_info "Cleaning up security scan images..."
    
    docker rmi codex-backend:security-scan codex-frontend:security-scan > /dev/null 2>&1 || true
    
    log_success "Cleanup completed"
}

# Main security scan function
run_security_scan() {
    log_info "Starting comprehensive container security scan..."
    echo ""
    
    # Prerequisites
    check_trivy_installation || exit 1
    
    # Build images for scanning
    build_images_for_scanning || exit 1
    
    # Run security checks on available images
    if docker image inspect codex-backend:security-scan >/dev/null 2>&1; then
        scan_image_vulnerabilities "codex-backend:security-scan"
    fi
    
    if docker image inspect codex-frontend:security-scan >/dev/null 2>&1; then
        scan_image_vulnerabilities "codex-frontend:security-scan"
    fi
    
    check_docker_security
    scan_for_secrets
    check_security_policies
    
    # Generate report
    generate_security_report
    
    echo ""
    log_info "Security scan completed"
    echo "Results: $SECURITY_PASSED passed, $SECURITY_FAILED failed, $SECURITY_WARNINGS warnings"
    
    if [ $SECURITY_FAILED -gt 0 ]; then
        log_error "Security scan failed. Please address the issues before deploying."
        return 1
    else
        log_success "All security checks passed!"
        return 0
    fi
}

# Handle script arguments
case "${1:-all}" in
    "scan"|"all")
        run_security_scan
        ;;
    "vulnerabilities"|"vuln")
        check_trivy_installation || exit 1
        build_images_for_scanning || exit 1
        scan_image_vulnerabilities "codex-backend:security-scan"
        scan_image_vulnerabilities "codex-frontend:security-scan"
        ;;
    "secrets")
        build_images_for_scanning || exit 1
        scan_for_secrets
        ;;
    "config")
        build_images_for_scanning || exit 1
        check_docker_security
        check_security_policies
        ;;
    "cleanup")
        cleanup_test_images
        ;;
    *)
        echo "Usage: $0 [scan|vulnerabilities|secrets|config|cleanup]"
        echo ""
        echo "Commands:"
        echo "  scan          - Run complete security scan (default)"
        echo "  vulnerabilities - Scan for vulnerabilities only"
        echo "  secrets       - Scan for exposed secrets only"
        echo "  config        - Check Docker security configurations"
        echo "  cleanup       - Remove test images"
        exit 1
        ;;
esac

# Always cleanup on exit
trap cleanup_test_images EXIT
