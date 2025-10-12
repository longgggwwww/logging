const { Kafka } = require('kafkajs');
const { v4: uuidv4 } = require('uuid');

const kafka = new Kafka({
  clientId: 'test-producer',
  brokers: ['localhost:19092', 'localhost:29092', 'localhost:39092']
});

const producer = kafka.producer();

const sendTestMessages = async () => {
  await producer.connect();
  console.log('✅ Producer đã kết nối\n');

  // Test messages với cấu trúc mới
  const testMessages = [
    // 1. ERROR với đầy đủ thông tin
    {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      service: 'api-service',
      message: 'Database connection failed',
      stackTrace: `Error: Connection timeout
    at Database.connect (/app/db/connection.js:45:12)
    at async Server.start (/app/server.js:23:5)`,
      user: 'user@example.com',
      requestId: 'req-' + uuidv4(),
      additionalData: {
        database: 'postgres',
        host: 'db.example.com',
        port: 5432,
        retryAttempts: 3
      }
    },

    // 2. WARNING với ít thông tin hơn
    {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      level: 'WARNING',
      service: 'auth-service',
      message: 'Too many login attempts detected',
      user: 'suspicious@example.com',
      requestId: 'req-' + uuidv4(),
      additionalData: {
        ipAddress: '192.168.1.100',
        attemptCount: 5,
        timeWindow: '5 minutes'
      }
    },

    // 3. INFO log
    {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      level: 'INFO',
      service: 'payment-service',
      message: 'Payment processed successfully',
      user: 'customer@example.com',
      requestId: 'req-' + uuidv4(),
      additionalData: {
        amount: 99.99,
        currency: 'USD',
        transactionId: 'txn-' + uuidv4()
      }
    },

    // 4. ERROR với stackTrace dài
    {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      service: 'order-service',
      message: 'Failed to process order',
      stackTrace: `Error: Validation failed
    at OrderValidator.validate (/app/validators/order.js:78:15)
    at OrderService.createOrder (/app/services/order.js:123:20)
    at OrderController.create (/app/controllers/order.js:45:30)
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
    at next (/app/node_modules/express/lib/router/route.js:137:13)
    at Route.dispatch (/app/node_modules/express/lib/router/route.js:112:3)`,
      user: 'customer2@example.com',
      requestId: 'req-' + uuidv4(),
      additionalData: {
        orderId: 'ORD-12345',
        items: [
          { id: 'ITEM-1', quantity: 2 },
          { id: 'ITEM-2', quantity: 1 }
        ],
        totalAmount: 299.99
      }
    },

    // 5. Message thiếu một số field để test validation
    {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      service: 'notification-service',
      message: 'Failed to send email notification',
      additionalData: {
        recipient: 'user@example.com',
        emailType: 'order-confirmation'
      }
      // Không có stackTrace, user, requestId
    },

    // 6. Message không có additionalData
    {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      level: 'WARNING',
      service: 'cache-service',
      message: 'Cache miss rate high',
      requestId: 'req-' + uuidv4()
    },

    // 7. Message lỗi để test error handling (thiếu message field)
    {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      service: 'test-service'
      // Thiếu field "message" bắt buộc
    }
  ];

  // Gửi từng message
  for (let i = 0; i < testMessages.length; i++) {
    try {
      await producer.send({
        topic: 'error-logs',
        messages: [
          { 
            key: testMessages[i].id,
            value: JSON.stringify(testMessages[i]) 
          }
        ],
      });

      console.log(`📨 [${i + 1}/${testMessages.length}] Đã gửi ${testMessages[i].level || 'INVALID'} message:`);
      console.log(`   Service: ${testMessages[i].service}`);
      console.log(`   Message: ${testMessages[i].message || '[MISSING MESSAGE]'}`);
      console.log(`   ID: ${testMessages[i].id}\n`);

      // Delay nhỏ giữa các messages
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`❌ Lỗi gửi message ${i + 1}:`, error.message);
    }
  }

  console.log('✅ Đã gửi tất cả test messages');
  await producer.disconnect();
};

sendTestMessages().catch(console.error);
