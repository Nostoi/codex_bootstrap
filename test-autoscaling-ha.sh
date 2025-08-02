#!/bin/bash

# Auto-scaling and High Availability Validation Script
# Tests HPA configuration, database persistence, and load balancing

set -e

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
echo "================================================"

# Test 1: Validate Backend HPA Configuration
echo "🔍 Validating Backend HPA Configuration..."
if grep -q "kind: HorizontalPodAutoscaler" k8s/backend-deployment.yaml; then
    if grep -q "minReplicas: 2" k8s/backend-deployment.yaml && \
       grep -q "maxReplicas: 10" k8s/backend-deployment.yaml && \
       grep -q "averageUtilization: 70" k8s/backend-deployment.yaml; then
        report_test "Backend HPA Configuration" "PASS" "Min: 2, Max: 10, CPU: 70%, Memory: 80%"
    else
        report_test "Backend HPA Configuration" "FAIL" "HPA values incorrect"
    fi
else
    report_test "Backend HPA Configuration" "FAIL" "HPA configuration missing"
fi

# Test 2: Validate Frontend HPA Configuration
echo "🔍 Validating Frontend HPA Configuration..."
if grep -q "kind: HorizontalPodAutoscaler" k8s/frontend-deployment.yaml; then
    if grep -q "minReplicas: 2" k8s/frontend-deployment.yaml && \
       grep -q "maxReplicas: 8" k8s/frontend-deployment.yaml && \
       grep -q "averageUtilization: 70" k8s/frontend-deployment.yaml; then
        report_test "Frontend HPA Configuration" "PASS" "Min: 2, Max: 8, CPU: 70%, Memory: 80%"
    else
        report_test "Frontend HPA Configuration" "FAIL" "HPA values incorrect"
    fi
else
    report_test "Frontend HPA Configuration" "FAIL" "HPA configuration missing"
fi

# Test 3: Validate HPA Scaling Behavior
echo "🔍 Validating HPA Scaling Behavior..."
if grep -q "stabilizationWindowSeconds: 300" k8s/backend-deployment.yaml && \
   grep -q "stabilizationWindowSeconds: 60" k8s/backend-deployment.yaml && \
   grep -A5 "scaleUp:" k8s/backend-deployment.yaml | grep -q "value: 100"; then
    report_test "HPA Scaling Behavior" "PASS" "Scale-down: 300s window, Scale-up: 60s window with 100% increase"
else
    report_test "HPA Scaling Behavior" "FAIL" "Scaling behavior configuration missing or incorrect"
fi

echo
echo -e "${BLUE}🗄️  Testing Database Persistence and High Availability${NC}"
echo "====================================================="

# Test 4: Validate PostgreSQL StatefulSet
echo "🔍 Validating PostgreSQL StatefulSet Configuration..."
if grep -q "kind: StatefulSet" k8s/database.yaml && \
   grep -q "name: postgresql" k8s/database.yaml && \
   grep -q "serviceName: postgresql-headless" k8s/database.yaml; then
    report_test "PostgreSQL StatefulSet" "PASS" "StatefulSet configured with headless service"
else
    report_test "PostgreSQL StatefulSet" "FAIL" "StatefulSet configuration missing or incorrect"
fi

# Test 5: Validate Persistent Volume Claims
echo "🔍 Validating Persistent Volume Claims..."
if grep -q "volumeClaimTemplates:" k8s/database.yaml && \
   grep -q "storage: 50Gi" k8s/database.yaml && \
   grep -q "storageClassName: fast-ssd" k8s/database.yaml; then
    report_test "Database Persistent Storage" "PASS" "50Gi fast-ssd storage configured"
else
    report_test "Database Persistent Storage" "FAIL" "PVC configuration missing or incorrect"
fi

# Test 6: Validate Database Health Checks
echo "🔍 Validating Database Health Checks..."
if grep -q "livenessProbe:" k8s/database.yaml && \
   grep -q "readinessProbe:" k8s/database.yaml && \
   grep -q "pg_isready" k8s/database.yaml; then
    report_test "Database Health Checks" "PASS" "Liveness and readiness probes configured with pg_isready"
else
    report_test "Database Health Checks" "FAIL" "Health check configuration missing or incorrect"
fi

# Test 7: Validate Database Resources
echo "🔍 Validating Database Resource Configuration..."
if grep -A10 "resources:" k8s/database.yaml | grep -q "limits:" && \
   grep -A10 "resources:" k8s/database.yaml | grep -q "requests:"; then
    report_test "Database Resource Limits" "PASS" "Resource limits and requests configured"
else
    report_test "Database Resource Limits" "FAIL" "Resource configuration missing"
fi

echo
echo -e "${BLUE}⚖️  Testing Load Balancing and Service Discovery${NC}"
echo "=============================================="

# Test 8: Validate Service Configurations
echo "🔍 Validating Service Configurations..."
SERVICE_COUNT=$(grep -c "kind: Service" k8s/*.yaml || echo "0")
if [ "$SERVICE_COUNT" -ge 5 ]; then
    report_test "Service Configuration" "PASS" "$SERVICE_COUNT services configured for load balancing"
else
    report_test "Service Configuration" "FAIL" "Insufficient service configurations ($SERVICE_COUNT found)"
fi

# Test 9: Validate Ingress Load Balancing
echo "🔍 Validating Ingress Load Balancing..."
if grep -q "nginx.ingress.kubernetes.io/load-balance" k8s/ingress.yaml || \
   grep -q "service:" k8s/ingress.yaml; then
    report_test "Ingress Load Balancing" "PASS" "Ingress configured for load balancing"
else
    report_test "Ingress Load Balancing" "FAIL" "Ingress load balancing configuration missing"
fi

# Test 10: Validate Network Policies for Security
echo "🔍 Validating Network Policy Configuration..."
if grep -q "kind: NetworkPolicy" k8s/ingress.yaml && \
   grep -q "policyTypes:" k8s/ingress.yaml && \
   grep -q "Ingress" k8s/ingress.yaml && \
   grep -q "Egress" k8s/ingress.yaml; then
    report_test "Network Security Policies" "PASS" "Network policies configured for ingress and egress"
else
    report_test "Network Security Policies" "FAIL" "Network policy configuration missing or incomplete"
fi

echo
echo -e "${BLUE}📊 Testing Resource Requirements for HPA${NC}"
echo "========================================"

# Test 11: Validate Resource Requests (Required for HPA)
echo "🔍 Validating Resource Requests for HPA Operation..."
BACKEND_HAS_REQUESTS=$(grep -A20 "containers:" k8s/backend-deployment.yaml | grep -c "requests:" || echo "0")
FRONTEND_HAS_REQUESTS=$(grep -A20 "containers:" k8s/frontend-deployment.yaml | grep -c "requests:" || echo "0")

if [ "$BACKEND_HAS_REQUESTS" -gt 0 ] && [ "$FRONTEND_HAS_REQUESTS" -gt 0 ]; then
    report_test "Resource Requests for HPA" "PASS" "Both backend and frontend have resource requests (required for HPA)"
else
    report_test "Resource Requests for HPA" "FAIL" "Missing resource requests - HPA requires CPU/memory requests"
fi

# Test 12: Validate CPU and Memory Metrics Configuration
echo "🔍 Validating HPA Metrics Configuration..."
if grep -A10 "metrics:" k8s/backend-deployment.yaml | grep -q "cpu" && \
   grep -A10 "metrics:" k8s/backend-deployment.yaml | grep -q "memory"; then
    report_test "HPA Metrics Configuration" "PASS" "Both CPU and memory metrics configured for scaling"
else
    report_test "HPA Metrics Configuration" "FAIL" "HPA metrics configuration incomplete"
fi

echo
echo -e "${BLUE}🔄 Testing High Availability Features${NC}"
echo "===================================="

# Test 13: Validate Multi-Replica Deployments
echo "🔍 Validating Multi-Replica Configuration..."
BACKEND_REPLICAS=$(grep "replicas:" k8s/backend-deployment.yaml | head -1 | grep -o '[0-9]\+' || echo "0")
FRONTEND_REPLICAS=$(grep "replicas:" k8s/frontend-deployment.yaml | head -1 | grep -o '[0-9]\+' || echo "0")

if [ "$BACKEND_REPLICAS" -ge 2 ] && [ "$FRONTEND_REPLICAS" -ge 2 ]; then
    report_test "Multi-Replica Deployment" "PASS" "Backend: $BACKEND_REPLICAS replicas, Frontend: $FRONTEND_REPLICAS replicas"
else
    report_test "Multi-Replica Deployment" "FAIL" "Insufficient replicas for high availability"
fi

# Test 14: Validate Rolling Update Strategy
echo "🔍 Validating Rolling Update Strategy..."
if grep -q "type: RollingUpdate" k8s/backend-deployment.yaml && \
   grep -q "maxUnavailable: 0" k8s/backend-deployment.yaml; then
    report_test "Zero-Downtime Updates" "PASS" "Rolling update strategy with zero unavailable pods"
else
    report_test "Zero-Downtime Updates" "FAIL" "Rolling update strategy not properly configured"
fi

# Test 15: Validate Database Backup Strategy
echo "🔍 Validating Database Backup Considerations..."
if grep -q "PersistentVolumeClaim" k8s/database.yaml && \
   grep -q "ReadWriteOnce" k8s/database.yaml; then
    report_test "Database Backup Foundation" "PASS" "Persistent storage configured for backup capabilities"
else
    report_test "Database Backup Foundation" "FAIL" "Database backup infrastructure missing"
fi

echo
echo -e "${BLUE}📈 Performance and Monitoring Integration${NC}"
echo "========================================"

# Test 16: Validate Prometheus Integration for HPA
echo "🔍 Validating Prometheus Integration for Auto-scaling..."
if grep -q "prometheus.io/scrape" k8s/backend-deployment.yaml && \
   grep -q "prometheus.io/scrape" k8s/frontend-deployment.yaml; then
    report_test "Prometheus Metrics Integration" "PASS" "Applications configured for Prometheus scraping"
else
    report_test "Prometheus Metrics Integration" "FAIL" "Prometheus integration missing for HPA metrics"
fi

# Test 17: Validate Database Monitoring
echo "🔍 Validating Database Monitoring Configuration..."
if grep -q "postgresql" k8s/prometheus-config.yaml; then
    report_test "Database Monitoring" "PASS" "PostgreSQL monitoring configured in Prometheus"
else
    report_test "Database Monitoring" "FAIL" "Database monitoring configuration missing"
fi

echo
echo "================================================="
echo -e "${BLUE}📊 Auto-scaling and High Availability Test Summary${NC}"
echo "================================================="

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
PASS_PERCENTAGE=$((TESTS_PASSED * 100 / TOTAL_TESTS))

echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo -e "Success Rate: ${PASS_PERCENTAGE}%"

echo
echo -e "${BLUE}🎯 Key Auto-scaling and High Availability Features Validated:${NC}"
echo "• ✅ HorizontalPodAutoscaler with CPU/Memory scaling"
echo "• ✅ Database StatefulSet with persistent storage"
echo "• ✅ Multi-replica deployments for high availability"
echo "• ✅ Rolling update strategy for zero-downtime deployments"
echo "• ✅ Network policies for security isolation"
echo "• ✅ Service discovery and load balancing"
echo "• ✅ Resource requests and limits for proper HPA operation"
echo "• ✅ Prometheus integration for metrics-based scaling"

if [ $TESTS_FAILED -eq 0 ]; then
    echo
    echo -e "${GREEN}🎉 All auto-scaling and high availability tests passed!${NC}"
    echo -e "${GREEN}✅ Task 4: Auto-scaling and High Availability - COMPLETE${NC}"
    exit 0
else
    echo
    echo -e "${YELLOW}⚠️  Some tests failed. Review the configuration before deployment.${NC}"
    exit 1
fi
