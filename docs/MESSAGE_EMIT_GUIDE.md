# 📤 Hướng Dẫn Emit Message vào Kafka

Hướng dẫn chi tiết cách triển khai emit một message vào Kafka với cấu trúc `LogMessage` chuẩn.

## 📋 Mục lục

1. [Cấu trúc LogMessage](#-cấu-trúc-logmessage)
2. [Setup Producer](#-setup-producer)
3. [Emit Message](#-emit-message)
4. [Ví dụ hoàn chỉnh](#-ví-dụ-hoàn-chỉnh)
5. [Best Practices](#-best-practices)

---

## 📝 Cấu trúc LogMessage

### Interface TypeScript

```typescript
interface LogMessage {
  project: string;
  function: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD";
  type: "ERROR" | "SUCCESS" | "WARNING" | "INFO" | "DEBUG";
  request: {
    headers: Record<string, any>;
    userAgent: string;
    url: string;
    params: Record<string, any>;
    body?: any;
  };
  response: {
    code: number;
    success: boolean;
    message: string;
    data: any[];
  };
  consoleLog: string;
  createdAt: string; // ISO 8601 format
  createdBy: {
    id: string;
    fullname: string;
    emplCode: string;
  } | null; // null nếu guest user
  additionalData: Record<string, any>;
  latency: number; // milliseconds
}
```

### Các trường bắt buộc

| Field | Type | Mô tả |
|-------|------|-------|
| `project` | string | Tên project/ứng dụng (vd: "ecommerce-platform") |
| `function` | string | Tên function/endpoint (vd: "login", "checkout") |
| `method` | string | HTTP method (GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD) |
| `type` | string | Loại log (ERROR, SUCCESS, WARNING, INFO, DEBUG) |
| `request` | object | Thông tin request |
| `response` | object | Thông tin response |
| `consoleLog` | string | Console log hoặc stack trace |
| `createdAt` | string | Timestamp ISO 8601 (vd: "2024-01-15T10:30:00.000Z") |
| `createdBy` | object/null | Thông tin user tạo log, null nếu guest |
| `additionalData` | object | Dữ liệu bổ sung tùy chỉnh |
| `latency` | number | Thời gian xử lý tính bằng milliseconds |

---

## 🔧 Setup Producer

### 1. Cài đặt dependencies

```bash
npm install kafkajs
# hoặc
yarn add kafkajs
```

### 2. Tạo Kafka Producer

```typescript
// kafka.ts
import { Kafka, logLevel } from "kafkajs";

const kafka = new Kafka({
  clientId: "your-app-name",
  brokers: [
    "proxy.iit.vn:19092",
    "proxy.iit.vn:29092",
    "proxy.iit.vn:39092"
  ],
  connectionTimeout: 30000,
  requestTimeout: 30000,
  retry: {
    initialRetryTime: 300,
    retries: 8,
  },
  logCreator: () => ({ level, log }) => {
    if (level === logLevel.INFO || level === logLevel.ERROR) {
      console.log(JSON.stringify(log, null, 2));
    }
  },
});

export const producer = kafka.producer();
```

### 3. Biến môi trường

Tạo file `.env`:

```env
KAFKA_BROKERS=proxy.iit.vn:19092,proxy.iit.vn:29092,proxy.iit.vn:39092
TOPICS=logs
```

---

## 📤 Emit Message

### 1. Tạo LogMessage

```typescript
import { LogMessage } from "./types";

const createLogMessage = (
  project: string,
  functionName: string,
  method: LogMessage["method"],
  type: LogMessage["type"],
  request: LogMessage["request"],
  response: LogMessage["response"],
  consoleLog: string,
  createdBy: LogMessage["createdBy"] = null,
  additionalData: Record<string, any> = {},
  latency: number = 0
): LogMessage => {
  return {
    project,
    function: functionName,
    method,
    type,
    request,
    response,
    consoleLog,
    createdAt: new Date().toISOString(),
    createdBy,
    additionalData,
    latency,
  };
};
```

### 2. Gửi message vào Kafka

```typescript
import { producer } from "./kafka";

const sendLogMessage = async (
  topic: string,
  message: LogMessage
): Promise<void> => {
  try {
    await producer.connect();
    console.log("✅ Producer connected");

    await producer.send({
      topic,
      messages: [
        {
          key: message.project, // Optional: partition key
          value: JSON.stringify(message),
          headers: {
            "content-type": "application/json",
          },
        },
      ],
    });

    console.log(`✅ Message sent to topic: ${topic}`);
  } catch (error) {
    console.error("❌ Error sending message:", error);
    throw error;
  } finally {
    await producer.disconnect();
    console.log("🔌 Producer disconnected");
  }
};
```

### 3. Gửi nhiều messages (batch)

```typescript
const sendMultipleMessages = async (
  topic: string,
  messages: LogMessage[]
): Promise<void> => {
  try {
    await producer.connect();
    console.log("✅ Producer connected");

    const kafkaMessages = messages.map((msg) => ({
      key: msg.project,
      value: JSON.stringify(msg),
      headers: {
        "content-type": "application/json",
      },
    }));

    await producer.send({
      topic,
      messages: kafkaMessages,
    });

    console.log(`✅ ${messages.length} messages sent to topic: ${topic}`);
  } catch (error) {
    console.error("❌ Error sending messages:", error);
    throw error;
  } finally {
    await producer.disconnect();
    console.log("🔌 Producer disconnected");
  }
};
```

---

## 💡 Ví dụ hoàn chỉnh

### Ví dụ 1: Error Log

```typescript
import { producer } from "./kafka";
import { LogMessage } from "./types";

async function logError() {
  const errorLog: LogMessage = {
    project: "ecommerce-platform",
    function: "login",
    method: "POST",
    type: "ERROR",
    request: {
      headers: {
        "content-type": "application/json",
        authorization: "Bearer token123",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      url: "/api/auth/login",
      params: {},
      body: {
        email: "customer@shop.com",
        password: "[REDACTED]",
      },
    },
    response: {
      code: 500,
      success: false,
      message: "Database connection failed",
      data: [],
    },
    consoleLog: `Error: Connection timeout
  at Database.connect (/app/db/connection.js:45:12)
  at AuthService.login (/app/services/auth.js:78:20)`,
    createdAt: new Date().toISOString(),
    createdBy: {
      id: "user123",
      fullname: "Nguyen Van A",
      emplCode: "EMP001",
    },
    additionalData: {
      database: "postgres",
      host: "db.shop.com",
      port: 5432,
      timeout: 30000,
    },
    latency: 30250,
  };

  await producer.connect();
  
  await producer.send({
    topic: "logs",
    messages: [
      {
        key: errorLog.project,
        value: JSON.stringify(errorLog),
      },
    ],
  });

  await producer.disconnect();
}
```

### Ví dụ 2: Success Log

```typescript
async function logSuccess() {
  const successLog: LogMessage = {
    project: "payment-service",
    function: "processPayment",
    method: "POST",
    type: "SUCCESS",
    request: {
      headers: {
        "content-type": "application/json",
      },
      userAgent: "Mobile App v2.1",
      url: "/api/payments/process",
      params: {},
      body: {
        orderId: "ORD-12345",
        amount: 150000,
        currency: "VND",
      },
    },
    response: {
      code: 200,
      success: true,
      message: "Payment processed successfully",
      data: [
        {
          transactionId: "TXN-987654",
          status: "completed",
        },
      ],
    },
    consoleLog: "Payment processed successfully for order ORD-12345",
    createdAt: new Date().toISOString(),
    createdBy: {
      id: "user456",
      fullname: "Tran Thi B",
      emplCode: "EMP002",
    },
    additionalData: {
      paymentGateway: "vnpay",
      bankCode: "NCB",
    },
    latency: 1250,
  };

  await producer.connect();
  
  await producer.send({
    topic: "info-logs",
    messages: [
      {
        key: successLog.project,
        value: JSON.stringify(successLog),
      },
    ],
  });

  await producer.disconnect();
}
```

### Ví dụ 3: Guest User (không có thông tin user)

```typescript
async function logGuestAction() {
  const guestLog: LogMessage = {
    project: "public-api",
    function: "searchProducts",
    method: "GET",
    type: "INFO",
    request: {
      headers: {
        "user-agent": "curl/7.68.0",
      },
      userAgent: "curl/7.68.0",
      url: "/api/products/search?q=laptop",
      params: {
        q: "laptop",
        page: "1",
        limit: "20",
      },
      body: null,
    },
    response: {
      code: 200,
      success: true,
      message: "Search completed",
      data: [
        { id: 1, name: "Dell XPS 13" },
        { id: 2, name: "MacBook Pro" },
      ],
    },
    consoleLog: "Guest user searched for: laptop",
    createdAt: new Date().toISOString(),
    createdBy: null, // Guest user
    additionalData: {
      searchResults: 45,
      searchTime: 125,
    },
    latency: 125,
  };

  await producer.connect();
  
  await producer.send({
    topic: "info-logs",
    messages: [
      {
        key: guestLog.project,
        value: JSON.stringify(guestLog),
      },
    ],
  });

  await producer.disconnect();
}
```

---

## ✅ Best Practices

### 1. **Sử dụng connection pool**

Tránh connect/disconnect cho mỗi message:

```typescript
// ❌ BAD: Connect/disconnect mỗi lần
async function sendLog(log: LogMessage) {
  await producer.connect();
  await producer.send({ topic: "logs", messages: [{ value: JSON.stringify(log) }] });
  await producer.disconnect();
}

// ✅ GOOD: Kết nối một lần, gửi nhiều messages
async function sendLogs(logs: LogMessage[]) {
  await producer.connect();
  
  for (const log of logs) {
    await producer.send({ 
      topic: "logs", 
      messages: [{ value: JSON.stringify(log) }] 
    });
  }
  
  await producer.disconnect();
}

// ✅ BETTER: Sử dụng batch send
async function sendLogsBatch(logs: LogMessage[]) {
  await producer.connect();
  
  await producer.send({
    topic: "logs",
    messages: logs.map(log => ({
      value: JSON.stringify(log)
    }))
  });
  
  await producer.disconnect();
}
```

### 2. **Redact sensitive data**

```typescript
const redactSensitiveData = (data: any): any => {
  const sensitiveFields = ['password', 'token', 'creditCard', 'ssn'];
  
  if (typeof data === 'object' && data !== null) {
    const redacted = { ...data };
    for (const key of Object.keys(redacted)) {
      if (sensitiveFields.includes(key)) {
        redacted[key] = '[REDACTED]';
      } else if (typeof redacted[key] === 'object') {
        redacted[key] = redactSensitiveData(redacted[key]);
      }
    }
    return redacted;
  }
  return data;
};

// Sử dụng
const message: LogMessage = {
  // ... other fields
  request: {
    body: redactSensitiveData(requestBody),
    // ...
  },
  // ...
};
```

### 3. **Error handling**

```typescript
async function sendLogWithRetry(
  topic: string,
  message: LogMessage,
  maxRetries = 3
): Promise<void> {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      await producer.send({
        topic,
        messages: [{ value: JSON.stringify(message) }],
      });
      console.log("✅ Message sent successfully");
      return;
    } catch (error) {
      retries++;
      console.error(`❌ Attempt ${retries} failed:`, error);
      
      if (retries >= maxRetries) {
        console.error("❌ Max retries reached. Message not sent.");
        throw error;
      }
      
      // Exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, retries) * 1000)
      );
    }
  }
}
```

### 4. **Validate message structure**

```typescript
const validateLogMessage = (message: any): message is LogMessage => {
  const requiredFields = [
    'project', 'function', 'method', 'type',
    'request', 'response', 'consoleLog', 'createdAt',
    'createdBy', 'additionalData', 'latency'
  ];
  
  for (const field of requiredFields) {
    if (!(field in message)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];
  if (!validMethods.includes(message.method)) {
    throw new Error(`Invalid method: ${message.method}`);
  }
  
  const validTypes = ['ERROR', 'SUCCESS', 'WARNING', 'INFO', 'DEBUG'];
  if (!validTypes.includes(message.type)) {
    throw new Error(`Invalid type: ${message.type}`);
  }
  
  return true;
};

// Sử dụng
try {
  validateLogMessage(myMessage);
  await sendLogMessage('logs', myMessage);
} catch (error) {
  console.error('Invalid message:', error);
}
```

### 5. **Sử dụng partition key**

```typescript
// Sử dụng project name làm partition key
// để đảm bảo logs của cùng 1 project nằm chung partition
await producer.send({
  topic: "logs",
  messages: [
    {
      key: message.project, // ← Partition key
      value: JSON.stringify(message),
    },
  ],
});
```

### 6. **Measure latency chính xác**

```typescript
async function handleRequest(req: Request, res: Response) {
  const startTime = Date.now();
  
  try {
    // Process request
    const result = await processRequest(req);
    
    const latency = Date.now() - startTime;
    
    const log: LogMessage = {
      // ... other fields
      latency, // ← Latency chính xác
      type: "SUCCESS",
      // ...
    };
    
    await sendLogMessage("info-logs", log);
    
    res.json(result);
  } catch (error) {
    const latency = Date.now() - startTime;
    
    const log: LogMessage = {
      // ... other fields
      latency, // ← Latency ngay cả khi có lỗi
      type: "ERROR",
      // ...
    };
    
    await sendLogMessage("logs", log);
    
    res.status(500).json({ error: error.message });
  }
}
```

---

## 🎯 Topics phổ biến

| Topic | Mục đích | Type |
|-------|----------|------|
| `logs` | Error messages cần gửi Discord | ERROR |
| `logs-retry` | Retry queue cho failed messages | ERROR |
| `logs-dlq` | Dead Letter Queue | ERROR |

---

## 📚 Tham khảo

- [MESSAGE_STRUCTURE.md](./MESSAGE_STRUCTURE.md) - Chi tiết cấu trúc message
- [test-producer/](../test-producer/) - Code mẫu producer hoàn chỉnh
- [KafkaJS Documentation](https://kafka.js.org/) - Tài liệu chính thức KafkaJS

---

## 🆘 Troubleshooting

### Lỗi connection timeout

```typescript
// Tăng timeout trong config
const kafka = new Kafka({
  connectionTimeout: 60000, // 60s
  requestTimeout: 60000,    // 60s
  // ...
});
```

### Lỗi message too large

```typescript
// Kiểm tra kích thước message
const messageSize = Buffer.byteLength(JSON.stringify(message));
if (messageSize > 1000000) { // 1MB
  console.warn('Message too large:', messageSize);
  // Cắt bớt consoleLog hoặc additionalData
}
```

### Producer không disconnect

```typescript
// Sử dụng process handlers
process.on('SIGTERM', async () => {
  await producer.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await producer.disconnect();
  process.exit(0);
});
```

---

**✅ Hoàn thành!** Bạn đã biết cách emit messages vào Kafka với cấu trúc `LogMessage` chuẩn.
