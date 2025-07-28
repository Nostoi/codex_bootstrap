#!/usr/bin/env bash
# Gradual deployment script for Helmsman project
# Supports phased rollout with feature flags and rollback capabilities

set -euo pipefail

# Configuration
DEPLOYMENT_ENV="${1:-staging}"
ROLLOUT_PHASE="${2:-0}"
FORCE_DEPLOY="${3:-false}"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "🚀 Helmsman Gradual Deployment"
echo "Environment: $DEPLOYMENT_ENV"
echo "Rollout Phase: $ROLLOUT_PHASE"
echo "=============================="

# Rollout phases configuration
declare -A ROLLOUT_PHASES=(
    ["0"]="Feature flags disabled - Infrastructure only"
    ["1"]="5% rollout - Limited user base"
    ["2"]="25% rollout - Expanded testing" 
    ["3"]="50% rollout - Half user base"
    ["4"]="100% rollout - Full deployment"
)

# Feature flag configurations for each phase
declare -A PHASE_0_FLAGS=(
    ["FF_ENHANCED_TASK_METADATA"]="false"
    ["FF_AI_TASK_EXTRACTION"]="false"
    ["FF_DAILY_PLANNING"]="false"
    ["FF_MEM0_INTEGRATION"]="false"
    ["FF_ADVANCED_AI_FEATURES"]="false"
)

declare -A PHASE_1_FLAGS=(
    ["FF_ENHANCED_TASK_METADATA"]="true"
    ["FF_AI_TASK_EXTRACTION"]="false"
    ["FF_DAILY_PLANNING"]="false"
    ["FF_MEM0_INTEGRATION"]="false"
    ["FF_ADVANCED_AI_FEATURES"]="false"
)

declare -A PHASE_2_FLAGS=(
    ["FF_ENHANCED_TASK_METADATA"]="true"
    ["FF_AI_TASK_EXTRACTION"]="true"
    ["FF_DAILY_PLANNING"]="false"
    ["FF_MEM0_INTEGRATION"]="false"
    ["FF_ADVANCED_AI_FEATURES"]="false"
)

declare -A PHASE_3_FLAGS=(
    ["FF_ENHANCED_TASK_METADATA"]="true"
    ["FF_AI_TASK_EXTRACTION"]="true"
    ["FF_DAILY_PLANNING"]="true"
    ["FF_MEM0_INTEGRATION"]="false"
    ["FF_ADVANCED_AI_FEATURES"]="false"
)

declare -A PHASE_4_FLAGS=(
    ["FF_ENHANCED_TASK_METADATA"]="true"
    ["FF_AI_TASK_EXTRACTION"]="true"
    ["FF_DAILY_PLANNING"]="true"
    ["FF_MEM0_INTEGRATION"]="true"
    ["FF_ADVANCED_AI_FEATURES"]="true"
)

print_status() {
    local status=$1
    local message=$2
    case $status in
        "SUCCESS") echo -e "✅ ${GREEN}$message${NC}" ;;
        "ERROR") echo -e "❌ ${RED}$message${NC}" ;;
        "WARNING") echo -e "⚠️  ${YELLOW}$message${NC}" ;;
        "INFO") echo -e "ℹ️  ${BLUE}$message${NC}" ;;
    esac
}

# Function to get feature flags for phase
get_phase_flags() {
    local phase=$1
    local -n flags_ref=$2
    
    case $phase in
        0) for key in "${!PHASE_0_FLAGS[@]}"; do flags_ref[$key]="${PHASE_0_FLAGS[$key]}"; done ;;
        1) for key in "${!PHASE_1_FLAGS[@]}"; do flags_ref[$key]="${PHASE_1_FLAGS[$key]}"; done ;;
        2) for key in "${!PHASE_2_FLAGS[@]}"; do flags_ref[$key]="${PHASE_2_FLAGS[$key]}"; done ;;
        3) for key in "${!PHASE_3_FLAGS[@]}"; do flags_ref[$key]="${PHASE_3_FLAGS[$key]}"; done ;;
        4) for key in "${!PHASE_4_FLAGS[@]}"; do flags_ref[$key]="${PHASE_4_FLAGS[$key]}"; done ;;
        *) echo "Unknown phase: $phase"; exit 1 ;;
    esac
}

# Validation
if [[ ! "$ROLLOUT_PHASE" =~ ^[0-4]$ ]]; then
    print_status "ERROR" "Invalid rollout phase. Must be 0-4."
    exit 1
fi

print_status "INFO" "Phase $ROLLOUT_PHASE: ${ROLLOUT_PHASES[$ROLLOUT_PHASE]}"

# Step 1: Pre-deployment validation
print_status "INFO" "Running pre-deployment validation..."
if ! ./scripts/pre-deploy-validation.sh; then
    if [ "$FORCE_DEPLOY" != "true" ]; then
        print_status "ERROR" "Pre-deployment validation failed. Use FORCE_DEPLOY=true to override."
        exit 1
    else
        print_status "WARNING" "Pre-deployment validation failed but proceeding due to FORCE_DEPLOY=true"
    fi
fi

# Step 2: Database migrations (if needed)
print_status "INFO" "Checking database migrations..."
cd backend
if npx prisma migrate status | grep -q "Database is up to date"; then
    print_status "SUCCESS" "Database is up to date"
else
    print_status "INFO" "Running database migrations..."
    if npx prisma migrate deploy; then
        print_status "SUCCESS" "Database migrations completed"
    else
        print_status "ERROR" "Database migrations failed"
        exit 1
    fi
fi
cd ..

# Step 3: Build and deploy services
print_status "INFO" "Building services..."

# Build backend
print_status "INFO" "Building backend..."
cd backend
if npm run build; then
    print_status "SUCCESS" "Backend build completed"
else
    print_status "ERROR" "Backend build failed"
    exit 1
fi
cd ..

# Build frontend
print_status "INFO" "Building frontend..."
cd frontend
if npm run build; then
    print_status "SUCCESS" "Frontend build completed"
else
    print_status "ERROR" "Frontend build failed"
    exit 1
fi
cd ..

# Step 4: Configure feature flags for this phase
print_status "INFO" "Configuring feature flags for phase $ROLLOUT_PHASE..."

declare -A current_flags
get_phase_flags "$ROLLOUT_PHASE" current_flags

print_status "INFO" "Feature flag configuration:"
for flag in "${!current_flags[@]}"; do
    echo "  $flag=${current_flags[$flag]}"
done

# In a real deployment, this would update environment variables
# For now, we'll create a deployment-specific .env file
if [ "$DEPLOYMENT_ENV" = "production" ]; then
    ENV_FILE="backend/.env.production"
else
    ENV_FILE="backend/.env.staging"
fi

print_status "INFO" "Creating environment file: $ENV_FILE"

# Copy base environment and add feature flags
cp backend/.env.example "$ENV_FILE"
for flag in "${!current_flags[@]}"; do
    if grep -q "^$flag=" "$ENV_FILE"; then
        sed -i.bak "s/^$flag=.*/$flag=${current_flags[$flag]}/" "$ENV_FILE"
    else
        echo "$flag=${current_flags[$flag]}" >> "$ENV_FILE"
    fi
done

# Step 5: Docker deployment
print_status "INFO" "Deploying with Docker Compose..."

# Set environment file for docker-compose
export ENV_FILE_PATH="$ENV_FILE"
export DEPLOYMENT_ENV
export ROLLOUT_PHASE

if docker-compose -f docker-compose.yml -f "docker-compose.$DEPLOYMENT_ENV.yml" up -d --build; then
    print_status "SUCCESS" "Docker services deployed successfully"
else
    print_status "ERROR" "Docker deployment failed"
    exit 1
fi

# Step 6: Health checks
print_status "INFO" "Running health checks..."
sleep 10  # Wait for services to start

# Check backend health
if curl -f http://localhost:8000/health >/dev/null 2>&1; then
    print_status "SUCCESS" "Backend health check passed"
else
    print_status "ERROR" "Backend health check failed"
    print_status "INFO" "Rolling back deployment..."
    docker-compose down
    exit 1
fi

# Check frontend health
if curl -f http://localhost:3000 >/dev/null 2>&1; then
    print_status "SUCCESS" "Frontend health check passed"
else
    print_status "WARNING" "Frontend health check failed"
fi

# Check feature flags service
if curl -f http://localhost:8000/feature-flags/health >/dev/null 2>&1; then
    print_status "SUCCESS" "Feature flags service health check passed"
else
    print_status "WARNING" "Feature flags service health check failed"
fi

# Step 7: Deployment summary
print_status "SUCCESS" "Deployment completed successfully!"
echo ""
echo "📊 Deployment Summary:"
echo "  Environment: $DEPLOYMENT_ENV"
echo "  Phase: $ROLLOUT_PHASE (${ROLLOUT_PHASES[$ROLLOUT_PHASE]})"
echo "  Feature Flags:"
for flag in "${!current_flags[@]}"; do
    echo "    $flag=${current_flags[$flag]}"
done
echo ""
echo "🔗 Service URLs:"
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:8000"
echo "  API Docs: http://localhost:8000/api/docs"
echo "  Feature Flags: http://localhost:8000/feature-flags"
echo ""
echo "📝 Next Steps:"
echo "  1. Monitor metrics and logs"
echo "  2. Collect user feedback"
echo "  3. Plan next rollout phase"
if [ "$ROLLOUT_PHASE" -lt 4 ]; then
    next_phase=$((ROLLOUT_PHASE + 1))
    echo "  4. Deploy phase $next_phase: ${ROLLOUT_PHASES[$next_phase]}"
fi

# Create rollback script
print_status "INFO" "Creating rollback script..."
cat > "rollback-${DEPLOYMENT_ENV}-phase${ROLLOUT_PHASE}.sh" << EOF
#!/usr/bin/env bash
# Rollback script for deployment phase $ROLLOUT_PHASE

echo "🔄 Rolling back deployment..."
docker-compose down
git checkout HEAD~1  # Go back to previous commit
docker-compose up -d --build
echo "✅ Rollback completed"
EOF

chmod +x "rollback-${DEPLOYMENT_ENV}-phase${ROLLOUT_PHASE}.sh"
print_status "SUCCESS" "Rollback script created: rollback-${DEPLOYMENT_ENV}-phase${ROLLOUT_PHASE}.sh"
