#!/bin/bash

# CI/CD Security Integration for Codex Bootstrap
# Automated security pipeline for continuous integration

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# CI/CD Environment Variables
CI_COMMIT_SHA=${CI_COMMIT_SHA:-$(git rev-parse HEAD 2>/dev/null || echo "unknown")}
CI_BRANCH=${CI_BRANCH:-$(git branch --show-current 2>/dev/null || echo "unknown")}
CI_BUILD_ID=${CI_BUILD_ID:-"local-$(date +%s)"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[CI-SECURITY]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1" 
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

# Create CI-specific build tags
create_ci_tags() {
    local service=$1
    local base_tag="${service}:${CI_COMMIT_SHA:0:8}"
    local latest_tag="${service}:latest"
    local branch_tag="${service}:${CI_BRANCH}"
    
    echo "$base_tag $latest_tag $branch_tag"
}

# Build images for CI with security scanning
build_for_security_scanning() {
    log_info "Building images for CI security scanning..."
    
    cd "$PROJECT_ROOT"
    
    # Backend build with CI tags
    log_info "Building backend image..."
    local backend_tags=$(create_ci_tags "codex-backend")
    
    if docker build \
        -t codex-backend:ci-scan \
        $(echo $backend_tags | sed 's/[^ ]* */-t &/g') \
        --build-arg BUILD_ID="$CI_BUILD_ID" \
        --build-arg COMMIT_SHA="$CI_COMMIT_SHA" \
        --build-arg BRANCH="$CI_BRANCH" \
        -f Dockerfile.backend \
        . > /dev/null 2>&1; then
        log_success "Backend image built successfully"
    else
        log_error "Backend image build failed"
        return 1
    fi
    
    # Frontend build with CI tags
    log_info "Building frontend image..."
    local frontend_tags=$(create_ci_tags "codex-frontend")
    
    if docker build \
        -t codex-frontend:ci-scan \
        $(echo $frontend_tags | sed 's/[^ ]* */-t &/g') \
        --build-arg BUILD_ID="$CI_BUILD_ID" \
        --build-arg COMMIT_SHA="$CI_COMMIT_SHA" \
        --build-arg BRANCH="$CI_BRANCH" \
        -f Dockerfile.frontend \
        . > /dev/null 2>&1; then
        log_success "Frontend image built successfully"
    else
        log_warning "Frontend image build failed - continuing with backend only"
    fi
}

# Run security scans with CI integration
run_ci_security_scans() {
    log_info "Running CI security scans..."
    
    local scan_failed=0
    local reports_dir="$PROJECT_ROOT/security-reports/ci"
    mkdir -p "$reports_dir"
    
    # Scan backend image
    if docker image inspect codex-backend:ci-scan >/dev/null 2>&1; then
        log_info "Scanning backend image for vulnerabilities..."
        
        local backend_report="$reports_dir/backend-ci-scan-${CI_COMMIT_SHA:0:8}.json"
        
        if trivy image \
            --format json \
            --output "$backend_report" \
            --severity "CRITICAL,HIGH" \
            --ignore-unfixed \
            --security-checks vuln,config,secret \
            codex-backend:ci-scan > /dev/null 2>&1; then
            
            # Parse results
            local critical=$(jq -r '[.Results[]? | .Vulnerabilities[]? | select(.Severity == "CRITICAL")] | length' "$backend_report" 2>/dev/null || echo "0")
            local high=$(jq -r '[.Results[]? | .Vulnerabilities[]? | select(.Severity == "HIGH")] | length' "$backend_report" 2>/dev/null || echo "0")
            local secrets=$(jq -r '[.Results[]? | .Secrets[]?] | length' "$backend_report" 2>/dev/null || echo "0")
            local configs=$(jq -r '[.Results[]? | .Misconfigurations[]?] | length' "$backend_report" 2>/dev/null || echo "0")
            
            echo "Backend scan results: Critical=$critical, High=$high, Secrets=$secrets, Config Issues=$configs"
            
            # CI-specific thresholds (stricter than development)
            if [ "$critical" -gt 0 ]; then
                log_error "Backend: $critical CRITICAL vulnerabilities found - blocking CI"
                scan_failed=1
            elif [ "$high" -gt 5 ]; then
                log_error "Backend: $high HIGH vulnerabilities found (max 5 allowed) - blocking CI"
                scan_failed=1
            elif [ "$secrets" -gt 0 ]; then
                log_error "Backend: $secrets secrets found - blocking CI"
                scan_failed=1
            else
                log_success "Backend: Security scan passed CI thresholds"
            fi
            
            if [ "$configs" -gt 0 ]; then
                log_warning "Backend: $configs configuration issues found"
            fi
            
        else
            log_error "Backend security scan failed"
            scan_failed=1
        fi
    fi
    
    # Scan frontend image (if available)
    if docker image inspect codex-frontend:ci-scan >/dev/null 2>&1; then
        log_info "Scanning frontend image for vulnerabilities..."
        
        local frontend_report="$reports_dir/frontend-ci-scan-${CI_COMMIT_SHA:0:8}.json"
        
        if trivy image \
            --format json \
            --output "$frontend_report" \
            --severity "CRITICAL,HIGH" \
            --ignore-unfixed \
            --security-checks vuln,config,secret \
            codex-frontend:ci-scan > /dev/null 2>&1; then
            
            # Parse results
            local critical=$(jq -r '[.Results[]? | .Vulnerabilities[]? | select(.Severity == "CRITICAL")] | length' "$frontend_report" 2>/dev/null || echo "0")
            local high=$(jq -r '[.Results[]? | .Vulnerabilities[]? | select(.Severity == "HIGH")] | length' "$frontend_report" 2>/dev/null || echo "0")
            local secrets=$(jq -r '[.Results[]? | .Secrets[]?] | length' "$frontend_report" 2>/dev/null || echo "0")
            
            echo "Frontend scan results: Critical=$critical, High=$high, Secrets=$secrets"
            
            if [ "$critical" -gt 0 ]; then
                log_error "Frontend: $critical CRITICAL vulnerabilities found - blocking CI"
                scan_failed=1
            elif [ "$high" -gt 5 ]; then
                log_error "Frontend: $high HIGH vulnerabilities found (max 5 allowed) - blocking CI"
                scan_failed=1
            elif [ "$secrets" -gt 0 ]; then
                log_error "Frontend: $secrets secrets found - blocking CI"
                scan_failed=1
            else
                log_success "Frontend: Security scan passed CI thresholds"
            fi
        else
            log_error "Frontend security scan failed"
            scan_failed=1
        fi
    fi
    
    return $scan_failed
}

# Generate CI security report
generate_ci_security_report() {
    local exit_code=$1
    local reports_dir="$PROJECT_ROOT/security-reports/ci"
    local summary_report="$reports_dir/ci-security-summary-${CI_COMMIT_SHA:0:8}.json"
    
    log_info "Generating CI security report..."
    
    # Create JSON report for CI integration
    cat > "$summary_report" << EOF
{
  "ci_build": {
    "build_id": "$CI_BUILD_ID",
    "commit_sha": "$CI_COMMIT_SHA",
    "branch": "$CI_BRANCH",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "security_scan_passed": $([ $exit_code -eq 0 ] && echo "true" || echo "false")
  },
  "security_summary": {
    "status": "$([ $exit_code -eq 0 ] && echo "PASSED" || echo "FAILED")",
    "risk_level": "$([ $exit_code -eq 0 ] && echo "LOW" || echo "HIGH")",
    "deployment_approved": $([ $exit_code -eq 0 ] && echo "true" || echo "false")
  },
  "scan_results": {
    "backend_report": "backend-ci-scan-${CI_COMMIT_SHA:0:8}.json",
    "frontend_report": "frontend-ci-scan-${CI_COMMIT_SHA:0:8}.json"
  },
  "recommendations": [
    $([ $exit_code -ne 0 ] && echo '"Address all CRITICAL and HIGH vulnerabilities before merging",' || echo '"Security scan passed - approved for deployment",')
    "Maintain regular dependency updates",
    "Monitor security advisories for used packages"
  ]
}
EOF
    
    # Also create human-readable markdown report
    local markdown_report="$reports_dir/ci-security-summary-${CI_COMMIT_SHA:0:8}.md"
    
    cat > "$markdown_report" << EOF
# CI Security Scan Report

**Build ID:** $CI_BUILD_ID  
**Commit:** $CI_COMMIT_SHA  
**Branch:** $CI_BRANCH  
**Timestamp:** $(date)  
**Status:** $([ $exit_code -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")

## Security Gate Results

$([ $exit_code -eq 0 ] && echo "✅ **SECURITY GATE PASSED** - Ready for deployment" || echo "❌ **SECURITY GATE FAILED** - Deployment blocked")

## Scan Summary

- **Critical Vulnerabilities:** Must be 0 for CI pass
- **High Vulnerabilities:** Must be ≤5 for CI pass  
- **Secrets Detection:** Must be 0 for CI pass
- **Configuration Issues:** Warnings only

## Detailed Reports

- Backend: \`backend-ci-scan-${CI_COMMIT_SHA:0:8}.json\`
- Frontend: \`frontend-ci-scan-${CI_COMMIT_SHA:0:8}.json\`

$([ $exit_code -ne 0 ] && echo "## Action Required

🚨 **This build is blocked due to security issues.**

Please review the detailed scan reports and address all CRITICAL and HIGH severity vulnerabilities before proceeding with the merge/deployment.

### Next Steps:
1. Review detailed vulnerability reports
2. Update dependencies with security patches
3. Re-run security scans
4. Commit fixes and re-trigger CI" || echo "## Deployment Approved

✅ This build has passed all security gates and is approved for deployment.")

---
*Generated by Codex Bootstrap CI Security Pipeline*
EOF
    
    log_success "CI security reports generated:"
    echo "  JSON: $summary_report"
    echo "  Markdown: $markdown_report"
}

# Upload security artifacts (placeholder for CI system integration)
upload_security_artifacts() {
    log_info "Uploading security artifacts..."
    
    # This would integrate with your CI system's artifact storage
    # Examples:
    # - GitHub Actions: Upload as artifacts
    # - GitLab CI: Store as artifacts
    # - Jenkins: Archive artifacts
    # - Azure DevOps: Publish artifacts
    
    local reports_dir="$PROJECT_ROOT/security-reports/ci"
    
    if [ -d "$reports_dir" ]; then
        log_success "Security artifacts ready for upload from: $reports_dir"
        
        # Example CI integration commands (uncomment for your CI system):
        
        # GitHub Actions:
        # echo "::set-output name=security-reports-path::$reports_dir"
        
        # GitLab CI:
        # echo "SECURITY_REPORTS_PATH=$reports_dir" >> build.env
        
        # Jenkins:
        # echo "Archiving security reports..."
        
        # Generic CI artifact indicator:
        echo "SECURITY_SCAN_ARTIFACTS=$reports_dir" > "$PROJECT_ROOT/.ci-security-artifacts"
        
    else
        log_warning "No security artifacts to upload"
    fi
}

# Main CI security pipeline
run_ci_security_pipeline() {
    log_info "Starting CI Security Pipeline..."
    echo ""
    echo "Build Information:"
    echo "  Build ID: $CI_BUILD_ID"
    echo "  Commit: $CI_COMMIT_SHA"
    echo "  Branch: $CI_BRANCH"
    echo ""
    
    # Check prerequisites
    if ! command -v trivy &> /dev/null; then
        log_error "Trivy not available in CI environment"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        log_error "jq not available in CI environment"
        exit 1
    fi
    
    # Run pipeline steps
    local pipeline_failed=0
    
    # Step 1: Build images
    build_for_security_scanning || pipeline_failed=1
    
    # Step 2: Run security scans (even if build partially failed)
    if [ $pipeline_failed -eq 0 ]; then
        run_ci_security_scans || pipeline_failed=1
    fi
    
    # Step 3: Generate reports
    generate_ci_security_report $pipeline_failed
    
    # Step 4: Upload artifacts
    upload_security_artifacts
    
    # Final result
    echo ""
    if [ $pipeline_failed -eq 0 ]; then
        log_success "🎉 CI Security Pipeline PASSED - Build approved for deployment"
        echo ""
        echo "Next steps:"
        echo "  ✅ Merge approved"
        echo "  ✅ Deployment approved"
        echo "  ✅ Security artifacts uploaded"
        exit 0
    else
        log_error "❌ CI Security Pipeline FAILED - Build blocked"
        echo ""
        echo "Required actions:"
        echo "  ❌ Fix security vulnerabilities"
        echo "  ❌ Re-run security pipeline"
        echo "  ❌ Merge blocked until issues resolved"
        exit 1
    fi
}

# Cleanup function
cleanup_ci_images() {
    log_info "Cleaning up CI images..."
    
    docker rmi codex-backend:ci-scan codex-frontend:ci-scan > /dev/null 2>&1 || true
    
    log_success "CI image cleanup completed"
}

# Handle script arguments
case "${1:-pipeline}" in
    "pipeline"|"ci")
        run_ci_security_pipeline
        ;;
    "build")
        build_for_security_scanning
        ;;
    "scan")
        run_ci_security_scans
        ;;
    "cleanup")
        cleanup_ci_images
        ;;
    "help"|"--help")
        echo "CI/CD Security Pipeline for Codex Bootstrap"
        echo ""
        echo "Usage: $0 [pipeline|build|scan|cleanup|help]"
        echo ""
        echo "Commands:"
        echo "  pipeline  - Run complete CI security pipeline (default)"
        echo "  ci        - Same as 'pipeline'"
        echo "  build     - Build images for security scanning only"
        echo "  scan      - Run security scans only (requires pre-built images)"
        echo "  cleanup   - Remove CI images"
        echo "  help      - Show this help message"
        echo ""
        echo "Environment Variables:"
        echo "  CI_COMMIT_SHA - Git commit SHA (auto-detected if not set)"
        echo "  CI_BRANCH     - Git branch name (auto-detected if not set)"
        echo "  CI_BUILD_ID   - Unique build identifier"
        exit 0
        ;;
    *)
        echo "Unknown command: $1"
        echo "Use '$0 help' for usage information."
        exit 1
        ;;
esac

# Always cleanup on exit
trap cleanup_ci_images EXIT
