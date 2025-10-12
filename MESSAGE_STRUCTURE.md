# 📋 Cấu trúc Message Lỗi

## 🔧 Cấu trúc Chuẩn

Tất cả messages gửi vào hệ thống phải tuân theo cấu trúc sau:

```json
{
  "id": "unique-id",
  "timestamp": "2023-10-05T12:34:56Z",
  "level": "ERROR",
  "service": "tên-service",
  "message": "Mô tả lỗi",
  "stackTrace": "chi tiết stack trace (nếu có)",
  "user": "người dùng liên quan (nếu có)",
  "requestId": "id của request (nếu có)",
  "additionalData": {}
}
```

## 📝 Chi tiết các trường

### ✅ Required Fields (Bắt buộc)

| Field | Type | Mô tả | Ví dụ |
|-------|------|-------|-------|
| `id` | String | ID duy nhất của log entry | `"550e8400-e29b-41d4-a716-446655440000"` |
| `timestamp` | String (ISO 8601) | Thời điểm xảy ra lỗi | `"2023-10-05T12:34:56.789Z"` |
| `level` | String (Enum) | Mức độ nghiêm trọng: `ERROR`, `WARNING`, `INFO` | `"ERROR"` |
| `service` | String | Tên service gặp lỗi | `"api-service"` |
| `message` | String | Mô tả ngắn gọn về lỗi | `"Database connection failed"` |

### 🔧 Optional Fields (Tùy chọn)

| Field | Type | Mô tả | Ví dụ |
|-------|------|-------|-------|
| `stackTrace` | String | Chi tiết stack trace của lỗi | `"Error: Connection timeout\n  at Database.connect..."` |
| `user` | String | User liên quan đến lỗi | `"user@example.com"` |
| `requestId` | String | ID của request gây ra lỗi | `"req-550e8400-e29b"` |
| `additionalData` | Object | Các thông tin bổ sung | `{"database": "postgres", "host": "db.example.com"}` |

## 🎨 Levels và Màu sắc

### ERROR (🚨 Red - #FF0000)
Lỗi nghiêm trọng cần xử lý ngay lập tức
```json
{
  "id": "err-001",
  "timestamp": "2023-10-05T12:34:56Z",
  "level": "ERROR",
  "service": "payment-service",
  "message": "Payment gateway timeout",
  "stackTrace": "Error: Timeout after 30000ms...",
  "user": "customer@example.com",
  "requestId": "req-abc123",
  "additionalData": {
    "amount": 99.99,
    "gateway": "stripe",
    "transactionId": "txn-xyz789"
  }
}
```

### WARNING (⚠️ Orange - #FFA500)
Cảnh báo cần chú ý nhưng không critical
```json
{
  "id": "warn-001",
  "timestamp": "2023-10-05T12:35:00Z",
  "level": "WARNING",
  "service": "auth-service",
  "message": "Too many login attempts",
  "user": "suspicious@example.com",
  "requestId": "req-def456",
  "additionalData": {
    "ipAddress": "192.168.1.100",
    "attemptCount": 5,
    "timeWindow": "5 minutes"
  }
}
```

### INFO (ℹ️ Blue - #0099FF)
Thông tin quan trọng cần tracking
```json
{
  "id": "info-001",
  "timestamp": "2023-10-05T12:36:00Z",
  "level": "INFO",
  "service": "order-service",
  "message": "Large order processed",
  "user": "vip@example.com",
  "requestId": "req-ghi789",
  "additionalData": {
    "orderId": "ORD-12345",
    "amount": 5000.00,
    "itemCount": 50
  }
}
```

## 📊 Hiển thị trên Discord

Hệ thống sẽ format message thành Discord embed với:

### Title
`{emoji} {level} - {service}`
- 🚨 ERROR - api-service
- ⚠️ WARNING - auth-service  
- ℹ️ INFO - payment-service

### Description
```
{message}

**Stack Trace:**
{stackTrace}
```

### Fields
- 🆔 **ID**: unique-id
- 🕐 **Timestamp**: 2023-10-05T12:34:56Z
- 📊 **Level**: ERROR
- 🔧 **Service**: api-service
- 👤 **User**: user@example.com (nếu có)
- 🔗 **Request ID**: req-abc123 (nếu có)
- 📦 **Additional Data**: JSON formatted (nếu có)

### Footer
`Kafka Partition: 0 | Offset: 12345`

### Color
- ERROR: Red (#FF0000)
- WARNING: Orange (#FFA500)
- INFO: Blue (#0099FF)

## ✅ Validation Rules

### 1. Required Field Validation
```javascript
if (!logData.id) {
  console.warn('⚠️  Warning: Message missing "id" field');
}

if (!logData.message) {
  throw new Error('Invalid message format: missing "message" field');
}

if (!logData.level) {
  console.warn('⚠️  Warning: Message missing "level" field, defaulting to ERROR');
  logData.level = 'ERROR';
}

if (!logData.service) {
  console.warn('⚠️  Warning: Message missing "service" field');
  logData.service = 'Unknown';
}
```

### 2. Level Validation
Level phải là một trong các giá trị: `ERROR`, `WARNING`, `INFO`

### 3. Timestamp Format
Timestamp phải theo format ISO 8601: `YYYY-MM-DDTHH:mm:ss.sssZ`

### 4. StackTrace Truncation
StackTrace dài hơn 500 ký tự sẽ bị cắt ngắn để tránh vượt quá giới hạn Discord

### 5. AdditionalData Size
AdditionalData được hiển thị trong code block, giới hạn 1000 ký tự

## 🧪 Test Messages

File `test-producer/index.js` chứa 7 test cases:

1. ✅ **ERROR đầy đủ**: Tất cả fields + stackTrace dài
2. ✅ **WARNING**: Một số optional fields
3. ✅ **INFO**: Message thông tin
4. ✅ **ERROR với stackTrace**: Stack trace chi tiết
5. ⚠️ **Thiếu optional fields**: Không có stackTrace, user, requestId
6. ⚠️ **Minimal message**: Chỉ có required fields
7. ❌ **Invalid message**: Thiếu field "message" (để test error handling)

## 🔧 Code Examples

### Tạo Error Message
```javascript
const { v4: uuidv4 } = require('uuid');

const errorLog = {
  id: uuidv4(),
  timestamp: new Date().toISOString(),
  level: 'ERROR',
  service: 'my-service',
  message: 'Something went wrong',
  stackTrace: error.stack,
  user: req.user?.email,
  requestId: req.id,
  additionalData: {
    endpoint: req.path,
    method: req.method,
    statusCode: 500
  }
};

await producer.send({
  topic: 'error-logs',
  messages: [{
    key: errorLog.id,
    value: JSON.stringify(errorLog)
  }]
});
```

### Tạo Warning Message
```javascript
const warningLog = {
  id: uuidv4(),
  timestamp: new Date().toISOString(),
  level: 'WARNING',
  service: 'cache-service',
  message: 'Cache hit rate below threshold',
  additionalData: {
    hitRate: 0.45,
    threshold: 0.70,
    cacheSize: '500MB'
  }
};
```

### Tạo Info Message
```javascript
const infoLog = {
  id: uuidv4(),
  timestamp: new Date().toISOString(),
  level: 'INFO',
  service: 'analytics-service',
  message: 'Daily report generated',
  requestId: reportId,
  additionalData: {
    reportType: 'daily-summary',
    recordCount: 10000,
    generatedAt: new Date().toISOString()
  }
};
```

## 🚀 Migration Guide

### Từ cấu trúc cũ sang mới

**Cấu trúc cũ:**
```json
{
  "timestamp": "2023-10-05T12:34:56Z",
  "level": "ERROR",
  "message": "Database error",
  "service": "api-service"
}
```

**Cấu trúc mới:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2023-10-05T12:34:56Z",
  "level": "ERROR",
  "service": "api-service",
  "message": "Database error",
  "stackTrace": null,
  "user": null,
  "requestId": null,
  "additionalData": {}
}
```

### Checklist Migration
- [ ] Thêm field `id` (sử dụng uuid)
- [ ] Đảm bảo `timestamp` là ISO 8601 format
- [ ] Validate `level` (ERROR/WARNING/INFO)
- [ ] Thêm `stackTrace` cho errors
- [ ] Thêm `user` nếu có user context
- [ ] Thêm `requestId` để trace requests
- [ ] Di chuyển custom fields vào `additionalData`

## 📚 Best Practices

1. **Luôn generate unique ID**: Sử dụng UUID v4
2. **Timestamp chính xác**: Dùng `new Date().toISOString()`
3. **Level phù hợp**: 
   - ERROR: Lỗi cần xử lý ngay
   - WARNING: Cảnh báo, theo dõi
   - INFO: Thông tin quan trọng
4. **Stack trace cho errors**: Luôn include stack trace với ERROR
5. **Request tracing**: Thêm requestId để trace end-to-end
6. **User context**: Thêm user khi có liên quan
7. **Additional data có cấu trúc**: Dùng object với keys có ý nghĩa
8. **Tránh PII**: Không log sensitive data (password, credit card, etc.)

## 🔍 Troubleshooting

### Message không hiển thị trên Discord
1. Kiểm tra có field `message` không
2. Verify format JSON hợp lệ
3. Check `level` có đúng enum không

### StackTrace quá dài
- Tự động truncate sau 500 ký tự
- Chỉ log phần quan trọng nhất

### AdditionalData không hiển thị
- Kiểm tra object không rỗng
- Verify JSON.stringify không lỗi
- Size limit: 1000 ký tự
