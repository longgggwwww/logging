const { Kafka } = require('kafkajs');

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
    // 1. ERROR - Login failed với đầy đủ thông tin
    {
      projectName: 'myapp',
      function: 'login',
      method: 'POST',
      type: 'ERROR',
      request: {
        headers: {
          'content-type': 'application/json',
          'authorization': 'Bearer token123',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        url: '/api/auth/login',
        params: {},
        body: { 
          email: 'test@example.com',
          password: '[REDACTED]'
        }
      },
      response: {
        code: 500,
        success: false,
        message: 'Database connection failed',
        data: []
      },
      consoleLog: `Error: Connection timeout
    at Database.connect (/app/db/connection.js:45:12)
    at AuthService.login (/app/services/auth.js:78:20)
    at async Server.start (/app/server.js:23:5)`,
      createdAt: new Date().toISOString(),
      createdBy: {
        id: 'user123',
        fullname: 'Nguyen Van A',
        emplCode: 'EMP001'
      },
      additionalData: {
        database: 'postgres',
        host: 'db.example.com',
        port: 5432,
        timeout: 30000,
        retryAttempts: 3
      },
      latency: 30250
    },

    // 2. WARNING - Too many registration attempts
    {
      projectName: 'myapp',
      function: 'register',
      method: 'POST',
      type: 'WARNING',
      request: {
        headers: {
          'content-type': 'application/json'
        },
        userAgent: 'PostmanRuntime/7.32.0',
        url: '/api/auth/register',
        params: {},
        body: { 
          email: 'suspicious@example.com',
          password: '[REDACTED]'
        }
      },
      response: {
        code: 429,
        success: false,
        message: 'Too many registration attempts',
        data: []
      },
      consoleLog: 'Warning: Rate limit exceeded for IP 192.168.1.100',
      createdAt: new Date().toISOString(),
      createdBy: null, // Guest user
      additionalData: {
        ipAddress: '192.168.1.100',
        attemptCount: 5,
        timeWindow: '5 minutes',
        blocked: true
      },
      latency: 125
    },

    // 3. SUCCESS - Order created successfully
    {
      projectName: 'myapp',
      function: 'createOrder',
      method: 'POST',
      type: 'SUCCESS',
      request: {
        headers: {
          'content-type': 'application/json',
          'authorization': 'Bearer user-token'
        },
        userAgent: 'MyApp/1.0.0 (iOS 16.0)',
        url: '/api/orders',
        params: {},
        body: { 
          items: [
            { id: 'ITEM-1', quantity: 2, price: 50.00 },
            { id: 'ITEM-2', quantity: 1, price: 100.00 }
          ],
          total: 200.00
        }
      },
      response: {
        code: 201,
        success: true,
        message: 'Order created successfully',
        data: [
          { 
            orderId: 'ORD-12345',
            status: 'pending',
            estimatedDelivery: '2023-10-10'
          }
        ]
      },
      consoleLog: 'Success: Large order processed successfully. Order ID: ORD-12345',
      createdAt: new Date().toISOString(),
      createdBy: {
        id: 'vip123',
        fullname: 'Tran Thi B',
        emplCode: 'EMP002'
      },
      additionalData: {
        orderId: 'ORD-12345',
        amount: 200.00,
        itemCount: 3,
        paymentMethod: 'credit_card',
        shippingAddress: '123 Main St, City'
      },
      latency: 850
    },

    // 4. INFO - User profile accessed
    {
      projectName: 'myapp',
      function: 'getUserProfile',
      method: 'GET',
      type: 'INFO',
      request: {
        headers: {
          'authorization': 'Bearer admin-token'
        },
        userAgent: 'Chrome/120.0.0.0',
        url: '/api/users/123',
        params: { id: '123' }
      },
      response: {
        code: 200,
        success: true,
        message: 'User profile retrieved successfully',
        data: [
          { 
            userId: '123', 
            name: 'John Doe',
            email: 'john@example.com'
          }
        ]
      },
      consoleLog: 'Info: User profile accessed by admin for audit purposes',
      createdAt: new Date().toISOString(),
      createdBy: {
        id: 'admin456',
        fullname: 'Le Van C',
        emplCode: 'EMP003'
      },
      additionalData: {
        accessedBy: 'admin',
        purpose: 'audit',
        targetUserId: '123'
      },
      latency: 45
    },

    // 5. DEBUG - Tax calculation
    {
      projectName: 'myapp',
      function: 'calculateTax',
      method: 'POST',
      type: 'DEBUG',
      request: {
        headers: {},
        userAgent: 'Internal/Debug',
        url: '/api/internal/tax',
        params: {},
        body: { 
          amount: 1000,
          region: 'US-CA'
        }
      },
      response: {
        code: 200,
        success: true,
        message: 'Tax calculated',
        data: [
          { 
            tax: 100,
            total: 1100,
            taxRate: 0.1
          }
        ]
      },
      consoleLog: 'Debug: Tax calculation completed. Steps: validate -> calculate -> round',
      createdAt: new Date().toISOString(),
      createdBy: {
        id: 'dev456',
        fullname: 'Developer User',
        emplCode: 'DEV001'
      },
      additionalData: {
        steps: ['validate', 'calculate', 'round'],
        taxRate: 0.1,
        region: 'US-CA'
      },
      latency: 15
    },

    // 6. ERROR - Payment gateway timeout
    {
      projectName: 'myapp',
      function: 'processPayment',
      method: 'POST',
      type: 'ERROR',
      request: {
        headers: {},
        userAgent: 'MyApp/1.0.0 (Android 13)',
        url: '/api/payments/process',
        params: {},
        body: {
          orderId: 'ORD-67890',
          amount: 299.99,
          method: 'stripe'
        }
      },
      response: {
        code: 504,
        success: false,
        message: 'Payment gateway timeout',
        data: []
      },
      consoleLog: `Error: Timeout after 30000ms
    at PaymentGateway.charge (/app/gateways/stripe.js:156:10)
    at PaymentService.process (/app/services/payment.js:89:15)
    at PaymentController.processPayment (/app/controllers/payment.js:34:20)`,
      createdAt: new Date().toISOString(),
      createdBy: {
        id: 'customer789',
        fullname: 'Pham Van D',
        emplCode: 'N/A'
      },
      additionalData: {
        gateway: 'stripe',
        orderId: 'ORD-67890',
        amount: 299.99,
        timeoutDuration: 30000
      },
      latency: 30500
    },

    // 7. Message thiếu required fields (để test error handling)
    {
      projectName: 'myapp',
      method: 'POST',
      type: 'ERROR',
      createdAt: new Date().toISOString(),
      latency: 100
      // Thiếu: function (required field)
    },

    // 8. Invalid message structure (để test DLQ)
    {
      projectName: 'myapp',
      function: 'testInvalid',
      // Thiếu: method, type, createdAt, latency
    }
  ];

  // Gửi từng message
  for (let i = 0; i < testMessages.length; i++) {
    try {
      await producer.send({
        topic: 'all_users',
        messages: [
          { 
            value: JSON.stringify(testMessages[i]) 
          }
        ],
      });

      const msg = testMessages[i];
      console.log(`📨 [${i + 1}/${testMessages.length}] Đã gửi ${msg.type || 'INVALID'} message:`);
      console.log(`   Project: ${msg.projectName || 'N/A'}`);
      console.log(`   Function: ${msg.function || '[MISSING]'}`);
      console.log(`   Method: ${msg.method || '[MISSING]'}`);
      if (msg.response && msg.response.message) {
        console.log(`   Message: ${msg.response.message}`);
      }
      console.log(`   Latency: ${msg.latency || '[MISSING]'}ms\n`);

      // Delay nhỏ giữa các messages
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`❌ Lỗi gửi message ${i + 1}:`, error.message);
    }
  }

  console.log('\n✅ Đã gửi tất cả test messages');
  console.log('📋 Summary:');
  console.log('   - Valid messages: 6 (ERROR x2, WARNING, SUCCESS, INFO, DEBUG)');
  console.log('   - Invalid messages (will go to DLQ): 2');
  console.log('\n💡 Check consumer logs to see processing in action!');
  
  await producer.disconnect();
};

sendTestMessages().catch(console.error);
