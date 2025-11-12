# MongoDB Backup Permission Troubleshooting Guide

## 📋 Overview

This guide helps you diagnose and fix permission-related issues with the MongoDB backup system.

## 🔍 Common Permission Issues

### 1. Scripts Not Executable

**Symptoms**:
- Error: "Permission denied" when running scripts
- Scripts don't execute

**Diagnosis**:
```bash
ls -l scripts/*mongodb*.sh
```

**Solution**:
```bash
# Make all scripts executable
chmod +x scripts/backup-mongodb.sh
chmod +x scripts/restore-mongodb.sh
chmod +x scripts/setup-mongodb-backup-cron.sh
chmod +x scripts/test-mongodb-backup-env.sh
chmod +x scripts/verify-mongodb-backup-permissions.sh

# Or all at once
chmod +x scripts/*.sh

# Verify
ls -l scripts/*mongodb*.sh
# Expected: -rwxr-xr-x
```

### 2. Backup Directory Not Writable

**Symptoms**:
- Error: "Permission denied" when creating backup
- Cannot write to backup directory

**Diagnosis**:
```bash
ls -ld ./backups/mongodb/
test -w ./backups/mongodb/ && echo "Writable" || echo "Not writable"
```

**Solutions**:

**Option 1: Change ownership**
```bash
sudo chown -R $USER:$USER ./backups/mongodb/
```

**Option 2: Add write permission**
```bash
chmod u+w ./backups/mongodb/
```

**Option 3: Create directory if missing**
```bash
mkdir -p ./backups/mongodb
chmod 755 ./backups/mongodb
```

### 3. Log Directory Not Writable

**Symptoms**:
- Warning messages about logging
- Logs not being created
- "Permission denied" for log file

**Diagnosis**:
```bash
ls -ld /var/log/
test -w /var/log/ && echo "Writable" || echo "Not writable"
```

**Solutions**:

**Option 1: Use sudo for log directory**
```bash
sudo mkdir -p /var/log
sudo chmod 755 /var/log
```

**Option 2: Create log file with proper permissions**
```bash
sudo touch /var/log/mongodb-backup.log
sudo chown $USER:$USER /var/log/mongodb-backup.log
sudo chmod 644 /var/log/mongodb-backup.log
```

**Option 3: Use alternative log location**
```bash
# In .env file
LOG_FILE=./logs/mongodb-backup.log

# Create directory
mkdir -p ./logs
chmod 755 ./logs
```

### 4. .env File Not Readable

**Symptoms**:
- Scripts use default values instead of .env values
- Warning: "cannot read .env file"

**Diagnosis**:
```bash
ls -l .env
test -r .env && echo "Readable" || echo "Not readable"
```

**Solution**:
```bash
# Make .env readable (but not too open)
chmod 600 .env

# If needed, adjust ownership
chown $USER:$USER .env

# Verify
ls -l .env
# Expected: -rw-------
```

## 🛠️ Automated Fix Tool

### Using verify-mongodb-backup-permissions.sh

**Check permissions only**:
```bash
./scripts/verify-mongodb-backup-permissions.sh
```

**Check and auto-fix**:
```bash
./scripts/verify-mongodb-backup-permissions.sh --fix
```

### What It Checks

1. ✅ Script executability
2. ✅ Backup directory writability
3. ✅ Log directory writability
4. ✅ User permissions
5. ✅ Disk space availability

### Example Output

```bash
[INFO] MongoDB Backup Permission Verification
[INFO] Mode: FIX (will attempt to fix issues)
[INFO] ==========================================

[INFO] Checking script permissions...
[INFO]   ✓ backup-mongodb.sh is executable
[INFO]   ✓ restore-mongodb.sh is executable
[SUCCESS] ✓ All scripts are executable

[INFO] Checking directory permissions...
[SUCCESS] ✓ Backup directory is writable: ./backups/mongodb
[INFO]   Current permissions: drwxr-xr-x runner runner

[INFO] Checking log file permissions...
[SUCCESS] ✓ Log directory is writable: /var/log
[INFO]   Current permissions: drwxrwxr-x root syslog

[SUCCESS] Checks Passed: 5
[ERROR] Checks Failed: 0
[SUCCESS] All permission checks passed!
```

## 📊 Permission Reference

### Recommended Permissions

| Item | Permission | Owner | Description |
|------|-----------|-------|-------------|
| Scripts | `755` (rwxr-xr-x) | User | Executable by all |
| .env | `600` (rw-------) | User | Read/write by owner only |
| Backup dir | `750` (rwxr-x---) | User | Full access for owner |
| Backups | `640` (rw-r-----) | User | Read/write owner, read group |
| Log dir | `755` (rwxr-xr-x) | root | Writable by owner |
| Log files | `640` (rw-r-----) | User/root | Read/write owner, read group |

### Permission Codes

| Code | Numeric | User | Group | Others |
|------|---------|------|-------|--------|
| `755` | rwxr-xr-x | rwx | r-x | r-x |
| `750` | rwxr-x--- | rwx | r-x | --- |
| `644` | rw-r--r-- | rw- | r-- | r-- |
| `640` | rw-r----- | rw- | r-- | --- |
| `600` | rw------- | rw- | --- | --- |

## 🔐 Security Considerations

### Principle of Least Privilege

1. **Scripts**: Should be executable but not writable by others
```bash
chmod 755 scripts/*.sh
```

2. **.env file**: Should be readable/writable only by owner
```bash
chmod 600 .env
```

3. **Backup directory**: Should be accessible only by backup user
```bash
chmod 750 ./backups/mongodb
```

4. **Backup files**: Should not be world-readable
```bash
chmod 640 ./backups/mongodb/mongodb_backup_*
```

### User and Group Management

**Create dedicated backup user** (optional):
```bash
# Create backup user
sudo useradd -r -s /bin/bash mongobackup

# Add to necessary groups
sudo usermod -a -G mongodb mongobackup

# Change ownership
sudo chown -R mongobackup:mongobackup ./backups/mongodb

# Set up cronjob for backup user
sudo -u mongobackup crontab -e
```

## 🐛 Troubleshooting Specific Errors

### Error: "bash: ./scripts/backup-mongodb.sh: Permission denied"

**Cause**: Script not executable

**Fix**:
```bash
chmod +x scripts/backup-mongodb.sh
```

### Error: "cannot create directory './backups/mongodb': Permission denied"

**Cause**: No write permission in parent directory

**Fix**:
```bash
# Check parent directory
ls -ld ./backups/

# Fix parent directory
chmod u+w ./backups/

# Or create with proper permissions
mkdir -p ./backups/mongodb
```

### Error: "cannot open /var/log/mongodb-backup.log: Permission denied"

**Cause**: No write permission for log file or directory

**Fix Option 1** (if you have sudo):
```bash
sudo touch /var/log/mongodb-backup.log
sudo chown $USER:$USER /var/log/mongodb-backup.log
```

**Fix Option 2** (alternative location):
```bash
# Use local log directory
mkdir -p ./logs
echo 'LOG_FILE=./logs/mongodb-backup.log' >> .env
```

### Error: "mongodump: command not found"

**Cause**: MongoDB tools not installed or not in PATH

**Fix**:
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install mongodb-database-tools

# macOS
brew install mongodb-database-tools

# Verify installation
which mongodump
mongodump --version
```

### Warning: "cannot read '.env': No such file or directory"

**Cause**: .env file doesn't exist

**Fix**:
```bash
# Create from example
cp .env.example .env

# Or create minimal version
cat > .env << EOF
MONGO_HOST=mongodb
MONGO_PORT=27017
MONGO_USERNAME=longgggwww
MONGO_PASSWORD=123456
MONGO_DATABASE=logs
EOF

# Set permissions
chmod 600 .env
```

## 🔧 Advanced Fixes

### Running as Different User

If scripts need to run as a different user:

```bash
# Option 1: sudo
sudo -u mongobackup ./scripts/backup-mongodb.sh

# Option 2: Change ownership
sudo chown mongobackup:mongobackup scripts/*.sh
sudo -u mongobackup ./scripts/backup-mongodb.sh

# Option 3: Add to sudoers (for automated runs)
echo "mongobackup ALL=(ALL) NOPASSWD: /path/to/backup-mongodb.sh" | \
  sudo tee /etc/sudoers.d/mongodb-backup
```

### SELinux Issues (CentOS/RHEL)

If SELinux is enabled and blocking:

```bash
# Check SELinux status
getenforce

# View denials
sudo ausearch -m avc -ts recent

# Fix contexts
sudo chcon -R -t user_home_t ./backups/mongodb/

# Or temporarily disable for testing
sudo setenforce 0  # Permissive mode
```

### AppArmor Issues (Ubuntu)

If AppArmor is blocking:

```bash
# Check status
sudo aa-status

# View denials
sudo dmesg | grep -i apparmor

# Create profile or disable for specific app
sudo aa-complain /path/to/script
```

## 📝 Permission Checklist

### Pre-flight Checklist

Run before first backup:

- [ ] All scripts are executable (`chmod +x scripts/*.sh`)
- [ ] .env file exists and is readable (`chmod 600 .env`)
- [ ] Backup directory exists (`mkdir -p ./backups/mongodb`)
- [ ] Backup directory is writable (`chmod 750 ./backups/mongodb`)
- [ ] Log directory is accessible
- [ ] MongoDB tools are installed
- [ ] Current user has necessary permissions
- [ ] Run verification script: `./scripts/verify-mongodb-backup-permissions.sh`

### Quick Fix Script

Create and run this quick fix:

```bash
#!/bin/bash
# quick-fix-permissions.sh

echo "Fixing MongoDB backup permissions..."

# Fix script permissions
chmod +x scripts/backup-mongodb.sh
chmod +x scripts/restore-mongodb.sh
chmod +x scripts/setup-mongodb-backup-cron.sh
chmod +x scripts/test-mongodb-backup-env.sh
chmod +x scripts/verify-mongodb-backup-permissions.sh

# Fix .env permissions
if [ -f .env ]; then
    chmod 600 .env
fi

# Create and fix backup directory
mkdir -p ./backups/mongodb
chmod 750 ./backups/mongodb

# Create and fix log directory
mkdir -p ./logs
chmod 755 ./logs

echo "Done! Run verification:"
echo "./scripts/verify-mongodb-backup-permissions.sh"
```

Save and run:
```bash
chmod +x quick-fix-permissions.sh
./quick-fix-permissions.sh
```

## 🆘 Getting Help

If you still have permission issues:

1. **Run diagnostics**:
```bash
./scripts/verify-mongodb-backup-permissions.sh > permission-report.txt
./scripts/test-mongodb-backup-env.sh >> permission-report.txt
```

2. **Collect information**:
```bash
# System info
uname -a
whoami
groups

# File permissions
ls -la .env
ls -la scripts/
ls -lad ./backups/mongodb/
ls -la /var/log/mongodb-backup.log

# Disk space
df -h ./backups/mongodb/
```

3. **Review documentation**:
- Main guide: `docs/MONGODB_BACKUP_GUIDE.md`
- Environment: `docs/MONGODB_BACKUP_ENV_UPDATE.md`

## 📚 References

- [Linux File Permissions](https://www.linux.com/training-tutorials/understanding-linux-file-permissions/)
- [chmod Command](https://man7.org/linux/man-pages/man1/chmod.1.html)
- [chown Command](https://man7.org/linux/man-pages/man1/chown.1.html)
- [Bash Scripting Permissions](https://www.shellscript.sh/tips/permissions/)

---

**Remember**: Always test permission changes in a development environment first!
