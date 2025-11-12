#!/bin/bash

################################################################################
# MongoDB Backup Permission Verification Script
# Description: Verify and fix permissions for MongoDB backup scripts and directories
# Usage: ./verify-mongodb-backup-permissions.sh [--fix]
################################################################################

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${BACKUP_DIR:-./backups/mongodb}"
LOG_FILE="${LOG_FILE:-/var/log/mongodb-backup.log}"
FIX_MODE=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check counters
CHECKS_PASSED=0
CHECKS_FAILED=0
FIXES_APPLIED=0

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
# Function: check_pass
# Description: Mark check as passed
################################################################################
check_pass() {
    local check_name=$1
    log_message "SUCCESS" "✓ $check_name"
    ((CHECKS_PASSED++))
}

################################################################################
# Function: check_fail
# Description: Mark check as failed
################################################################################
check_fail() {
    local check_name=$1
    local reason=$2
    log_message "ERROR" "✗ $check_name - $reason"
    ((CHECKS_FAILED++))
}

################################################################################
# Function: apply_fix
# Description: Mark fix as applied
################################################################################
apply_fix() {
    local fix_name=$1
    log_message "INFO" "→ Applied fix: $fix_name"
    ((FIXES_APPLIED++))
}

################################################################################
# Function: check_script_permissions
# Description: Check if backup scripts are executable
################################################################################
check_script_permissions() {
    log_message "INFO" "Checking script permissions..."
    
    local scripts=(
        "$SCRIPT_DIR/backup-mongodb.sh"
        "$SCRIPT_DIR/restore-mongodb.sh"
        "$SCRIPT_DIR/setup-mongodb-backup-cron.sh"
        "$SCRIPT_DIR/test-mongodb-backup-env.sh"
        "$SCRIPT_DIR/verify-mongodb-backup-permissions.sh"
    )
    
    local all_executable=true
    
    for script in "${scripts[@]}"; do
        if [ -f "$script" ]; then
            if [ -x "$script" ]; then
                log_message "INFO" "  ✓ $(basename "$script") is executable"
            else
                log_message "WARNING" "  ✗ $(basename "$script") is not executable"
                all_executable=false
                
                if [ "$FIX_MODE" = true ]; then
                    chmod +x "$script"
                    apply_fix "Made $(basename "$script") executable"
                fi
            fi
        else
            log_message "WARNING" "  ? $(basename "$script") not found"
        fi
    done
    
    if $all_executable; then
        check_pass "All scripts are executable"
    else
        if [ "$FIX_MODE" = false ]; then
            check_fail "Script permissions" "Some scripts are not executable (run with --fix)"
        else
            check_pass "Script permissions fixed"
        fi
    fi
}

################################################################################
# Function: check_directory_permissions
# Description: Check if backup directory has correct permissions
################################################################################
check_directory_permissions() {
    log_message "INFO" "Checking directory permissions..."
    
    # Check backup directory
    if [ -d "$BACKUP_DIR" ]; then
        if [ -w "$BACKUP_DIR" ]; then
            check_pass "Backup directory is writable: $BACKUP_DIR"
        else
            check_fail "Backup directory" "Not writable: $BACKUP_DIR"
            
            if [ "$FIX_MODE" = true ]; then
                if chmod u+w "$BACKUP_DIR" 2>/dev/null; then
                    apply_fix "Made backup directory writable"
                else
                    log_message "ERROR" "  Failed to fix permissions (may need sudo)"
                fi
            fi
        fi
        
        # Display current permissions
        local perms=$(ls -ld "$BACKUP_DIR" | awk '{print $1, $3, $4}')
        log_message "INFO" "  Current permissions: $perms"
    else
        log_message "WARNING" "Backup directory does not exist: $BACKUP_DIR"
        
        if [ "$FIX_MODE" = true ]; then
            if mkdir -p "$BACKUP_DIR" 2>/dev/null; then
                apply_fix "Created backup directory"
                check_pass "Backup directory created"
            else
                check_fail "Backup directory" "Failed to create (may need sudo)"
            fi
        fi
    fi
}

################################################################################
# Function: check_log_permissions
# Description: Check if log directory/file has correct permissions
################################################################################
check_log_permissions() {
    log_message "INFO" "Checking log file permissions..."
    
    local log_dir=$(dirname "$LOG_FILE")
    
    # Check log directory
    if [ -d "$log_dir" ]; then
        if [ -w "$log_dir" ]; then
            check_pass "Log directory is writable: $log_dir"
        else
            log_message "WARNING" "Log directory not writable: $log_dir"
            log_message "INFO" "  Will attempt to use sudo for logging"
            
            if [ "$FIX_MODE" = true ]; then
                if sudo chmod u+w "$log_dir" 2>/dev/null; then
                    apply_fix "Fixed log directory permissions (with sudo)"
                else
                    log_message "WARNING" "  Could not fix (will use sudo fallback)"
                fi
            fi
        fi
        
        # Display current permissions
        local perms=$(ls -ld "$log_dir" | awk '{print $1, $3, $4}')
        log_message "INFO" "  Current permissions: $perms"
    else
        log_message "WARNING" "Log directory does not exist: $log_dir"
        
        if [ "$FIX_MODE" = true ]; then
            if mkdir -p "$log_dir" 2>/dev/null || sudo mkdir -p "$log_dir" 2>/dev/null; then
                apply_fix "Created log directory"
                if [ -w "$log_dir" ]; then
                    check_pass "Log directory created and writable"
                else
                    log_message "WARNING" "Log directory created but not writable (will use sudo)"
                fi
            else
                check_fail "Log directory" "Failed to create"
            fi
        fi
    fi
    
    # Check log file if it exists
    if [ -f "$LOG_FILE" ]; then
        if [ -w "$LOG_FILE" ]; then
            log_message "INFO" "  ✓ Log file is writable"
        else
            log_message "WARNING" "  ✗ Log file is not writable (will try sudo)"
        fi
    fi
}

################################################################################
# Function: check_user_permissions
# Description: Check current user and permissions
################################################################################
check_user_permissions() {
    log_message "INFO" "Checking user permissions..."
    
    local current_user=$(whoami)
    log_message "INFO" "  Current user: $current_user"
    
    # Check if user can write to backup directory
    if [ -d "$BACKUP_DIR" ]; then
        local owner=$(stat -c %U "$BACKUP_DIR" 2>/dev/null || stat -f %Su "$BACKUP_DIR" 2>/dev/null)
        log_message "INFO" "  Backup directory owner: $owner"
        
        if [ "$owner" = "$current_user" ]; then
            check_pass "User owns backup directory"
        else
            log_message "WARNING" "  User does not own backup directory"
        fi
    fi
    
    # Check sudo availability
    if sudo -n true 2>/dev/null; then
        log_message "INFO" "  ✓ Sudo available without password"
    else
        log_message "INFO" "  ℹ Sudo may require password"
    fi
}

################################################################################
# Function: check_disk_space
# Description: Check available disk space
################################################################################
check_disk_space() {
    log_message "INFO" "Checking disk space..."
    
    if [ -d "$BACKUP_DIR" ]; then
        local available=$(df -h "$BACKUP_DIR" | tail -1 | awk '{print $4}')
        local usage=$(df -h "$BACKUP_DIR" | tail -1 | awk '{print $5}')
        
        log_message "INFO" "  Available space: $available"
        log_message "INFO" "  Disk usage: $usage"
        
        # Check if less than 1GB available
        local available_mb=$(df -m "$BACKUP_DIR" | tail -1 | awk '{print $4}')
        if [ "$available_mb" -lt 1024 ]; then
            check_fail "Disk space" "Less than 1GB available"
        else
            check_pass "Sufficient disk space available"
        fi
    else
        log_message "WARNING" "Cannot check disk space (backup directory doesn't exist)"
    fi
}

################################################################################
# Function: print_summary
# Description: Print check summary
################################################################################
print_summary() {
    echo ""
    log_message "INFO" "=========================================="
    log_message "INFO" "Permission Check Summary"
    log_message "INFO" "=========================================="
    log_message "SUCCESS" "Checks Passed: $CHECKS_PASSED"
    log_message "ERROR" "Checks Failed: $CHECKS_FAILED"
    
    if [ "$FIX_MODE" = true ]; then
        log_message "INFO" "Fixes Applied: $FIXES_APPLIED"
    fi
    
    log_message "INFO" "=========================================="
    
    if [ $CHECKS_FAILED -eq 0 ]; then
        log_message "SUCCESS" "All permission checks passed!"
        return 0
    else
        if [ "$FIX_MODE" = true ]; then
            log_message "WARNING" "Some issues remain. Manual intervention may be required."
        else
            log_message "ERROR" "Some checks failed. Run with --fix to attempt automatic fixes."
        fi
        return 1
    fi
}

################################################################################
# Function: print_recommendations
# Description: Print recommendations based on checks
################################################################################
print_recommendations() {
    echo ""
    log_message "INFO" "Recommendations:"
    log_message "INFO" "  1. Ensure backup directory is writable: $BACKUP_DIR"
    log_message "INFO" "  2. Ensure log directory is writable: $(dirname "$LOG_FILE")"
    log_message "INFO" "  3. All scripts should be executable (chmod +x scripts/*.sh)"
    log_message "INFO" "  4. Consider running backups as a dedicated backup user"
    log_message "INFO" "  5. Set up log rotation for: $LOG_FILE"
    echo ""
}

################################################################################
# Main execution
################################################################################
main() {
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --fix)
                FIX_MODE=true
                shift
                ;;
            *)
                log_message "ERROR" "Unknown option: $1"
                echo "Usage: $0 [--fix]"
                exit 1
                ;;
        esac
    done
    
    log_message "INFO" "=========================================="
    log_message "INFO" "MongoDB Backup Permission Verification"
    if [ "$FIX_MODE" = true ]; then
        log_message "INFO" "Mode: FIX (will attempt to fix issues)"
    else
        log_message "INFO" "Mode: CHECK ONLY (use --fix to apply fixes)"
    fi
    log_message "INFO" "=========================================="
    echo ""
    
    # Run checks
    check_script_permissions
    check_directory_permissions
    check_log_permissions
    check_user_permissions
    check_disk_space
    
    # Print summary
    print_summary
    
    # Print recommendations
    if [ $CHECKS_FAILED -gt 0 ]; then
        print_recommendations
    fi
}

# Run main function
main "$@"
