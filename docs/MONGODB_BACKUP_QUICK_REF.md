# MongoDB Backup - Quick Reference

## 🎯 Thiết lập Cronjob (Chỉ cần làm 1 lần)

```bash
./scripts/setup-mongodb-backup-cron.sh
```

Script này sẽ tự động:
- ✅ Tạo thư mục backup với quyền đúng
- ✅ Tạo log file với quyền đúng
- ✅ Thiết lập cronjob chạy lúc 4:00 AM
- ✅ Tích hợp file .env

Với file .env tùy chỉnh:
```bash
./scripts/setup-mongodb-backup-cron.sh --env-file /path/to/.env
```

Với lịch backup tùy chỉnh:
```bash
./scripts/setup-mongodb-backup-cron.sh --schedule "0 2 * * *"  # 2:00 AM
```

✅ Sau khi chạy, hệ thống sẽ tự động backup MongoDB lúc **4:00 AM** mỗi ngày **không cần sudo**.

## ✔️ Verify hệ thống

```bash
./scripts/verify-mongodb-backup-permissions.sh
```

Script này kiểm tra:
- Docker access
- Backup directory permissions
- Log file permissions
- MongoDB container status
- Cronjob configuration
- Environment variables

## 📋 Các lệnh thường dùng

### Backup ngay
```bash
./scripts/backup-mongodb.sh
# hoặc với .env cụ thể
./scripts/backup-mongodb.sh --env-file /path/to/.env
```

### Backup với tùy chọn
```bash
# Thay đổi thời gian lưu trữ
./scripts/backup-mongodb.sh --retention-days 14

# Thay đổi thư mục backup
./scripts/backup-mongodb.sh --backup-dir /custom/path

# Kết hợp các tùy chọn
./scripts/backup-mongodb.sh --env-file .env --backup-dir /backups --retention-days 30
```

### Xem danh sách backup
```bash
ls -lh /var/backups/mongodb/
```

### Restore từ backup
```bash
./scripts/restore-mongodb.sh mongodb_backup_YYYYMMDD_HHMMSS.tar.gz
# hoặc với .env cụ thể
./scripts/restore-mongodb.sh --env-file /path/to/.env backup_file.tar.gz
```

### Xem log backup
```bash
tail -f /var/log/mongodb-backup.log
```

### Kiểm tra cronjob
```bash
crontab -l
```

### Xóa cronjob
```bash
crontab -l | grep -v "backup-mongodb.sh" | crontab -
```

## 🔧 Options

### backup-mongodb.sh
```bash
--env-file FILE         # Path to .env file
--backup-dir DIR        # Backup directory (default: /var/backups/mongodb)
--retention-days DAYS   # Days to keep backups (default: 7)
--help                  # Show help
```

### restore-mongodb.sh
```bash
--env-file FILE      # Path to .env file
--backup-dir DIR     # Backup directory (default: /var/backups/mongodb)
--help               # Show help
```

### setup-mongodb-backup-cron.sh
```bash
--env-file FILE      # Path to .env file
--schedule CRON      # Cron schedule (default: '0 4 * * *')
--help               # Show help
```

## 📝 Thông tin quan trọng

- **Thời gian backup**: 4:00 AM hằng ngày (có thể tùy chỉnh)
- **Vị trí backup**: `/var/backups/mongodb/` (có thể tùy chỉnh)
- **Lưu trữ**: 7 ngày (có thể tùy chỉnh)
- **Log file**: `/var/log/mongodb-backup.log`
- **Format**: `mongodb_backup_YYYYMMDD_HHMMSS.tar.gz`
- **Biến môi trường**: Scripts tự động tìm `.env` hoặc dùng `--env-file`

## 🔑 Biến môi trường (.env)

```bash
MONGO_USERNAME=longgggwww
MONGO_PASSWORD=123456
MONGO_DATABASE=logs
```

Scripts tự động tìm file `.env` trong thư mục gốc của project.
Hoặc sử dụng `--env-file` để chỉ định đường dẫn cụ thể.

## 📚 Hướng dẫn chi tiết

Xem [MONGODB_BACKUP_GUIDE.md](./MONGODB_BACKUP_GUIDE.md) để biết thêm chi tiết.
