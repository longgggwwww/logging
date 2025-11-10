# 🚀 Kafka Error Logging System - Updated Structure

Hệ thống logging phân tán sử dụng Kafka, Discord webhook và Firebase Cloud Messaging (FCM) với **cấu trúc message mới**.

## 📋 Cấu Trúc Message Mới

### Required Fields
- `projectName`: Tên project/ứng dụng
- `function`: Tên function/endpoint
- `method`: HTTP Method (GET, POST, PATCH, PUT, DELETE)
- `type`: Loại log (ERROR, WARNING, INFO, SUCCESS, DEBUG)
- `createdAt`: Timestamp (ISO 8601)
- `latency`: Thời gian xử lý (ms)

### Optional Fields
- `request`: Object chứa headers, userAgent, url, params, body
- `response`: Object chứa code, success, message, data
- `consoleLog`: Console log hoặc stack trace
- `createdBy`: Object chứa id, fullname, emplCode (hoặc null nếu guest)
- `additionalData`: Dữ liệu bổ sung dạng JSON

### Example Message
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
    "body": { "email": "user@example.com" }
  },
  "response": {
    "code": 500,
    "success": false,
    "message": "Database connection failed",
    "data": []
  },
  "consoleLog": "Error: Connection timeout...",
  "createdAt": "2023-10-05T12:34:56.789Z",
  "createdBy": {
    "id": "user123",
    "fullname": "Nguyen Van A",
    "emplCode": "EMP001"
  },
  "additionalData": {
    "database": "postgres",
    "timeout": 30000
  },
  "latency": 30250
}
```

## 🎨 Types và Màu Sắc

| Type | Emoji | Color | Khi Nào Sử Dụng |
|------|-------|-------|------------------|
| ERROR | 🚨 | Red (#FF0000) | Lỗi nghiêm trọng |
| WARNING | ⚠️ | Orange (#FFA500) | Cảnh báo |
| INFO | ℹ️ | Blue (#0099FF) | Thông tin tracking |
| SUCCESS | ✅ | Green (#00FF00) | Thao tác thành công |
| DEBUG | 🐛 | Gray (#808080) | Debug info |

## 📚 Documentation

### General Documentation
- **[MESSAGE_STRUCTURE.md](./MESSAGE_STRUCTURE.md)** - Chi tiết cấu trúc message
- **[MESSAGE_EMIT_GUIDE.md](./MESSAGE_EMIT_GUIDE.md)** - 📤 Hướng dẫn emit message vào Kafka
- **[NEW_STRUCTURE_GUIDE.md](./NEW_STRUCTURE_GUIDE.md)** - Hướng dẫn sử dụng
- **[UPDATE_SUMMARY.md](./UPDATE_SUMMARY.md)** - Tổng hợp thay đổi
- **[QUICK_START.md](./QUICK_START.md)** - Hướng dẫn quick start

### 🚀 CI/CD Documentation

#### GitHub Actions
- **[CICD_SUMMARY.md](./CICD_SUMMARY.md)** - Complete CI/CD setup summary
- **[CICD_QUICK_START.md](./CICD_QUICK_START.md)** - Quick start guide
- **[CICD_SETUP.md](./CICD_SETUP.md)** - Detailed setup guide (Vietnamese)
- **[CICD_DIAGRAM.md](./CICD_DIAGRAM.md)** - Visual diagrams & flow
- **[CICD_CHECKLIST.md](./CICD_CHECKLIST.md)** - Step-by-step checklist
- **[REBUILD_TRIGGER.md](./REBUILD_TRIGGER.md)** - 🔁 Rebuild trigger guide (NEW)

#### GitLab CI/CD
- **[GITLAB_CICD_SUMMARY.md](./GITLAB_CICD_SUMMARY.md)** - ✨ Complete implementation summary
- **[GITLAB_CICD_QUICK_START.md](./GITLAB_CICD_QUICK_START.md)** - 🚀 Quick start guide (Vietnamese)
- **[GITLAB_CICD_SETUP.md](./GITLAB_CICD_SETUP.md)** - 📖 Detailed setup & configuration
- **[GITLAB_CICD_DIAGRAM.md](./GITLAB_CICD_DIAGRAM.md)** - 📊 Visual diagrams & flows
- **[GITHUB_VS_GITLAB_CICD.md](./GITHUB_VS_GITLAB_CICD.md)** - 🔄 Platform comparison & migration tips

#### Other
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - NPM workspaces migration guide

### 📊 Log Processor Service Documentation
- **[LOG_PROCESSOR_IMPLEMENTATION.md](./LOG_PROCESSOR_IMPLEMENTATION.md)** - ✨ Complete implementation summary
- **[LOG_PROCESSOR_SUMMARY.md](./LOG_PROCESSOR_SUMMARY.md)** - Technical summary
- **[log-processor/README.md](./log-processor/README.md)** - Quick overview
- **[log-processor/SETUP_GUIDE.md](./log-processor/SETUP_GUIDE.md)** - Detailed setup guide
- **[log-processor/ARCHITECTURE_DIAGRAM.md](./log-processor/ARCHITECTURE_DIAGRAM.md)** - System architecture
- **[log-processor/QUICK_REFERENCE.md](./log-processor/QUICK_REFERENCE.md)** - Quick reference card

### ✅ **Dead Letter Queue (DLQ)**
- Messages thất bại sau khi retry tối đa sẽ được gửi vào `error-logs-dlq`
- Lưu trữ đầy đủ thông tin lỗi, metadata, và số lần retry
- Cho phép phân tích và xử lý lại messages lỗi sau này

### 🔄 **Retry Mechanism**
- **Exponential backoff**: Thời gian retry tăng theo cấp số nhân (1s, 2s, 4s...)
- **Configurable retries**: Mặc định 3 lần retry cho Discord webhook
- **Retry Queue**: Messages thất bại được gửi vào `error-logs-retry` để xử lý lại

### 🛡️ **Error Handling**
- **Graceful degradation**: Consumer không crash khi có lỗi
- **Error classification**: Phân loại lỗi theo loại (parse error, validation error, network error)
- **Logging**: Log chi tiết mọi lỗi với stack trace
- **Metrics tracking**: Theo dõi số lượng success/failure/retry

### 📊 **Monitoring & Metrics**
- Realtime metrics mỗi 30 giây:
  - ✅ Processed: Số messages xử lý thành công
  - ❌ Failed: Số messages thất bại
  - 🔄 Retried Successfully: Số messages retry thành công
  - ⚰️ Sent to DLQ: Số messages gửi vào DLQ
  - 🔴 Discord Errors: Số lỗi gửi Discord

### 🎯 **Other Features**
- **Auto topic creation**: Tự động tạo topics khi cần
- **Graceful shutdown**: Disconnect sạch sẽ khi tắt (Ctrl+C)
- **Rich Discord embeds**: Format đẹp với metadata đầy đủ
- **Configurable timeouts**: Có thể config timeout cho mọi thao tác

## 🏗️ System Architecture

### Services

1. **Discord Webhook Service** - Gửi error logs đến Discord
   - Xử lý messages từ `error-logs` topic
   - Retry mechanism với exponential backoff
   - DLQ cho messages thất bại

2. **FCM Service** - Push notifications qua Firebase Cloud Messaging
   - Consumer từ `error-logs` topic
   - Gửi notifications đến mobile devices

3. **Log Processor Service** 📊 **NEW**
   - Consumer từ `logs.error.dlq` topic
   - Lưu error logs vào PostgreSQL database
   - Sử dụng Prisma ORM
   - 3 tables: Projects, Functions, Logs
   - Full-text search và analytics capabilities

## 📁 Cấu trúc Topics

```
error-logs          → Main topic (messages mới)
error-logs-retry    → Retry queue (messages đang retry)
error-logs-dlq      → Dead Letter Queue (messages thất bại cuối cùng)
logs.error.dlq      → Error logs for database storage (Log Processor)
```

## 🔧 Cấu hình

### Config trong `index.js`:

```javascript
const CONFIG = {
  kafka: {
    brokers: ['localhost:19092', 'localhost:29092', 'localhost:39092'],
    connectionTimeout: 30000,
    requestTimeout: 30000
  },
  discord: {
    webhookUrl: 'YOUR_WEBHOOK_URL',
    maxRetries: 3,          // Số lần retry cho Discord
    retryDelay: 1000,       // Delay giữa các retry (ms)
    timeout: 5000
  },
  processing: {
    maxRetries: 3,          // Số lần retry trước khi vào DLQ
    retryDelay: 2000
  }
};
```

## 🚀 Cách sử dụng

### 1️⃣ Tạo topics (chỉ cần làm 1 lần)
```bash
./create-topics.sh
```

### 2️⃣ Chạy consumer
```bash
cd discord-webhook
node index.js
```

### 3️⃣ Test gửi messages
```bash
node test-producer.js
```

Test producer sẽ gửi 5 messages:
- 3 messages hợp lệ ✅
- 2 messages không hợp lệ ❌ (để test error handling)

### 4️⃣ Monitor Dead Letter Queue
```bash
./monitor-dlq.sh
```

## 📊 Flow xử lý message

```
┌─────────────────┐
│  error-logs     │ (Main topic)
│  (new messages) │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  Process Message        │
│  - Parse JSON           │
│  - Validate             │
│  - Send to Discord      │
└────┬──────────┬─────────┘
     │          │
     ▼          ▼
  SUCCESS    FAILED
     │          │
     │          ▼
     │     ┌─────────────────┐
     │     │ Retry <= 3?     │
     │     └────┬──────┬─────┘
     │          │      │
     │        YES    NO
     │          │      │
     │          ▼      ▼
     │     ┌─────────────────┐   ┌─────────────────┐
     │     │ error-logs-retry│   │ error-logs-dlq  │
     │     │ (Retry queue)   │   │ (Dead Letter Q) │
     │     └────────┬────────┘   └─────────────────┘
     │              │
     │              ▼
     │     (Process again with
     │      exponential backoff)
     │              │
     └──────────────┴───► ✅ Commit offset
```

## 🔍 Ví dụ Messages

### Cấu trúc Message Mới (Chi tiết đầy đủ trong [MESSAGE_STRUCTURE.md](MESSAGE_STRUCTURE.md)):

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2023-10-05T12:34:56Z",
  "level": "ERROR",
  "service": "api-service",
  "message": "Database connection failed",
  "stackTrace": "Error: Connection timeout\n  at Database.connect...",
  "user": "user@example.com",
  "requestId": "req-abc123",
  "additionalData": {
    "database": "postgres",
    "host": "db.example.com",
    "port": 5432
  }
}
```

### Fields:
- **id** (required): ID duy nhất (UUID)
- **timestamp** (required): ISO 8601 format
- **level** (required): `ERROR`, `WARNING`, hoặc `INFO`
- **service** (required): Tên service
- **message** (required): Mô tả lỗi
- **stackTrace** (optional): Stack trace chi tiết
- **user** (optional): User liên quan
- **requestId** (optional): Request ID để tracing
- **additionalData** (optional): Thông tin bổ sung dạng object

### Message trong DLQ:
```json
{
  "originalTopic": "error-logs",
  "originalPartition": 0,
  "originalOffset": "12345",
  "error": {
    "message": "Invalid message format: missing 'message' field",
    "stack": "Error: ...",
    "timestamp": "2025-10-09T16:00:05Z"
  },
  "originalData": {...},
  "attemptCount": 3,
  "lastAttemptTime": "2025-10-09T16:00:05Z"
}
```

## 🛠️ Scripts tiện ích

| Script | Mô tả |
|--------|-------|
| `./create-topics.sh` | Tạo tất cả topics cần thiết |
| `./monitor-dlq.sh` | Xem messages trong Dead Letter Queue |
| `./setup-log-processor.sh` | Setup Log Processor service (install deps, generate Prisma) |
| `./test-log-processor.sh` | Test Log Processor bằng cách gửi message mẫu |
| `node test-producer.js` | Gửi test messages (bao gồm cả invalid) |
| `node index.js` | Chạy consumer chính |

## 🚀 Quick Start - Log Processor Service

### Setup & Run

```bash
# 1. Setup service (install dependencies, generate Prisma client)
./setup-log-processor.sh

# 2. Start all services with Docker
docker-compose up -d

# 3. Check logs
docker logs -f log-processor

# 4. Send test message
./test-log-processor.sh

# 5. View data in Prisma Studio
cd log-processor
npm run prisma:studio
# Access at: http://localhost:5555
```

### Local Development

```bash
cd log-processor

# Install dependencies
npm install

# Generate Prisma Client
npm run prisma:generate

# Push schema to database
npm run prisma:push

# Start in development mode
npm run dev

# Open Prisma Studio to view data
npm run prisma:studio
```

### Query Examples

```javascript
import { getRecentErrors, getLogsByProject } from './queries.js';

// Get 50 most recent errors
const errors = await getRecentErrors(50);

// Get logs by project with pagination
const logs = await getLogsByProject(projectId, page, limit);
```

📖 **Full Documentation**: [log-processor/SETUP_GUIDE.md](./log-processor/SETUP_GUIDE.md)

## 🎯 Best Practices

1. **Monitor DLQ thường xuyên**: Messages trong DLQ cần được review và xử lý
2. **Adjust retry config**: Tùy chỉnh số lần retry và delay phù hợp với use case
3. **Log analysis**: Theo dõi logs để phát hiện patterns của lỗi
4. **Graceful shutdown**: Luôn dùng Ctrl+C để tắt consumer, không kill -9

## ⚠️ Error Types & Handling

| Error Type | Retry? | Send to DLQ? | Note |
|-----------|--------|--------------|------|
| JSON Parse Error | ✅ Yes | ✅ After max retries | Có thể do message bị corrupt |
| Validation Error | ✅ Yes | ✅ After max retries | Message thiếu fields required |
| Discord Network Error | ✅ Yes (exponential) | ✅ After max retries | Discord API down hoặc rate limit |
| Discord Timeout | ✅ Yes | ✅ After max retries | Slow network |

## 📈 Production Considerations

- ✅ Auto commit với interval 5s để balance giữa performance và reliability
- ✅ Session timeout 30s, heartbeat 3s cho stability
- ✅ Producer transactions enabled
- ✅ Replication factor 3 cho high availability
- ✅ Partitions 3 cho parallelism

## 🐛 Troubleshooting

### Consumer không kết nối được Kafka?
```bash
# Kiểm tra Kafka containers
docker ps | grep kafka

# Kiểm tra logs
docker logs kafka-controller-1
```

### Messages không được process?
```bash
# Kiểm tra consumer group
docker exec kafka-controller-1 /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --describe \
  --group discord-group
```

### Quá nhiều messages trong DLQ?
```bash
# Monitor DLQ
./monitor-dlq.sh

# Analyze error patterns trong logs
grep "Error processing message" logs/*.log
```

## 📝 License

MIT
