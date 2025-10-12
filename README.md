# 🚀 Kafka Error Logs Consumer - Production Ready

Hệ thống consumer Kafka với đầy đủ cơ chế error handling, retry, và Dead Letter Queue cho môi trường production.

## ✨ Tính năng

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

## 📁 Cấu trúc Topics

```
error-logs          → Main topic (messages mới)
error-logs-retry    → Retry queue (messages đang retry)
error-logs-dlq      → Dead Letter Queue (messages thất bại cuối cùng)
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

### Valid message:
```json
{
  "timestamp": "2025-10-09T16:00:00Z",
  "level": "ERROR",
  "message": "Database connection failed",
  "service": "api-service"
}
```

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
| `node test-producer.js` | Gửi test messages (bao gồm cả invalid) |
| `node index.js` | Chạy consumer chính |

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
