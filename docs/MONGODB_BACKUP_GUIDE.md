# MongoDB Backup Guide

## 📋 Overview

This guide provides comprehensive instructions for using the automated MongoDB backup system for the log monitoring application.

## 🎯 Features

- ✅ **Automated Daily Backups** - Scheduled backups at 4:00 AM (configurable)
- ✅ **Retention Policy** - Automatically keeps last 7 backups (configurable)
- ✅ **Easy Restore** - Simple restore process with interactive selection
- ✅ **Environment Configuration** - Uses `.env` file for configuration
- ✅ **Comprehensive Logging** - Detailed logs for monitoring and debugging
- ✅ **Permission Management** - Tools to verify and fix permissions
- ✅ **Environment Testing** - Test environment before running backups

## 📁 File Structure

```
scripts/
├── backup-mongodb.sh                    # Main backup script
├── restore-mongodb.sh                   # Restore from backup
├── setup-mongodb-backup-cron.sh         # Setup automated cronjob
├── test-mongodb-backup-env.sh           # Test environment
└── verify-mongodb-backup-permissions.sh # Verify permissions

backups/
└── mongodb/                             # Backup storage location
    ├── mongodb_backup_20240101_040000/
    ├── mongodb_backup_20240102_040000/
    └── ...

logs/
└── mongodb-backup.log                   # Backup operation logs
```

## 🚀 Quick Start

### 1. Prerequisites

Install MongoDB Database Tools:

```bash
# Ubuntu/Debian
sudo apt-get install mongodb-database-tools

# macOS
brew install mongodb-database-tools

# Or download from:
# https://www.mongodb.com/try/download/database-tools
```

### 2. Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` file:

```bash
# MongoDB Configuration
MONGO_USERNAME=longgggwww
MONGO_PASSWORD=123456
MONGO_DATABASE=logs
MONGO_HOST=mongodb
MONGO_PORT=27017
MONGO_AUTH_DB=admin

# Backup Configuration (optional)
BACKUP_DIR=./backups/mongodb
LOG_FILE=/var/log/mongodb-backup.log
RETENTION_DAYS=7
```

### 3. Test Environment

Before setting up automated backups, test your environment:

```bash
./scripts/test-mongodb-backup-env.sh
```

This will verify:
- MongoDB tools are installed
- Environment variables are loaded correctly
- MongoDB connection is working
- Directories have correct permissions
- Sufficient disk space is available

### 4. Verify Permissions

Check and fix permissions if needed:

```bash
# Check only
./scripts/verify-mongodb-backup-permissions.sh

# Check and fix
./scripts/verify-mongodb-backup-permissions.sh --fix
```

### 5. Manual Backup Test

Test manual backup before setting up automation:

```bash
./scripts/backup-mongodb.sh
```

This will:
- Create a timestamped backup in `./backups/mongodb/`
- Log all operations to `/var/log/mongodb-backup.log`
- Display backup summary

### 6. Setup Automated Backups

Setup daily automated backups at 4:00 AM:

```bash
./scripts/setup-mongodb-backup-cron.sh
```

Or specify custom schedule (e.g., 2:00 AM):

```bash
./scripts/setup-mongodb-backup-cron.sh "0 2 * * *"
```

### 7. Verify Cronjob

Check that cronjob was installed:

```bash
crontab -l
```

## 📖 Usage

### Manual Backup

Run manual backup at any time:

```bash
./scripts/backup-mongodb.sh
```

### List Available Backups

```bash
./scripts/restore-mongodb.sh
```

This will display all available backups with their sizes and dates.

### Restore from Backup

```bash
./scripts/restore-mongodb.sh mongodb_backup_20240101_040000
```

**⚠️ WARNING**: Restore will DROP existing data before restoring!

The script will:
1. List available backups if no backup name provided
2. Validate the selected backup
3. Ask for confirmation before proceeding
4. Restore the database
5. Display summary

### View Backup Logs

```bash
# View all logs
tail -f /var/log/mongodb-backup.log

# View recent logs
tail -n 100 /var/log/mongodb-backup.log

# View cron job logs
tail -f /var/log/mongodb-backup-cron.log
```

## 🔧 Configuration Options

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGO_HOST` | `mongodb` | MongoDB host |
| `MONGO_PORT` | `27017` | MongoDB port |
| `MONGO_USERNAME` | `longgggwww` | MongoDB username |
| `MONGO_PASSWORD` | `123456` | MongoDB password |
| `MONGO_DATABASE` | `logs` | Database to backup |
| `MONGO_AUTH_DB` | `admin` | Authentication database |
| `BACKUP_DIR` | `./backups/mongodb` | Backup storage directory |
| `LOG_FILE` | `/var/log/mongodb-backup.log` | Log file path |
| `RETENTION_DAYS` | `7` | Number of days to keep backups |

### Cron Schedule Examples

| Schedule | Description |
|----------|-------------|
| `0 4 * * *` | Daily at 4:00 AM (default) |
| `0 2 * * *` | Daily at 2:00 AM |
| `0 0 * * 0` | Weekly on Sunday at midnight |
| `0 3 * * 1-5` | Weekdays at 3:00 AM |
| `0 */6 * * *` | Every 6 hours |

## 🛠️ Troubleshooting

### Issue: MongoDB Tools Not Found

**Solution**: Install MongoDB Database Tools

```bash
# Ubuntu/Debian
sudo apt-get install mongodb-database-tools

# Or download from MongoDB website
```

### Issue: Permission Denied

**Solution**: Fix permissions

```bash
# Fix script permissions
chmod +x scripts/*.sh

# Fix directory permissions
sudo chown -R $USER:$USER ./backups/mongodb
sudo chmod -R u+w ./backups/mongodb

# Or use the verification script
./scripts/verify-mongodb-backup-permissions.sh --fix
```

### Issue: Cannot Connect to MongoDB

**Solution**: Check MongoDB connection

```bash
# Test connection manually
mongosh --host mongodb --port 27017 \
  --username longgggwww \
  --password 123456 \
  --authenticationDatabase admin

# Or run environment test
./scripts/test-mongodb-backup-env.sh
```

### Issue: Backup Directory Full

**Solution**: Reduce retention days or increase disk space

```bash
# Check disk space
df -h ./backups/mongodb

# Reduce retention (in .env)
RETENTION_DAYS=3

# Or manually clean old backups
rm -rf ./backups/mongodb/mongodb_backup_20240101_*
```

### Issue: Cronjob Not Running

**Solution**: Check cron service and logs

```bash
# Check cron service
sudo systemctl status cron    # Ubuntu/Debian
sudo systemctl status crond   # CentOS/RHEL

# View cron logs
grep CRON /var/log/syslog     # Ubuntu/Debian
tail -f /var/log/cron         # CentOS/RHEL

# Check cronjob
crontab -l
```

## 📊 Monitoring

### Check Backup Status

```bash
# List all backups
ls -lh ./backups/mongodb/

# Check latest backup
ls -lt ./backups/mongodb/ | head -n 2

# Check backup sizes
du -sh ./backups/mongodb/*
```

### Monitor Logs

```bash
# Real-time log monitoring
tail -f /var/log/mongodb-backup.log

# Check for errors
grep ERROR /var/log/mongodb-backup.log

# Check recent backups
grep "Backup completed successfully" /var/log/mongodb-backup.log | tail -n 5
```

### Backup Health Check

```bash
# Run environment test
./scripts/test-mongodb-backup-env.sh

# Verify permissions
./scripts/verify-mongodb-backup-permissions.sh
```

## 🔒 Security Best Practices

1. **Secure Credentials**
   - Never commit `.env` file to version control
   - Use strong passwords for MongoDB
   - Restrict file permissions: `chmod 600 .env`

2. **Backup Storage**
   - Store backups in secure location
   - Consider encrypting backups
   - Implement off-site backup strategy

3. **Access Control**
   - Limit access to backup scripts and files
   - Use dedicated backup user with minimal permissions
   - Regularly audit backup access logs

4. **Network Security**
   - Use MongoDB authentication
   - Configure firewall rules
   - Use SSL/TLS for MongoDB connections in production

## 📝 Maintenance

### Regular Tasks

- **Weekly**: Review backup logs for errors
- **Monthly**: Test restore process
- **Quarterly**: Review and update retention policy
- **Annually**: Review and update security practices

### Log Rotation

Setup log rotation for backup logs:

```bash
# Create logrotate configuration
sudo nano /etc/logrotate.d/mongodb-backup

# Add content:
/var/log/mongodb-backup.log {
    weekly
    rotate 4
    compress
    missingok
    notifempty
    create 644 root root
}
```

## 🆘 Support

For issues or questions:

1. Check this guide and troubleshooting section
2. Review logs: `/var/log/mongodb-backup.log`
3. Run diagnostics: `./scripts/test-mongodb-backup-env.sh`
4. Check [MONGODB_BACKUP_IMPLEMENTATION.md](./MONGODB_BACKUP_IMPLEMENTATION.md) for technical details

## 📚 Additional Resources

- [MongoDB Backup Documentation](https://docs.mongodb.com/manual/core/backups/)
- [mongodump Reference](https://docs.mongodb.com/database-tools/mongodump/)
- [mongorestore Reference](https://docs.mongodb.com/database-tools/mongorestore/)
- [Cron Format Guide](https://crontab.guru/)

## ✅ Next Steps

After successful setup:

1. ✅ Monitor first automated backup
2. ✅ Test restore process in development
3. ✅ Setup monitoring alerts (optional)
4. ✅ Document backup procedures for your team
5. ✅ Plan disaster recovery procedures
