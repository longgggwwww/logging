#!/bin/bash

# Script to clean old node_modules and reinstall with workspaces
# Usage: ./scripts/clean-install.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo "🧹 Cleaning old node_modules..."
echo "================================================"

# Remove all node_modules directories
echo "Removing node_modules from services..."
rm -rf services/*/node_modules
rm -rf test-producer/node_modules
rm -rf web-app/node_modules

echo "Removing root node_modules..."
rm -rf node_modules

echo "Removing package-lock.json files..."
rm -f services/*/package-lock.json
rm -f test-producer/package-lock.json
rm -f package-lock.json

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📦 Installing dependencies with npm workspaces..."
echo "================================================"

npm install

echo ""
echo "✅ Installation complete!"
echo ""
echo "📊 Summary:"
echo "-------------------------------------------"
du -sh node_modules/ 2>/dev/null && echo "Root node_modules size: $(du -sh node_modules/ | cut -f1)"

total_service_size=0
for dir in services/*/node_modules test-producer/node_modules; do
  if [ -d "$dir" ]; then
    size=$(du -sh "$dir" 2>/dev/null | cut -f1)
    echo "  $dir: $size"
  fi
done

echo ""
echo "💡 Next steps:"
echo "   1. Run 'npm run build:all' to build all services"
echo "   2. Run './scripts/build-all.sh' to build Docker images"
echo "   3. Run 'docker-compose up -d' to start services"
