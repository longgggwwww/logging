#!/bin/bash

################################################################################
# MongoDB Backup Cronjob Setup Script
# Description: Automated setup of cronjob for MongoDB backups
# Usage: ./setup-mongodb-backup-cron.sh [schedule]
#        ./setup-mongodb-backup-cron.sh "0 4 * * *"
#        ./setup-mongodb-backup-cron.sh (uses default: 0 4 * * *)
################################################################################

set -euo pipefail

# Configuration
DEFAULT_SCHEDULE="0 4 * * *"  # 4:00 AM daily
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/backup-mongodb.sh"
CRON_COMMENT="# MongoDB automated backup"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

################################################################################
# Function: log_message
# Description: Log messages with color
################################################################################
log_message() {
    local level=$1
    shift
    local message="$*"
    
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
# Function: check_backup_script
# Description: Verify backup script exists and is executable
################################################################################
check_backup_script() {
    log_message "INFO" "Checking backup script..."
    
    if [ ! -f "$BACKUP_SCRIPT" ]; then
        log_message "ERROR" "Backup script not found: $BACKUP_SCRIPT"
        exit 1
    fi
    
    if [ ! -x "$BACKUP_SCRIPT" ]; then
        log_message "INFO" "Making backup script executable..."
        chmod +x "$BACKUP_SCRIPT"
    fi
    
    log_message "SUCCESS" "Backup script is ready: $BACKUP_SCRIPT"
}

################################################################################
# Function: validate_cron_schedule
# Description: Basic validation of cron schedule format
################################################################################
validate_cron_schedule() {
    local schedule=$1
    
    # Count fields (should be 5 for standard cron)
    local field_count=$(echo "$schedule" | wc -w)
    
    if [ "$field_count" -ne 5 ]; then
        log_message "ERROR" "Invalid cron schedule format. Expected 5 fields, got $field_count"
        log_message "INFO" "Example: '0 4 * * *' (4:00 AM daily)"
        return 1
    fi
    
    return 0
}

################################################################################
# Function: check_existing_cron
# Description: Check if cronjob already exists
################################################################################
check_existing_cron() {
    log_message "INFO" "Checking for existing cronjob..."
    
    if crontab -l 2>/dev/null | grep -q "$BACKUP_SCRIPT"; then
        log_message "WARNING" "Found existing cronjob for MongoDB backup"
        return 0
    else
        log_message "INFO" "No existing cronjob found"
        return 1
    fi
}

################################################################################
# Function: remove_existing_cron
# Description: Remove existing MongoDB backup cronjobs
################################################################################
remove_existing_cron() {
    log_message "INFO" "Removing existing MongoDB backup cronjobs..."
    
    # Get current crontab, remove MongoDB backup lines, save back
    (crontab -l 2>/dev/null | grep -v "$BACKUP_SCRIPT" || true) | crontab -
    
    log_message "SUCCESS" "Existing cronjobs removed"
}

################################################################################
# Function: add_cron_job
# Description: Add new cronjob for MongoDB backup
################################################################################
add_cron_job() {
    local schedule=$1
    
    log_message "INFO" "Adding cronjob with schedule: $schedule"
    
    # Create the cron entry
    local cron_entry="$schedule $BACKUP_SCRIPT >> /var/log/mongodb-backup-cron.log 2>&1"
    
    # Add to crontab
    (crontab -l 2>/dev/null; echo "$CRON_COMMENT"; echo "$cron_entry") | crontab -
    
    log_message "SUCCESS" "Cronjob added successfully"
}

################################################################################
# Function: display_cron_info
# Description: Display human-readable cron schedule information
################################################################################
display_cron_info() {
    local schedule=$1
    
    log_message "INFO" "=========================================="
    log_message "INFO" "Cronjob Configuration"
    log_message "INFO" "=========================================="
    log_message "INFO" "Schedule: $schedule"
    log_message "INFO" "Script: $BACKUP_SCRIPT"
    log_message "INFO" "Log: /var/log/mongodb-backup-cron.log"
    log_message "INFO" ""
    
    # Parse schedule for human-readable format
    local minute=$(echo "$schedule" | awk '{print $1}')
    local hour=$(echo "$schedule" | awk '{print $2}')
    local day=$(echo "$schedule" | awk '{print $3}')
    local month=$(echo "$schedule" | awk '{print $4}')
    local weekday=$(echo "$schedule" | awk '{print $5}')
    
    log_message "INFO" "Human-readable schedule:"
    if [ "$minute" = "0" ] && [ "$hour" != "*" ] && [ "$day" = "*" ] && [ "$month" = "*" ] && [ "$weekday" = "*" ]; then
        log_message "INFO" "  - Every day at ${hour}:00"
    else
        log_message "INFO" "  - Minute: $minute"
        log_message "INFO" "  - Hour: $hour"
        log_message "INFO" "  - Day: $day"
        log_message "INFO" "  - Month: $month"
        log_message "INFO" "  - Weekday: $weekday"
    fi
    
    log_message "INFO" "=========================================="
}

################################################################################
# Function: verify_cron_installation
# Description: Verify that cronjob was installed correctly
################################################################################
verify_cron_installation() {
    log_message "INFO" "Verifying cronjob installation..."
    
    if crontab -l 2>/dev/null | grep -q "$BACKUP_SCRIPT"; then
        log_message "SUCCESS" "Cronjob verification passed"
        echo ""
        log_message "INFO" "Current crontab entries for MongoDB backup:"
        crontab -l 2>/dev/null | grep -A1 "$CRON_COMMENT" || true
        return 0
    else
        log_message "ERROR" "Cronjob verification failed"
        return 1
    fi
}

################################################################################
# Function: print_usage_instructions
# Description: Print usage instructions
################################################################################
print_usage_instructions() {
    log_message "INFO" ""
    log_message "INFO" "=========================================="
    log_message "INFO" "Next Steps"
    log_message "INFO" "=========================================="
    log_message "INFO" "1. Verify cronjob: crontab -l"
    log_message "INFO" "2. View logs: tail -f /var/log/mongodb-backup.log"
    log_message "INFO" "3. View cron logs: tail -f /var/log/mongodb-backup-cron.log"
    log_message "INFO" "4. Test backup manually: $BACKUP_SCRIPT"
    log_message "INFO" "5. List backups: ls -lh ./backups/mongodb/"
    log_message "INFO" ""
    log_message "INFO" "To remove cronjob:"
    log_message "INFO" "  crontab -e (then delete the MongoDB backup line)"
    log_message "INFO" ""
    log_message "INFO" "To modify schedule:"
    log_message "INFO" "  Run this script again with new schedule"
    log_message "INFO" "  Example: $0 '0 2 * * *'"
    log_message "INFO" "=========================================="
}

################################################################################
# Main execution
################################################################################
main() {
    log_message "INFO" "=========================================="
    log_message "INFO" "MongoDB Backup Cronjob Setup"
    log_message "INFO" "=========================================="
    
    # Get schedule from argument or use default
    local schedule="${1:-$DEFAULT_SCHEDULE}"
    
    # Validate schedule
    if ! validate_cron_schedule "$schedule"; then
        exit 1
    fi
    
    # Check backup script
    check_backup_script
    
    # Check for existing cronjob
    if check_existing_cron; then
        log_message "WARNING" "Existing cronjob will be replaced"
        read -p "Continue? (yes/no): " -r
        echo
        
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            log_message "INFO" "Setup cancelled by user"
            exit 0
        fi
        
        remove_existing_cron
    fi
    
    # Add cronjob
    add_cron_job "$schedule"
    
    # Display configuration
    display_cron_info "$schedule"
    
    # Verify installation
    if verify_cron_installation; then
        # Print usage instructions
        print_usage_instructions
        
        log_message "SUCCESS" "MongoDB backup cronjob setup completed successfully!"
        exit 0
    else
        log_message "ERROR" "Cronjob setup failed"
        exit 1
    fi
}

# Run main function
main "$@"
