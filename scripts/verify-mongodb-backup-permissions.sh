#!/bin/bash

# Script to verify and fix permissions for MongoDB backup

echo "=========================================="
echo "MongoDB Backup - Permission Verification"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

USER_NAME=$(whoami)

echo "Current user: $USER_NAME"
echo ""

# Check 1: Docker group membership
echo "Check 1: Docker access..."
if groups | grep -q docker; then
    echo -e "${GREEN}✓${NC} User is in docker group"
else
    echo -e "${RED}✗${NC} User is NOT in docker group"
    echo "   Fix: sudo usermod -aG docker $USER_NAME"
    echo "   Then logout and login again"
fi
echo ""

# Check 2: Backup directory
echo "Check 2: Backup directory permissions..."
BACKUP_DIR="/var/backups/mongodb"
if [ -d "$BACKUP_DIR" ]; then
    DIR_OWNER=$(stat -c '%U' "$BACKUP_DIR")
    DIR_PERMS=$(stat -c '%a' "$BACKUP_DIR")
    
    if [ "$DIR_OWNER" = "$USER_NAME" ] && [ -w "$BACKUP_DIR" ]; then
        echo -e "${GREEN}✓${NC} $BACKUP_DIR is writable"
        echo "   Owner: $DIR_OWNER, Permissions: $DIR_PERMS"
    else
        echo -e "${YELLOW}⚠${NC} $BACKUP_DIR needs permission fix"
        echo "   Owner: $DIR_OWNER, Permissions: $DIR_PERMS"
        echo "   Fix: sudo chown $USER_NAME:$USER_NAME $BACKUP_DIR"
    fi
else
    echo -e "${YELLOW}⚠${NC} $BACKUP_DIR does not exist"
    echo "   Will be created on first backup"
fi
echo ""

# Check 3: Log file
echo "Check 3: Log file permissions..."
LOG_FILE="/var/log/mongodb-backup.log"
if [ -f "$LOG_FILE" ]; then
    LOG_OWNER=$(stat -c '%U' "$LOG_FILE")
    LOG_PERMS=$(stat -c '%a' "$LOG_FILE")
    
    if [ "$LOG_OWNER" = "$USER_NAME" ] && [ -w "$LOG_FILE" ]; then
        echo -e "${GREEN}✓${NC} $LOG_FILE is writable"
        echo "   Owner: $LOG_OWNER, Permissions: $LOG_PERMS"
    else
        echo -e "${YELLOW}⚠${NC} $LOG_FILE needs permission fix"
        echo "   Owner: $LOG_OWNER, Permissions: $LOG_PERMS"
        echo "   Fix: sudo chown $USER_NAME:$USER_NAME $LOG_FILE"
    fi
else
    echo -e "${YELLOW}⚠${NC} $LOG_FILE does not exist"
    echo "   Will be created on setup"
fi
echo ""

# Check 4: MongoDB container
echo "Check 4: MongoDB container..."
if docker ps --format '{{.Names}}' | grep -q "^mongodb$"; then
    echo -e "${GREEN}✓${NC} MongoDB container is running"
else
    echo -e "${YELLOW}⚠${NC} MongoDB container is NOT running"
    echo "   Start with: docker-compose up -d mongodb"
fi
echo ""

# Check 5: Crontab
echo "Check 5: Crontab configuration..."
if crontab -l 2>/dev/null | grep -q "backup-mongodb.sh"; then
    echo -e "${GREEN}✓${NC} Cronjob is configured"
    echo "   Schedule:"
    crontab -l | grep "backup-mongodb.sh"
else
    echo -e "${YELLOW}⚠${NC} No cronjob configured"
    echo "   Setup with: ./scripts/setup-mongodb-backup-cron.sh --env-file .env"
fi
echo ""

# Check 6: .env file
echo "Check 6: Environment file..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env"

if [ -f "$ENV_FILE" ]; then
    echo -e "${GREEN}✓${NC} .env file exists: $ENV_FILE"
    
    # Check MongoDB variables
    if grep -q "^MONGO_USERNAME=" "$ENV_FILE" && \
       grep -q "^MONGO_PASSWORD=" "$ENV_FILE" && \
       grep -q "^MONGO_DATABASE=" "$ENV_FILE"; then
        echo -e "${GREEN}✓${NC} All MongoDB variables are defined"
    else
        echo -e "${YELLOW}⚠${NC} Some MongoDB variables are missing"
    fi
else
    echo -e "${YELLOW}⚠${NC} .env file not found"
    echo "   Copy from: cp .env.example .env"
fi
echo ""

echo "=========================================="
echo "Summary"
echo "=========================================="

# Count issues
ISSUES=0

if ! groups | grep -q docker; then
    ((ISSUES++))
fi

if [ -d "$BACKUP_DIR" ] && { [ "$(stat -c '%U' "$BACKUP_DIR")" != "$USER_NAME" ] || [ ! -w "$BACKUP_DIR" ]; }; then
    ((ISSUES++))
fi

if [ -f "$LOG_FILE" ] && { [ "$(stat -c '%U' "$LOG_FILE")" != "$USER_NAME" ] || [ ! -w "$LOG_FILE" ]; }; then
    ((ISSUES++))
fi

if ! docker ps --format '{{.Names}}' | grep -q "^mongodb$"; then
    ((ISSUES++))
fi

if ! crontab -l 2>/dev/null | grep -q "backup-mongodb.sh"; then
    ((ISSUES++))
fi

if [ ! -f "$ENV_FILE" ]; then
    ((ISSUES++))
fi

if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo "  MongoDB backup system is ready to use."
    echo ""
    echo "Test backup with:"
    echo "  ./scripts/backup-mongodb.sh --env-file .env"
else
    echo -e "${YELLOW}⚠ Found $ISSUES issue(s) that need attention.${NC}"
    echo "  Review the checks above and apply suggested fixes."
fi

echo ""
echo "=========================================="
