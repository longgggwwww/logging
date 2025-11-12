#!/bin/bash

################################################################################
# MongoDB Backup Script
# Description: Automated backup script for MongoDB with retention policy
# Usage: ./backup-mongodb.sh
################################################################################

set -euo pipefail

# Load environment variables from .env file if it exists
if [ -f "$(dirname "$0")/../.env" ]; then
    # Export variables from .env file, skipping comments and empty lines
    set -a
    # shellcheck disable=SC1091
    source <(grep -v '^#' "$(dirname "$0")/../.env" | grep -v '^$' | sed 's/\${\([^}]*\)}/\$$\1/g')
    set +a
fi

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups/mongodb}"
LOG_FILE="${LOG_FILE:-/var/log/mongodb-backup.log}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="mongodb_backup_${TIMESTAMP}"

# MongoDB Configuration from environment
MONGO_HOST="${MONGO_HOST:-mongodb}"
MONGO_PORT="${MONGO_PORT:-27017}"
MONGO_USERNAME="${MONGO_USERNAME:-longgggwww}"
MONGO_PASSWORD="${MONGO_PASSWORD:-123456}"
MONGO_DATABASE="${MONGO_DATABASE:-logs}"
MONGO_AUTH_DB="${MONGO_AUTH_DB:-admin}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

################################################################################
# Function: log_message
# Description: Log messages to file and console
################################################################################
log_message() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    
    # Create log directory if it doesn't exist
    local log_dir=$(dirname "$LOG_FILE")
    if [ ! -d "$log_dir" ]; then
        sudo mkdir -p "$log_dir" 2>/dev/null || mkdir -p "$log_dir" 2>/dev/null || true
    fi
    
    # Log to file (create if doesn't exist)
    echo "[${timestamp}] [${level}] ${message}" | sudo tee -a "$LOG_FILE" 2>/dev/null || echo "[${timestamp}] [${level}] ${message}" >> "$LOG_FILE" 2>/dev/null || true
    
    # Log to console with color
    case $level in
        ERROR)
            echo -e "${RED}[${level}] ${message}${NC}"
            ;;
        SUCCESS)
            echo -e "${GREEN}[${level}] ${message}${NC}"
            ;;
        WARNING)
            echo -e "${YELLOW}[${level}] ${message}${NC}"
            ;;
        *)
            echo "[${level}] ${message}"
            ;;
    esac
}

################################################################################
# Function: check_dependencies
# Description: Check if required tools are installed
################################################################################
check_dependencies() {
    log_message "INFO" "Checking dependencies..."
    
    local dependencies=("mongodump" "date" "find")
    local missing_deps=()
    
    for dep in "${dependencies[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            missing_deps+=("$dep")
        fi
    done
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_message "ERROR" "Missing dependencies: ${missing_deps[*]}"
        log_message "INFO" "Install MongoDB tools: https://www.mongodb.com/try/download/database-tools"
        exit 1
    fi
    
    log_message "SUCCESS" "All dependencies are installed"
}

################################################################################
# Function: create_backup_directory
# Description: Create backup directory if it doesn't exist
################################################################################
create_backup_directory() {
    if [ ! -d "$BACKUP_DIR" ]; then
        log_message "INFO" "Creating backup directory: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
    fi
    
    # Check write permissions
    if [ ! -w "$BACKUP_DIR" ]; then
        log_message "ERROR" "No write permission for backup directory: $BACKUP_DIR"
        exit 1
    fi
    
    log_message "SUCCESS" "Backup directory ready: $BACKUP_DIR"
}

################################################################################
# Function: perform_backup
# Description: Execute mongodump to create backup
################################################################################
perform_backup() {
    log_message "INFO" "Starting MongoDB backup..."
    log_message "INFO" "Database: $MONGO_DATABASE"
    log_message "INFO" "Backup location: $BACKUP_DIR/$BACKUP_NAME"
    
    local backup_path="$BACKUP_DIR/$BACKUP_NAME"
    
    # Perform backup with mongodump
    if mongodump \
        --host="$MONGO_HOST" \
        --port="$MONGO_PORT" \
        --username="$MONGO_USERNAME" \
        --password="$MONGO_PASSWORD" \
        --authenticationDatabase="$MONGO_AUTH_DB" \
        --db="$MONGO_DATABASE" \
        --out="$backup_path" \
        --gzip 2>&1 | tee -a "$LOG_FILE"; then
        
        log_message "SUCCESS" "Backup completed successfully"
        
        # Get backup size
        local backup_size=$(du -sh "$backup_path" | cut -f1)
        log_message "INFO" "Backup size: $backup_size"
        
        return 0
    else
        log_message "ERROR" "Backup failed"
        return 1
    fi
}

################################################################################
# Function: cleanup_old_backups
# Description: Remove backups older than retention period
################################################################################
cleanup_old_backups() {
    log_message "INFO" "Cleaning up old backups (retention: $RETENTION_DAYS days)..."
    
    local deleted_count=0
    
    # Find and delete old backups
    if find "$BACKUP_DIR" -maxdepth 1 -type d -name "mongodb_backup_*" -mtime +"$RETENTION_DAYS" -print0 | while IFS= read -r -d '' backup; do
        log_message "INFO" "Deleting old backup: $(basename "$backup")"
        rm -rf "$backup"
        ((deleted_count++))
    done; then
        if [ $deleted_count -gt 0 ]; then
            log_message "SUCCESS" "Deleted $deleted_count old backup(s)"
        else
            log_message "INFO" "No old backups to delete"
        fi
    else
        log_message "WARNING" "Error during cleanup, but continuing..."
    fi
}

################################################################################
# Function: print_summary
# Description: Print backup summary
################################################################################
print_summary() {
    log_message "INFO" "=========================================="
    log_message "INFO" "Backup Summary"
    log_message "INFO" "=========================================="
    log_message "INFO" "Backup Name: $BACKUP_NAME"
    log_message "INFO" "Backup Location: $BACKUP_DIR/$BACKUP_NAME"
    log_message "INFO" "Database: $MONGO_DATABASE"
    log_message "INFO" "Timestamp: $(date)"
    
    # Count total backups
    local total_backups=$(find "$BACKUP_DIR" -maxdepth 1 -type d -name "mongodb_backup_*" | wc -l)
    log_message "INFO" "Total backups: $total_backups"
    log_message "INFO" "=========================================="
}

################################################################################
# Main execution
################################################################################
main() {
    log_message "INFO" "=========================================="
    log_message "INFO" "MongoDB Backup Script Started"
    log_message "INFO" "=========================================="
    
    # Check dependencies
    check_dependencies
    
    # Create backup directory
    create_backup_directory
    
    # Perform backup
    if perform_backup; then
        # Cleanup old backups
        cleanup_old_backups
        
        # Print summary
        print_summary
        
        log_message "SUCCESS" "MongoDB backup process completed successfully"
        exit 0
    else
        log_message "ERROR" "MongoDB backup process failed"
        exit 1
    fi
}

# Run main function
main "$@"
