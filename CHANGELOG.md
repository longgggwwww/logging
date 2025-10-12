# 🔄 Changelog - Message Structure Update

## 📅 Date: October 12, 2025

## 🎯 Mục đích
Cập nhật hệ thống để xử lý message lỗi theo cấu trúc mới với đầy đủ metadata và fields bổ sung.

## 📊 Cấu trúc Message Mới

### Before (Cũ):
```json
{
  "timestamp": "2023-10-05T12:34:56Z",
  "level": "ERROR",
  "message": "Database error",
  "service": "api-service"
}
```

### After (Mới):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2023-10-05T12:34:56Z",
  "level": "ERROR",
  "service": "api-service",
  "message": "Database error",
  "stackTrace": "Error: Connection timeout...",
  "user": "user@example.com",
  "requestId": "req-abc123",
  "additionalData": {
    "database": "postgres",
    "host": "db.example.com"
  }
}
```

## 🔧 Các File Đã Thay Đổi

### 1. `discord-webhook/index.js`

#### Thay đổi trong `sendToDiscord()`:
- ✅ Parse toàn bộ `logData` object thay vì chỉ message string
- ✅ Hỗ trợ 3 levels với màu sắc và emoji khác nhau:
  - 🚨 ERROR (Red #FF0000)
  - ⚠️ WARNING (Orange #FFA500)
  - ℹ️ INFO (Blue #0099FF)
- ✅ Hiển thị đầy đủ các fields:
  - 🆔 ID
  - 🕐 Timestamp
  - 📊 Level
  - 🔧 Service
  - 👤 User (nếu có)
  - 🔗 Request ID (nếu có)
  - 📦 Additional Data (formatted JSON)
- ✅ Hiển thị Stack Trace trong description
- ✅ Auto-truncate stack trace nếu quá dài (>500 chars)

#### Thay đổi trong `processMessage()`:
- ✅ Validate các required fields: `id`, `message`, `level`, `service`
- ✅ Warning logs cho missing optional fields
- ✅ Auto-default `level` to 'ERROR' nếu thiếu
- ✅ Truyền full `logData` object đến Discord

### 2. `test-producer/index.js`

#### Hoàn toàn viết lại:
- ✅ Import `uuid` library để generate unique IDs
- ✅ Tạo 7 test messages đa dạng:
  1. ERROR đầy đủ với stackTrace dài
  2. WARNING với một số optional fields
  3. INFO message
  4. ERROR với detailed stackTrace
  5. Message thiếu optional fields
  6. Minimal message
  7. Invalid message (thiếu "message" field)
- ✅ Sử dụng message key là UUID
- ✅ Delay 500ms giữa các messages
- ✅ Log chi tiết mỗi message được gửi

### 3. `test-producer/package.json`

- ✅ Thêm dependency: `uuid: ^9.0.0`
- ✅ Update main entry point: `index.js`

### 4. New Files Created

#### `MESSAGE_STRUCTURE.md` (NEW)
Tài liệu đầy đủ về cấu trúc message:
- ✅ Chi tiết từng field (required/optional)
- ✅ Validation rules
- ✅ Ví dụ cho từng level (ERROR/WARNING/INFO)
- ✅ Discord formatting preview
- ✅ Code examples
- ✅ Migration guide từ cấu trúc cũ
- ✅ Best practices
- ✅ Troubleshooting guide

#### `test-new-structure.sh` (NEW)
Script để test nhanh:
- ✅ Check Kafka status
- ✅ List topics
- ✅ Send test messages
- ✅ Hướng dẫn next steps
- ✅ Colored output

### 5. Updated Files

#### `README.md`
- ✅ Update phần "Ví dụ Messages" với cấu trúc mới
- ✅ Link đến MESSAGE_STRUCTURE.md
- ✅ List tất cả fields (required/optional)

#### `SUMMARY.txt`
- ✅ Thêm section về cấu trúc message mới
- ✅ Link đến MESSAGE_STRUCTURE.md

## 🎨 Discord Embed Improvements

### Trước:
```
Title: 🚨 Error Log Alert
Description: Simple message text
Fields:
  - Timestamp
  - Service
  - Level
```

### Sau:
```
Title: 🚨 ERROR - api-service (dynamic emoji & color)
Description: 
  Message text
  
  **Stack Trace:**
  Detailed stack trace...

Fields:
  - 🆔 ID: unique-id
  - 🕐 Timestamp: ISO format
  - 📊 Level: ERROR/WARNING/INFO
  - 🔧 Service: service-name
  - 👤 User: user@example.com
  - 🔗 Request ID: req-abc123
  - 📦 Additional Data: {...}
```

## 🧪 Testing

### Install Dependencies:
```bash
cd test-producer
npm install  # Installs uuid
```

### Run Tests:
```bash
# Quick test
./test-new-structure.sh

# Or manual
cd test-producer
node index.js
```

### Expected Results:
- 6 messages sẽ được xử lý thành công và gửi đến Discord
- 1 message invalid sẽ retry 3 lần rồi vào DLQ
- Discord sẽ hiển thị rich embeds với đầy đủ thông tin

## 📈 Benefits

### 1. Better Tracking
- ✅ Unique ID cho mỗi log entry
- ✅ Request ID để trace end-to-end
- ✅ User context cho user-related errors

### 2. Better Debugging
- ✅ Full stack trace
- ✅ Additional data với context bổ sung
- ✅ Timestamp chính xác ISO 8601

### 3. Better Categorization
- ✅ 3 levels: ERROR/WARNING/INFO
- ✅ Màu sắc và emoji khác nhau
- ✅ Dễ filter và prioritize

### 4. Better Monitoring
- ✅ Rich Discord embeds dễ đọc
- ✅ Structured data dễ parse
- ✅ Validation rules đảm bảo data quality

## 🔄 Migration Path

### For Existing Services:

#### Option 1: Update Service Code
```javascript
// Old
logger.error('Database error');

// New
logger.error({
  id: uuidv4(),
  timestamp: new Date().toISOString(),
  level: 'ERROR',
  service: 'my-service',
  message: 'Database error',
  stackTrace: error.stack,
  user: req.user?.email,
  requestId: req.id,
  additionalData: { ... }
});
```

#### Option 2: Backward Compatible
Hệ thống vẫn xử lý được messages cũ:
- Missing fields sẽ được default hoặc log warning
- Chỉ `message` field là required
- Các optional fields có thể thêm dần

## ⚠️ Breaking Changes

### Required Fields:
- `message`: Phải có, nếu không sẽ throw error và vào DLQ

### Recommended Fields:
- `id`: Nên có để tracking
- `level`: Nên có để categorize
- `service`: Nên có để identify source
- `timestamp`: Nên có để tracking time

## 📚 Documentation

1. **MESSAGE_STRUCTURE.md**: Chi tiết đầy đủ về cấu trúc message
2. **README.md**: Hướng dẫn sử dụng tổng quan
3. **ARCHITECTURE.md**: Kiến trúc hệ thống
4. **FEATURES.md**: Danh sách tính năng

## 🚀 Next Steps

1. Test với script mới: `./test-new-structure.sh`
2. Kiểm tra Discord notifications
3. Monitor DLQ: `./monitor-dlq.sh`
4. Update các services để gửi message theo format mới
5. Review và adjust validation rules nếu cần

## ✅ Checklist

- [x] Update discord-webhook/index.js
- [x] Update test-producer/index.js
- [x] Add uuid dependency
- [x] Create MESSAGE_STRUCTURE.md
- [x] Create test-new-structure.sh
- [x] Update README.md
- [x] Update SUMMARY.txt
- [x] Test locally
- [x] Create CHANGELOG.md

## 📞 Support

Nếu gặp vấn đề:
1. Check MESSAGE_STRUCTURE.md
2. Run `./test-new-structure.sh` để test
3. Check logs trong consumer
4. Monitor DLQ với `./monitor-dlq.sh`
