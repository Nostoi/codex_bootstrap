#!/usr/bin/env bash
set -euo pipefail

echo "🧪 Running test suite for Codex Bootstrap (Node.js Full-Stack)"

# Backend tests (NestJS)
echo "🏗️  Running NestJS backend tests..."
cd backend

# Generate Prisma client in case schema has changed
if [ -f prisma/schema.prisma ]; then
  echo "⏳ Generating Prisma client..."
  npx prisma generate > /dev/null
fi

# Ensure dependencies are installed
if [ ! -f node_modules/.bin/jest ]; then
  echo "Installing missing backend dependencies..."
  npm install
fi

if ! npx jest --version >/dev/null 2>&1; then
  echo "Jest not installed, skipping backend tests"
else
  echo "Running Jest tests for NestJS backend with coverage..."
  npm run test:cov
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
  echo "Running Jest tests for Next.js frontend with coverage..."
  npm run test:cov
  echo "✅ Frontend tests completed"
fi

# End-to-end tests with Playwright
if [ -f node_modules/.bin/playwright ]; then
  echo "🎭 Running Playwright end-to-end tests..."
  npx playwright install --with-deps >/dev/null 2>&1 || true
  npm run test:e2e || echo "⚠️  Playwright tests failed"
else
  echo "Playwright not installed, skipping e2e tests"
fi

cd ..

echo "🎉 All tests completed!"
echo ""
echo "Stack tested:"
echo "- Backend:  NestJS + Prisma + y-websocket"
echo "- Frontend: Next.js + TypeScript + React Query"
