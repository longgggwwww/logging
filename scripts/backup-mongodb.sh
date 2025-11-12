#!/bin/bash

# MongoDB Backup Script
# Backs up MongoDB docker volume to compressed archive

set -e

# Default configuration
BACKUP_DIR="/var/backups/mongodb"
CONTAINER_NAME="mongodb"
RETENTION_DAYS=7
ENV_FILE=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --env-file)
            ENV_FILE="$2"
            shift 2
            ;;
        --backup-dir)
            BACKUP_DIR="$2"
            shift 2
            ;;
        --retention-days)
            RETENTION_DAYS="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --env-file FILE         Path to .env file (default: auto-detect)"
            echo "  --backup-dir DIR        Backup directory (default: /var/backups/mongodb)"
            echo "  --retention-days DAYS   Days to keep backups (default: 7)"
            echo "  --help                  Show this help message"
            echo ""
            echo "Example:"
            echo "  $0 --env-file .env --backup-dir /backups --retention-days 14"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Auto-detect .env file if not specified
if [ -z "$ENV_FILE" ]; then
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
    
    if [ -f "$PROJECT_ROOT/.env" ]; then
        ENV_FILE="$PROJECT_ROOT/.env"
    elif [ -f "$PWD/.env" ]; then
        ENV_FILE="$PWD/.env"
    fi
fi

# Load environment variables from .env file
if [ -n "$ENV_FILE" ] && [ -f "$ENV_FILE" ]; then
    echo "Loading environment variables from: $ENV_FILE"
    # Export variables from .env file
    set -a
    source "$ENV_FILE"
    set +a
else
    echo "Warning: .env file not found. Using default values."
fi

# MongoDB Configuration (using environment variables with defaults)
MONGO_USER="${MONGO_USERNAME:-longgggwww}"
MONGO_PASS="${MONGO_PASSWORD:-123456}"
MONGO_DB="${MONGO_DATABASE:-logs}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="mongodb_backup_${DATE}.tar.gz"

# Create backup directory if it doesn't exist with proper permissions
if [ ! -d "$BACKUP_DIR" ]; then
    echo "Creating backup directory: $BACKUP_DIR"
    sudo mkdir -p "$BACKUP_DIR"
    sudo chown $USER:$USER "$BACKUP_DIR"
    sudo chmod 755 "$BACKUP_DIR"
fi

# Check if we have write permission
if [ ! -w "$BACKUP_DIR" ]; then
    echo "Error: No write permission for $BACKUP_DIR"
    echo "Run: sudo chown $USER:$USER $BACKUP_DIR"
    exit 1
fi

echo "==================================="
echo "MongoDB Backup Started: $(date)"
echo "==================================="

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "Error: MongoDB container is not running!"
    exit 1
fi

# Create temporary directory for backup
TEMP_BACKUP_DIR="/tmp/mongodb_backup_${DATE}"
mkdir -p "$TEMP_BACKUP_DIR"

# Perform mongodump
echo "Creating MongoDB dump..."
docker exec "$CONTAINER_NAME" mongodump \
    --username="$MONGO_USER" \
    --password="$MONGO_PASS" \
    --authenticationDatabase=admin \
    --db="$MONGO_DB" \
    --out=/tmp/backup

# Copy dump from container to host
echo "Copying backup from container..."
docker cp "${CONTAINER_NAME}:/tmp/backup" "$TEMP_BACKUP_DIR/"

# Compress backup
echo "Compressing backup..."
tar -czf "${BACKUP_DIR}/${BACKUP_NAME}" -C "$TEMP_BACKUP_DIR" .

# Clean up temporary files in container and host
echo "Cleaning up temporary files..."
docker exec "$CONTAINER_NAME" rm -rf /tmp/backup
rm -rf "$TEMP_BACKUP_DIR"

# Get backup size
BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_NAME}" | cut -f1)
echo "Backup created: ${BACKUP_NAME} (${BACKUP_SIZE})"

# Remove old backups (older than RETENTION_DAYS)
echo "Removing backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -name "mongodb_backup_*.tar.gz" -type f -mtime +${RETENTION_DAYS} -delete

# List current backups
echo ""
echo "Current backups:"
ls -lh "$BACKUP_DIR"/mongodb_backup_*.tar.gz 2>/dev/null || echo "No backups found"

echo ""
echo "==================================="
echo "MongoDB Backup Completed: $(date)"
echo "==================================="

# Optional: Send notification (uncomment if needed)
# curl -X POST "your-notification-webhook-url" \
#     -H "Content-Type: application/json" \
#     -d "{\"message\": \"MongoDB backup completed: ${BACKUP_NAME}\"}"
