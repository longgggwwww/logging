# 📋 Cấu trúc Message Log

## 🔧 Cấu trúc Chuẩn

Tất cả messages gửi vào hệ thống phải tuân theo cấu trúc sau:

```json
{
  "projectName": "myapp",
  "function": "login",
  "method": "POST",
  "type": "ERROR",
  "request": {
    "headers": {},
    "userAgent": "Mozilla/5.0...",
    "url": "/api/auth/login",
    "params": {},
    "body": {}
  },
  "response": {
    "code": 500,
    "success": false,
    "message": "Login failed",
    "data": []
  },
  "consoleLog": "Error: Database connection failed",
  "createdAt": "2023-10-05T12:34:56.789Z",
  "createdBy": {
    "id": "user123",
    "fullname": "Nguyen Van A",
    "emplCode": "EMP001"
  },
  "additionalData": {},
  "latency": 1250
}
```

## 📝 Chi tiết các trường

### ✅ Required Fields (Bắt buộc)

| Field | Type | Mô tả | Ví dụ |
|-------|------|-------|-------|
| `projectName` | String | Tên dự án/ứng dụng | `"myapp"` |
| `function` | String | Tên chức năng/endpoint | `"login"`, `"register"`, `"getUser"` |
| `method` | String (Enum) | HTTP Method: `GET`, `POST`, `PATCH`, `PUT`, `DELETE` | `"POST"` |
| `type` | String (Enum) | Loại log: `DEBUG`, `SUCCESS`, `INFO`, `WARNING`, `ERROR` | `"ERROR"` |
| `createdAt` | String (ISO 8601) | Thời điểm tạo log (timestamp) | `"2023-10-05T12:34:56.789Z"` |
| `latency` | Number | Thời gian xử lý (milliseconds) | `1250` |

### 🔧 Optional Fields (Tùy chọn)

| Field | Type | Mô tả | Ví dụ |
|-------|------|-------|-------|
| `request` | Object | Thông tin request | `{"headers": {}, "userAgent": "...", "url": "/api/login", "params": {}, "body": {}}` |
| `response` | Object | Thông tin response | `{"code": 200, "success": true, "message": "OK", "data": []}` |
| `consoleLog` | String | Console log message/stack trace | `"Error: Connection timeout\n  at Database.connect..."` |
| `createdBy` | Object/null | Thông tin người dùng (null nếu guest) | `{"id": "123", "fullname": "John Doe", "emplCode": "EMP001"}` |
| `additionalData` | Object | Các thông tin bổ sung (JSON) | `{"database": "postgres", "host": "db.example.com"}` |

## 🎨 Types và Màu sắc

### ERROR (🚨 Red - #FF0000)
Lỗi nghiêm trọng cần xử lý ngay lập tức
```json
{
  "projectName": "myapp",
  "function": "getUserById",
  "method": "GET",
  "type": "ERROR",
  "request": {
    "headers": {
      "authorization": "Bearer token...",
      "content-type": "application/json"
    },
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "url": "/api/users/123",
    "params": { "id": "123" }
  },
  "response": {
    "code": 500,
    "success": false,
    "message": "Database connection failed",
    "data": []
  },
  "consoleLog": "Error: Connection timeout\n  at Database.connect()\n  at UserService.getById()",
  "createdAt": "2023-10-05T12:34:56.789Z",
  "createdBy": {
    "id": "user123",
    "fullname": "Nguyen Van A",
    "emplCode": "EMP001"
  },
  "additionalData": {
    "database": "postgres",
    "host": "db.example.com",
    "timeout": 30000
  },
  "latency": 30250
}
```

### WARNING (⚠️ Orange - #FFA500)
Cảnh báo cần chú ý nhưng không critical
```json
{
  "projectName": "myapp",
  "function": "login",
  "method": "POST",
  "type": "WARNING",
  "request": {
    "headers": {},
    "userAgent": "PostmanRuntime/7.32.0",
    "url": "/api/auth/login",
    "params": {},
    "body": { "email": "suspicious@example.com" }
  },
  "response": {
    "code": 429,
    "success": false,
    "message": "Too many login attempts",
    "data": []
  },
  "consoleLog": "Warning: Rate limit exceeded for IP 192.168.1.100",
  "createdAt": "2023-10-05T12:35:00.123Z",
  "createdBy": null,
  "additionalData": {
    "ipAddress": "192.168.1.100",
    "attemptCount": 5,
    "timeWindow": "5 minutes"
  },
  "latency": 125
}
```

### INFO (ℹ️ Blue - #0099FF)
Thông tin quan trọng cần tracking
```json
{
  "projectName": "myapp",
  "function": "createOrder",
  "method": "POST",
  "type": "INFO",
  "request": {
    "headers": {},
    "userAgent": "MyApp/1.0.0 (iOS 16.0)",
    "url": "/api/orders",
    "params": {},
    "body": { "items": ["item1", "item2"] }
  },
  "response": {
    "code": 201,
    "success": true,
    "message": "Order created successfully",
    "data": [{ "orderId": "ORD-12345" }]
  },
  "consoleLog": "Info: Large order processed successfully",
  "createdAt": "2023-10-05T12:36:00.456Z",
  "createdBy": {
    "id": "vip123",
    "fullname": "Tran Thi B",
    "emplCode": "EMP002"
  },
  "additionalData": {
    "orderId": "ORD-12345",
    "amount": 5000.00,
    "itemCount": 50
  },
  "latency": 850
}
```

### SUCCESS (✅ Green - #00FF00)
Thao tác thành công cần tracking
```json
{
  "projectName": "myapp",
  "function": "updateProfile",
  "method": "PATCH",
  "type": "SUCCESS",
  "request": {
    "headers": {},
    "userAgent": "MyApp/1.0.0 (Android 13)",
    "url": "/api/users/profile",
    "params": {},
    "body": { "name": "Updated Name" }
  },
  "response": {
    "code": 200,
    "success": true,
    "message": "Profile updated successfully",
    "data": [{ "userId": "123" }]
  },
  "consoleLog": "Success: User profile updated",
  "createdAt": "2023-10-05T12:37:00.789Z",
  "createdBy": {
    "id": "user123",
    "fullname": "Nguyen Van A",
    "emplCode": "EMP001"
  },
  "additionalData": {
    "changedFields": ["name", "avatar"],
    "previousName": "Old Name"
  },
  "latency": 250
}
```

### DEBUG (🐛 Gray - #808080)
Thông tin debug cho developers
```json
{
  "projectName": "myapp",
  "function": "calculateTax",
  "method": "POST",
  "type": "DEBUG",
  "request": {
    "headers": {},
    "userAgent": "Internal/Debug",
    "url": "/api/internal/tax",
    "params": {},
    "body": { "amount": 1000 }
  },
  "response": {
    "code": 200,
    "success": true,
    "message": "Tax calculated",
    "data": [{ "tax": 100, "total": 1100 }]
  },
  "consoleLog": "Debug: Tax calculation steps logged",
  "createdAt": "2023-10-05T12:38:00.123Z",
  "createdBy": {
    "id": "dev456",
    "fullname": "Developer User",
    "emplCode": "DEV001"
  },
  "additionalData": {
    "steps": ["validate", "calculate", "round"],
    "taxRate": 0.1
  },
  "latency": 15
}
```

## 📊 Hiển thị trên Discord

Hệ thống sẽ format message thành Discord embed với:

### Title
`{emoji} {type} - {projectName}/{function}`
- 🚨 ERROR - myapp/login
- ⚠️ WARNING - myapp/register  
- ℹ️ INFO - myapp/createOrder
- ✅ SUCCESS - myapp/updateProfile
- 🐛 DEBUG - myapp/calculateTax

### Description
```
{response.message}

**Console Log:**
{consoleLog}
```

### Fields
- �️ **Project**: myapp
- ⚙️ **Function**: login
- 🔧 **Method**: POST
- 🕐 **Created At**: 2023-10-05T12:34:56.789Z
- ⚡ **Latency**: 1250ms
- � **Response Code**: 500
- 👤 **Created By**: Nguyen Van A (EMP001) (nếu có, hiển thị "Guest" nếu null)
- 🌐 **URL**: /api/auth/login
- 📦 **Additional Data**: JSON formatted (nếu có)

### Footer
`Kafka Partition: 0 | Offset: 12345`

### Color
- ERROR: Red (#FF0000)
- WARNING: Orange (#FFA500)
- INFO: Blue (#0099FF)
- SUCCESS: Green (#00FF00)
- DEBUG: Gray (#808080)

## ✅ Validation Rules

### 1. Required Field Validation
```javascript
if (!logData.projectName) {
  console.warn('⚠️  Warning: Message missing "projectName" field');
  logData.projectName = 'Unknown';
}

if (!logData.function) {
  console.warn('⚠️  Warning: Message missing "function" field');
  logData.function = 'Unknown';
}

if (!logData.method) {
  console.warn('⚠️  Warning: Message missing "method" field');
  logData.method = 'UNKNOWN';
}

if (!logData.type) {
  console.warn('⚠️  Warning: Message missing "type" field, defaulting to ERROR');
  logData.type = 'ERROR';
}

if (!logData.createdAt) {
  console.warn('⚠️  Warning: Message missing "createdAt" field');
  logData.createdAt = new Date().toISOString();
}

if (logData.latency === undefined) {
  console.warn('⚠️  Warning: Message missing "latency" field');
  logData.latency = 0;
}
```

### 2. Type Validation
Type phải là một trong các giá trị: `ERROR`, `WARNING`, `INFO`, `SUCCESS`, `DEBUG`

### 3. Method Validation
Method phải là một trong các giá trị: `GET`, `POST`, `PATCH`, `PUT`, `DELETE`

### 4. Timestamp Format
createdAt phải theo format ISO 8601: `YYYY-MM-DDTHH:mm:ss.sssZ`

### 5. ConsoleLog Truncation
ConsoleLog dài hơn 500 ký tự sẽ bị cắt ngắn để tránh vượt quá giới hạn Discord

### 6. AdditionalData Size
AdditionalData được hiển thị trong code block, giới hạn 1000 ký tự

### 7. CreatedBy Validation
- Có thể là object với `id`, `fullname`, `emplCode`
- Hoặc `null` nếu là guest user

## 🧪 Test Messages

File `test-producer.js` chứa các test cases:

1. ✅ **ERROR**: Login failed với database connection error
2. ✅ **WARNING**: Too many registration attempts
3. ✅ **SUCCESS**: Order created successfully
4. ✅ **INFO**: User profile accessed
5. ❌ **Invalid message**: Thiếu required fields (để test error handling)

## 🔧 Code Examples

### Tạo Error Message
```javascript
const errorLog = {
  projectName: 'myapp',
  function: 'login',
  method: 'POST',
  type: 'ERROR',
  request: {
    headers: { 'content-type': 'application/json' },
    userAgent: req.headers['user-agent'],
    url: req.originalUrl,
    params: req.params,
    body: req.body
  },
  response: {
    code: 500,
    success: false,
    message: 'Internal server error',
    data: []
  },
  consoleLog: error.stack,
  createdAt: new Date().toISOString(),
  createdBy: req.user ? {
    id: req.user.id,
    fullname: req.user.fullname,
    emplCode: req.user.emplCode
  } : null,
  additionalData: {
    errorCode: 'DB_CONNECTION_FAILED',
    database: 'postgres'
  },
  latency: Date.now() - req.startTime
};

await producer.send({
  topic: 'logs',
  messages: [{
    value: JSON.stringify(errorLog)
  }]
});
```

### Tạo Success Message
```javascript
const successLog = {
  projectName: 'myapp',
  function: 'createOrder',
  method: 'POST',
  type: 'SUCCESS',
  request: {
    headers: {},
    userAgent: req.headers['user-agent'],
    url: req.originalUrl,
    params: {},
    body: { items: orderItems }
  },
  response: {
    code: 201,
    success: true,
    message: 'Order created successfully',
    data: [{ orderId: newOrder.id }]
  },
  consoleLog: `Order ${newOrder.id} created for user ${req.user.id}`,
  createdAt: new Date().toISOString(),
  createdBy: {
    id: req.user.id,
    fullname: req.user.fullname,
    emplCode: req.user.emplCode
  },
  additionalData: {
    orderId: newOrder.id,
    amount: newOrder.total,
    itemCount: orderItems.length
  },
  latency: Date.now() - req.startTime
};
```

### Tạo Warning Message
```javascript
const warningLog = {
  projectName: 'myapp',
  function: 'login',
  method: 'POST',
  type: 'WARNING',
  request: {
    headers: {},
    userAgent: req.headers['user-agent'],
    url: req.originalUrl,
    params: {},
    body: { email: req.body.email }
  },
  response: {
    code: 429,
    success: false,
    message: 'Too many login attempts',
    data: []
  },
  consoleLog: `Rate limit exceeded for IP ${req.ip}`,
  createdAt: new Date().toISOString(),
  createdBy: null, // Guest user
  additionalData: {
    ipAddress: req.ip,
    attemptCount: loginAttempts,
    timeWindow: '5 minutes'
  },
  latency: Date.now() - req.startTime
};
```

## 🚀 Migration Guide

### Từ cấu trúc cũ sang mới

**Cấu trúc cũ:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2023-10-05T12:34:56Z",
  "level": "ERROR",
  "service": "api-service",
  "message": "Database error",
  "stackTrace": "Error: ...",
  "user": "user@example.com",
  "requestId": "req-123",
  "additionalData": {}
}
```

**Cấu trúc mới:**
```json
{
  "projectName": "myapp",
  "function": "getUserById",
  "method": "GET",
  "type": "ERROR",
  "request": {
    "headers": {},
    "userAgent": "...",
    "url": "/api/users/123",
    "params": { "id": "123" }
  },
  "response": {
    "code": 500,
    "success": false,
    "message": "Database error",
    "data": []
  },
  "consoleLog": "Error: ...",
  "createdAt": "2023-10-05T12:34:56.789Z",
  "createdBy": {
    "id": "user123",
    "fullname": "John Doe",
    "emplCode": "EMP001"
  },
  "additionalData": {},
  "latency": 1250
}
```

### Checklist Migration
- [x] Đổi `id` → Loại bỏ (không cần nữa)
- [x] Đổi `timestamp` → `createdAt`
- [x] Đổi `level` → `type` (và thêm SUCCESS, DEBUG)
- [x] Đổi `service` → `projectName`
- [x] Thêm `function` (tên endpoint/chức năng)
- [x] Thêm `method` (HTTP method)
- [x] Đổi `message` → `response.message`
- [x] Đổi `stackTrace` → `consoleLog`
- [x] Đổi `user` → `createdBy` (object với id, fullname, emplCode)
- [x] Loại bỏ `requestId`
- [x] Thêm `request` object (headers, userAgent, url, params, body)
- [x] Thêm `response` object (code, success, message, data)
- [x] Thêm `latency` (milliseconds)
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
