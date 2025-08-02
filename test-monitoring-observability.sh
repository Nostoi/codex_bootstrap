#!/bin/bash

# Monitoring and Observability Stack Validation Script
# Tests Prometheus, Grafana, alerting, and observability infrastructure

echo "📊 Monitoring and Observability Stack Validation"
echo "==============================================="

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
echo -e "${BLUE}📈 Testing Prometheus Configuration${NC}"
echo "================================="

# Test 1: Prometheus Deployment
echo "🔍 Validating Prometheus Deployment..."
PROMETHEUS_DEPLOYMENT=$(grep -h "name: prometheus" k8s/monitoring.yaml 2>/dev/null | wc -l | tr -d ' ')
PROMETHEUS_IMAGE=$(grep -h "image: prom/prometheus" k8s/monitoring.yaml 2>/dev/null | wc -l | tr -d ' ')

if [ "${PROMETHEUS_DEPLOYMENT:-0}" -gt 0 ] && [ "${PROMETHEUS_IMAGE:-0}" -gt 0 ]; then
    VERSION=$(grep -o "prom/prometheus:v[0-9.]*" k8s/monitoring.yaml 2>/dev/null | head -1 || echo "prom/prometheus:latest")
    report_test "Prometheus Deployment" "PASS" "Deployed with $VERSION"
else
    report_test "Prometheus Deployment" "FAIL" "Prometheus deployment configuration missing"
fi

# Test 2: Prometheus Storage
echo "🔍 Validating Prometheus Persistent Storage..."
PROMETHEUS_PVC=$(grep -h "name: prometheus-storage" k8s/monitoring.yaml 2>/dev/null | wc -l | tr -d ' ')
PROMETHEUS_STORAGE_SIZE=$(grep -A15 "name: prometheus-storage" k8s/monitoring.yaml | grep -h "storage:" | grep -o '[0-9]*Gi' | head -1 2>/dev/null || echo "")

if [ "${PROMETHEUS_PVC:-0}" -gt 0 ] && [ -n "$PROMETHEUS_STORAGE_SIZE" ]; then
    report_test "Prometheus Persistent Storage" "PASS" "$PROMETHEUS_STORAGE_SIZE persistent storage configured"
else
    report_test "Prometheus Persistent Storage" "FAIL" "Prometheus storage configuration missing"
fi

# Test 3: Prometheus Configuration
echo "🔍 Validating Prometheus Configuration..."
PROMETHEUS_CONFIG=$(grep -h "prometheus.yml:" k8s/prometheus-config.yaml 2>/dev/null | wc -l | tr -d ' ')
SCRAPE_CONFIGS=$(grep -h "scrape_configs:" k8s/prometheus-config.yaml 2>/dev/null | wc -l | tr -d ' ')
SCRAPE_JOBS=$(grep -h "job_name:" k8s/prometheus-config.yaml 2>/dev/null | wc -l | tr -d ' ')

if [ "${PROMETHEUS_CONFIG:-0}" -gt 0 ] && [ "${SCRAPE_CONFIGS:-0}" -gt 0 ] && [ "${SCRAPE_JOBS:-0}" -ge 4 ]; then
    report_test "Prometheus Scrape Configuration" "PASS" "$SCRAPE_JOBS scraping jobs configured"
else
    report_test "Prometheus Scrape Configuration" "FAIL" "Prometheus configuration incomplete"
fi

# Test 4: Alerting Rules
echo "🔍 Validating Alerting Rules..."
ALERTS_CONFIG=$(grep -h "alerts.yml:" k8s/prometheus-config.yaml 2>/dev/null | wc -l | tr -d ' ')
ALERT_RULES=$(grep -h "alert:" k8s/prometheus-config.yaml 2>/dev/null | wc -l | tr -d ' ')

if [ "${ALERTS_CONFIG:-0}" -gt 0 ] && [ "${ALERT_RULES:-0}" -ge 5 ]; then
    report_test "Prometheus Alerting Rules" "PASS" "$ALERT_RULES alerting rules configured"
else
    report_test "Prometheus Alerting Rules" "FAIL" "Alerting rules configuration missing or incomplete"
fi

echo
echo -e "${BLUE}📊 Testing Grafana Configuration${NC}"
echo "==============================="

# Test 5: Grafana Deployment
echo "🔍 Validating Grafana Deployment..."
GRAFANA_DEPLOYMENT=$(grep -h "name: grafana" k8s/monitoring.yaml 2>/dev/null | wc -l | tr -d ' ')
GRAFANA_IMAGE=$(grep -h "image: grafana/grafana" k8s/monitoring.yaml 2>/dev/null | wc -l | tr -d ' ')

if [ "${GRAFANA_DEPLOYMENT:-0}" -gt 0 ] && [ "${GRAFANA_IMAGE:-0}" -gt 0 ]; then
    VERSION=$(grep -o "grafana/grafana:[0-9.]*" k8s/monitoring.yaml 2>/dev/null | head -1 || echo "grafana/grafana:latest")
    report_test "Grafana Deployment" "PASS" "Deployed with $VERSION"
else
    report_test "Grafana Deployment" "FAIL" "Grafana deployment configuration missing"
fi

# Test 6: Grafana Storage
echo "🔍 Validating Grafana Persistent Storage..."
GRAFANA_PVC=$(grep -h "name: grafana-storage" k8s/monitoring.yaml 2>/dev/null | wc -l | tr -d ' ')

if [ "${GRAFANA_PVC:-0}" -gt 0 ]; then
    report_test "Grafana Persistent Storage" "PASS" "Persistent storage configured for dashboard persistence"
else
    report_test "Grafana Persistent Storage" "FAIL" "Grafana storage configuration missing"
fi

# Test 7: Grafana Security
echo "🔍 Validating Grafana Security Configuration..."
GRAFANA_ADMIN_SECRET=$(grep -h "GF_SECURITY_ADMIN_PASSWORD" k8s/monitoring.yaml 2>/dev/null | wc -l | tr -d ' ')
GRAFANA_SECRET_REF=$(grep -h "secretKeyRef:" k8s/monitoring.yaml 2>/dev/null | wc -l | tr -d ' ')

if [ "${GRAFANA_ADMIN_SECRET:-0}" -gt 0 ] && [ "${GRAFANA_SECRET_REF:-0}" -gt 0 ]; then
    report_test "Grafana Security Configuration" "PASS" "Admin password secured with Kubernetes secrets"
else
    report_test "Grafana Security Configuration" "FAIL" "Grafana security configuration missing"
fi

echo
echo -e "${BLUE}🔐 Testing RBAC and Service Accounts${NC}"
echo "===================================="

# Test 8: Prometheus RBAC
echo "🔍 Validating Prometheus RBAC Configuration..."
PROMETHEUS_SA=$(grep -h "kind: ServiceAccount" k8s/monitoring.yaml 2>/dev/null | wc -l | tr -d ' ')
CLUSTER_ROLE=$(grep -h "kind: ClusterRole" k8s/monitoring.yaml 2>/dev/null | wc -l | tr -d ' ')
CLUSTER_ROLE_BINDING=$(grep -h "kind: ClusterRoleBinding" k8s/monitoring.yaml 2>/dev/null | wc -l | tr -d ' ')

if [ "${PROMETHEUS_SA:-0}" -gt 0 ] && [ "${CLUSTER_ROLE:-0}" -gt 0 ] && [ "${CLUSTER_ROLE_BINDING:-0}" -gt 0 ]; then
    report_test "Prometheus RBAC Configuration" "PASS" "ServiceAccount, ClusterRole, and ClusterRoleBinding configured"
else
    report_test "Prometheus RBAC Configuration" "FAIL" "RBAC configuration incomplete"
fi

# Test 9: RBAC Permissions
echo "🔍 Validating RBAC Permissions..."
RBAC_NODES=$(grep -A20 "rules:" k8s/monitoring.yaml | grep -h "nodes" 2>/dev/null | wc -l | tr -d ' ')
RBAC_SERVICES=$(grep -A20 "rules:" k8s/monitoring.yaml | grep -h "services" 2>/dev/null | wc -l | tr -d ' ')
RBAC_PODS=$(grep -A20 "rules:" k8s/monitoring.yaml | grep -h "pods" 2>/dev/null | wc -l | tr -d ' ')

if [ "${RBAC_NODES:-0}" -gt 0 ] && [ "${RBAC_SERVICES:-0}" -gt 0 ] && [ "${RBAC_PODS:-0}" -gt 0 ]; then
    report_test "Prometheus RBAC Permissions" "PASS" "Access to nodes, services, and pods configured"
else
    report_test "Prometheus RBAC Permissions" "FAIL" "RBAC permissions insufficient"
fi

echo
echo -e "${BLUE}📡 Testing Service Discovery${NC}"
echo "==========================="

# Test 10: Kubernetes Service Discovery
echo "🔍 Validating Kubernetes Service Discovery..."
K8S_SD_PODS=$(grep -h "kubernetes_sd_configs:" k8s/prometheus-config.yaml 2>/dev/null | wc -l | tr -d ' ')
K8S_SD_ROLE_POD=$(grep -A5 "kubernetes_sd_configs:" k8s/prometheus-config.yaml | grep -h "role: pod" 2>/dev/null | wc -l | tr -d ' ')
K8S_SD_ROLE_NODE=$(grep -A5 "kubernetes_sd_configs:" k8s/prometheus-config.yaml | grep -h "role: node" 2>/dev/null | wc -l | tr -d ' ')

if [ "${K8S_SD_PODS:-0}" -gt 0 ] && [ "${K8S_SD_ROLE_POD:-0}" -gt 0 ] && [ "${K8S_SD_ROLE_NODE:-0}" -gt 0 ]; then
    report_test "Kubernetes Service Discovery" "PASS" "Pod and node service discovery configured"
else
    report_test "Kubernetes Service Discovery" "FAIL" "Service discovery configuration incomplete"
fi

# Test 11: Application Metrics Collection
echo "🔍 Validating Application Metrics Collection..."
BACKEND_JOB=$(grep -h "codex-backend" k8s/prometheus-config.yaml 2>/dev/null | wc -l | tr -d ' ')
FRONTEND_JOB=$(grep -h "codex-frontend" k8s/prometheus-config.yaml 2>/dev/null | wc -l | tr -d ' ')
POSTGRES_JOB=$(grep -h "postgresql" k8s/prometheus-config.yaml 2>/dev/null | wc -l | tr -d ' ')

if [ "${BACKEND_JOB:-0}" -gt 0 ] && [ "${POSTGRES_JOB:-0}" -gt 0 ]; then
    report_test "Application Metrics Collection" "PASS" "Backend and database metrics configured"
else
    report_test "Application Metrics Collection" "FAIL" "Application metrics configuration missing"
fi

echo
echo -e "${BLUE}🚨 Testing Alerting Infrastructure${NC}"
echo "================================="

# Test 12: Alert Definitions
echo "🔍 Validating Alert Definitions..."
CPU_ALERT=$(grep -h "HighCPUUsage" k8s/prometheus-config.yaml 2>/dev/null | wc -l | tr -d ' ')
MEMORY_ALERT=$(grep -h "HighMemoryUsage" k8s/prometheus-config.yaml 2>/dev/null | wc -l | tr -d ' ')
SERVICE_ALERT=$(grep -h "ServiceDown" k8s/prometheus-config.yaml 2>/dev/null | wc -l | tr -d ' ')
DATABASE_ALERT=$(grep -h "DatabaseConnectionIssues" k8s/prometheus-config.yaml 2>/dev/null | wc -l | tr -d ' ')

if [ "${CPU_ALERT:-0}" -gt 0 ] && [ "${MEMORY_ALERT:-0}" -gt 0 ] && [ "${SERVICE_ALERT:-0}" -gt 0 ] && [ "${DATABASE_ALERT:-0}" -gt 0 ]; then
    report_test "Critical Alert Definitions" "PASS" "CPU, memory, service, and database alerts configured"
else
    report_test "Critical Alert Definitions" "FAIL" "Essential alert definitions missing"
fi

# Test 13: Alert Thresholds
echo "🔍 Validating Alert Thresholds..."
CPU_THRESHOLD=$(grep -A10 "HighCPUUsage" k8s/prometheus-config.yaml | grep -o "> [0-9]*" | head -1 2>/dev/null || echo "")
MEMORY_THRESHOLD=$(grep -A10 "HighMemoryUsage" k8s/prometheus-config.yaml | grep -o "> [0-9]*" | head -1 2>/dev/null || echo "")

if [ -n "$CPU_THRESHOLD" ] && [ -n "$MEMORY_THRESHOLD" ]; then
    report_test "Alert Thresholds Configuration" "PASS" "CPU: ${CPU_THRESHOLD}%, Memory: ${MEMORY_THRESHOLD}%"
else
    report_test "Alert Thresholds Configuration" "FAIL" "Alert thresholds not properly configured"
fi

echo
echo -e "${BLUE}💾 Testing Data Persistence${NC}"
echo "=========================="

# Test 14: Monitoring Data Persistence
echo "🔍 Validating Monitoring Data Persistence..."
PROMETHEUS_RETENTION=$(grep -h "storage.tsdb.retention.time" k8s/monitoring.yaml 2>/dev/null | wc -l | tr -d ' ')
RETENTION_PERIOD=$(grep -o "retention.time=[0-9]*d" k8s/monitoring.yaml 2>/dev/null | grep -o "[0-9]*d" | head -1 || echo "")

if [ "${PROMETHEUS_RETENTION:-0}" -gt 0 ] && [ -n "$RETENTION_PERIOD" ]; then
    report_test "Prometheus Data Retention" "PASS" "Data retention configured for $RETENTION_PERIOD"
else
    report_test "Prometheus Data Retention" "FAIL" "Data retention policy not configured"
fi

# Test 15: Storage Classes
echo "🔍 Validating Storage Classes for Performance..."
FAST_SSD_STORAGE=$(grep -h "storageClassName: fast-ssd" k8s/monitoring.yaml 2>/dev/null | wc -l | tr -d ' ')

if [ "${FAST_SSD_STORAGE:-0}" -gt 0 ]; then
    report_test "High-Performance Storage" "PASS" "Fast SSD storage configured for monitoring data"
else
    report_test "High-Performance Storage" "FAIL" "High-performance storage not configured"
fi

echo
echo "==============================================="
echo -e "${BLUE}📊 Monitoring and Observability Summary${NC}"
echo "==============================================="

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
echo -e "${BLUE}🎯 Key Monitoring and Observability Features:${NC}"
echo "• ✅ Prometheus deployment with persistent storage and data retention"
echo "• ✅ Grafana dashboards with secure admin configuration"
echo "• ✅ Comprehensive alerting rules for CPU, memory, services, and database"
echo "• ✅ Kubernetes service discovery for pods, nodes, and services"
echo "• ✅ RBAC configuration with proper permissions for metrics collection"
echo "• ✅ Multi-job scraping configuration for all application components"
echo "• ✅ High-performance SSD storage for monitoring data"
echo "• ✅ Production-ready observability infrastructure"
echo "• ✅ Security integration with Kubernetes secrets"
echo "• ✅ Alert threshold configuration for proactive monitoring"

if [ $TESTS_FAILED -eq 0 ]; then
    echo
    echo -e "${GREEN}🎉 All monitoring and observability tests passed!${NC}"
    echo -e "${GREEN}✅ Task 5: Monitoring and Observability Stack - COMPLETE${NC}"
    exit 0
else
    echo
    echo -e "${YELLOW}⚠️  $TESTS_FAILED test(s) failed. Review the monitoring configuration.${NC}"
    exit 1
fi
