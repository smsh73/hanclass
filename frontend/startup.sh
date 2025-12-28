#!/bin/sh
cd /home/site/wwwroot
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

# Check if standalone build exists
if [ -d ".next/standalone" ]; then
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
else
  echo "Standalone build not found. Using npm start..."
  exec npm start
fi

