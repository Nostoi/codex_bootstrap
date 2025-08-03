#!/bin/bash

# Container Registry Setup and Image Scanning Pipeline
# Automates Docker image building, tagging, scanning, and pushing to registry

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
REGISTRY="${DOCKER_REGISTRY:-ghcr.io}"
NAMESPACE="${DOCKER_NAMESPACE:-codex-bootstrap}"
VERSION="${BUILD_VERSION:-$(date +%Y%m%d-%H%M%S)}"
SCAN_THRESHOLD="${SCAN_THRESHOLD:-HIGH}"

# Image configurations
BACKEND_IMAGE="${REGISTRY}/${NAMESPACE}/backend"
FRONTEND_IMAGE="${REGISTRY}/${NAMESPACE}/frontend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker login
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker daemon is not running"
        exit 1
    fi
    
    # Check Trivy
    if ! command -v trivy &> /dev/null; then
        log_warning "Trivy not found, installing..."
        case "$(uname -s)" in
            Darwin)
                if command -v brew &> /dev/null; then
                    brew install trivy
                else
                    log_error "Homebrew not found. Please install Trivy manually."
                    exit 1
                fi
                ;;
            Linux)
                curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin
                ;;
            *)
                log_error "Unsupported OS for automatic Trivy installation"
                exit 1
                ;;
        esac
    fi
    
    log_success "Prerequisites check passed"
}

# Build Docker images with BuildKit
build_images() {
    log_info "Building Docker images with security optimizations..."
    
    cd "$PROJECT_ROOT"
    
    # Enable BuildKit for enhanced security and caching
    export DOCKER_BUILDKIT=1
    export BUILDKIT_PROGRESS=plain
    
    # Build backend image with metadata
    log_info "Building backend image..."
    docker build \
        --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
        --build-arg VCS_REF="$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')" \
        --build-arg VERSION="$VERSION" \
        --label org.opencontainers.image.created="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
        --label org.opencontainers.image.version="$VERSION" \
        --label org.opencontainers.image.revision="$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')" \
        --tag "${BACKEND_IMAGE}:${VERSION}" \
        --tag "${BACKEND_IMAGE}:latest" \
        --file Dockerfile.backend \
        --cache-from "${BACKEND_IMAGE}:latest" \
        .
    
    # Build frontend image with metadata
    log_info "Building frontend image..."
    docker build \
        --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
        --build-arg VCS_REF="$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')" \
        --build-arg VERSION="$VERSION" \
        --label org.opencontainers.image.created="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
        --label org.opencontainers.image.version="$VERSION" \
        --label org.opencontainers.image.revision="$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')" \
        --tag "${FRONTEND_IMAGE}:${VERSION}" \
        --tag "${FRONTEND_IMAGE}:latest" \
        --file Dockerfile.frontend \
        --cache-from "${FRONTEND_IMAGE}:latest" \
        .
    
    log_success "Images built successfully"
}

# Scan images for vulnerabilities
scan_images() {
    log_info "Scanning images for vulnerabilities..."
    
    local scan_failed=false
    
    # Scan backend image
    log_info "Scanning backend image..."
    if ! trivy image \
        --exit-code 1 \
        --severity "${SCAN_THRESHOLD},CRITICAL" \
        --format table \
        "${BACKEND_IMAGE}:${VERSION}"; then
        log_error "Backend image failed security scan"
        scan_failed=true
    else
        log_success "Backend image passed security scan"
    fi
    
    # Scan frontend image
    log_info "Scanning frontend image..."
    if ! trivy image \
        --exit-code 1 \
        --severity "${SCAN_THRESHOLD},CRITICAL" \
        --format table \
        "${FRONTEND_IMAGE}:${VERSION}"; then
        log_error "Frontend image failed security scan"
        scan_failed=true
    else
        log_success "Frontend image passed security scan"
    fi
    
    if $scan_failed; then
        log_error "One or more images failed security scanning"
        return 1
    fi
    
    log_success "All images passed security scanning"
}

# Generate SBOM (Software Bill of Materials)
generate_sbom() {
    log_info "Generating Software Bill of Materials (SBOM)..."
    
    mkdir -p "$PROJECT_ROOT/security-reports/sbom"
    
    # Generate SBOM for backend
    log_info "Generating SBOM for backend..."
    trivy image \
        --format spdx-json \
        --output "$PROJECT_ROOT/security-reports/sbom/backend-sbom.spdx.json" \
        "${BACKEND_IMAGE}:${VERSION}"
    
    # Generate SBOM for frontend
    log_info "Generating SBOM for frontend..."
    trivy image \
        --format spdx-json \
        --output "$PROJECT_ROOT/security-reports/sbom/frontend-sbom.spdx.json" \
        "${FRONTEND_IMAGE}:${VERSION}"
    
    log_success "SBOM generated successfully"
}

# Sign images with cosign (if available)
sign_images() {
    if command -v cosign &> /dev/null; then
        log_info "Signing images with cosign..."
        
        # Check if COSIGN_PRIVATE_KEY is set
        if [[ -n "${COSIGN_PRIVATE_KEY:-}" ]]; then
            log_info "Signing backend image..."
            cosign sign --key env://COSIGN_PRIVATE_KEY "${BACKEND_IMAGE}:${VERSION}"
            
            log_info "Signing frontend image..."
            cosign sign --key env://COSIGN_PRIVATE_KEY "${FRONTEND_IMAGE}:${VERSION}"
            
            log_success "Images signed successfully"
        else
            log_warning "COSIGN_PRIVATE_KEY not set, skipping image signing"
        fi
    else
        log_warning "cosign not found, skipping image signing"
    fi
}

# Push images to registry
push_images() {
    log_info "Pushing images to registry..."
    
    # Check if we're logged into the registry
    if ! docker info | grep -q "Registry:"; then
        log_warning "Not logged into container registry. Please run: docker login $REGISTRY"
    fi
    
    # Push backend image
    log_info "Pushing backend image..."
    docker push "${BACKEND_IMAGE}:${VERSION}"
    docker push "${BACKEND_IMAGE}:latest"
    
    # Push frontend image
    log_info "Pushing frontend image..."
    docker push "${FRONTEND_IMAGE}:${VERSION}"
    docker push "${FRONTEND_IMAGE}:latest"
    
    log_success "Images pushed successfully"
    log_info "Backend image: ${BACKEND_IMAGE}:${VERSION}"
    log_info "Frontend image: ${FRONTEND_IMAGE}:${VERSION}"
}

# Clean up local images (optional)
cleanup() {
    if [[ "${CLEANUP_LOCAL:-false}" == "true" ]]; then
        log_info "Cleaning up local images..."
        
        # Remove old images (keep latest 3 versions)
        docker images "${BACKEND_IMAGE}" --format "table {{.Repository}}:{{.Tag}}\t{{.CreatedAt}}" | \
            tail -n +4 | awk '{print $1}' | xargs -r docker rmi || true
        
        docker images "${FRONTEND_IMAGE}" --format "table {{.Repository}}:{{.Tag}}\t{{.CreatedAt}}" | \
            tail -n +4 | awk '{print $1}' | xargs -r docker rmi || true
        
        log_success "Local cleanup completed"
    fi
}

# Generate manifest and deployment info
generate_deployment_info() {
    log_info "Generating deployment information..."
    
    local deploy_info_file="$PROJECT_ROOT/security-reports/deployment-info-${VERSION}.json"
    
    cat > "$deploy_info_file" << EOF
{
  "version": "$VERSION",
  "timestamp": "$(date -u +'%Y-%m-%dT%H:%M:%SZ')",
  "git_commit": "$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
  "images": {
    "backend": {
      "image": "${BACKEND_IMAGE}:${VERSION}",
      "digest": "$(docker inspect --format='{{index .RepoDigests 0}}' "${BACKEND_IMAGE}:${VERSION}" 2>/dev/null || echo 'unknown')",
      "size": "$(docker inspect --format='{{.Size}}' "${BACKEND_IMAGE}:${VERSION}" 2>/dev/null || echo 'unknown')"
    },
    "frontend": {
      "image": "${FRONTEND_IMAGE}:${VERSION}",
      "digest": "$(docker inspect --format='{{index .RepoDigests 0}}' "${FRONTEND_IMAGE}:${VERSION}" 2>/dev/null || echo 'unknown')",
      "size": "$(docker inspect --format='{{.Size}}' "${FRONTEND_IMAGE}:${VERSION}" 2>/dev/null || echo 'unknown')"
    }
  },
  "security": {
    "scan_threshold": "$SCAN_THRESHOLD",
    "sbom_generated": true,
    "signed": $(command -v cosign &> /dev/null && [[ -n "${COSIGN_PRIVATE_KEY:-}" ]] && echo "true" || echo "false")
  }
}
EOF
    
    log_success "Deployment info generated: $deploy_info_file"
}

# Main execution
main() {
    log_info "Starting container registry pipeline for Codex Bootstrap"
    log_info "Registry: $REGISTRY"
    log_info "Namespace: $NAMESPACE"
    log_info "Version: $VERSION"
    log_info "Scan Threshold: $SCAN_THRESHOLD"
    
    # Execute pipeline steps
    check_prerequisites
    build_images
    
    # Security scanning
    if ! scan_images; then
        log_error "Security scanning failed. Aborting pipeline."
        exit 1
    fi
    
    # Generate SBOM
    generate_sbom
    
    # Sign images (optional)
    sign_images
    
    # Push to registry
    if [[ "${PUSH_IMAGES:-true}" == "true" ]]; then
        push_images
    else
        log_info "Skipping image push (PUSH_IMAGES=false)"
    fi
    
    # Generate deployment info
    generate_deployment_info
    
    # Cleanup
    cleanup
    
    log_success "Container registry pipeline completed successfully!"
    log_info "Images are ready for deployment:"
    log_info "  Backend: ${BACKEND_IMAGE}:${VERSION}"
    log_info "  Frontend: ${FRONTEND_IMAGE}:${VERSION}"
}

# Execute main function with all arguments
main "$@"
