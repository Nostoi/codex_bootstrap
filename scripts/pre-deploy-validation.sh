#!/usr/bin/env bash
# Pre-deployment validation script for Helmsman project
# This script validates that the system is ready for deployment

set -euo pipefail

echo "🔍 Starting pre-deployment validation..."
echo "=====================================\n"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

VALIDATION_ERRORS=0

# Function to print status
print_status() {
    local status=$1
    local message=$2
    if [ "$status" = "PASS" ]; then
        echo -e "✅ ${GREEN}PASS${NC} - $message"
    elif [ "$status" = "FAIL" ]; then
        echo -e "❌ ${RED}FAIL${NC} - $message"
        VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
    elif [ "$status" = "WARN" ]; then
        echo -e "⚠️  ${YELLOW}WARN${NC} - $message"
    else
        echo -e "ℹ️  ${BLUE}INFO${NC} - $message"
    fi
}

# Function to check command exists
check_command() {
    if command -v "$1" >/dev/null 2>&1; then
        print_status "PASS" "$1 is installed"
        return 0
    else
        print_status "FAIL" "$1 is not installed"
        return 1
    fi
}

# 1. Check required tools
echo "1. Checking required tools..."
check_command "node"
check_command "npm"
check_command "pnpm" || print_status "WARN" "pnpm not found, npm will be used"
check_command "docker"
check_command "git"

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d'.' -f1)
if [ "$NODE_MAJOR" -ge 18 ]; then
    print_status "PASS" "Node.js version $NODE_VERSION (>= 18)"
else
    print_status "FAIL" "Node.js version $NODE_VERSION (< 18 required)"
fi

echo ""

# 2. Environment Configuration
echo "2. Checking environment configuration..."

# Check if .env files exist
if [ -f "backend/.env" ]; then
    print_status "PASS" "Backend .env file exists"
    
    # Check critical environment variables
    if grep -q "DATABASE_URL=" backend/.env; then
        print_status "PASS" "DATABASE_URL configured"
    else
        print_status "FAIL" "DATABASE_URL not configured in backend/.env"
    fi
    
    if grep -q "JWT_SECRET=" backend/.env; then
        JWT_SECRET=$(grep "JWT_SECRET=" backend/.env | cut -d'=' -f2 | tr -d '"')
        if [ ${#JWT_SECRET} -ge 32 ]; then
            print_status "PASS" "JWT_SECRET configured with adequate length"
        else
            print_status "FAIL" "JWT_SECRET too short (< 32 characters)"
        fi
    else
        print_status "FAIL" "JWT_SECRET not configured"
    fi
    
    # Check OpenAI configuration
    if grep -q "OPENAI_API_KEY=" backend/.env; then
        print_status "PASS" "OPENAI_API_KEY configured"
    else
        print_status "WARN" "OPENAI_API_KEY not configured (AI features will be disabled)"
    fi
else
    print_status "FAIL" "Backend .env file missing"
fi

if [ -f "frontend/.env.local" ] || [ -f "frontend/.env" ]; then
    print_status "PASS" "Frontend environment configuration exists"
else
    print_status "WARN" "Frontend .env file missing (using defaults)"
fi

echo ""

# 3. Dependencies Check
echo "3. Checking dependencies..."

cd backend
if [ -f "package.json" ] && [ -f "package-lock.json" ]; then
    print_status "PASS" "Backend package files exist"
    
    # Check if node_modules exists and is up to date
    if [ -d "node_modules" ]; then
        print_status "PASS" "Backend node_modules exists"
    else
        print_status "FAIL" "Backend node_modules missing - run npm install"
    fi
else
    print_status "FAIL" "Backend package files missing"
fi

cd ../frontend
if [ -f "package.json" ] && ([ -f "package-lock.json" ] || [ -f "pnpm-lock.yaml" ]); then
    print_status "PASS" "Frontend package files exist"
    
    if [ -d "node_modules" ]; then
        print_status "PASS" "Frontend node_modules exists"
    else
        print_status "FAIL" "Frontend node_modules missing - run npm/pnpm install"
    fi
else
    print_status "FAIL" "Frontend package files missing"
fi

cd ..

echo ""

# 4. Database Check
echo "4. Checking database configuration..."

cd backend
if [ -f "prisma/schema.prisma" ]; then
    print_status "PASS" "Prisma schema exists"
    
    # Check if Prisma client is generated
    if [ -d "node_modules/.prisma" ] || [ -d "prisma/generated" ]; then
        print_status "PASS" "Prisma client generated"
    else
        print_status "FAIL" "Prisma client not generated - run npx prisma generate"
    fi
    
    # Check migrations
    if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations)" ]; then
        print_status "PASS" "Database migrations exist"
    else
        print_status "WARN" "No database migrations found"
    fi
else
    print_status "FAIL" "Prisma schema missing"
fi

cd ..

echo ""

# 5. Build Tests
echo "5. Running build tests..."

echo "  Building backend..."
cd backend
if npm run build >/dev/null 2>&1; then
    print_status "PASS" "Backend builds successfully"
else
    print_status "FAIL" "Backend build failed"
fi

cd ../frontend
echo "  Building frontend..."
if npm run build >/dev/null 2>&1; then
    print_status "PASS" "Frontend builds successfully"
else
    print_status "FAIL" "Frontend build failed"
fi

cd ..

echo ""

# 6. Test Suite
echo "6. Running test suites..."

cd backend
echo "  Running backend tests..."
if npm test >/dev/null 2>&1; then
    print_status "PASS" "Backend tests pass"
else
    print_status "FAIL" "Backend tests failed"
fi

cd ../frontend
echo "  Running frontend tests..."
if npm test -- --watchAll=false >/dev/null 2>&1; then
    print_status "PASS" "Frontend tests pass"
else
    print_status "FAIL" "Frontend tests failed"
fi

cd ..

echo ""

# 7. Security Checks
echo "7. Running security checks..."

cd backend
if npm audit --audit-level high >/dev/null 2>&1; then
    print_status "PASS" "Backend security audit clean"
else
    print_status "WARN" "Backend has security vulnerabilities"
fi

cd ../frontend
if npm audit --audit-level high >/dev/null 2>&1; then
    print_status "PASS" "Frontend security audit clean"
else
    print_status "WARN" "Frontend has security vulnerabilities"
fi

cd ..

echo ""

# 8. Docker Check
echo "8. Checking Docker configuration..."

if [ -f "Dockerfile.backend" ]; then
    print_status "PASS" "Backend Dockerfile exists"
else
    print_status "FAIL" "Backend Dockerfile missing"
fi

if [ -f "Dockerfile.frontend" ]; then
    print_status "PASS" "Frontend Dockerfile exists"
else
    print_status "FAIL" "Frontend Dockerfile missing"
fi

if [ -f "docker-compose.yml" ]; then
    print_status "PASS" "Docker Compose configuration exists"
    
    # Validate docker-compose syntax
    if docker-compose config >/dev/null 2>&1; then
        print_status "PASS" "Docker Compose configuration valid"
    else
        print_status "FAIL" "Docker Compose configuration invalid"
    fi
else
    print_status "FAIL" "Docker Compose configuration missing"
fi

echo ""

# 9. Feature Flags Validation
echo "9. Validating feature flags..."

if [ -f "backend/src/features/feature-flags.service.ts" ]; then
    print_status "PASS" "Feature flags service exists"
    
    # Check if feature flags are properly configured in environment
    cd backend
    if [ -f ".env" ]; then
        flag_count=$(grep -c "^FF_" .env || echo "0")
        if [ "$flag_count" -gt 0 ]; then
            print_status "PASS" "Feature flags configured ($flag_count flags)"
        else
            print_status "WARN" "No feature flags configured in environment"
        fi
    fi
    cd ..
else
    print_status "FAIL" "Feature flags service missing"
fi

echo ""

# 10. Git Status Check
echo "10. Checking git status..."

if git status >/dev/null 2>&1; then
    UNCOMMITTED=$(git status --porcelain | wc -l)
    if [ "$UNCOMMITTED" -eq 0 ]; then
        print_status "PASS" "No uncommitted changes"
    else
        print_status "WARN" "$UNCOMMITTED uncommitted changes detected"
        git status --short
    fi
    
    CURRENT_BRANCH=$(git branch --show-current)
    print_status "INFO" "Current branch: $CURRENT_BRANCH"
    
    # Check if we're on main/master for production deployment
    if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
        print_status "PASS" "On production branch"
    else
        print_status "WARN" "Not on main/master branch (deployment may be for staging)"
    fi
else
    print_status "WARN" "Not in a git repository"
fi

echo ""
echo "======================================"
echo "🎯 Validation Summary"
echo "======================================"

if [ $VALIDATION_ERRORS -eq 0 ]; then
    echo -e "✅ ${GREEN}All validations passed!${NC}"
    echo "🚀 System is ready for deployment"
    exit 0
else
    echo -e "❌ ${RED}$VALIDATION_ERRORS validation error(s) found${NC}"
    echo "🛑 Fix errors before deploying"
    exit 1
fi
