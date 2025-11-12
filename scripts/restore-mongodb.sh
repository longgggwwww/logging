#!/bin/bash

################################################################################
# MongoDB Restore Script
# Description: Restore MongoDB database from backup
# Usage: ./restore-mongodb.sh [backup_name]
#        ./restore-mongodb.sh mongodb_backup_20240101_120000
#        ./restore-mongodb.sh (will list available backups)
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
BLUE='\033[0;34m'
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
        INFO)
            echo -e "${BLUE}[${level}] ${message}${NC}"
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
    
    local dependencies=("mongorestore" "date" "find")
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
# Function: list_available_backups
# Description: List all available backups
################################################################################
list_available_backups() {
    log_message "INFO" "Available backups in $BACKUP_DIR:"
    echo ""
    
    if [ ! -d "$BACKUP_DIR" ]; then
        log_message "WARNING" "Backup directory does not exist: $BACKUP_DIR"
        return 1
    fi
    
    local backups=($(find "$BACKUP_DIR" -maxdepth 1 -type d -name "mongodb_backup_*" | sort -r))
    
    if [ ${#backups[@]} -eq 0 ]; then
        log_message "WARNING" "No backups found"
        return 1
    fi
    
    local count=1
    for backup in "${backups[@]}"; do
        local backup_name=$(basename "$backup")
        local backup_size=$(du -sh "$backup" | cut -f1)
        local backup_date=$(stat -c %y "$backup" | cut -d' ' -f1,2 | cut -d'.' -f1)
        
        echo -e "${GREEN}[$count]${NC} $backup_name"
        echo "    Size: $backup_size"
        echo "    Date: $backup_date"
        echo ""
        
        ((count++))
    done
    
    return 0
}

################################################################################
# Function: validate_backup
# Description: Validate that backup exists and is valid
################################################################################
validate_backup() {
    local backup_name=$1
    local backup_path="$BACKUP_DIR/$backup_name"
    
    if [ ! -d "$backup_path" ]; then
        log_message "ERROR" "Backup not found: $backup_path"
        return 1
    fi
    
    if [ ! -d "$backup_path/$MONGO_DATABASE" ]; then
        log_message "ERROR" "Database directory not found in backup: $MONGO_DATABASE"
        return 1
    fi
    
    log_message "SUCCESS" "Backup validation passed: $backup_name"
    return 0
}

################################################################################
# Function: confirm_restore
# Description: Ask user for confirmation before restore
################################################################################
confirm_restore() {
    local backup_name=$1
    
    log_message "WARNING" "=========================================="
    log_message "WARNING" "RESTORE CONFIRMATION"
    log_message "WARNING" "=========================================="
    log_message "WARNING" "This will restore the database: $MONGO_DATABASE"
    log_message "WARNING" "From backup: $backup_name"
    log_message "WARNING" "Host: $MONGO_HOST:$MONGO_PORT"
    log_message "WARNING" ""
    log_message "WARNING" "⚠️  WARNING: This operation will DROP existing data!"
    log_message "WARNING" "=========================================="
    
    read -p "Are you sure you want to continue? (yes/no): " -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log_message "INFO" "Restore cancelled by user"
        exit 0
    fi
}

################################################################################
# Function: perform_restore
# Description: Execute mongorestore to restore backup
################################################################################
perform_restore() {
    local backup_name=$1
    local backup_path="$BACKUP_DIR/$backup_name"
    
    log_message "INFO" "Starting MongoDB restore..."
    log_message "INFO" "Backup: $backup_name"
    log_message "INFO" "Database: $MONGO_DATABASE"
    log_message "INFO" "Host: $MONGO_HOST:$MONGO_PORT"
    
    # Perform restore with mongorestore
    if mongorestore \
        --host="$MONGO_HOST" \
        --port="$MONGO_PORT" \
        --username="$MONGO_USERNAME" \
        --password="$MONGO_PASSWORD" \
        --authenticationDatabase="$MONGO_AUTH_DB" \
        --db="$MONGO_DATABASE" \
        --drop \
        --gzip \
        "$backup_path/$MONGO_DATABASE" 2>&1 | tee -a "$LOG_FILE"; then
        
        log_message "SUCCESS" "Restore completed successfully"
        return 0
    else
        log_message "ERROR" "Restore failed"
        return 1
    fi
}

################################################################################
# Function: print_summary
# Description: Print restore summary
################################################################################
print_summary() {
    local backup_name=$1
    
    log_message "INFO" "=========================================="
    log_message "INFO" "Restore Summary"
    log_message "INFO" "=========================================="
    log_message "INFO" "Backup: $backup_name"
    log_message "INFO" "Database: $MONGO_DATABASE"
    log_message "INFO" "Host: $MONGO_HOST:$MONGO_PORT"
    log_message "INFO" "Timestamp: $(date)"
    log_message "INFO" "=========================================="
}

################################################################################
# Main execution
################################################################################
main() {
    log_message "INFO" "=========================================="
    log_message "INFO" "MongoDB Restore Script Started"
    log_message "INFO" "=========================================="
    
    # Check dependencies
    check_dependencies
    
    # If no backup name provided, list available backups
    if [ $# -eq 0 ]; then
        log_message "INFO" "Usage: $0 <backup_name>"
        echo ""
        list_available_backups
        exit 0
    fi
    
    local backup_name=$1
    
    # Validate backup
    if ! validate_backup "$backup_name"; then
        log_message "ERROR" "Backup validation failed"
        echo ""
        list_available_backups
        exit 1
    fi
    
    # Confirm restore
    confirm_restore "$backup_name"
    
    # Perform restore
    if perform_restore "$backup_name"; then
        # Print summary
        print_summary "$backup_name"
        
        log_message "SUCCESS" "MongoDB restore process completed successfully"
        exit 0
    else
        log_message "ERROR" "MongoDB restore process failed"
        exit 1
    fi
}

# Run main function
main "$@"
