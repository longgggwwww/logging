# 📘 Hướng Dẫn Sử Dụng Cấu Trúc Message Mới

## 🎯 Tổng Quan

Cấu trúc message mới được thiết kế để:
- ✅ Tracking chi tiết hơn về request/response
- ✅ Phân loại rõ ràng theo project, function, method
- ✅ Hỗ trợ nhiều loại log: ERROR, WARNING, INFO, SUCCESS, DEBUG
- ✅ Lưu trữ thông tin user đầy đủ hoặc guest
- ✅ Đo lường performance qua latency

## 📋 Cấu Trúc Chi Tiết

### Required Fields (Bắt buộc)

| Field | Type | Mô tả | Ví dụ |
|-------|------|-------|-------|
| `projectName` | String | Tên project/ứng dụng | `"myapp"` |
| `function` | String | Tên function/endpoint | `"login"`, `"createOrder"` |
| `method` | String | HTTP Method | `"GET"`, `"POST"`, `"PATCH"`, `"PUT"`, `"DELETE"` |
| `type` | String | Loại log | `"ERROR"`, `"WARNING"`, `"INFO"`, `"SUCCESS"`, `"DEBUG"` |
| `createdAt` | String | Timestamp (ISO 8601) | `"2023-10-05T12:34:56.789Z"` |
| `latency` | Number | Thời gian xử lý (ms) | `1250` |

### Optional Fields (Tùy chọn)

#### request (Object)
```javascript
{
  "headers": {},           // Request headers
  "userAgent": "",        // User agent string
  "url": "",              // Request URL
  "params": {},           // URL parameters
  "body": {}              // Request body (nếu có)
}
```

#### response (Object)
```javascript
{
  "code": 200,            // HTTP status code
  "success": true,        // Success flag
  "message": "",          // Response message
  "data": []              // Response data array
}
```

#### createdBy (Object hoặc null)
```javascript
{
  "id": "user123",        // User ID
  "fullname": "Nguyen Van A", // Full name
  "emplCode": "EMP001"    // Employee code
}
// hoặc null nếu là guest
```

#### Các field khác
- `consoleLog`: String - Console log hoặc stack trace
- `additionalData`: Object - Dữ liệu bổ sung dạng JSON

## 🎨 Các Loại Type

### 1. ERROR (🚨)
**Khi nào sử dụng:** Lỗi nghiêm trọng cần xử lý ngay
```javascript
{
  "type": "ERROR",
  "response": {
    "code": 500,
    "success": false,
    "message": "Database connection failed"
  }
}
```

### 2. WARNING (⚠️)
**Khi nào sử dụng:** Cảnh báo, vấn đề tiềm ẩn
```javascript
{
  "type": "WARNING",
  "response": {
    "code": 429,
    "success": false,
    "message": "Too many requests"
  }
}
```

### 3. INFO (ℹ️)
**Khi nào sử dụng:** Thông tin tracking quan trọng
```javascript
{
  "type": "INFO",
  "response": {
    "code": 200,
    "success": true,
    "message": "User profile accessed"
  }
}
```

### 4. SUCCESS (✅)
**Khi nào sử dụng:** Thao tác thành công cần tracking
```javascript
{
  "type": "SUCCESS",
  "response": {
    "code": 201,
    "success": true,
    "message": "Order created successfully"
  }
}
```

### 5. DEBUG (🐛)
**Khi nào sử dụng:** Thông tin debug cho developers
```javascript
{
  "type": "DEBUG",
  "response": {
    "code": 200,
    "success": true,
    "message": "Debug info"
  }
}
```

## 💻 Code Examples

### Express.js Middleware

```javascript
// Middleware để track request time
app.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

// Middleware để log
const logToKafka = async (req, res, type, message, additionalData = {}) => {
  const log = {
    projectName: 'myapp',
    function: req.route?.path || req.path,
    method: req.method,
    type: type,
    request: {
      headers: req.headers,
      userAgent: req.headers['user-agent'],
      url: req.originalUrl,
      params: req.params,
      body: req.method !== 'GET' ? req.body : undefined
    },
    response: {
      code: res.statusCode,
      success: res.statusCode < 400,
      message: message,
      data: []
    },
    consoleLog: type === 'ERROR' ? new Error().stack : message,
    createdAt: new Date().toISOString(),
    createdBy: req.user ? {
      id: req.user.id,
      fullname: req.user.fullname,
      emplCode: req.user.emplCode
    } : null,
    additionalData: additionalData,
    latency: Date.now() - req.startTime
  };

  await producer.send({
    topic: 'error-logs',
    messages: [{ value: JSON.stringify(log) }]
  });
};

// Sử dụng trong route
app.post('/api/login', async (req, res) => {
  try {
    const user = await authService.login(req.body);
    
    await logToKafka(req, res, 'SUCCESS', 'Login successful', {
      userId: user.id
    });
    
    res.json({ success: true, user });
  } catch (error) {
    res.status(500);
    
    await logToKafka(req, res, 'ERROR', error.message, {
      errorCode: error.code,
      errorType: error.name
    });
    
    res.json({ success: false, message: error.message });
  }
});
```

### NestJS Interceptor

```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (data) => {
          this.logToKafka(request, response, 'SUCCESS', 'Request successful', data, startTime);
        },
        error: (error) => {
          this.logToKafka(request, response, 'ERROR', error.message, null, startTime);
        }
      })
    );
  }

  private async logToKafka(req, res, type, message, data, startTime) {
    const log = {
      projectName: 'myapp',
      function: req.route?.path || req.path,
      method: req.method,
      type: type,
      request: {
        headers: req.headers,
        userAgent: req.headers['user-agent'],
        url: req.url,
        params: req.params,
        body: req.body
      },
      response: {
        code: res.statusCode,
        success: res.statusCode < 400,
        message: message,
        data: data ? [data] : []
      },
      consoleLog: type === 'ERROR' ? new Error().stack : message,
      createdAt: new Date().toISOString(),
      createdBy: req.user || null,
      additionalData: {},
      latency: Date.now() - startTime
    };

    await this.kafkaService.send('error-logs', log);
  }
}
```

### FastAPI (Python)

```python
from datetime import datetime
from typing import Optional
import time
from fastapi import Request, Response
from kafka import KafkaProducer
import json

class LogMiddleware:
    def __init__(self, app):
        self.app = app
        self.producer = KafkaProducer(
            bootstrap_servers=['localhost:19092', 'localhost:29092', 'localhost:39092'],
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        start_time = time.time()
        
        # Process request
        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                status_code = message["status"]
                latency = int((time.time() - start_time) * 1000)
                
                log_data = {
                    "projectName": "myapp",
                    "function": scope["path"],
                    "method": scope["method"],
                    "type": "SUCCESS" if status_code < 400 else "ERROR",
                    "request": {
                        "headers": dict(scope["headers"]),
                        "userAgent": dict(scope["headers"]).get(b"user-agent", b"").decode(),
                        "url": scope["path"],
                        "params": dict(scope.get("query_string", {}))
                    },
                    "response": {
                        "code": status_code,
                        "success": status_code < 400,
                        "message": "Request processed",
                        "data": []
                    },
                    "consoleLog": "",
                    "createdAt": datetime.utcnow().isoformat() + "Z",
                    "createdBy": scope.get("user", None),
                    "additionalData": {},
                    "latency": latency
                }
                
                self.producer.send('error-logs', value=log_data)
                
            await send(message)

        await self.app(scope, receive, send_wrapper)
```

## 🧪 Testing

### Test với cURL

```bash
# Test ERROR
curl -X POST http://localhost:3000/test-error

# Test SUCCESS
curl -X POST http://localhost:3000/test-success \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Test với authentication
curl -X GET http://localhost:3000/api/users/123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Producer

```bash
# Chạy test producer
node test-producer.js

# Kiểm tra Discord webhook
# Kiểm tra FCM notifications
```

## 📊 Monitoring

### Discord Output
- Title: `🚨 ERROR - myapp/login`
- Fields: Project, Function, Method, Type, Created At, Latency, Response Code, Created By, URL
- Color-coded theo type

### FCM Notification
- Title: `🚨 ERROR - myapp/login`
- Body: Response message + method + URL + user + latency
- Data payload: Tất cả thông tin chi tiết

## ⚙️ Configuration

### Kafka Topics
- `error-logs`: Topic chính
- `error-logs-retry`: Topic retry
- `error-logs-dlq`: Dead letter queue

### Consumer Groups
- `discord-group`: Discord webhook consumer
- `fcm-group`: FCM notification consumer

## 🔧 Troubleshooting

### Message bị reject
- Kiểm tra required fields: projectName, function, method, type, createdAt, latency
- Validate type: phải là một trong ERROR, WARNING, INFO, SUCCESS, DEBUG
- Validate method: phải là một trong GET, POST, PATCH, PUT, DELETE

### Không nhận được notification
- Kiểm tra Kafka broker connection
- Kiểm tra Discord webhook URL
- Kiểm tra FCM device tokens
- Xem logs trong consumer

### Performance issues
- Monitor latency field
- Check Kafka lag
- Review additionalData size (giới hạn 500 chars)
- Review consoleLog size (giới hạn 500 chars)

## 📚 Resources

- [MESSAGE_STRUCTURE.md](./MESSAGE_STRUCTURE.md) - Cấu trúc chi tiết
- [test-producer.js](./test-producer.js) - Test examples
- [fcm-service/index.js](./fcm-service/index.js) - FCM consumer
- [discord-webhook/index.js](./discord-webhook/index.js) - Discord consumer
