#!/bin/bash

# Port Configuration Script for Codex Bootstrap
# This script centralizes port management and updates all configuration files

# Default port configuration
export FRONTEND_PORT=${FRONTEND_PORT:-3500}
export BACKEND_PORT=${BACKEND_PORT:-3501}
export WEBSOCKET_PORT=${WEBSOCKET_PORT:-3502}

echo "🔧 Codex Bootstrap Port Configuration"
echo "======================================"
echo "Frontend Port:  $FRONTEND_PORT"
echo "Backend Port:   $BACKEND_PORT"
echo "WebSocket Port: $WEBSOCKET_PORT"
echo ""

# Function to update .env files
update_env_files() {
    echo "📝 Updating environment files..."
    
    # Update frontend .env.local
    if [ -f "frontend/.env.local" ]; then
        sed -i.bak "s/NEXT_PUBLIC_FRONTEND_PORT=.*/NEXT_PUBLIC_FRONTEND_PORT=$FRONTEND_PORT/" frontend/.env.local
        sed -i.bak "s/NEXT_PUBLIC_BACKEND_PORT=.*/NEXT_PUBLIC_BACKEND_PORT=$BACKEND_PORT/" frontend/.env.local
        sed -i.bak "s/NEXT_PUBLIC_WEBSOCKET_PORT=.*/NEXT_PUBLIC_WEBSOCKET_PORT=$WEBSOCKET_PORT/" frontend/.env.local
        sed -i.bak "s|NEXT_PUBLIC_WS_URL=.*|NEXT_PUBLIC_WS_URL=ws://localhost:$BACKEND_PORT|" frontend/.env.local
        sed -i.bak "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=http://localhost:$BACKEND_PORT/api|" frontend/.env.local
        echo "✅ Updated frontend/.env.local"
    fi
    
    # Update backend .env
    if [ -f "backend/.env" ]; then
        sed -i.bak "s/FRONTEND_PORT=.*/FRONTEND_PORT=$FRONTEND_PORT/" backend/.env
        sed -i.bak "s/BACKEND_PORT=.*/BACKEND_PORT=$BACKEND_PORT/" backend/.env
        sed -i.bak "s/WEBSOCKET_PORT=.*/WEBSOCKET_PORT=$WEBSOCKET_PORT/" backend/.env
        sed -i.bak "s/PORT=.*/PORT=$BACKEND_PORT/" backend/.env
        sed -i.bak "s|CORS_ORIGIN=.*|CORS_ORIGIN=\"http://localhost:$FRONTEND_PORT\"|" backend/.env
        sed -i.bak "s|FRONTEND_URL=.*|FRONTEND_URL=\"http://localhost:$FRONTEND_PORT\"|" backend/.env
        echo "✅ Updated backend/.env"
    fi
}

# Function to show current port usage
show_port_status() {
    echo "🔍 Checking port availability..."
    
    for port in $FRONTEND_PORT $BACKEND_PORT $WEBSOCKET_PORT; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo "❌ Port $port is in use"
        else
            echo "✅ Port $port is available"
        fi
    done
}

# Function to start services with correct ports
start_services() {
    echo "🚀 Starting services with configured ports..."
    
    # Set environment variables for the session
    export NEXT_PUBLIC_FRONTEND_PORT=$FRONTEND_PORT
    export NEXT_PUBLIC_BACKEND_PORT=$BACKEND_PORT
    export NEXT_PUBLIC_WEBSOCKET_PORT=$WEBSOCKET_PORT
    
    echo "Use these commands to start services:"
    echo "  Backend:  cd backend && PORT=$BACKEND_PORT pnpm run start:dev"
    echo "  Frontend: cd frontend && NEXT_PUBLIC_FRONTEND_PORT=$FRONTEND_PORT pnpm run dev"
    echo "  Storybook: cd frontend && pnpm run storybook"
}

# Main execution
case "${1:-help}" in
    "update")
        update_env_files
        ;;
    "status")
        show_port_status
        ;;
    "start")
        start_services
        ;;
    "help"|*)
        echo "Usage: $0 [update|status|start|help]"
        echo ""
        echo "Commands:"
        echo "  update  - Update all .env files with current port configuration"
        echo "  status  - Check if ports are available"
        echo "  start   - Show commands to start services with correct ports"
        echo "  help    - Show this help message"
        echo ""
        echo "Environment Variables:"
        echo "  FRONTEND_PORT  - Frontend server port (default: 3500)"
        echo "  BACKEND_PORT   - Backend server port (default: 3501)"
        echo "  WEBSOCKET_PORT - WebSocket server port (default: 3502)"
        ;;
esac
