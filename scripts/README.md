# Scripts Directory

Thư mục chứa các utility scripts để quản lý và vận hành hệ thống.

## 📂 Danh sách Scripts

### 🏗️ Build & Deployment

#### `build-all.sh`
Build tất cả các services trong hệ thống.
```bash
./scripts/build-all.sh           # Build tuần tự
./scripts/build-all.sh --parallel # Build song song
```

#### `clean-install.sh`
Xóa và cài đặt lại toàn bộ dependencies.
```bash
./scripts/clean-install.sh
```

#### `rebuild-interactive.sh`
Rebuild services theo chế độ tương tác (chọn service muốn rebuild).
```bash
./scripts/rebuild-interactive.sh
```

#### `trigger-rebuild.sh`
Trigger rebuild cho CI/CD pipeline.
```bash
./scripts/trigger-rebuild.sh
```

### 🌐 Web Application

#### `run-web-app.sh`
Chạy web application ở chế độ development.
```bash
./scripts/run-web-app.sh
```

#### `run-web-app-with-env.sh`
Chạy web application với environment variables cụ thể.
```bash
./scripts/run-web-app-with-env.sh
```

### 💾 Database Backup & Restore

#### `backup-mongodb.sh` ⭐ NEW
Backup MongoDB database vào file nén.
```bash
./scripts/backup-mongodb.sh
# Với options
./scripts/backup-mongodb.sh --env-file .env --backup-dir /backups --retention-days 14
```

Tính năng:
- Backup toàn bộ database MongoDB
- Nén thành file `.tar.gz`
- Tự động xóa backup cũ (mặc định 7 ngày)
- Lưu tại `/var/backups/mongodb/`
- Tự động tìm và load biến môi trường từ `.env`
- Hỗ trợ tùy chỉnh thư mục backup và retention

Options:
- `--env-file FILE` - Đường dẫn đến file .env
- `--backup-dir DIR` - Thư mục lưu backup (mặc định: /var/backups/mongodb)
- `--retention-days DAYS` - Số ngày giữ backup (mặc định: 7)
- `--help` - Hiển thị trợ giúp

#### `restore-mongodb.sh` ⭐ NEW
Restore MongoDB từ file backup.
```bash
./scripts/restore-mongodb.sh <backup-file>
# Ví dụ:
./scripts/restore-mongodb.sh mongodb_backup_20241112_040000.tar.gz
# Với options
./scripts/restore-mongodb.sh --env-file .env --backup-dir /backups backup_file.tar.gz
```

Options:
- `--env-file FILE` - Đường dẫn đến file .env
- `--backup-dir DIR` - Thư mục chứa backup (mặc định: /var/backups/mongodb)
- `--help` - Hiển thị trợ giúp

⚠️ **Cảnh báo**: Restore sẽ xóa toàn bộ dữ liệu hiện tại!

#### `setup-mongodb-backup-cron.sh` ⭐ NEW
Thiết lập cronjob tự động backup MongoDB.
```bash
./scripts/setup-mongodb-backup-cron.sh
# Với options
./scripts/setup-mongodb-backup-cron.sh --env-file .env --schedule "0 2 * * *"
```

Tính năng:
- Tự động chạy backup theo lịch (mặc định 4:00 AM hằng ngày)
- Lưu log tại `/var/log/mongodb-backup.log`
- Kiểm tra và xử lý cronjob cũ
- Tự động tích hợp file `.env` vào cronjob

Options:
- `--env-file FILE` - Đường dẫn đến file .env
- `--schedule CRON` - Lịch backup theo định dạng cron (mặc định: '0 4 * * *')
- `--help` - Hiển thị trợ giúp

#### `test-mongodb-backup-env.sh` ⭐ NEW
Test script để kiểm tra environment variables và scripts.
```bash
./scripts/test-mongodb-backup-env.sh
```

Tính năng:
- Kiểm tra file `.env` tồn tại
- Test tất cả backup scripts
- Verify biến môi trường MongoDB
- Hiển thị thông tin cấu hình

📖 **Chi tiết**: Xem [MONGODB_BACKUP_GUIDE.md](../docs/MONGODB_BACKUP_GUIDE.md)

### 🔐 Security

#### `generate-ssh-keys.sh`
Tạo SSH keys cho deployment.
```bash
./scripts/generate-ssh-keys.sh
```

### 🖥️ Server Setup

#### `setup-vps.sh`
Thiết lập VPS server mới.
```bash
./scripts/setup-vps.sh
```

## 🚀 Quick Start

### Khởi động hệ thống lần đầu

```bash
# 1. Build tất cả services
./scripts/build-all.sh

# 2. Khởi động docker compose
docker-compose up -d

# 3. Thiết lập backup tự động (khuyến nghị)
./scripts/setup-mongodb-backup-cron.sh
```

### Backup & Restore

```bash
# Backup ngay lập tức
./scripts/backup-mongodb.sh

# Xem danh sách backup
ls -lh /var/backups/mongodb/

# Restore từ backup
./scripts/restore-mongodb.sh mongodb_backup_20241112_040000.tar.gz
```

### Development

```bash
# Chạy web app local
./scripts/run-web-app.sh

# Rebuild một service cụ thể
./scripts/rebuild-interactive.sh
```

## 📝 Lưu ý

- Tất cả scripts cần có quyền thực thi: `chmod +x scripts/*.sh`
- Chạy scripts từ thư mục gốc của project
- Kiểm tra logs nếu có lỗi: `docker-compose logs [service-name]`
- Backup scripts yêu cầu MongoDB container đang chạy

## 🆘 Xử lý sự cố

### Script không chạy được
```bash
# Cấp quyền thực thi
chmod +x scripts/*.sh
```

### Docker compose error
```bash
# Restart tất cả services
docker-compose restart

# Xem logs
docker-compose logs -f
```

### Backup failed
```bash
# Kiểm tra MongoDB container
docker ps | grep mongodb

# Kiểm tra dung lượng đĩa
df -h /var/backups/

# Xem logs
tail -f /var/log/mongodb-backup.log
```

## 📚 Tài liệu liên quan

- [MongoDB Backup Guide](../docs/MONGODB_BACKUP_GUIDE.md) - Hướng dẫn chi tiết về backup & restore
- [Quick Start](../docs/QUICK_START.md) - Hướng dẫn khởi động nhanh
- [Docker Compose Architecture](../docs/DOCKER_COMPOSE_ARCHITECTURE.md) - Kiến trúc hệ thống
- [CI/CD Setup](../docs/CICD_SETUP.md) - Thiết lập CI/CD
