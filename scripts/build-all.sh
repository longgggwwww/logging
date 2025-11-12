#!/bin/bash

# Script to build all services with workspace optimization
# Usage: ./scripts/build-all.sh [--parallel]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo "🏗️  Building all services with npm workspaces..."
echo "================================================"

SERVICES=(
  "api"
  "discord-bot"
  "fcm"
  "processor"
  "realtime"
  "web-app"
)

if [ "$1" == "--parallel" ]; then
  echo "📦 Building services in parallel..."
  
  for service in "${SERVICES[@]}"; do
    echo "   Starting build for $service..."
    docker-compose build "$service" &
  done
  
  wait
  echo "✅ All services built successfully in parallel!"
else
  echo "📦 Building services sequentially..."
  
  for service in "${SERVICES[@]}"; do
    echo ""
    echo "🔨 Building $service..."
    echo "-------------------------------------------"
    docker-compose build "$service"
    echo "✅ $service built successfully!"
  done
  
  echo ""
  echo "✅ All services built successfully!"
fi

echo ""
echo "================================================"
echo "📊 Image sizes:"
docker images --format "table {{.Repository}}\t{{.Size}}" | grep "log-monitoring"

echo ""
echo "💡 Tip: Use 'docker-compose up -d' to start all services"
