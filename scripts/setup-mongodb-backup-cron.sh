#!/bin/bash

# Setup MongoDB Backup Cronjob
# Configures a cron job to run MongoDB backup daily at 4:00 AM

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_SCRIPT="${SCRIPT_DIR}/backup-mongodb.sh"
CRON_SCHEDULE="0 4 * * *"
ENV_FILE=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --env-file)
            ENV_FILE="$2"
            shift 2
            ;;
        --schedule)
            CRON_SCHEDULE="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --env-file FILE      Path to .env file (default: auto-detect from project root)"
            echo "  --schedule CRON      Cron schedule (default: '0 4 * * *' - 4:00 AM daily)"
            echo "  --help               Show this help message"
            echo ""
            echo "Example:"
            echo "  $0 --env-file .env --schedule '0 2 * * *'  # 2:00 AM daily"
            echo "  $0 --schedule '0 */6 * * *'                # Every 6 hours"
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
    if [ -f "$PROJECT_ROOT/.env" ]; then
        ENV_FILE="$PROJECT_ROOT/.env"
    elif [ -f "$PWD/.env" ]; then
        ENV_FILE="$PWD/.env"
    fi
fi

# Build cron job command with env-file option if available
if [ -n "$ENV_FILE" ] && [ -f "$ENV_FILE" ]; then
    CRON_JOB="${CRON_SCHEDULE} ${BACKUP_SCRIPT} --env-file ${ENV_FILE} >> /var/log/mongodb-backup.log 2>&1"
    echo "Using .env file: $ENV_FILE"
else
    CRON_JOB="${CRON_SCHEDULE} ${BACKUP_SCRIPT} >> /var/log/mongodb-backup.log 2>&1"
    echo "Warning: .env file not found. Cronjob will use default values."
fi

echo "==================================="
echo "MongoDB Backup Cronjob Setup"
echo "==================================="

# Check if backup script exists
if [ ! -f "$BACKUP_SCRIPT" ]; then
    echo "Error: Backup script not found at ${BACKUP_SCRIPT}"
    exit 1
fi

# Make sure backup script is executable
chmod +x "$BACKUP_SCRIPT"

# Create and setup log file with proper permissions
echo "Setting up log file..."
sudo mkdir -p /var/log
sudo touch /var/log/mongodb-backup.log
sudo chown $USER:$USER /var/log/mongodb-backup.log
sudo chmod 644 /var/log/mongodb-backup.log

# Create and setup backup directory with proper permissions
echo "Setting up backup directory..."
BACKUP_DIR="/var/backups/mongodb"
sudo mkdir -p "$BACKUP_DIR"
sudo chown $USER:$USER "$BACKUP_DIR"
sudo chmod 755 "$BACKUP_DIR"

echo "✓ Permissions configured successfully"

# Check if cronjob already exists
if crontab -l 2>/dev/null | grep -F "$BACKUP_SCRIPT" >/dev/null; then
    echo "Cronjob for MongoDB backup already exists."
    echo "Current crontab:"
    crontab -l | grep -F "$BACKUP_SCRIPT"
    echo ""
    read -p "Do you want to remove and re-add it? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Remove existing cronjob
        crontab -l | grep -vF "$BACKUP_SCRIPT" | crontab -
        echo "Existing cronjob removed."
    else
        echo "Setup cancelled."
        exit 0
    fi
fi

# Add new cronjob
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo ""
echo "✓ Cronjob added successfully!"
echo ""
echo "Schedule: ${CRON_SCHEDULE}"
echo "Command: ${BACKUP_SCRIPT}"
if [ -n "$ENV_FILE" ] && [ -f "$ENV_FILE" ]; then
    echo "Env file: ${ENV_FILE}"
fi
echo "Log file: /var/log/mongodb-backup.log"
echo ""
echo "Current crontab:"
crontab -l
echo ""
echo "==================================="
echo "Setup completed!"
echo "==================================="
echo ""
echo "Useful commands:"
echo "  View crontab:        crontab -l"
echo "  Edit crontab:        crontab -e"
echo "  Remove crontab:      crontab -r"
echo "  View backup logs:    tail -f /var/log/mongodb-backup.log"
if [ -n "$ENV_FILE" ] && [ -f "$ENV_FILE" ]; then
    echo "  Test backup script:  ${BACKUP_SCRIPT} --env-file ${ENV_FILE}"
else
    echo "  Test backup script:  ${BACKUP_SCRIPT}"
fi
echo "  List backups:        ls -lh /var/backups/mongodb/"
