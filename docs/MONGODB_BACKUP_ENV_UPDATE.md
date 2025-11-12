# MongoDB Backup Environment Configuration

## 📋 Overview

This document provides detailed information about environment configuration for the MongoDB backup system.

## 🔧 Environment Variables

### Required Variables

These variables must be set for the backup system to function:

#### MongoDB Connection

```bash
# MongoDB server hostname or IP
MONGO_HOST=mongodb

# MongoDB server port
MONGO_PORT=27017

# MongoDB authentication username
MONGO_USERNAME=longgggwww

# MongoDB authentication password
MONGO_PASSWORD=123456

# Database name to backup
MONGO_DATABASE=logs
```

### Optional Variables

These variables have default values and can be customized:

#### MongoDB Authentication

```bash
# Authentication database (default: admin)
MONGO_AUTH_DB=admin
```

#### Backup Configuration

```bash
# Directory for storing backups (default: ./backups/mongodb)
BACKUP_DIR=./backups/mongodb

# Log file location (default: /var/log/mongodb-backup.log)
LOG_FILE=/var/log/mongodb-backup.log

# Backup retention in days (default: 7)
RETENTION_DAYS=7
```

## 📄 .env File Setup

### Creating .env File

1. **Copy from example**:
```bash
cp .env.example .env
```

2. **Edit configuration**:
```bash
nano .env  # or your preferred editor
```

3. **Secure the file**:
```bash
chmod 600 .env
```

### .env File Template

```bash
# ============================================
# MongoDB Backup Configuration
# ============================================

# MongoDB Connection Settings
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

# ============================================
# Other Application Settings
# (Keep your existing settings below)
# ============================================

# ... rest of your .env file ...
```

## 🐳 Docker Environment Integration

### Using with Docker Compose

The backup scripts can connect to MongoDB running in Docker. The default settings are already configured for Docker Compose setup:

```yaml
# docker-compose.yml (excerpt)
mongodb:
  image: mongo:7.0
  container_name: mongodb
  environment:
    MONGO_INITDB_ROOT_USERNAME: ${MONGO_USERNAME:-longgggwww}
    MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD:-123456}
    MONGO_INITDB_DATABASE: ${MONGO_DATABASE:-logs}
  ports:
    - "27017:27017"
```

### Accessing MongoDB from Host

**Option 1: Use exposed port (default)**
```bash
MONGO_HOST=localhost  # or your host IP
MONGO_PORT=27017
```

**Option 2: Connect from within Docker network**
```bash
MONGO_HOST=mongodb  # container name
MONGO_PORT=27017
```

**Option 3: Run backup from within container**
```bash
# Execute backup inside container
docker exec -it mongodb /path/to/backup-mongodb.sh
```

## 🔐 Security Best Practices

### .env File Security

1. **Never commit to version control**:
```bash
# Ensure .env is in .gitignore
echo ".env" >> .gitignore
```

2. **Restrict file permissions**:
```bash
# Only owner can read/write
chmod 600 .env

# Verify permissions
ls -la .env
# Expected: -rw------- 1 user user
```

3. **Use strong passwords**:
```bash
# Generate strong password
openssl rand -base64 32

# Use in .env
MONGO_PASSWORD=your_strong_generated_password
```

### Credential Management

**Development Environment**:
- Use simple passwords for local development
- Keep credentials in `.env` file
- Don't share `.env` file

**Production Environment**:
- Use strong, unique passwords
- Consider using secret management systems
- Rotate credentials regularly
- Use environment-specific `.env` files

## 🌍 Environment-Specific Configuration

### Development Environment

```bash
# .env.development
MONGO_HOST=localhost
MONGO_PORT=27017
MONGO_USERNAME=dev_user
MONGO_PASSWORD=dev_password
MONGO_DATABASE=logs_dev
BACKUP_DIR=./backups/dev
RETENTION_DAYS=3
```

### Staging Environment

```bash
# .env.staging
MONGO_HOST=staging-mongodb
MONGO_PORT=27017
MONGO_USERNAME=staging_user
MONGO_PASSWORD=staging_password
MONGO_DATABASE=logs_staging
BACKUP_DIR=/data/backups/mongodb
RETENTION_DAYS=7
```

### Production Environment

```bash
# .env.production
MONGO_HOST=prod-mongodb.example.com
MONGO_PORT=27017
MONGO_USERNAME=backup_user
MONGO_PASSWORD=strong_production_password
MONGO_DATABASE=logs
BACKUP_DIR=/data/backups/mongodb
LOG_FILE=/var/log/mongodb-backup/production.log
RETENTION_DAYS=14
```

## 🔄 Variable Precedence

The scripts load variables in the following order (later overrides earlier):

1. **Script defaults** (lowest priority)
2. **`.env` file variables**
3. **Exported environment variables** (highest priority)

### Example

```bash
# In .env file
RETENTION_DAYS=7

# Export overrides .env
export RETENTION_DAYS=14

# Script will use: 14
./scripts/backup-mongodb.sh
```

## ✅ Validation

### Test Environment Variables

Run the environment test script:

```bash
./scripts/test-mongodb-backup-env.sh
```

This will verify:
- ✅ .env file exists and is readable
- ✅ All required variables are set
- ✅ MongoDB connection works
- ✅ Directories are accessible
- ✅ Tools are installed

### Manual Validation

```bash
# Load .env file
source .env

# Check variables
echo "Host: $MONGO_HOST"
echo "Port: $MONGO_PORT"
echo "Database: $MONGO_DATABASE"
echo "Backup Dir: $BACKUP_DIR"
echo "Retention: $RETENTION_DAYS days"
```

## 🐛 Troubleshooting

### Issue: Variables Not Loading

**Symptoms**:
- Scripts using default values instead of .env values
- Connection failures

**Solutions**:

1. **Check .env file location**:
```bash
# .env should be in project root
ls -la .env
```

2. **Check .env file format**:
```bash
# No spaces around =
MONGO_HOST=mongodb          # ✅ Correct
MONGO_HOST = mongodb        # ❌ Wrong
MONGO_HOST="mongodb"        # ✅ Correct (with quotes)
```

3. **Check for syntax errors**:
```bash
# Test loading
set -a
source .env
set +a
```

### Issue: Permission Denied Reading .env

**Solution**:
```bash
# Fix permissions
chmod 600 .env

# Or make readable by group
chmod 640 .env
```

### Issue: MongoDB Connection Fails

**Solutions**:

1. **Verify MongoDB is running**:
```bash
# Check Docker container
docker ps | grep mongodb

# Check local service
systemctl status mongod
```

2. **Test connection manually**:
```bash
mongosh --host $MONGO_HOST --port $MONGO_PORT \
  --username $MONGO_USERNAME \
  --password $MONGO_PASSWORD \
  --authenticationDatabase $MONGO_AUTH_DB
```

3. **Check network connectivity**:
```bash
# Ping MongoDB host
ping $MONGO_HOST

# Test port connectivity
telnet $MONGO_HOST $MONGO_PORT
# or
nc -zv $MONGO_HOST $MONGO_PORT
```

## 📝 Configuration Examples

### Local Development with Docker

```bash
# .env for local Docker Compose
MONGO_HOST=mongodb
MONGO_PORT=27017
MONGO_USERNAME=longgggwww
MONGO_PASSWORD=123456
MONGO_DATABASE=logs
BACKUP_DIR=./backups/mongodb
RETENTION_DAYS=3
```

### Remote MongoDB Server

```bash
# .env for remote MongoDB
MONGO_HOST=mongodb.example.com
MONGO_PORT=27017
MONGO_USERNAME=backup_user
MONGO_PASSWORD=secure_password
MONGO_DATABASE=logs
MONGO_AUTH_DB=admin
BACKUP_DIR=/mnt/backups/mongodb
LOG_FILE=/var/log/remote-mongodb-backup.log
RETENTION_DAYS=14
```

### Multiple Database Backup

Create separate .env files and scripts:

```bash
# .env.logs
MONGO_DATABASE=logs
BACKUP_DIR=./backups/mongodb/logs

# .env.analytics
MONGO_DATABASE=analytics
BACKUP_DIR=./backups/mongodb/analytics

# Run with specific env
env $(cat .env.logs | xargs) ./scripts/backup-mongodb.sh
env $(cat .env.analytics | xargs) ./scripts/backup-mongodb.sh
```

## 🔍 Debugging

### Enable Verbose Output

Add to script:
```bash
# Debug mode
set -x  # Print commands before execution

# Verbose MongoDB commands
mongodump --verbose ...
```

### Check Variable Values

```bash
# Add to backup script temporarily
echo "MONGO_HOST: $MONGO_HOST"
echo "MONGO_PORT: $MONGO_PORT"
echo "MONGO_DATABASE: $MONGO_DATABASE"
echo "BACKUP_DIR: $BACKUP_DIR"
```

### Environment Test Output

```bash
# Full environment test with details
./scripts/test-mongodb-backup-env.sh > env-test.log 2>&1
cat env-test.log
```

## 📚 Additional Resources

- [Environment Variables Guide](https://www.digitalocean.com/community/tutorials/how-to-read-and-set-environmental-and-shell-variables-on-linux)
- [MongoDB Connection String](https://docs.mongodb.com/manual/reference/connection-string/)
- [Docker Environment Variables](https://docs.docker.com/compose/environment-variables/)
- [Bash Environment Variables](https://www.gnu.org/software/bash/manual/html_node/Environment.html)

## ✅ Checklist

Before running backups:

- [ ] .env file created and configured
- [ ] .env file has correct permissions (600)
- [ ] All required variables are set
- [ ] MongoDB connection tested
- [ ] Directories exist and are writable
- [ ] Environment test passes
- [ ] Variables loaded correctly

---

**Note**: Always test configuration changes in a development environment before applying to production.
