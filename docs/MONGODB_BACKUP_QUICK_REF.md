# MongoDB Backup Quick Reference

## 🚀 Quick Commands

### Setup
```bash
# Install MongoDB tools
sudo apt-get install mongodb-database-tools  # Ubuntu/Debian
brew install mongodb-database-tools          # macOS

# Test environment
./scripts/test-mongodb-backup-env.sh

# Verify permissions
./scripts/verify-mongodb-backup-permissions.sh --fix

# Setup automated backups (4:00 AM daily)
./scripts/setup-mongodb-backup-cron.sh
```

### Backup Operations
```bash
# Manual backup
./scripts/backup-mongodb.sh

# List all backups
ls -lh ./backups/mongodb/

# Check backup size
du -sh ./backups/mongodb/*
```

### Restore Operations
```bash
# List available backups
./scripts/restore-mongodb.sh

# Restore specific backup
./scripts/restore-mongodb.sh mongodb_backup_20240101_040000
```

### Monitoring
```bash
# View backup logs
tail -f /var/log/mongodb-backup.log

# View cron logs
tail -f /var/log/mongodb-backup-cron.log

# Check last backup status
tail -n 50 /var/log/mongodb-backup.log | grep "SUCCESS\|ERROR"

# List cronjobs
crontab -l
```

## ⚙️ Configuration

### Environment Variables (.env)
```bash
# MongoDB Connection
MONGO_HOST=mongodb
MONGO_PORT=27017
MONGO_USERNAME=longgggwww
MONGO_PASSWORD=123456
MONGO_DATABASE=logs
MONGO_AUTH_DB=admin

# Backup Settings
BACKUP_DIR=./backups/mongodb
LOG_FILE=/var/log/mongodb-backup.log
RETENTION_DAYS=7
```

### Common Cron Schedules
```bash
# Daily at 4:00 AM (default)
./scripts/setup-mongodb-backup-cron.sh "0 4 * * *"

# Daily at 2:00 AM
./scripts/setup-mongodb-backup-cron.sh "0 2 * * *"

# Every 12 hours
./scripts/setup-mongodb-backup-cron.sh "0 */12 * * *"

# Weekly on Sunday at midnight
./scripts/setup-mongodb-backup-cron.sh "0 0 * * 0"

# Weekdays at 3:00 AM
./scripts/setup-mongodb-backup-cron.sh "0 3 * * 1-5"
```

## 🔧 Troubleshooting

### MongoDB Tools Not Found
```bash
# Check installation
mongodump --version
mongorestore --version

# Install if missing
sudo apt-get install mongodb-database-tools
```

### Permission Issues
```bash
# Fix script permissions
chmod +x scripts/*.sh

# Fix directory permissions
sudo chown -R $USER:$USER ./backups/mongodb

# Or use auto-fix
./scripts/verify-mongodb-backup-permissions.sh --fix
```

### Connection Issues
```bash
# Test MongoDB connection
mongosh --host mongodb --port 27017 \
  --username longgggwww \
  --password 123456 \
  --authenticationDatabase admin

# Run full environment test
./scripts/test-mongodb-backup-env.sh
```

### Disk Space Issues
```bash
# Check disk space
df -h ./backups/mongodb/

# Reduce retention in .env
RETENTION_DAYS=3

# Manually clean old backups
rm -rf ./backups/mongodb/mongodb_backup_20230101_*
```

### Cronjob Not Running
```bash
# Check cron service
sudo systemctl status cron

# View cron logs
grep CRON /var/log/syslog

# Edit crontab manually
crontab -e
```

## 📊 File Locations

| Item | Location |
|------|----------|
| Scripts | `./scripts/` |
| Backups | `./backups/mongodb/` |
| Main log | `/var/log/mongodb-backup.log` |
| Cron log | `/var/log/mongodb-backup-cron.log` |
| Config | `./.env` |

## 🔑 Key Scripts

| Script | Purpose |
|--------|---------|
| `backup-mongodb.sh` | Perform backup |
| `restore-mongodb.sh` | Restore from backup |
| `setup-mongodb-backup-cron.sh` | Setup automation |
| `test-mongodb-backup-env.sh` | Test environment |
| `verify-mongodb-backup-permissions.sh` | Check permissions |

## ⏰ Cron Schedule Format

```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, 0=Sunday)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

### Examples
- `0 4 * * *` = Daily at 4:00 AM
- `*/30 * * * *` = Every 30 minutes
- `0 */6 * * *` = Every 6 hours
- `0 0 * * 0` = Weekly (Sunday midnight)
- `0 3 1 * *` = Monthly (1st at 3:00 AM)

## 🆘 Emergency Procedures

### Quick Restore
```bash
# 1. List backups
./scripts/restore-mongodb.sh

# 2. Choose and restore
./scripts/restore-mongodb.sh mongodb_backup_YYYYMMDD_HHMMSS

# 3. Confirm when prompted
yes
```

### Manual Backup
```bash
# If scripts fail, use mongodump directly
mongodump \
  --host=mongodb \
  --port=27017 \
  --username=longgggwww \
  --password=123456 \
  --authenticationDatabase=admin \
  --db=logs \
  --out=./emergency-backup \
  --gzip
```

### Stop Automated Backups
```bash
# Remove cronjob
crontab -e
# Delete the MongoDB backup line and save
```

## 📞 Quick Help

### View Documentation
```bash
# Main guide
cat docs/MONGODB_BACKUP_GUIDE.md

# Implementation details
cat docs/MONGODB_BACKUP_IMPLEMENTATION.md

# This quick ref
cat docs/MONGODB_BACKUP_QUICK_REF.md
```

### Script Help
```bash
# Most scripts show usage when run without args
./scripts/restore-mongodb.sh
./scripts/setup-mongodb-backup-cron.sh
```

## ✅ Quick Checklist

### Initial Setup
- [ ] Install MongoDB tools
- [ ] Configure .env file
- [ ] Test environment
- [ ] Fix permissions if needed
- [ ] Test manual backup
- [ ] Setup cronjob
- [ ] Verify cronjob installed

### Regular Maintenance
- [ ] Check logs weekly
- [ ] Test restore monthly
- [ ] Monitor disk space
- [ ] Review retention policy

### Before Production
- [ ] Test in staging
- [ ] Verify backup works
- [ ] Test restore works
- [ ] Document procedures
- [ ] Train team members

## 🔗 Resources

- Full Guide: `docs/MONGODB_BACKUP_GUIDE.md`
- Implementation: `docs/MONGODB_BACKUP_IMPLEMENTATION.md`
- MongoDB Docs: https://docs.mongodb.com/manual/core/backups/
- Cron Format: https://crontab.guru/
