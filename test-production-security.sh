#!/bin/bash

# Production Security Test Script
# Tests the complete Docker Compose production security setup

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Production Security Test Suite ===${NC}"
echo "Testing docker-compose.production-secure.yml configuration"
echo

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
        return 1
    fi
}

# Function to run test with error handling
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "${YELLOW}Testing: $test_name${NC}"
    if eval "$test_command" >/dev/null 2>&1; then
        print_result 0 "$test_name"
    else
        print_result 1 "$test_name"
        return 1
    fi
}

echo "1. Configuration Validation Tests"
echo "================================"

# Test Docker Compose file syntax
run_test "Docker Compose syntax validation" \
    "docker-compose -f docker-compose.production-secure.yml config --quiet"

# Test all required files exist
echo
echo "2. File Existence Tests"
echo "======================="

required_files=(
    "docker-compose.production-secure.yml"
    "nginx/nginx.conf"
    "nginx/ssl.conf"
    "falco/falco.yaml"
    "certs/privkey.pem"
    "certs/fullchain.pem"
    "certs/dhparam.pem"
    ".env.production"
    "secrets/db_password.txt"
    "secrets/db_user.txt"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        print_result 0 "File exists: $file"
    else
        print_result 1 "File missing: $file"
    fi
done

echo
echo "3. Security Configuration Tests"
echo "==============================="

# Test certificate permissions
if [ -f "certs/privkey.pem" ] && [ "$(stat -f '%A' certs/privkey.pem)" = "600" ]; then
    print_result 0 "Private key has correct permissions (600)"
else
    print_result 1 "Private key permissions incorrect"
fi

if [ -f "certs/fullchain.pem" ] && [ "$(stat -f '%A' certs/fullchain.pem)" = "644" ]; then
    print_result 0 "Certificate has correct permissions (644)"
else
    print_result 1 "Certificate permissions incorrect"
fi

# Test secrets file permissions
if [ -f "secrets/db_password.txt" ] && [ "$(stat -f '%A' secrets/db_password.txt)" = "600" ]; then
    print_result 0 "Database password secret has correct permissions (600)"
else
    print_result 1 "Database password secret permissions incorrect"
fi

echo
echo "4. Docker Security Tests"
echo "========================"

# Parse Docker Compose and test security settings
compose_config=$(docker-compose -f docker-compose.production-secure.yml config 2>/dev/null)

# Test non-root user configuration
if echo "$compose_config" | grep -q "user.*1001"; then
    print_result 0 "Non-root user configured for services"
else
    print_result 1 "Non-root user not properly configured"
fi

# Test security options
if echo "$compose_config" | grep -q "no-new-privileges:true"; then
    print_result 0 "no-new-privileges security option enabled"
else
    print_result 1 "no-new-privileges security option missing"
fi

# Test capability restrictions
if echo "$compose_config" | grep -A1 "cap_drop:" | grep -q "ALL"; then
    print_result 0 "Capabilities dropped (ALL)"
else
    print_result 1 "Capabilities not properly restricted"
fi

# Test read-only root filesystem
if echo "$compose_config" | grep -q "read_only.*true"; then
    print_result 0 "Read-only root filesystem enabled"
else
    print_result 1 "Read-only root filesystem not enabled"
fi

echo
echo "5. Network Security Tests"
echo "========================="

# Test network isolation
if echo "$compose_config" | grep -q "secure_backend:"; then
    print_result 0 "Backend network properly isolated"
else
    print_result 1 "Backend network isolation not configured"
fi

if echo "$compose_config" | grep -q "secure_frontend:"; then
    print_result 0 "Frontend network properly isolated"
else
    print_result 1 "Frontend network isolation not configured"
fi

echo
echo "6. Monitoring Integration Tests" 
echo "==============================="

# Test Falco service configuration
if echo "$compose_config" | grep -A10 "falco:" | grep -q "privileged.*true"; then
    print_result 0 "Falco monitoring service configured with required privileges"
else
    print_result 1 "Falco monitoring service not properly configured"
fi

# Test volume mounts for monitoring
if echo "$compose_config" | grep -q "/var/run/docker.sock"; then
    print_result 0 "Docker socket mounted for container monitoring"
else
    print_result 1 "Docker socket not mounted for monitoring"
fi

echo
echo "7. Resource Limitation Tests"
echo "============================"

# Test memory limits
if echo "$compose_config" | grep -q "memory:"; then
    print_result 0 "Memory limits configured for services"
else
    print_result 1 "Memory limits not configured"
fi

# Test CPU limits
if echo "$compose_config" | grep -q "cpus"; then
    print_result 0 "CPU limits configured for services"
else
    print_result 1 "CPU limits not configured"
fi

echo
echo "8. SSL/TLS Configuration Tests"
echo "=============================="

# Test SSL certificate validity
if openssl x509 -in certs/fullchain.pem -text -noout >/dev/null 2>&1; then
    print_result 0 "SSL certificate is valid X.509 format"
else
    print_result 1 "SSL certificate format invalid"
fi

# Test private key validity
if openssl rsa -in certs/privkey.pem -check >/dev/null 2>&1; then
    print_result 0 "SSL private key is valid"
else
    print_result 1 "SSL private key invalid"
fi

echo
echo "9. Environment Configuration Tests"
echo "=================================="

# Check if production environment file exists and has required variables
if [ -f ".env.production" ]; then
    required_env_vars=("NODE_ENV" "DATABASE_URL" "JWT_SECRET")
    for var in "${required_env_vars[@]}"; do
        if grep -q "^${var}=" ".env.production"; then
            print_result 0 "Environment variable $var configured"
        else
            print_result 1 "Environment variable $var missing"
        fi
    done
else
    print_result 1 "Production environment file missing"
fi

echo
echo "10. Quick Startup Test"
echo "======================"

# Test if services can be started (dry run)
if docker-compose -f docker-compose.production-secure.yml up --dry-run >/dev/null 2>&1; then
    print_result 0 "Services can be started (dry run successful)"
else
    print_result 1 "Service startup validation failed"
fi

echo
echo -e "${BLUE}=== Test Summary ===${NC}"
echo "Production security configuration validation complete."
echo
echo -e "${YELLOW}To start the production environment:${NC}"
echo "docker-compose -f docker-compose.production-secure.yml up -d"
echo
echo -e "${YELLOW}To monitor security events:${NC}"
echo "docker-compose -f docker-compose.production-secure.yml logs -f falco"
echo
echo -e "${YELLOW}To check service health:${NC}"
echo "docker-compose -f docker-compose.production-secure.yml ps"
echo
