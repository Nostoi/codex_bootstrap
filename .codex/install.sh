#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Setting up Codex Bootstrap environment (Node.js Full-Stack)..."

echo "� Installing backend dependencies (NestJS)..."
cd backend
npm install

# Verify key NestJS dependencies are installed
if ! npm list @nestjs/core >/dev/null 2>&1; then
  echo "NestJS core not found, installing explicitly..."
  npm install @nestjs/core @nestjs/common @nestjs/platform-express --save
fi

if ! npm list prisma >/dev/null 2>&1; then
  echo "Prisma not found, installing explicitly..."
  npm install prisma @prisma/client --save
fi

if ! npm list y-websocket >/dev/null 2>&1; then
  echo "y-websocket not found, installing explicitly..."
  npm install y-websocket yjs --save
fi

if ! npm list @microsoft/microsoft-graph-client >/dev/null 2>&1; then
  echo "Microsoft Graph SDK not found, installing explicitly..."
  npm install @microsoft/microsoft-graph-client --save
fi

if ! npm list googleapis >/dev/null 2>&1; then
  echo "Google APIs not found, installing explicitly..."
  npm install googleapis --save
fi

if ! npm list jest >/dev/null 2>&1; then
  echo "Jest not found, installing explicitly..."
  npm install jest @nestjs/testing --save-dev
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

cd ..

echo "🌐 Installing frontend dependencies (Next.js)..."
cd frontend

npm install

# Verify key Next.js dependencies are installed
if ! npm list next >/dev/null 2>&1; then
  echo "Next.js not found, installing explicitly..."
  npm install next --save
fi

if ! npm list typescript >/dev/null 2>&1; then
  echo "TypeScript not found, installing explicitly..."
  npm install typescript @types/node @types/react @types/react-dom --save-dev
fi

if ! npm list daisyui >/dev/null 2>&1; then
  echo "DaisyUI not found, installing explicitly..."
  npm install daisyui --save-dev
fi

if ! npm list zustand >/dev/null 2>&1; then
  echo "Zustand not found, installing explicitly..."
  npm install zustand --save
fi

if ! npm list @tanstack/react-query >/dev/null 2>&1; then
  echo "React Query not found, installing explicitly..."
  npm install @tanstack/react-query @tanstack/react-query-devtools --save
fi

if ! npm list jest >/dev/null 2>&1; then
  echo "Jest not found, installing explicitly..."
  npm install jest jest-environment-jsdom --save-dev
fi

cd ..

echo "✅ Installation complete!"
echo ""
echo "🏗️  Full-Stack Architecture Ready:"
echo "- Backend:  NestJS + Prisma + PostgreSQL"
echo "- Frontend: Next.js + TypeScript + Tailwind + DaisyUI"
echo "- State:    Zustand + React Query"
echo "- Real-time: y-websocket (CRDT sync)"
echo "- APIs:     Microsoft Graph + Google APIs"
echo ""
echo "🚀 Ready for development with:"
echo "  ./dev_init.sh    # Start development servers"
echo "  ./run_tests.sh   # Run test suites"
