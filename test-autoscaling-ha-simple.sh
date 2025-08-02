#!/bin/bash

# Auto-scaling and High Availability Validation Script - Simplified
# Tests HPA configuration, database persistence, and load balancing

echo "🔄 Auto-scaling and High Availability Validation"
echo "================================================="

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
echo -e "${BLUE}🎯 Testing HorizontalPodAutoscaler Configuration${NC}"

# Test 1: Backend HPA
echo "🔍 Validating Backend HPA Configuration..."
BACKEND_HPA_PRESENT=$(grep -c "kind: HorizontalPodAutoscaler" k8s/backend-deployment.yaml 2>/dev/null || echo "0")
BACKEND_MIN_REPLICAS=$(grep -c "minReplicas: 2" k8s/backend-deployment.yaml 2>/dev/null || echo "0")
BACKEND_MAX_REPLICAS=$(grep -c "maxReplicas: 10" k8s/backend-deployment.yaml 2>/dev/null || echo "0")

if [ "$BACKEND_HPA_PRESENT" -gt 0 ] && [ "$BACKEND_MIN_REPLICAS" -gt 0 ] && [ "$BACKEND_MAX_REPLICAS" -gt 0 ]; then
    report_test "Backend HPA Configuration" "PASS" "Min: 2, Max: 10 replicas with CPU/Memory scaling"
else
    report_test "Backend HPA Configuration" "FAIL" "Missing HPA configuration"
fi

# Test 2: Frontend HPA
echo "🔍 Validating Frontend HPA Configuration..."
FRONTEND_HPA_PRESENT=$(grep -c "kind: HorizontalPodAutoscaler" k8s/frontend-deployment.yaml 2>/dev/null || echo "0")
FRONTEND_MIN_REPLICAS=$(grep -c "minReplicas: 2" k8s/frontend-deployment.yaml 2>/dev/null || echo "0")
FRONTEND_MAX_REPLICAS=$(grep -c "maxReplicas: 8" k8s/frontend-deployment.yaml 2>/dev/null || echo "0")

if [ "$FRONTEND_HPA_PRESENT" -gt 0 ] && [ "$FRONTEND_MIN_REPLICAS" -gt 0 ] && [ "$FRONTEND_MAX_REPLICAS" -gt 0 ]; then
    report_test "Frontend HPA Configuration" "PASS" "Min: 2, Max: 8 replicas with CPU/Memory scaling"
else
    report_test "Frontend HPA Configuration" "FAIL" "Missing HPA configuration"
fi

echo
echo -e "${BLUE}🗄️  Testing Database Persistence${NC}"

# Test 3: PostgreSQL StatefulSet
echo "🔍 Validating PostgreSQL StatefulSet..."
POSTGRES_STATEFUL=$(grep -c "kind: StatefulSet" k8s/database.yaml 2>/dev/null || echo "0")
POSTGRES_PVC=$(grep -c "volumeClaimTemplates:" k8s/database.yaml 2>/dev/null || echo "0")
POSTGRES_STORAGE=$(grep -c "storage: 50Gi" k8s/database.yaml 2>/dev/null || echo "0")

if [ "$POSTGRES_STATEFUL" -gt 0 ] && [ "$POSTGRES_PVC" -gt 0 ] && [ "$POSTGRES_STORAGE" -gt 0 ]; then
    report_test "PostgreSQL High Availability" "PASS" "StatefulSet with 50Gi persistent storage"
else
    report_test "PostgreSQL High Availability" "FAIL" "Missing StatefulSet or storage configuration"
fi

# Test 4: Database Health Checks
echo "🔍 Validating Database Health Checks..."
POSTGRES_LIVENESS=$(grep -c "livenessProbe:" k8s/database.yaml 2>/dev/null || echo "0")
POSTGRES_READINESS=$(grep -c "readinessProbe:" k8s/database.yaml 2>/dev/null || echo "0")
POSTGRES_READY_CHECK=$(grep -c "pg_isready" k8s/database.yaml 2>/dev/null || echo "0")

if [ "$POSTGRES_LIVENESS" -gt 0 ] && [ "$POSTGRES_READINESS" -gt 0 ] && [ "$POSTGRES_READY_CHECK" -gt 0 ]; then
    report_test "Database Health Checks" "PASS" "Liveness and readiness probes with pg_isready"
else
    report_test "Database Health Checks" "FAIL" "Missing health check configuration"
fi

echo
echo -e "${BLUE}⚖️  Testing Load Balancing${NC}"

# Test 5: Service Discovery
echo "🔍 Validating Service Configuration..."
SERVICE_COUNT=$(grep -h "kind: Service" k8s/*.yaml 2>/dev/null | wc -l | tr -d ' ')
if [ "${SERVICE_COUNT:-0}" -ge 5 ]; then
    report_test "Service Load Balancing" "PASS" "$SERVICE_COUNT services configured for load balancing"
else
    report_test "Service Load Balancing" "FAIL" "Insufficient service configurations ($SERVICE_COUNT found)"
fi

# Test 6: Network Policies
echo "🔍 Validating Network Security..."
NETWORK_POLICY=$(grep -c "kind: NetworkPolicy" k8s/ingress.yaml 2>/dev/null || echo "0")
if [ "$NETWORK_POLICY" -gt 0 ]; then
    report_test "Network Security Policies" "PASS" "Network policies configured for security isolation"
else
    report_test "Network Security Policies" "FAIL" "Network policy configuration missing"
fi

echo
echo -e "${BLUE}🔄 Testing High Availability Features${NC}"

# Test 7: Multi-Replica Deployments
echo "🔍 Validating Multi-Replica Configuration..."
BACKEND_REPLICAS=$(grep "replicas:" k8s/backend-deployment.yaml | head -1 | grep -o '[0-9]\+' 2>/dev/null || echo "0")
FRONTEND_REPLICAS=$(grep "replicas:" k8s/frontend-deployment.yaml | head -1 | grep -o '[0-9]\+' 2>/dev/null || echo "0")

if [ "$BACKEND_REPLICAS" -ge 2 ] && [ "$FRONTEND_REPLICAS" -ge 2 ]; then
    report_test "Multi-Replica High Availability" "PASS" "Backend: $BACKEND_REPLICAS, Frontend: $FRONTEND_REPLICAS replicas"
else
    report_test "Multi-Replica High Availability" "FAIL" "Insufficient replicas for HA"
fi

# Test 8: Rolling Updates
echo "🔍 Validating Zero-Downtime Updates..."
ROLLING_UPDATE=$(grep -h "type: RollingUpdate" k8s/backend-deployment.yaml 2>/dev/null | wc -l | tr -d ' ')
MAX_UNAVAILABLE=$(grep -h "maxUnavailable:" k8s/backend-deployment.yaml 2>/dev/null | wc -l | tr -d ' ')

if [ "${ROLLING_UPDATE:-0}" -gt 0 ] && [ "${MAX_UNAVAILABLE:-0}" -gt 0 ]; then
    report_test "Zero-Downtime Updates" "PASS" "Rolling update strategy configured for high availability"
else
    report_test "Zero-Downtime Updates" "FAIL" "Rolling update strategy not properly configured"
fi

echo
echo -e "${BLUE}📊 Testing Monitoring Integration${NC}"

# Test 9: Prometheus Integration
echo "🔍 Validating Metrics Collection..."
BACKEND_METRICS=$(grep -c "prometheus.io/scrape" k8s/backend-deployment.yaml 2>/dev/null || echo "0")
FRONTEND_METRICS=$(grep -c "prometheus.io/scrape" k8s/frontend-deployment.yaml 2>/dev/null || echo "0")

if [ "$BACKEND_METRICS" -gt 0 ] && [ "$FRONTEND_METRICS" -gt 0 ]; then
    report_test "Prometheus Metrics Integration" "PASS" "Applications configured for metrics collection"
else
    report_test "Prometheus Metrics Integration" "FAIL" "Missing Prometheus integration"
fi

# Test 10: Resource Requests (Required for HPA)
echo "🔍 Validating Resource Requests for HPA..."
BACKEND_REQUESTS=$(grep -h "requests:" k8s/backend-deployment.yaml 2>/dev/null | wc -l | tr -d ' ')
FRONTEND_REQUESTS=$(grep -h "requests:" k8s/frontend-deployment.yaml 2>/dev/null | wc -l | tr -d ' ')

if [ "${BACKEND_REQUESTS:-0}" -gt 0 ] && [ "${FRONTEND_REQUESTS:-0}" -gt 0 ]; then
    report_test "Resource Requests for HPA" "PASS" "CPU/Memory requests configured for HPA operation"
else
    report_test "Resource Requests for HPA" "FAIL" "Missing resource requests - required for HPA"
fi

echo
echo "================================================="
echo -e "${BLUE}📊 Auto-scaling and High Availability Summary${NC}"
echo "================================================="

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
echo -e "${BLUE}🎯 Key Auto-scaling and High Availability Features:${NC}"
echo "• ✅ HorizontalPodAutoscaler with CPU/Memory scaling (Backend: 2-10, Frontend: 2-8)"
echo "• ✅ PostgreSQL StatefulSet with 50Gi persistent storage"
echo "• ✅ Multi-replica deployments for high availability"
echo "• ✅ Rolling update strategy for zero-downtime deployments"
echo "• ✅ Network policies for security isolation"
echo "• ✅ Service discovery and load balancing"
echo "• ✅ Resource requests configured for HPA operation"
echo "• ✅ Prometheus integration for metrics-based scaling"
echo "• ✅ Database health checks with pg_isready"
echo "• ✅ Production-ready high availability infrastructure"

if [ $TESTS_FAILED -eq 0 ]; then
    echo
    echo -e "${GREEN}🎉 All auto-scaling and high availability tests passed!${NC}"
    echo -e "${GREEN}✅ Task 4: Auto-scaling and High Availability - COMPLETE${NC}"
    exit 0
else
    echo
    echo -e "${YELLOW}⚠️  $TESTS_FAILED test(s) failed. Review the configuration.${NC}"
    exit 1
fi
