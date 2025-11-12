#!/bin/bash

# MongoDB Restore Script
# Restores MongoDB from a backup archive

set -e

# Default configuration
BACKUP_DIR="/var/backups/mongodb"
CONTAINER_NAME="mongodb"
ENV_FILE=""
BACKUP_FILE=""

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
        --help)
            echo "Usage: $0 [OPTIONS] <backup_file.tar.gz>"
            echo ""
            echo "Options:"
            echo "  --env-file FILE      Path to .env file (default: auto-detect)"
            echo "  --backup-dir DIR     Backup directory (default: /var/backups/mongodb)"
            echo "  --help               Show this help message"
            echo ""
            echo "Example:"
            echo "  $0 --env-file .env mongodb_backup_20241112_040000.tar.gz"
            echo "  $0 /var/backups/mongodb/mongodb_backup_20241112_040000.tar.gz"
            exit 0
            ;;
        -*)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
        *)
            BACKUP_FILE="$1"
            shift
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

# Check if backup file is provided
if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 [OPTIONS] <backup_file.tar.gz>"
    echo ""
    echo "Available backups:"
    ls -lh "$BACKUP_DIR"/mongodb_backup_*.tar.gz 2>/dev/null || echo "No backups found in $BACKUP_DIR"
    echo ""
    echo "Use --help for more options"
    exit 1
fi

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    # Try to find it in backup directory
    if [ -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
        BACKUP_FILE="${BACKUP_DIR}/${BACKUP_FILE}"
    else
        echo "Error: Backup file not found: $BACKUP_FILE"
        exit 1
    fi
fi

echo "==================================="
echo "MongoDB Restore Started: $(date)"
echo "==================================="
echo "Backup file: $BACKUP_FILE"

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "Error: MongoDB container is not running!"
    exit 1
fi

# Warning prompt
echo ""
echo "WARNING: This will REPLACE all data in database '$MONGO_DB'"
read -p "Are you sure you want to continue? (yes/no) " -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Restore cancelled."
    exit 0
fi

# Create temporary directory
TEMP_RESTORE_DIR="/tmp/mongodb_restore_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$TEMP_RESTORE_DIR"

# Extract backup
echo "Extracting backup..."
tar -xzf "$BACKUP_FILE" -C "$TEMP_RESTORE_DIR"

# Copy to container
echo "Copying backup to container..."
docker cp "$TEMP_RESTORE_DIR/backup" "${CONTAINER_NAME}:/tmp/"

# Restore database
echo "Restoring database..."
docker exec "$CONTAINER_NAME" mongorestore \
    --username="$MONGO_USER" \
    --password="$MONGO_PASS" \
    --authenticationDatabase=admin \
    --db="$MONGO_DB" \
    --drop \
    /tmp/backup/"$MONGO_DB"

# Clean up
echo "Cleaning up..."
docker exec "$CONTAINER_NAME" rm -rf /tmp/backup
rm -rf "$TEMP_RESTORE_DIR"

echo ""
echo "==================================="
echo "MongoDB Restore Completed: $(date)"
echo "==================================="
