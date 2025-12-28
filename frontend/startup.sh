#!/bin/sh
cd /home/site/wwwroot
export NODE_ENV=production
export PORT=${PORT:-8080}
export HOSTNAME=0.0.0.0

echo "=== Frontend Startup Script ==="
echo "Working directory: $(pwd)"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install --production=false
fi

# Build if .next doesn't exist
if [ ! -d ".next" ]; then
  echo "Building Next.js..."
  npm run build || {
    echo "Build failed!"
    exit 1
  }
fi

# Start server
if [ -d ".next/standalone" ]; then
  echo "Starting standalone server..."
  cd .next/standalone
  exec node server.js
else
  echo "Starting Next.js server..."
  exec npm start
fi

