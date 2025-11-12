# MongoDB Backup & Restore Guide

Hướng dẫn backup và restore MongoDB cho hệ thống log monitoring.

## 📋 Tổng quan

Hệ thống bao gồm 3 scripts chính:
- **backup-mongodb.sh**: Script backup MongoDB
- **restore-mongodb.sh**: Script restore MongoDB từ backup
- **setup-mongodb-backup-cron.sh**: Script thiết lập cronjob tự động backup

## 🚀 Thiết lập Cronjob

### Cài đặt cronjob tự động backup lúc 4h sáng hằng ngày:

```bash
./scripts/setup-mongodb-backup-cron.sh
```

Script sẽ tự động tìm file `.env` trong thư mục gốc của project. Bạn cũng có thể chỉ định rõ file `.env`:

```bash
./scripts/setup-mongodb-backup-cron.sh --env-file /path/to/.env
```

Tùy chỉnh lịch backup:

```bash
# Backup mỗi 6 giờ
./scripts/setup-mongodb-backup-cron.sh --schedule "0 */6 * * *"

# Backup lúc 2h sáng
./scripts/setup-mongodb-backup-cron.sh --schedule "0 2 * * *" --env-file .env
```

Script này sẽ:
- Tự động tìm và load biến môi trường từ file `.env`
- Thiết lập cronjob chạy backup vào lúc 4:00 AM mỗi ngày (hoặc theo schedule tùy chỉnh)
- Tạo log file tại `/var/log/mongodb-backup.log`
- Kiểm tra và xử lý cronjob cũ (nếu có)

### Kiểm tra cronjob đã được thiết lập:

```bash
crontab -l
```

Kết quả mong đợi:
```
0 4 * * * /home/ad/syslog/scripts/backup-mongodb.sh >> /var/log/mongodb-backup.log 2>&1
```

## 💾 Backup thủ công

### Chạy backup ngay lập tức:

```bash
./scripts/backup-mongodb.sh
```

Script tự động tìm file `.env` trong thư mục project. Bạn cũng có thể chỉ định rõ:

```bash
./scripts/backup-mongodb.sh --env-file /path/to/.env
```

Tùy chọn nâng cao:

```bash
# Chỉ định thư mục backup khác
./scripts/backup-mongodb.sh --backup-dir /custom/backup/path

# Thay đổi thời gian lưu trữ
./scripts/backup-mongodb.sh --retention-days 14

# Kết hợp các tùy chọn
./scripts/backup-mongodb.sh --env-file .env --backup-dir /backups --retention-days 30

# Xem tất cả tùy chọn
./scripts/backup-mongodb.sh --help
```

### Vị trí lưu backup:

Mặc định: `/var/backups/mongodb/`

Tên file: `mongodb_backup_YYYYMMDD_HHMMSS.tar.gz`

### Xem danh sách backup:

```bash
ls -lh /var/backups/mongodb/
```

### Chính sách lưu trữ:

- Backup được giữ lại trong **7 ngày**
- Các backup cũ hơn 7 ngày sẽ tự động bị xóa

## 🔄 Restore từ backup

### Liệt kê các backup có sẵn:

```bash
./scripts/restore-mongodb.sh
```

### Restore từ một backup cụ thể:

```bash
./scripts/restore-mongodb.sh /var/backups/mongodb/mongodb_backup_20241112_040000.tar.gz
```

Hoặc chỉ cần tên file (script tự tìm trong thư mục backup mặc định):

```bash
./scripts/restore-mongodb.sh mongodb_backup_20241112_040000.tar.gz
```

Sử dụng file `.env` cụ thể:

```bash
./scripts/restore-mongodb.sh --env-file /path/to/.env mongodb_backup_20241112_040000.tar.gz
```

Các tùy chọn:

```bash
# Chỉ định thư mục backup khác
./scripts/restore-mongodb.sh --backup-dir /custom/backup/path backup_file.tar.gz

# Xem trợ giúp
./scripts/restore-mongodb.sh --help
```

⚠️ **Cảnh báo**: Restore sẽ **XÓA** toàn bộ dữ liệu hiện tại và thay thế bằng dữ liệu từ backup!

## 📊 Giám sát

### Xem log backup:

```bash
tail -f /var/log/mongodb-backup.log
```

### Xem log backup gần nhất:

```bash
tail -n 50 /var/log/mongodb-backup.log
```

### Kiểm tra kích thước backup:

```bash
du -sh /var/backups/mongodb/
```

## 🔧 Cấu hình

### Biến môi trường

Scripts sử dụng các biến môi trường từ file `.env`:

```bash
# MongoDB Configuration
MONGO_USERNAME=longgggwww
MONGO_PASSWORD=123456
MONGO_DATABASE=logs
```

Scripts tự động tìm file `.env` theo thứ tự:
1. Thư mục gốc của project (`/home/ad/syslog/.env`)
2. Thư mục hiện tại (`$PWD/.env`)
3. Hoặc sử dụng option `--env-file` để chỉ định

Nếu không tìm thấy file `.env`, scripts sẽ sử dụng giá trị mặc định.

### Thay đổi thời gian backup:

Sử dụng option `--schedule` khi chạy setup script:

```bash
./scripts/setup-mongodb-backup-cron.sh --schedule "0 4 * * *"
```

Ví dụ lịch backup:
- `0 4 * * *` - 4:00 AM mỗi ngày (mặc định)
- `0 */6 * * *` - Mỗi 6 giờ
- `0 2 * * 0` - 2:00 AM mỗi Chủ nhật
- `0 0 1 * *` - 12:00 AM ngày đầu tiên mỗi tháng
- `*/30 * * * *` - Mỗi 30 phút

### Thay đổi thời gian lưu trữ:

Sử dụng option `--retention-days` khi chạy backup:

```bash
./scripts/backup-mongodb.sh --retention-days 14  # Giữ backup 14 ngày
```

### Thay đổi thư mục backup:

Sử dụng option `--backup-dir`:

```bash
./scripts/backup-mongodb.sh --backup-dir "/custom/backup/path"
```

## 🧪 Test

### Test script backup:

```bash
./scripts/backup-mongodb.sh
```

Kiểm tra:
- Không có lỗi
- File backup được tạo trong `/var/backups/mongodb/`
- Kích thước file hợp lý

### Test script restore:

```bash
# Tạo một backup test
./scripts/backup-mongodb.sh

# Restore từ backup vừa tạo
./scripts/restore-mongodb.sh $(ls -t /var/backups/mongodb/mongodb_backup_*.tar.gz | head -1)
```

## 📝 Lưu ý quan trọng

1. **File .env**: 
   - Scripts tự động tìm file `.env` trong thư mục gốc của project
   - Hoặc sử dụng `--env-file` để chỉ định đường dẫn cụ thể
   - Các biến cần thiết: `MONGO_USERNAME`, `MONGO_PASSWORD`, `MONGO_DATABASE`
   - Nếu không tìm thấy, sẽ sử dụng giá trị mặc định

2. **Quyền truy cập**: Script cần quyền đọc/ghi vào:
   - `/var/backups/mongodb/`
   - `/var/log/mongodb-backup.log`
   - Docker container `mongodb`
   - File `.env` (nếu có)

3. **Dung lượng đĩa**: Đảm bảo đủ dung lượng cho backup:
   ```bash
   df -h /var/backups/
   ```

4. **MongoDB phải đang chạy**: Container MongoDB phải đang hoạt động:
   ```bash
   docker ps | grep mongodb
   ```

## 🆘 Xử lý sự cố

### Lỗi "MongoDB container is not running"

```bash
docker-compose up -d mongodb
```

### Lỗi quyền truy cập

```bash
sudo mkdir -p /var/backups/mongodb
sudo chown $USER:$USER /var/backups/mongodb
```

### Cronjob không chạy

Kiểm tra cron service:
```bash
sudo systemctl status cron
```

Khởi động lại cron:
```bash
sudo systemctl restart cron
```

### Xóa cronjob

```bash
crontab -e
# Xóa dòng chứa backup-mongodb.sh
```

Hoặc:
```bash
crontab -l | grep -v "backup-mongodb.sh" | crontab -
```

## 📞 Tích hợp Notification (Tùy chọn)

Để nhận thông báo khi backup hoàn thành, uncomment và cấu hình phần cuối của file `backup-mongodb.sh`:

```bash
# Slack webhook
curl -X POST "https://hooks.slack.com/services/YOUR/WEBHOOK/URL" \
    -H "Content-Type: application/json" \
    -d "{\"text\": \"MongoDB backup completed: ${BACKUP_NAME}\"}"

# Discord webhook
curl -X POST "YOUR_DISCORD_WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d "{\"content\": \"MongoDB backup completed: ${BACKUP_NAME}\"}"

# Email
echo "Backup completed: ${BACKUP_NAME}" | mail -s "MongoDB Backup" your-email@example.com
```

## 🔐 Backup sang Remote Storage (Khuyến nghị)

Để tăng tính an toàn, nên đồng bộ backup sang remote storage:

### AWS S3:

```bash
# Thêm vào cuối backup-mongodb.sh
aws s3 sync /var/backups/mongodb/ s3://your-bucket/mongodb-backups/
```

### rsync sang server khác:

```bash
# Thêm vào cuối backup-mongodb.sh
rsync -avz /var/backups/mongodb/ user@remote-server:/backups/mongodb/
```

### Google Drive (sử dụng rclone):

```bash
# Thêm vào cuối backup-mongodb.sh
rclone sync /var/backups/mongodb/ gdrive:/mongodb-backups/
```
