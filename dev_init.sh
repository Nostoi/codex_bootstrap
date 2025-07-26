#!/usr/bin/env bash
# Run with USE_DOCKER=true to start docker-compose containers

set -euo pipefail

echo "🚀 Starting Codex Bootstrap Development Environment (Node.js Full-Stack)"

# Optionally start with Docker
: "${USE_DOCKER:=false}"
if [ "$USE_DOCKER" = "true" ] && command -v docker >/dev/null 2>&1; then
    echo "🐳 Starting services using docker-compose..."
    docker compose up -d
    echo "🛑 Stop containers with: docker compose down"
    echo "✅ Containers started. Frontend: http://localhost:3000  Backend: http://localhost:8000"
    exit 0
fi

# Export optional debug environment variables if provided
: "${DEBUG:=false}"
if [ "$DEBUG" = "true" ]; then
    export DEBUG
    echo "🐛 Debug mode enabled"
fi

# CORS allowed origins for the backend (Next.js runs on port 3000)
: "${ALLOW_ORIGINS:=http://localhost:3000}"
export CORS_ORIGIN="$ALLOW_ORIGINS"

# Ensure root .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env from template..."
    cp .env.template .env
    echo "⚠️  Review .env and update secrets accordingly"
fi

echo "🛑 Killing existing processes..."
# Kill existing processes
pkill -f "nest start" || true
pkill -f "next" || true
pkill -f "y-websocket" || true

echo "�️  Setting up database..."
# Check if .env file exists in backend
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating backend .env file from example..."
    cp backend/.env.example backend/.env
    echo "⚠️  Please configure your database connection in backend/.env"
fi

echo "📦 Installing root git hooks..."
npm install

echo "📦 Installing backend dependencies..."
# Install backend dependencies
cd backend
npm install
echo "✅ Installed Node.js backend dependencies"

# Generate Prisma client and run migrations
echo "🔧 Setting up Prisma database..."
npx prisma generate
npx prisma db push
echo "✅ Database setup complete"

echo "🌐 Setting up Next.js frontend..."
# Install frontend dependencies
cd ../frontend
npm install
echo "✅ Installed Next.js frontend dependencies"
cd ..

echo "🎯 Starting services..."
# Start backend in background
cd backend
npm run start:dev &
BACKEND_PID=$!
echo "✅ NestJS backend started on http://localhost:8000 (PID: $BACKEND_PID)"
cd ..

# Start frontend in background
cd frontend
npm run dev &
FRONTEND_PID=$!
echo "✅ Next.js frontend started on http://localhost:3000 (PID: $FRONTEND_PID)"
cd ..

# Wait briefly for servers to start
echo "⏳ Waiting for servers to initialize..."
sleep 5

# Open in default browser (macOS or Linux)
if [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:3000
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open http://localhost:3000
fi

echo ""
echo "🎉 Full-stack development environment is ready!"
echo "Frontend:          http://localhost:3000"
echo "Backend API:       http://localhost:8000"
echo "API Documentation: http://localhost:8000/api/docs"
echo "Collaboration WS:  ws://localhost:8001/collaboration"
echo ""
echo "Stack:"
echo "- Frontend: Next.js 14+ + TypeScript + Tailwind + DaisyUI"
echo "- Backend:  NestJS + Prisma + PostgreSQL"
echo "- Real-time: y-websocket (CRDT sync)"
echo "- APIs: Microsoft Graph + Google APIs"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for servers to shut down manually
trap 'echo "🛑 Shutting down..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true; exit 0' INT
wait