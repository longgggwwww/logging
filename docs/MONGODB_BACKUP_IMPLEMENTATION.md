# MongoDB Backup Implementation Details

## 📋 Overview

This document provides technical implementation details for the MongoDB backup automation system.

## 🏗️ Architecture

### Components

```
┌─────────────────────────────────────────────────────┐
│                  User Interface                      │
│  (Scripts: setup, backup, restore, test, verify)   │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│              Cronjob Scheduler                       │
│  (cron: 0 4 * * * backup-mongodb.sh)                │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│             Backup Engine                            │
│  - Environment loading (.env)                        │
│  - Dependency checking                               │
│  - MongoDB connection                                │
│  - mongodump execution                               │
│  - Retention management                              │
│  - Logging                                           │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│              Storage Layer                           │
│  - Backup files (./backups/mongodb/)                │
│  - Log files (/var/log/mongodb-backup.log)          │
└─────────────────────────────────────────────────────┘
```

## 📜 Script Details

### 1. backup-mongodb.sh

**Purpose**: Main backup script with mongodump integration

**Key Features**:
- Environment variable loading from `.env`
- Dependency verification
- Timestamped backup creation
- Automatic retention cleanup
- Comprehensive logging
- Error handling

**Execution Flow**:
```
1. Load environment variables
2. Check dependencies (mongodump, date, find)
3. Create backup directory if needed
4. Execute mongodump with credentials
5. Verify backup creation
6. Cleanup old backups based on retention
7. Log all operations
8. Print summary
```

**Technical Details**:
```bash
# Backup naming convention
BACKUP_NAME="mongodb_backup_YYYYMMDD_HHMMSS"

# mongodump command structure
mongodump \
    --host=$MONGO_HOST \
    --port=$MONGO_PORT \
    --username=$MONGO_USERNAME \
    --password=$MONGO_PASSWORD \
    --authenticationDatabase=$MONGO_AUTH_DB \
    --db=$MONGO_DATABASE \
    --out=$BACKUP_PATH \
    --gzip
```

**Error Handling**:
- Exit on undefined variables (`set -u`)
- Exit on command failures (`set -e`)
- Pipeline failure detection (`set -o pipefail`)
- Graceful fallback for sudo operations
- Detailed error logging

### 2. restore-mongodb.sh

**Purpose**: Restore MongoDB database from backup

**Key Features**:
- Interactive backup selection
- Backup validation
- User confirmation before restore
- Drop existing data option
- Detailed logging

**Execution Flow**:
```
1. Load environment variables
2. Check dependencies (mongorestore)
3. List available backups (if no argument)
4. Validate selected backup
5. Display warning and request confirmation
6. Execute mongorestore with --drop flag
7. Verify restore completion
8. Log all operations
```

**Technical Details**:
```bash
# mongorestore command structure
mongorestore \
    --host=$MONGO_HOST \
    --port=$MONGO_PORT \
    --username=$MONGO_USERNAME \
    --password=$MONGO_PASSWORD \
    --authenticationDatabase=$MONGO_AUTH_DB \
    --db=$MONGO_DATABASE \
    --drop \
    --gzip \
    $BACKUP_PATH/$MONGO_DATABASE
```

**Safety Features**:
- Explicit user confirmation required
- Clear warning about data deletion
- Backup validation before restore
- Detailed operation logging

### 3. setup-mongodb-backup-cron.sh

**Purpose**: Automate cronjob installation

**Key Features**:
- Default schedule (4:00 AM daily)
- Custom schedule support
- Schedule validation
- Existing cronjob detection and removal
- User confirmation for replacement
- Installation verification

**Execution Flow**:
```
1. Parse schedule argument (or use default)
2. Validate cron schedule format
3. Check for existing cronjobs
4. Request confirmation if replacing
5. Add new cronjob entry
6. Verify installation
7. Display configuration details
```

**Technical Details**:
```bash
# Cron entry format
0 4 * * * /path/to/backup-mongodb.sh >> /var/log/mongodb-backup-cron.log 2>&1

# Schedule validation
- 5 fields required: minute hour day month weekday
- Range validation for each field
```

### 4. test-mongodb-backup-env.sh

**Purpose**: Environment testing and validation

**Key Features**:
- Environment file checking
- MongoDB tools verification
- Connection testing
- Directory permission checking
- Disk space verification
- Comprehensive reporting

**Tests Performed**:
```
1. .env file existence and readability
2. Environment variable loading
3. MongoDB tools installation (mongodump, mongorestore, mongosh)
4. Backup directory accessibility and permissions
5. Log directory accessibility and permissions
6. Cron availability
7. MongoDB connection and authentication
8. Database access verification
9. Disk space check
```

**Output Format**:
```
✓ Test Passed
✗ Test Failed
⚠ Test Warning
```

### 5. verify-mongodb-backup-permissions.sh

**Purpose**: Permission verification and fixing

**Key Features**:
- Script executable check
- Directory permission verification
- Auto-fix capability (--fix flag)
- User permission analysis
- Disk space monitoring
- Detailed recommendations

**Checks Performed**:
```
1. All scripts are executable
2. Backup directory exists and is writable
3. Log directory exists and is writable
4. Current user permissions
5. Sudo availability
6. Disk space availability
```

**Fix Mode**:
```bash
# Check only
./verify-mongodb-backup-permissions.sh

# Check and auto-fix
./verify-mongodb-backup-permissions.sh --fix
```

## 🔧 Configuration System

### Environment Variables

**Loading Mechanism**:
```bash
if [ -f "$(dirname "$0")/../.env" ]; then
    set -a
    source <(grep -v '^#' "$(dirname "$0")/../.env" | grep -v '^$')
    set +a
fi
```

**Variable Precedence**:
1. Exported environment variables (highest priority)
2. .env file variables
3. Script defaults (lowest priority)

**Required Variables**:
- `MONGO_HOST`
- `MONGO_PORT`
- `MONGO_USERNAME`
- `MONGO_PASSWORD`
- `MONGO_DATABASE`

**Optional Variables**:
- `MONGO_AUTH_DB` (default: admin)
- `BACKUP_DIR` (default: ./backups/mongodb)
- `LOG_FILE` (default: /var/log/mongodb-backup.log)
- `RETENTION_DAYS` (default: 7)

## 📝 Logging System

### Log Format

```
[YYYY-MM-DD HH:MM:SS] [LEVEL] Message
```

### Log Levels

| Level | Purpose | Color |
|-------|---------|-------|
| INFO | General information | Blue |
| SUCCESS | Successful operations | Green |
| WARNING | Non-critical issues | Yellow |
| ERROR | Critical failures | Red |

### Log Locations

1. **Main Log**: `/var/log/mongodb-backup.log`
   - All backup/restore operations
   - Detailed execution logs
   - Error messages and stack traces

2. **Cron Log**: `/var/log/mongodb-backup-cron.log`
   - Cronjob execution output
   - Scheduled backup results
   - Cron-specific errors

### Log Management

**Fallback Strategy**:
```bash
# Try sudo if direct write fails
echo "$message" | sudo tee -a "$LOG_FILE" 2>/dev/null || \
echo "$message" >> "$LOG_FILE" 2>/dev/null || \
true  # Continue even if logging fails
```

**Recommended Log Rotation**:
```bash
# /etc/logrotate.d/mongodb-backup
/var/log/mongodb-backup.log {
    weekly
    rotate 4
    compress
    missingok
    notifempty
    create 644 root root
}
```

## 💾 Backup Storage

### Directory Structure

```
backups/mongodb/
├── mongodb_backup_20240101_040000/
│   └── logs/
│       ├── collection1.bson.gz
│       ├── collection1.metadata.json.gz
│       ├── collection2.bson.gz
│       └── collection2.metadata.json.gz
├── mongodb_backup_20240102_040000/
└── mongodb_backup_20240103_040000/
```

### Backup Format

- **Compression**: gzip compression enabled (`--gzip`)
- **Format**: BSON + metadata JSON
- **Structure**: One directory per backup with database subdirectory

### Retention Policy

**Algorithm**:
```bash
# Find backups older than RETENTION_DAYS
find "$BACKUP_DIR" \
    -maxdepth 1 \
    -type d \
    -name "mongodb_backup_*" \
    -mtime +$RETENTION_DAYS \
    -exec rm -rf {} \;
```

**Execution Timing**: After successful backup completion

## 🔒 Security Considerations

### Credential Management

1. **Never hardcode credentials**
   - Use `.env` file
   - Add `.env` to `.gitignore`
   - Set restrictive permissions: `chmod 600 .env`

2. **Script Security**
   - Scripts check for `.env` in parent directory
   - No credentials in command line arguments
   - Secure variable expansion

### File Permissions

**Recommended Permissions**:
```bash
# Scripts
chmod 755 scripts/*.sh

# Environment file
chmod 600 .env

# Backup directory
chmod 750 backups/mongodb/

# Log files
chmod 640 /var/log/mongodb-backup*.log
```

### Network Security

1. **MongoDB Connection**
   - Use authentication always
   - Limit network exposure
   - Use SSL/TLS in production

2. **Backup Storage**
   - Restrict directory access
   - Consider encryption at rest
   - Implement off-site backup strategy

## 📊 Performance Considerations

### Backup Size Estimation

Typical log database sizes:
- Small: < 1 GB (< 1 minute backup)
- Medium: 1-10 GB (1-5 minutes backup)
- Large: 10-100 GB (5-30 minutes backup)

### Optimization Strategies

1. **Compression**: Enabled by default (`--gzip`)
2. **Parallel Processing**: mongodump handles internally
3. **Network Optimization**: Run on same host as MongoDB
4. **Retention Tuning**: Adjust based on disk space

### Resource Usage

**During Backup**:
- CPU: Moderate (compression overhead)
- Memory: Low to moderate (depends on collection size)
- Disk I/O: High (reading and writing data)
- Network: Low to none (if on same host)

## 🧪 Testing Strategy

### Unit Testing

Each script includes:
- Dependency checking
- Parameter validation
- Error condition handling
- Dry-run capabilities

### Integration Testing

1. **Environment Test**: `test-mongodb-backup-env.sh`
2. **Permission Test**: `verify-mongodb-backup-permissions.sh`
3. **Manual Backup**: `backup-mongodb.sh`
4. **Restore Test**: `restore-mongodb.sh`

### Production Validation

Before production deployment:
1. Test in staging environment
2. Verify backup creation
3. Test restore process
4. Validate cronjob execution
5. Monitor first week of automated backups

## 🔄 Maintenance Procedures

### Regular Maintenance

**Weekly**:
- Review backup logs for errors
- Verify backup completion
- Check disk space

**Monthly**:
- Test restore process
- Review retention policy
- Audit backup sizes

**Quarterly**:
- Update scripts if needed
- Review security practices
- Test disaster recovery

### Upgrade Procedures

1. Test new version in staging
2. Backup current configuration
3. Update scripts
4. Run environment test
5. Verify permissions
6. Test manual backup
7. Monitor automated backups

## 📈 Monitoring and Alerts

### Key Metrics

1. **Backup Success Rate**: Should be 100%
2. **Backup Duration**: Track for trends
3. **Backup Size**: Monitor growth
4. **Disk Space**: Prevent full disk
5. **Restore Test Success**: Monthly validation

### Recommended Monitoring

```bash
# Check last backup status
tail -n 50 /var/log/mongodb-backup.log | grep -i "success\|error"

# Monitor backup sizes
du -sh backups/mongodb/* | tail -n 7

# Check disk space
df -h backups/mongodb/

# Verify cronjob execution
grep "mongodb" /var/log/syslog | tail -n 10
```

## 🐛 Known Limitations

1. **Single Database**: Backs up one database at a time
2. **Local Storage**: No built-in remote backup support
3. **No Encryption**: Backups are not encrypted by default
4. **Manual Recovery**: No automated disaster recovery
5. **Point-in-Time**: No continuous backup/PITR support

## 🔮 Future Enhancements

Potential improvements:
- Multi-database backup support
- Remote backup destinations (S3, FTP, etc.)
- Backup encryption
- Email notifications
- Backup verification/validation
- Incremental backups
- Web-based monitoring dashboard
- Integration with monitoring systems (Prometheus, etc.)

## 📚 References

- [MongoDB Backup Methods](https://docs.mongodb.com/manual/core/backups/)
- [mongodump Documentation](https://docs.mongodb.com/database-tools/mongodump/)
- [mongorestore Documentation](https://docs.mongodb.com/database-tools/mongorestore/)
- [Bash Best Practices](https://bertvv.github.io/cheat-sheets/Bash.html)
- [Cron Documentation](https://man7.org/linux/man-pages/man5/crontab.5.html)
