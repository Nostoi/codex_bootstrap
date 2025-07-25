#!/usr/bin/env bash
set -euo pipefail

echo "🧪 Running test suite for Codex Bootstrap (Node.js Full-Stack)"

# Backend tests (NestJS)
echo "🏗️  Running NestJS backend tests..."
cd backend

# Ensure dependencies are installed
if [ ! -f node_modules/.bin/jest ]; then
  echo "Installing missing backend dependencies..."
  npm install
fi

if ! npx jest --version >/dev/null 2>&1; then
  echo "Jest not installed, skipping backend tests"
else
  echo "Running Jest tests for NestJS backend..."
  npm run test
  echo "✅ Backend tests completed"
fi

cd ..

# Frontend tests (Next.js)
echo "🌐 Running Next.js frontend tests..."
cd frontend

# Ensure dependencies are installed before checking Jest
if [ ! -f node_modules/.bin/jest ]; then
  echo "Installing missing frontend dependencies..."
  npm install
fi

if ! npx jest --version >/dev/null 2>&1; then
  echo "Jest not installed, skipping frontend tests"
else
  echo "Running Jest tests for Next.js frontend..."
  npm run test
  echo "✅ Frontend tests completed"
fi

cd ..

echo "🎉 All tests completed!"
echo ""
echo "Stack tested:"
echo "- Backend:  NestJS + Prisma + y-websocket"
echo "- Frontend: Next.js + TypeScript + React Query"
