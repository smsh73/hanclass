#!/bin/sh
cd /home/site/wwwroot
echo "Current directory: $(pwd)"
echo "Files in directory:"
ls -la
echo "Installing dependencies..."
npm install
echo "Building Next.js application..."
npm run build || (echo "Build failed, but continuing..." && exit 0)
echo "Starting Next.js application..."
exec npm start

