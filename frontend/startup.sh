#!/bin/sh
# Azure App Service ZIP 배포용 스크립트
# Docker 컨테이너에서는 이미 빌드가 완료되어 있으므로 이 스크립트를 사용하지 않음

# Docker 컨테이너 환경 감지 - 빠른 감지 및 실행
if [ -d ".next" ] && [ -d "node_modules" ] && [ ! -d "/home/site/wwwroot" ]; then
  # Docker 환경: 바로 서버 시작
  if [ -f "server.js" ]; then
    exec node server.js
  elif [ -f ".next/standalone/server.js" ]; then
    cd .next/standalone
    [ -d "../static" ] && [ ! -d ".next/static" ] && mkdir -p .next && cp -r ../static .next/static 2>/dev/null || true
    [ -d "../../public" ] && [ ! -d "public" ] && cp -r ../../public ./public 2>/dev/null || true
    exec node server.js
  elif [ -d ".next/standalone" ] && [ -f ".next/standalone/server.js" ]; then
    cd .next/standalone
    [ -d "../static" ] && [ ! -d ".next/static" ] && mkdir -p .next && cp -r ../static .next/static 2>/dev/null || true
    [ -d "../../public" ] && [ ! -d "public" ] && cp -r ../../public ./public 2>/dev/null || true
    exec node server.js
  else
    exec npm start
  fi
fi

# Azure App Service ZIP 배포 환경
# 작업 디렉토리 확인
if [ -d "/home/site/wwwroot" ]; then
  cd /home/site/wwwroot
elif [ -d "/app" ]; then
  cd /app
else
  echo "Warning: Could not find working directory, using current directory"
fi

export NODE_ENV=production
export PORT=${PORT:-8080}
export HOSTNAME=0.0.0.0

echo "=== Frontend Startup Script ==="
echo "Working directory: $(pwd)"
echo "Files in directory:"
ls -la | head -20

# Clean up existing node_modules if it exists and has permission issues
if [ -d "node_modules" ]; then
  echo "Cleaning up existing node_modules..."
  rm -rf node_modules 2>/dev/null || {
    echo "Warning: Could not remove node_modules, continuing..."
  }
fi

# Clean npm cache
echo "Cleaning npm cache..."
npm cache clean --force 2>/dev/null || true

# Install dependencies with proper flags
echo "Installing dependencies..."
npm install --production=false --legacy-peer-deps --no-audit --no-fund || {
  echo "npm install failed, trying with --force..."
  npm install --production=false --legacy-peer-deps --force --no-audit --no-fund || {
    echo "npm install failed completely!"
    exit 1
  }
}

# Verify next is installed
if ! command -v next &> /dev/null && [ ! -f "node_modules/.bin/next" ]; then
  echo "Error: next command not found after installation"
  echo "Checking node_modules..."
  ls -la node_modules/.bin/ | head -10 || echo "node_modules/.bin not found"
  exit 1
fi

# Build Next.js
echo "Building Next.js..."
npm run build || {
  echo "Build failed!"
  exit 1
}

# Docker 컨테이너에서는 이미 빌드가 완료되어 있으므로 직접 실행
# Azure App Service ZIP 배포에서는 빌드 필요
if [ -f "server.js" ]; then
  echo "Standalone server.js found. Starting directly..."
  exec node server.js
elif [ -d ".next/standalone" ]; then
  echo "Standalone build found. Setting up..."
  # Copy static files to standalone directory
  if [ -d ".next/static" ]; then
    cp -r .next/static .next/standalone/.next/static 2>/dev/null || true
  fi
  if [ -d "public" ]; then
    cp -r public .next/standalone/public 2>/dev/null || true
  fi
  cd .next/standalone
  echo "Starting standalone server from $(pwd)..."
  exec node server.js
elif [ -f ".next/standalone/server.js" ]; then
  echo "Starting standalone server from .next/standalone..."
  exec node .next/standalone/server.js
else
  echo "Standalone build not found. Using npm start..."
  exec npm start
fi

