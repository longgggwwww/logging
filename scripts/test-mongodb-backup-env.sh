#!/bin/bash

# Test script to verify environment variable loading

echo "=========================================="
echo "MongoDB Backup Scripts - Environment Test"
echo "=========================================="
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Project root: $PROJECT_ROOT"
echo ""

# Test 1: Check if .env exists
echo "Test 1: Checking .env file..."
if [ -f "$PROJECT_ROOT/.env" ]; then
    echo "✅ .env file found at: $PROJECT_ROOT/.env"
    echo ""
    echo "MongoDB variables in .env:"
    grep "^MONGO_" "$PROJECT_ROOT/.env" || echo "No MONGO_ variables found"
else
    echo "❌ .env file not found"
fi
echo ""

# Test 2: Test backup script help
echo "Test 2: Testing backup-mongodb.sh --help..."
"$SCRIPT_DIR/backup-mongodb.sh" --help
echo ""

# Test 3: Test restore script help
echo "Test 3: Testing restore-mongodb.sh --help..."
"$SCRIPT_DIR/restore-mongodb.sh" --help
echo ""

# Test 4: Test setup cronjob script help
echo "Test 4: Testing setup-mongodb-backup-cron.sh --help..."
"$SCRIPT_DIR/setup-mongodb-backup-cron.sh" --help
echo ""

# Test 5: Test .env loading (dry run)
echo "Test 5: Testing .env loading..."
if [ -f "$PROJECT_ROOT/.env" ]; then
    set -a
    source "$PROJECT_ROOT/.env"
    set +a
    
    echo "Loaded environment variables:"
    echo "  MONGO_USERNAME: ${MONGO_USERNAME:-<not set>}"
    echo "  MONGO_PASSWORD: ${MONGO_PASSWORD:+****} (hidden)"
    echo "  MONGO_DATABASE: ${MONGO_DATABASE:-<not set>}"
    
    if [ -n "$MONGO_USERNAME" ] && [ -n "$MONGO_PASSWORD" ] && [ -n "$MONGO_DATABASE" ]; then
        echo "✅ All MongoDB variables loaded successfully"
    else
        echo "⚠️  Some MongoDB variables are missing"
    fi
else
    echo "⚠️  .env file not found, will use defaults"
fi
echo ""

echo "=========================================="
echo "Test completed!"
echo "=========================================="
