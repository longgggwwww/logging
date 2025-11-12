#!/bin/bash

################################################################################
# MongoDB Backup Environment Testing Script
# Description: Test and verify environment configuration for MongoDB backups
# Usage: ./test-mongodb-backup-env.sh
################################################################################

set -euo pipefail

# Load environment variables from .env file if it exists
if [ -f "$(dirname "$0")/../.env" ]; then
    set -a
    # shellcheck disable=SC1091
    source <(grep -v '^#' "$(dirname "$0")/../.env" | grep -v '^$' | sed 's/\${\([^}]*\)}/\$$\1/g')
    set +a
fi

# Configuration defaults
BACKUP_DIR="${BACKUP_DIR:-./backups/mongodb}"
LOG_FILE="${LOG_FILE:-/var/log/mongodb-backup.log}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

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

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_WARNING=0

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
# Function: test_pass
# Description: Mark test as passed
################################################################################
test_pass() {
    local test_name=$1
    log_message "SUCCESS" "✓ $test_name"
    ((TESTS_PASSED++))
}

################################################################################
# Function: test_fail
# Description: Mark test as failed
################################################################################
test_fail() {
    local test_name=$1
    local reason=$2
    log_message "ERROR" "✗ $test_name - $reason"
    ((TESTS_FAILED++))
}

################################################################################
# Function: test_warn
# Description: Mark test as warning
################################################################################
test_warn() {
    local test_name=$1
    local reason=$2
    log_message "WARNING" "⚠ $test_name - $reason"
    ((TESTS_WARNING++))
}

################################################################################
# Function: test_env_file
# Description: Test if .env file exists and is readable
################################################################################
test_env_file() {
    log_message "INFO" "Testing .env file..."
    
    local env_file="$(dirname "$0")/../.env"
    
    if [ -f "$env_file" ]; then
        if [ -r "$env_file" ]; then
            test_pass ".env file exists and is readable"
        else
            test_fail ".env file" "File exists but is not readable"
        fi
    else
        test_warn ".env file" "File not found (will use defaults)"
    fi
}

################################################################################
# Function: test_mongodb_tools
# Description: Test if MongoDB tools are installed
################################################################################
test_mongodb_tools() {
    log_message "INFO" "Testing MongoDB tools..."
    
    local tools=("mongodump" "mongorestore" "mongosh")
    local all_installed=true
    
    for tool in "${tools[@]}"; do
        if command -v "$tool" &> /dev/null; then
            local version=$($tool --version 2>&1 | head -n 1)
            log_message "INFO" "  - $tool: $version"
        else
            test_fail "MongoDB tool: $tool" "Not installed"
            all_installed=false
        fi
    done
    
    if $all_installed; then
        test_pass "MongoDB tools installed"
    fi
}

################################################################################
# Function: test_backup_directory
# Description: Test backup directory accessibility
################################################################################
test_backup_directory() {
    log_message "INFO" "Testing backup directory..."
    
    if [ -d "$BACKUP_DIR" ]; then
        if [ -w "$BACKUP_DIR" ]; then
            test_pass "Backup directory writable: $BACKUP_DIR"
        else
            test_fail "Backup directory" "Not writable: $BACKUP_DIR"
        fi
        
        # Check available space
        local available_space=$(df -h "$BACKUP_DIR" | tail -1 | awk '{print $4}')
        log_message "INFO" "  Available space: $available_space"
    else
        log_message "INFO" "  Directory does not exist, attempting to create..."
        if mkdir -p "$BACKUP_DIR" 2>/dev/null; then
            test_pass "Backup directory created: $BACKUP_DIR"
        else
            test_fail "Backup directory" "Cannot create: $BACKUP_DIR"
        fi
    fi
}

################################################################################
# Function: test_log_directory
# Description: Test log directory accessibility
################################################################################
test_log_directory() {
    log_message "INFO" "Testing log directory..."
    
    local log_dir=$(dirname "$LOG_FILE")
    
    if [ -d "$log_dir" ]; then
        if [ -w "$log_dir" ]; then
            test_pass "Log directory writable: $log_dir"
        else
            test_warn "Log directory" "Not writable (will try with sudo): $log_dir"
        fi
    else
        log_message "INFO" "  Directory does not exist, attempting to create..."
        if mkdir -p "$log_dir" 2>/dev/null || sudo mkdir -p "$log_dir" 2>/dev/null; then
            test_pass "Log directory created: $log_dir"
        else
            test_warn "Log directory" "Cannot create (backup will continue): $log_dir"
        fi
    fi
}

################################################################################
# Function: test_mongodb_connection
# Description: Test connection to MongoDB
################################################################################
test_mongodb_connection() {
    log_message "INFO" "Testing MongoDB connection..."
    
    if ! command -v mongosh &> /dev/null; then
        test_warn "MongoDB connection" "mongosh not installed, skipping connection test"
        return
    fi
    
    # Test connection with timeout
    if timeout 5 mongosh \
        --host "$MONGO_HOST" \
        --port "$MONGO_PORT" \
        --username "$MONGO_USERNAME" \
        --password "$MONGO_PASSWORD" \
        --authenticationDatabase "$MONGO_AUTH_DB" \
        --eval "db.adminCommand('ping')" \
        --quiet &>/dev/null; then
        test_pass "MongoDB connection successful"
        
        # Test database access
        if timeout 5 mongosh \
            --host "$MONGO_HOST" \
            --port "$MONGO_PORT" \
            --username "$MONGO_USERNAME" \
            --password "$MONGO_PASSWORD" \
            --authenticationDatabase "$MONGO_AUTH_DB" \
            "$MONGO_DATABASE" \
            --eval "db.getCollectionNames()" \
            --quiet &>/dev/null; then
            test_pass "Database access successful: $MONGO_DATABASE"
        else
            test_fail "Database access" "Cannot access database: $MONGO_DATABASE"
        fi
    else
        test_fail "MongoDB connection" "Cannot connect to $MONGO_HOST:$MONGO_PORT"
    fi
}

################################################################################
# Function: test_environment_variables
# Description: Display environment variables
################################################################################
test_environment_variables() {
    log_message "INFO" "Checking environment variables..."
    
    echo ""
    log_message "INFO" "MongoDB Configuration:"
    log_message "INFO" "  MONGO_HOST: $MONGO_HOST"
    log_message "INFO" "  MONGO_PORT: $MONGO_PORT"
    log_message "INFO" "  MONGO_USERNAME: $MONGO_USERNAME"
    log_message "INFO" "  MONGO_PASSWORD: ${MONGO_PASSWORD:0:3}***" # Show first 3 chars only
    log_message "INFO" "  MONGO_DATABASE: $MONGO_DATABASE"
    log_message "INFO" "  MONGO_AUTH_DB: $MONGO_AUTH_DB"
    echo ""
    log_message "INFO" "Backup Configuration:"
    log_message "INFO" "  BACKUP_DIR: $BACKUP_DIR"
    log_message "INFO" "  LOG_FILE: $LOG_FILE"
    log_message "INFO" "  RETENTION_DAYS: $RETENTION_DAYS"
    echo ""
    
    test_pass "Environment variables loaded"
}

################################################################################
# Function: test_cron_availability
# Description: Test if cron is available
################################################################################
test_cron_availability() {
    log_message "INFO" "Testing cron availability..."
    
    if command -v crontab &> /dev/null; then
        test_pass "crontab command available"
        
        # Check if cron service is running (optional)
        if systemctl is-active --quiet cron 2>/dev/null || systemctl is-active --quiet crond 2>/dev/null; then
            test_pass "Cron service is running"
        else
            test_warn "Cron service" "Service status unknown or not running"
        fi
    else
        test_fail "crontab" "crontab command not found"
    fi
}

################################################################################
# Function: print_summary
# Description: Print test summary
################################################################################
print_summary() {
    echo ""
    log_message "INFO" "=========================================="
    log_message "INFO" "Test Summary"
    log_message "INFO" "=========================================="
    log_message "SUCCESS" "Tests Passed: $TESTS_PASSED"
    log_message "WARNING" "Tests with Warnings: $TESTS_WARNING"
    log_message "ERROR" "Tests Failed: $TESTS_FAILED"
    log_message "INFO" "=========================================="
    
    if [ $TESTS_FAILED -eq 0 ]; then
        if [ $TESTS_WARNING -eq 0 ]; then
            log_message "SUCCESS" "All tests passed! Environment is ready for MongoDB backups."
        else
            log_message "WARNING" "Environment is mostly ready, but some warnings need attention."
        fi
        return 0
    else
        log_message "ERROR" "Some tests failed. Please fix the issues before running backups."
        return 1
    fi
}

################################################################################
# Main execution
################################################################################
main() {
    log_message "INFO" "=========================================="
    log_message "INFO" "MongoDB Backup Environment Test"
    log_message "INFO" "=========================================="
    echo ""
    
    # Run tests
    test_env_file
    test_environment_variables
    test_mongodb_tools
    test_backup_directory
    test_log_directory
    test_cron_availability
    test_mongodb_connection
    
    # Print summary
    print_summary
}

# Run main function
main "$@"
