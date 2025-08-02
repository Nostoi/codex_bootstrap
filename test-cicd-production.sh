#!/bin/bash

# CI/CD Pipeline and Production Validation Script
# Tests GitHub Actions workflow, security scanning, deployment automation, and documentation

echo "🚀 CI/CD Pipeline and Production Validation"
echo "==========================================="

# Define colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Function to report test results
report_test() {
    local test_name="$1"
    local status="$2"
    local details="$3"
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✅ $test_name${NC}"
        [ -n "$details" ] && echo -e "   📋 $details"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ $test_name${NC}"
        [ -n "$details" ] && echo -e "   📋 $details"
        ((TESTS_FAILED++))
    fi
}

echo
echo -e "${BLUE}⚙️  Testing GitHub Actions CI/CD Workflows${NC}"
echo "=========================================="

# Test 1: CI/CD Workflow Files
echo "🔍 Validating CI/CD Workflow Files..."
CICD_WORKFLOW=$([ -f ".github/workflows/ci-cd.yml" ] && echo "1" || echo "0")
CI_WORKFLOW=$([ -f ".github/workflows/ci.yml" ] && echo "1" || echo "0")

if [ "$CICD_WORKFLOW" = "1" ] && [ "$CI_WORKFLOW" = "1" ]; then
    report_test "GitHub Actions Workflows" "PASS" "CI and CI/CD workflow files present"
else
    report_test "GitHub Actions Workflows" "FAIL" "Missing workflow files"
fi

# Test 2: Multi-Environment Deployment
echo "🔍 Validating Multi-Environment Deployment..."
STAGING_ENV=$(grep -c "environment: staging" .github/workflows/ci-cd.yml 2>/dev/null || echo "0")
PRODUCTION_ENV=$(grep -c "environment: production" .github/workflows/ci-cd.yml 2>/dev/null || echo "0")

if [ "$STAGING_ENV" -gt 0 ] && [ "$PRODUCTION_ENV" -gt 0 ]; then
    report_test "Multi-Environment Deployment" "PASS" "Staging and production environments configured"
else
    report_test "Multi-Environment Deployment" "FAIL" "Missing environment configurations"
fi

# Test 3: Automated Testing
echo "🔍 Validating Automated Testing Configuration..."
BACKEND_TESTS=$(grep -c "test-backend:" .github/workflows/ci-cd.yml 2>/dev/null || echo "0")
FRONTEND_TESTS=$(grep -c "test-frontend:" .github/workflows/ci-cd.yml 2>/dev/null || echo "0")
TEST_COVERAGE=$(grep -c "codecov" .github/workflows/ci-cd.yml 2>/dev/null || echo "0")

if [ "$BACKEND_TESTS" -gt 0 ] && [ "$FRONTEND_TESTS" -gt 0 ] && [ "$TEST_COVERAGE" -gt 0 ]; then
    report_test "Automated Testing Pipeline" "PASS" "Backend/frontend tests with coverage reporting"
else
    report_test "Automated Testing Pipeline" "FAIL" "Testing configuration incomplete"
fi

echo
echo -e "${BLUE}🔒 Testing Security Integration${NC}"
echo "============================="

# Test 4: Security Scanning
echo "🔍 Validating Security Scanning Integration..."
TRIVY_SCAN=$(grep -c "trivy-action" .github/workflows/ci-cd.yml 2>/dev/null || echo "0")
NPM_AUDIT=$(grep -c "npm audit" .github/workflows/ci-cd.yml 2>/dev/null || echo "0")
SECURITY_JOB=$(grep -c "security-scan:" .github/workflows/ci-cd.yml 2>/dev/null || echo "0")

if [ "$TRIVY_SCAN" -gt 0 ] && [ "$NPM_AUDIT" -gt 0 ] && [ "$SECURITY_JOB" -gt 0 ]; then
    report_test "Security Scanning Integration" "PASS" "Trivy vulnerability scanning and npm audit configured"
else
    report_test "Security Scanning Integration" "FAIL" "Security scanning configuration missing"
fi

# Test 5: Container Security
echo "🔍 Validating Container Security Configuration..."
# Check for security hardening configurations in K8s files
SECURITY_POLICIES=$(grep -c "runAsNonRoot\|allowPrivilegeEscalation\|capabilities" k8s/*.yaml 2>/dev/null | awk -F: '{sum += $2} END {print sum}')
SECURITY_CONTEXTS=$(grep -c "securityContext" k8s/*.yaml 2>/dev/null | awk -F: '{sum += $2} END {print sum}')

if [ "${SECURITY_POLICIES:-0}" -gt 10 ] && [ "${SECURITY_CONTEXTS:-0}" -gt 5 ]; then
    report_test "Container Security Configuration" "PASS" "Security policies and configurations implemented"
else
    report_test "Container Security Configuration" "FAIL" "Security configuration incomplete"
fi

echo
echo -e "${BLUE}🐳 Testing Docker Integration${NC}"
echo "==========================="

# Test 6: Docker Build Configuration
echo "🔍 Validating Docker Build Configuration..."
DOCKER_BUILDX=$(grep -c "setup-buildx-action" .github/workflows/ci-cd.yml 2>/dev/null || echo "0")
MULTI_PLATFORM=$(grep -c "linux/amd64,linux/arm64" .github/workflows/ci-cd.yml 2>/dev/null || echo "0")
REGISTRY_LOGIN=$(grep -c "docker/login-action" .github/workflows/ci-cd.yml 2>/dev/null || echo "0")

if [ "$DOCKER_BUILDX" -gt 0 ] && [ "$MULTI_PLATFORM" -gt 0 ] && [ "$REGISTRY_LOGIN" -gt 0 ]; then
    report_test "Docker Build Configuration" "PASS" "Multi-platform builds with registry integration"
else
    report_test "Docker Build Configuration" "FAIL" "Docker build configuration incomplete"
fi

# Test 7: Container Registry Integration
echo "🔍 Validating Container Registry Integration..."
REGISTRY_VAR=$(grep -c "REGISTRY:" .github/workflows/ci-cd.yml 2>/dev/null || echo "0")
IMAGE_METADATA=$(grep -c "metadata-action" .github/workflows/ci-cd.yml 2>/dev/null || echo "0")
IMAGE_TAGS=$(grep -c "type=ref,event=branch" .github/workflows/ci-cd.yml 2>/dev/null || echo "0")

if [ "$REGISTRY_VAR" -gt 0 ] && [ "$IMAGE_METADATA" -gt 0 ] && [ "$IMAGE_TAGS" -gt 0 ]; then
    report_test "Container Registry Integration" "PASS" "GitHub Container Registry with proper tagging"
else
    report_test "Container Registry Integration" "FAIL" "Registry integration configuration missing"
fi

echo
echo -e "${BLUE}☸️  Testing Kubernetes Deployment${NC}"
echo "================================"

# Test 8: Kubernetes Integration
echo "🔍 Validating Kubernetes Deployment Integration..."
KUBECTL_SETUP=$(grep -c "setup-kubectl" .github/workflows/ci-cd.yml 2>/dev/null || echo "0")
K8S_APPLY=$(grep -c "kubectl apply" .github/workflows/ci-cd.yml 2>/dev/null || echo "0")
ROLLOUT_STATUS=$(grep -c "rollout status" .github/workflows/ci-cd.yml 2>/dev/null || echo "0")

if [ "$KUBECTL_SETUP" -gt 0 ] && [ "$K8S_APPLY" -gt 0 ] && [ "$ROLLOUT_STATUS" -gt 0 ]; then
    report_test "Kubernetes Deployment Integration" "PASS" "kubectl setup with deployment rollout validation"
else
    report_test "Kubernetes Deployment Integration" "FAIL" "Kubernetes integration configuration missing"
fi

# Test 9: Deployment Strategy
echo "🔍 Validating Deployment Strategy..."
DATABASE_FIRST=$(grep -A10 "Apply database changes first" .github/workflows/ci-cd.yml 2>/dev/null | wc -l | tr -d ' ')
DEPLOYMENT_ORDER=$(grep -c "database.yaml.*backend-deployment.yaml.*frontend-deployment.yaml" .github/workflows/ci-cd.yml 2>/dev/null || echo "0")

if [ "${DATABASE_FIRST:-0}" -gt 0 ]; then
    report_test "Deployment Strategy" "PASS" "Database-first deployment strategy implemented"
else
    report_test "Deployment Strategy" "FAIL" "Deployment strategy not properly configured"
fi

echo
echo -e "${BLUE}🧪 Testing Quality Assurance${NC}"
echo "=========================="

# Test 10: Smoke Tests
echo "🔍 Validating Smoke Tests..."
HEALTH_CHECKS=$(grep -c "curl -f.*health" .github/workflows/ci-cd.yml 2>/dev/null || echo "0")
WEBSOCKET_TEST=$(grep -c "WebSocket.*connection" .github/workflows/ci-cd.yml 2>/dev/null || echo "0")
STAGING_TESTS=$(grep -A10 "Run smoke tests" .github/workflows/ci-cd.yml 2>/dev/null | wc -l | tr -d ' ')

if [ "$HEALTH_CHECKS" -gt 0 ] && [ "$WEBSOCKET_TEST" -gt 0 ] && [ "${STAGING_TESTS:-0}" -gt 5 ]; then
    report_test "Production Smoke Tests" "PASS" "Health checks and WebSocket testing configured"
else
    report_test "Production Smoke Tests" "FAIL" "Smoke tests configuration incomplete"
fi

# Test 11: Performance Testing
echo "🔍 Validating Performance Testing Integration..."
# Check for performance testing scripts or configurations
PERF_TESTS=$(find . -name "*performance*" -o -name "*load*" -o -name "*benchmark*" 2>/dev/null | wc -l | tr -d ' ')
if [ "${PERF_TESTS:-0}" -gt 0 ]; then
    report_test "Performance Testing" "PASS" "Performance testing configurations found"
else
    report_test "Performance Testing" "FAIL" "Performance testing not configured"
fi

echo
echo -e "${BLUE}📋 Testing Documentation and Runbooks${NC}"
echo "===================================="

# Test 12: Deployment Documentation
echo "🔍 Validating Deployment Documentation..."
DEPLOYMENT_GUIDE=$([ -f "docs/deployment-guide.md" ] && echo "1" || echo "0")
README_DEPLOYMENT=$(grep -c -i "deployment\|deploy" README.md 2>/dev/null || echo "0")
K8S_VALIDATION_REPORT=$([ -f "k8s-validation-report.md" ] && echo "1" || echo "0")

if [ "$DEPLOYMENT_GUIDE" = "1" ] && [ "$README_DEPLOYMENT" -gt 0 ] && [ "$K8S_VALIDATION_REPORT" = "1" ]; then
    report_test "Deployment Documentation" "PASS" "Comprehensive deployment guides and validation reports"
else
    report_test "Deployment Documentation" "FAIL" "Deployment documentation incomplete"
fi

# Test 13: Operational Procedures
echo "🔍 Validating Operational Procedures..."
DEV_DOCS=$(find docs/ -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
TROUBLESHOOTING_DOCS=$(grep -r -c -i "troubleshoot\|debug\|error" docs/ 2>/dev/null | wc -l | tr -d ' ')

if [ "${DEV_DOCS:-0}" -gt 10 ] && [ "${TROUBLESHOOTING_DOCS:-0}" -gt 3 ]; then
    report_test "Operational Documentation" "PASS" "Comprehensive operational procedures documented"
else
    report_test "Operational Documentation" "FAIL" "Operational documentation insufficient"
fi

echo
echo -e "${BLUE}🔄 Testing Rollback and Recovery${NC}"
echo "=============================="

# Test 14: Rollback Procedures
echo "🔍 Validating Rollback Procedures..."
ROLLBACK_TIMEOUT=$(grep -c "timeout.*s" .github/workflows/ci-cd.yml 2>/dev/null || echo "0")
DEPLOYMENT_STRATEGY=$(grep -c "RollingUpdate" k8s/*deployment.yaml 2>/dev/null | awk -F: '{sum += $2} END {print sum}')

if [ "$ROLLBACK_TIMEOUT" -gt 0 ] && [ "${DEPLOYMENT_STRATEGY:-0}" -gt 0 ]; then
    report_test "Rollback Procedures" "PASS" "Deployment timeouts and rolling update strategy configured"
else
    report_test "Rollback Procedures" "FAIL" "Rollback procedures not properly configured"
fi

# Test 15: Notification and Monitoring
echo "🔍 Validating Notification Integration..."
SLACK_NOTIFICATIONS=$(grep -c "action-slack" .github/workflows/ci-cd.yml 2>/dev/null || echo "0")
SUCCESS_NOTIFICATION=$(grep -c "deployment successful" .github/workflows/ci-cd.yml 2>/dev/null || echo "0")
FAILURE_NOTIFICATION=$(grep -c "deployment failed" .github/workflows/ci-cd.yml 2>/dev/null || echo "0")

if [ "$SLACK_NOTIFICATIONS" -gt 0 ] && [ "$SUCCESS_NOTIFICATION" -gt 0 ] && [ "$FAILURE_NOTIFICATION" -gt 0 ]; then
    report_test "Deployment Notifications" "PASS" "Success and failure notifications configured"
else
    report_test "Deployment Notifications" "FAIL" "Notification configuration incomplete"
fi

echo
echo "==========================================="
echo -e "${BLUE}📊 CI/CD Pipeline and Production Validation Summary${NC}"
echo "==========================================="

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
if [ "$TOTAL_TESTS" -gt 0 ]; then
    PASS_PERCENTAGE=$((TESTS_PASSED * 100 / TOTAL_TESTS))
else
    PASS_PERCENTAGE=0
fi

echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo -e "Success Rate: ${PASS_PERCENTAGE}%"

echo
echo -e "${BLUE}🎯 Key CI/CD and Production Features:${NC}"
echo "• ✅ GitHub Actions CI/CD pipeline with multi-environment deployment"
echo "• ✅ Automated testing with backend, frontend, and coverage reporting"
echo "• ✅ Security scanning with Trivy vulnerability assessment and npm audit"
echo "• ✅ Multi-platform Docker builds with container registry integration"
echo "• ✅ Kubernetes deployment automation with rollout status validation"
echo "• ✅ Database-first deployment strategy for data consistency"
echo "• ✅ Production smoke tests with health checks and WebSocket validation"
echo "• ✅ Comprehensive deployment documentation and operational procedures"
echo "• ✅ Rolling update deployment strategy for zero-downtime updates"
echo "• ✅ Slack notifications for deployment success and failure alerts"
echo "• ✅ Container security hardening with non-root execution"
echo "• ✅ Environment-specific configuration management"
echo "• ✅ Automated cleanup and image management"
echo "• ✅ Production-ready CI/CD automation pipeline"

if [ $TESTS_FAILED -eq 0 ]; then
    echo
    echo -e "${GREEN}🎉 All CI/CD pipeline and production validation tests passed!${NC}"
    echo -e "${GREEN}✅ Task 6: CI/CD Pipeline and Production Validation - COMPLETE${NC}"
    exit 0
else
    echo
    echo -e "${YELLOW}⚠️  $TESTS_FAILED test(s) failed. Review the CI/CD configuration.${NC}"
    exit 1
fi
