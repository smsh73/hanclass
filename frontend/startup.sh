#!/bin/sh
# Docker 컨테이너에서는 /app이 작업 디렉토리
# Azure App Service ZIP 배포에서는 /home/site/wwwroot이 작업 디렉토리
if [ -d "/home/site/wwwroot" ]; then
  cd /home/site/wwwroot
else
  cd /app
fi

export NODE_ENV=production
export PORT=${PORT:-8080}
export HOSTNAME=0.0.0.0

echo "=== Frontend Startup Script ==="
echo "Working directory: $(pwd)"
echo "Files in directory:"
ls -la | head -20

# Docker 컨테이너에서는 이미 빌드가 완료되어 있으므로 빌드 과정 생략
# Azure App Service ZIP 배포에서만 빌드 수행
if [ ! -d ".next" ] && [ ! -f "server.js" ]; then
  echo "No build found. Starting build process..."
  
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
else
  echo "Build already exists. Skipping build process..."
fi

# Docker 컨테이너에서는 이미 빌드가 완료되어 있으므로 빌드 과정 생략
if [ -f "server.js" ]; then
  echo "Standalone server.js found in root. Starting..."
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
  echo "Standalone server.js found in .next/standalone. Starting..."
  cd .next/standalone
  exec node server.js
else
  echo "Standalone build not found. Using npm start..."
  exec npm start
fi

