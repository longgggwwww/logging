# MongoDB Backup Scripts - Environment Variables Update

## ✅ Đã hoàn thành

Đã bổ sung option `--env-file` và đồng bộ tên biến môi trường với `.env` cho tất cả MongoDB backup scripts.

## 📝 Thay đổi chính

### 1. **backup-mongodb.sh**
- ✅ Thêm option `--env-file` để chỉ định file .env
- ✅ Tự động tìm `.env` trong project root hoặc thư mục hiện tại
- ✅ Thêm option `--backup-dir` để tùy chỉnh thư mục backup
- ✅ Thêm option `--retention-days` để tùy chỉnh thời gian lưu trữ
- ✅ Thêm option `--help` để hiển thị hướng dẫn
- ✅ Sử dụng đúng tên biến: `MONGO_USERNAME`, `MONGO_PASSWORD`, `MONGO_DATABASE`

### 2. **restore-mongodb.sh**
- ✅ Thêm option `--env-file` để chỉ định file .env
- ✅ Tự động tìm `.env` trong project root hoặc thư mục hiện tại
- ✅ Thêm option `--backup-dir` để tùy chỉnh thư mục backup
- ✅ Thêm option `--help` để hiển thị hướng dẫn
- ✅ Sử dụng đúng tên biến: `MONGO_USERNAME`, `MONGO_PASSWORD`, `MONGO_DATABASE`
- ✅ Cải thiện argument parsing

### 3. **setup-mongodb-backup-cron.sh**
- ✅ Thêm option `--env-file` để chỉ định file .env
- ✅ Tự động tìm `.env` trong project root
- ✅ Thêm option `--schedule` để tùy chỉnh lịch backup
- ✅ Thêm option `--help` để hiển thị hướng dẫn
- ✅ Cronjob tự động sử dụng `--env-file` nếu file .env tồn tại
- ✅ Hiển thị thông tin .env đang sử dụng

## 🔧 Tính năng mới

### Auto-detect .env file
Scripts tự động tìm file `.env` theo thứ tự:
1. `<project-root>/.env` (ví dụ: `/home/ad/syslog/.env`)
2. `$PWD/.env` (thư mục hiện tại)
3. Hoặc sử dụng `--env-file` để chỉ định rõ ràng

### Command-line Options

#### backup-mongodb.sh
```bash
# Sử dụng .env mặc định (auto-detect)
./scripts/backup-mongodb.sh

# Chỉ định .env cụ thể
./scripts/backup-mongodb.sh --env-file /path/to/.env

# Tùy chỉnh thư mục backup
./scripts/backup-mongodb.sh --backup-dir /custom/backup/path

# Tùy chỉnh thời gian lưu trữ (giữ 30 ngày)
./scripts/backup-mongodb.sh --retention-days 30

# Kết hợp các options
./scripts/backup-mongodb.sh \
  --env-file .env \
  --backup-dir /backups \
  --retention-days 14
```

#### restore-mongodb.sh
```bash
# Sử dụng .env mặc định (auto-detect)
./scripts/restore-mongodb.sh backup_file.tar.gz

# Chỉ định .env cụ thể
./scripts/restore-mongodb.sh --env-file /path/to/.env backup_file.tar.gz

# Chỉ định thư mục backup
./scripts/restore-mongodb.sh --backup-dir /custom/path backup_file.tar.gz

# Kết hợp các options
./scripts/restore-mongodb.sh \
  --env-file .env \
  --backup-dir /backups \
  mongodb_backup_20241112_040000.tar.gz
```

#### setup-mongodb-backup-cron.sh
```bash
# Sử dụng mặc định (4:00 AM, auto-detect .env)
./scripts/setup-mongodb-backup-cron.sh

# Chỉ định .env cụ thể
./scripts/setup-mongodb-backup-cron.sh --env-file /path/to/.env

# Thay đổi lịch backup (2:00 AM)
./scripts/setup-mongodb-backup-cron.sh --schedule "0 2 * * *"

# Backup mỗi 6 giờ
./scripts/setup-mongodb-backup-cron.sh --schedule "0 */6 * * *"

# Kết hợp các options
./scripts/setup-mongodb-backup-cron.sh \
  --env-file .env \
  --schedule "0 2 * * *"
```

## 🔑 Biến môi trường

Scripts sử dụng các biến từ file `.env`:

```bash
# MongoDB Configuration
MONGO_USERNAME=longgggwww    # (mặc định nếu không tìm thấy .env)
MONGO_PASSWORD=123456         # (mặc định nếu không tìm thấy .env)
MONGO_DATABASE=logs           # (mặc định nếu không tìm thấy .env)
```

Các biến này khớp với cấu hình trong:
- `docker-compose.yml`
- `.env.example`

## 📚 Documentation đã cập nhật

### 1. **MONGODB_BACKUP_GUIDE.md**
- ✅ Thêm hướng dẫn sử dụng `--env-file`
- ✅ Thêm hướng dẫn sử dụng các options mới
- ✅ Cập nhật phần cấu hình với options thay vì chỉnh sửa script
- ✅ Thêm phần biến môi trường

### 2. **MONGODB_BACKUP_QUICK_REF.md**
- ✅ Thêm ví dụ sử dụng `--env-file`
- ✅ Thêm bảng tóm tắt tất cả options
- ✅ Thêm phần biến môi trường

## 🧪 Testing

Tất cả scripts đã được test với option `--help`:

```bash
# Test backup script
./scripts/backup-mongodb.sh --help
✅ Output: Hiển thị đầy đủ options và examples

# Test restore script
./scripts/restore-mongodb.sh --help
✅ Output: Hiển thị đầy đủ options và examples

# Test setup cronjob script
./scripts/setup-mongodb-backup-cron.sh --help
✅ Output: Hiển thị đầy đủ options và examples
```

## ✨ Ưu điểm

### 1. **Linh hoạt**
- Không cần chỉnh sửa script để thay đổi cấu hình
- Có thể sử dụng nhiều file .env khác nhau
- Dễ dàng tùy chỉnh qua command-line options

### 2. **An toàn**
- Không hard-code credentials trong script
- Tự động load từ .env file
- Fallback về giá trị mặc định nếu không tìm thấy

### 3. **User-friendly**
- Auto-detect .env file
- Help message đầy đủ với `--help`
- Ví dụ cụ thể trong help message

### 4. **Nhất quán**
- Sử dụng đúng tên biến với `.env.example`
- Sử dụng đúng tên biến với `docker-compose.yml`
- Tất cả scripts có cùng pattern options

## 🎯 Ví dụ sử dụng

### Scenario 1: Development
```bash
# Sử dụng .env mặc định
./scripts/backup-mongodb.sh
./scripts/restore-mongodb.sh backup_file.tar.gz
```

### Scenario 2: Production
```bash
# Sử dụng .env.production riêng
./scripts/backup-mongodb.sh --env-file .env.production
./scripts/setup-mongodb-backup-cron.sh --env-file .env.production
```

### Scenario 3: Custom configuration
```bash
# Backup vào NAS, giữ 30 ngày
./scripts/backup-mongodb.sh \
  --env-file .env.production \
  --backup-dir /mnt/nas/mongodb-backups \
  --retention-days 30

# Setup cronjob với cấu hình tùy chỉnh
./scripts/setup-mongodb-backup-cron.sh \
  --env-file .env.production \
  --schedule "0 2 * * *"
```

### Scenario 4: Multiple environments
```bash
# Backup staging
./scripts/backup-mongodb.sh --env-file .env.staging --backup-dir /backups/staging

# Backup production
./scripts/backup-mongodb.sh --env-file .env.production --backup-dir /backups/production
```

## 🔍 Backward Compatibility

Scripts vẫn hoạt động như cũ nếu không truyền options:
- ✅ Tự động tìm `.env` trong project root
- ✅ Sử dụng giá trị mặc định nếu không tìm thấy
- ✅ Không break existing cronjobs

## 📦 Files thay đổi

1. ✅ `scripts/backup-mongodb.sh` - Thêm argument parsing và auto-detect .env
2. ✅ `scripts/restore-mongodb.sh` - Thêm argument parsing và auto-detect .env
3. ✅ `scripts/setup-mongodb-backup-cron.sh` - Thêm options và tích hợp .env vào cronjob
4. ✅ `docs/MONGODB_BACKUP_GUIDE.md` - Cập nhật documentation đầy đủ
5. ✅ `docs/MONGODB_BACKUP_QUICK_REF.md` - Cập nhật quick reference
6. ✅ `docs/MONGODB_BACKUP_ENV_UPDATE.md` - File này (summary)

## 🎉 Kết luận

Đã hoàn thành việc bổ sung option `--env-file` và đồng bộ tên biến môi trường cho tất cả MongoDB backup scripts. Scripts hiện tại:

✅ Linh hoạt với command-line options
✅ Tự động tìm và load .env file
✅ Sử dụng đúng tên biến môi trường
✅ User-friendly với --help
✅ Backward compatible
✅ Fully documented
