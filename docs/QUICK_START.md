# 🚀 Quick Start - New Message Structure

## 📋 TL;DR

Hệ thống bây giờ yêu cầu message theo format:

```javascript
{
  id: "uuid",              // REQUIRED
  timestamp: "ISO-8601",   // REQUIRED
  level: "ERROR|WARNING|INFO", // REQUIRED
  service: "service-name", // REQUIRED
  message: "description",  // REQUIRED
  stackTrace: "...",       // optional
  user: "user@email",      // optional
  requestId: "req-id",     // optional
  additionalData: {}       // optional
}
```

## 🎯 Send a Message (3 Steps)

### 1. Install uuid
```bash
npm install uuid
```

### 2. Create Message
```javascript
const { v4: uuidv4 } = require('uuid');
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  brokers: ['localhost:19092']
});

const producer = kafka.producer();
await producer.connect();

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
    method: req.method
  }
};
```

### 3. Send to Kafka
```javascript
await producer.send({
  topic: 'logs',
  messages: [{
    key: errorLog.id,
    value: JSON.stringify(errorLog)
  }]
});
```

## 🎨 Levels

```javascript
// 🚨 RED - Needs immediate attention
level: 'ERROR'

// ⚠️ ORANGE - Should monitor
level: 'WARNING'

// ℹ️ BLUE - For information
level: 'INFO'
```

## 📦 Examples

### ERROR with Stack Trace
```javascript
{
  id: uuidv4(),
  timestamp: new Date().toISOString(),
  level: 'ERROR',
  service: 'payment-service',
  message: 'Payment processing failed',
  stackTrace: error.stack,
  user: 'customer@example.com',
  requestId: 'req-abc123',
  additionalData: {
    amount: 99.99,
    currency: 'USD',
    gateway: 'stripe'
  }
}
```

### WARNING
```javascript
{
  id: uuidv4(),
  timestamp: new Date().toISOString(),
  level: 'WARNING',
  service: 'auth-service',
  message: 'Multiple failed login attempts',
  user: 'user@example.com',
  additionalData: {
    attempts: 5,
    ipAddress: '192.168.1.1'
  }
}
```

### INFO
```javascript
{
  id: uuidv4(),
  timestamp: new Date().toISOString(),
  level: 'INFO',
  service: 'order-service',
  message: 'Large order processed',
  user: 'vip@example.com',
  requestId: 'req-xyz',
  additionalData: {
    orderId: 'ORD-12345',
    amount: 5000
  }
}
```

## 🧪 Test It

```bash
# 1. Make sure Kafka is running
docker-compose up -d

# 2. Create topics
./create-topics.sh

# 3. Start consumer
cd discord-webhook
node index.js

# 4. Send test messages (in another terminal)
./test-new-structure.sh
```

## 📚 Full Documentation

- **MESSAGE_STRUCTURE.md** - Complete field reference
- **CHANGELOG.md** - What changed
- **README.md** - Full system guide

## ❓ FAQ

**Q: What if I don't have requestId?**
A: It's optional. Just omit it.

**Q: What if I don't have stackTrace?**
A: Optional. Only include for errors.

**Q: Can I add custom fields?**
A: Yes! Use `additionalData` object.

**Q: What happens if I miss required fields?**
A: Message will be retried 3 times, then sent to DLQ.

## 🆘 Help

Message not showing in Discord?
1. Check it has `message` field (required)
2. Check JSON is valid
3. Check `level` is ERROR/WARNING/INFO
4. Monitor DLQ: `./monitor-dlq.sh`

## 💡 Tips

✅ Always use UUID for `id`
✅ Always use ISO 8601 for `timestamp`
✅ Include `stackTrace` for errors
✅ Include `requestId` for tracing
✅ Use `additionalData` for context
❌ Don't log sensitive data (passwords, etc.)
