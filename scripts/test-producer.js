const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'test-producer',
  brokers: ['localhost:19092', 'localhost:29092', 'localhost:39092']
});

const producer = kafka.producer();

const testMessages = [
  // Valid ERROR message
  {
    projectName: 'myapp',
    function: 'login',
    method: 'POST',
    type: 'ERROR',
    request: {
      headers: {
        'content-type': 'application/json',
        'authorization': 'Bearer token123'
      },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      url: '/api/auth/login',
      params: {},
      body: { email: 'test@example.com' }
    },
    response: {
      code: 500,
      success: false,
      message: 'Database connection failed',
      data: []
    },
    consoleLog: 'Error: Connection timeout\n  at Database.connect()\n  at AuthService.login()',
    createdAt: new Date().toISOString(),
    createdBy: {
      id: 'user123',
      fullname: 'Nguyen Van A',
      emplCode: 'EMP001'
    },
    additionalData: {
      database: 'postgres',
      host: 'db.example.com',
      timeout: 30000
    },
    latency: 30250
  },
  
  // Valid WARNING message
  {
    projectName: 'myapp',
    function: 'register',
    method: 'POST',
    type: 'WARNING',
    request: {
      headers: {},
      userAgent: 'PostmanRuntime/7.32.0',
      url: '/api/auth/register',
      params: {},
      body: { email: 'suspicious@example.com' }
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
      timeWindow: '5 minutes'
    },
    latency: 125
  },
  
  // Valid SUCCESS message
  {
    projectName: 'myapp',
    function: 'createOrder',
    method: 'POST',
    type: 'SUCCESS',
    request: {
      headers: {},
      userAgent: 'MyApp/1.0.0 (iOS 16.0)',
      url: '/api/orders',
      params: {},
      body: { items: ['item1', 'item2'], total: 5000 }
    },
    response: {
      code: 201,
      success: true,
      message: 'Order created successfully',
      data: [{ orderId: 'ORD-12345' }]
    },
    consoleLog: 'Success: Large order processed successfully',
    createdAt: new Date().toISOString(),
    createdBy: {
      id: 'vip123',
      fullname: 'Tran Thi B',
      emplCode: 'EMP002'
    },
    additionalData: {
      orderId: 'ORD-12345',
      amount: 5000.00,
      itemCount: 50
    },
    latency: 850
  },
  
  // Valid INFO message
  {
    projectName: 'myapp',
    function: 'getUserProfile',
    method: 'GET',
    type: 'INFO',
    request: {
      headers: {},
      userAgent: 'Chrome/120.0.0.0',
      url: '/api/users/123',
      params: { id: '123' }
    },
    response: {
      code: 200,
      success: true,
      message: 'User profile retrieved',
      data: [{ userId: '123', name: 'John Doe' }]
    },
    consoleLog: 'Info: User profile accessed',
    createdAt: new Date().toISOString(),
    createdBy: {
      id: 'admin456',
      fullname: 'Le Van C',
      emplCode: 'EMP003'
    },
    additionalData: {
      accessedBy: 'admin',
      purpose: 'audit'
    },
    latency: 45
  },
  
  // Invalid message - missing required fields (will trigger retry then DLQ)
  {
    projectName: 'myapp',
    method: 'POST',
    type: 'ERROR'
    // Missing 'function', 'createdAt', 'latency' - will fail validation
  },
  
  // Invalid JSON structure
  "This is not a valid JSON object"
];

const sendTestMessages = async () => {
  try {
    await producer.connect();
    console.log('✅ Producer connected\n');

    for (let i = 0; i < testMessages.length; i++) {
      const msg = testMessages[i];
      const value = typeof msg === 'string' ? msg : JSON.stringify(msg);
      
      await producer.send({
        topic: 'error-logs',
        messages: [{ value }],
      });

      console.log(`📨 Message ${i + 1}/${testMessages.length} sent:`, 
        typeof msg === 'string' ? msg.substring(0, 50) : msg.message || 'INVALID');
      
      // Small delay between messages
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n✅ All test messages sent!');
    console.log('📋 Summary:');
    console.log('   - Valid messages: 4 (ERROR, WARNING, SUCCESS, INFO)');
    console.log('   - Invalid messages (will go to DLQ): 2');
    console.log('\n💡 Check consumer logs to see error handling in action!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await producer.disconnect();
  }
};

sendTestMessages().catch(console.error);
