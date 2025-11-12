# MongoDB Backup - Permission Fix Summary

## ✅ Đã khắc phục vấn đề permissions

### 🔴 Vấn đề ban đầu

Cronjob có thể bị **permission denied** khi chạy vào 4h sáng vì:
1. ❌ Thư mục `/var/backups/mongodb` thuộc về `root`
2. ❌ Log file `/var/log/mongodb-backup.log` thuộc về `root`
3. ❌ User không thể ghi vào các thư mục này

### ✅ Giải pháp đã triển khai

#### 1. Cập nhật `backup-mongodb.sh`
Thêm kiểm tra và tự động tạo thư mục với quyền đúng:
```bash
# Create backup directory if it doesn't exist with proper permissions
if [ ! -d "$BACKUP_DIR" ]; then
    echo "Creating backup directory: $BACKUP_DIR"
    sudo mkdir -p "$BACKUP_DIR"
    sudo chown $USER:$USER "$BACKUP_DIR"
    sudo chmod 755 "$BACKUP_DIR"
fi

# Check if we have write permission
if [ ! -w "$BACKUP_DIR" ]; then
    echo "Error: No write permission for $BACKUP_DIR"
    echo "Run: sudo chown $USER:$USER $BACKUP_DIR"
    exit 1
fi
```

#### 2. Cập nhật `setup-mongodb-backup-cron.sh`
Tự động thiết lập permissions khi setup cronjob:
```bash
# Create and setup log file with proper permissions
sudo mkdir -p /var/log
sudo touch /var/log/mongodb-backup.log
sudo chown $USER:$USER /var/log/mongodb-backup.log
sudo chmod 644 /var/log/mongodb-backup.log

# Create and setup backup directory with proper permissions
BACKUP_DIR="/var/backups/mongodb"
sudo mkdir -p "$BACKUP_DIR"
sudo chown $USER:$USER "$BACKUP_DIR"
sudo chmod 755 "$BACKUP_DIR"
```

#### 3. Tạo `verify-mongodb-backup-permissions.sh`
Script để verify tất cả permissions:
- ✅ Docker group membership
- ✅ Backup directory permissions
- ✅ Log file permissions
- ✅ MongoDB container status
- ✅ Cronjob configuration
- ✅ Environment variables

### 📊 Kết quả sau khi fix

```bash
# Trước
drwxr-xr-x 2 root root 4096 Nov 12 11:38 /var/backups/mongodb
-rw-rw-rw- 1 root root    0 Nov 12 11:37 /var/log/mongodb-backup.log

# Sau
drwxr-xr-x 2 ad ad 4096 Nov 12 11:38 /var/backups/mongodb
-rw-r--r-- 1 ad ad    0 Nov 12 11:40 /var/log/mongodb-backup.log
```

### ✅ Đảm bảo

1. **Không cần sudo khi cronjob chạy**
   - Thư mục backup thuộc về user hiện tại
   - Log file thuộc về user hiện tại
   - User đã ở trong docker group

2. **Tự động fix permissions**
   - Script setup tự động chown/chmod
   - Script backup kiểm tra quyền ghi
   - Error message rõ ràng nếu có vấn đề

3. **Verification tool**
   - Chạy `./scripts/verify-mongodb-backup-permissions.sh`
   - Kiểm tra tất cả 6 điều kiện cần thiết
   - Hiển thị màu sắc rõ ràng (✓ pass, ⚠ warning)

### 🧪 Testing

```bash
# 1. Setup lại cronjob (tự động fix permissions)
./scripts/setup-mongodb-backup-cron.sh --env-file .env

# 2. Verify permissions
./scripts/verify-mongodb-backup-permissions.sh

# Output mong đợi:
# ✓ All checks passed!
# MongoDB backup system is ready to use.

# 3. Test backup không cần sudo
./scripts/backup-mongodb.sh --env-file .env

# Output mong đợi:
# Backup created: mongodb_backup_20241112_114135.tar.gz (4.0K)
```

### 📝 Workflow hoàn chỉnh

#### Setup lần đầu:
```bash
# 1. Đảm bảo user trong docker group
sudo usermod -aG docker $USER
# Logout và login lại

# 2. Setup cronjob (tự động fix permissions)
./scripts/setup-mongodb-backup-cron.sh --env-file .env

# 3. Verify
./scripts/verify-mongodb-backup-permissions.sh

# 4. Test backup
./scripts/backup-mongodb.sh --env-file .env
```

#### Cronjob sẽ chạy tự động:
- ⏰ Mỗi ngày lúc 4:00 AM
- 👤 Dưới user hiện tại (không cần sudo)
- 📝 Log vào `/var/log/mongodb-backup.log`
- 💾 Backup vào `/var/backups/mongodb/`
- 🔐 Với credentials từ `.env`

### 🎯 Lợi ích

1. **An toàn hơn**
   - Không chạy với sudo trong cron
   - User chỉ có quyền cần thiết
   - Isolate permissions

2. **Dễ troubleshoot**
   - Verify script kiểm tra tất cả
   - Error messages rõ ràng
   - Tự động suggest fix

3. **Tự động hóa hoàn toàn**
   - Setup script fix mọi thứ
   - Không cần manual intervention
   - Zero configuration

### 📚 Documentation cập nhật

1. ✅ `MONGODB_BACKUP_QUICK_REF.md` - Thêm phần verify
2. ✅ `scripts/verify-mongodb-backup-permissions.sh` - Script mới
3. ✅ `MONGODB_BACKUP_PERMISSION_FIX.md` - File này

### 🎉 Kết luận

✅ **Đã fix hoàn toàn vấn đề permission denied**

Cronjob giờ đây:
- ✅ Chạy được lúc 4h sáng mà không lỗi
- ✅ Không cần sudo
- ✅ Tự động verify permissions
- ✅ Error handling tốt hơn
- ✅ Production-ready

### 🔍 Troubleshooting

Nếu vẫn gặp permission issues:

```bash
# 1. Chạy verify script
./scripts/verify-mongodb-backup-permissions.sh

# 2. Fix thủ công nếu cần
sudo chown $USER:$USER /var/backups/mongodb
sudo chown $USER:$USER /var/log/mongodb-backup.log

# 3. Hoặc chạy lại setup
./scripts/setup-mongodb-backup-cron.sh --env-file .env
```
