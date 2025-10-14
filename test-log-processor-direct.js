const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'test-producer',
  brokers: ['localhost:19092', 'localhost:29092', 'localhost:39092'],
  connectionTimeout: 30000,
  requestTimeout: 30000
});

const producer = kafka.producer();

async function sendTestMessage() {
  try {
    await producer.connect();
    console.log('✅ Producer connected');

    const testMessage = {
      projectName: 'test-project-kafka',
      function: 'testFunction',
      method: 'POST',
      type: 'ERROR',
      request: {
        headers: { 'content-type': 'application/json' },
        userAgent: 'test-agent',
        url: '/api/test',
        params: { id: '123' },
        body: { test: 'data' }
      },
      response: {
        code: 500,
        success: false,
        message: 'Test error message',
        data: { error: 'Internal server error' }
      },
      consoleLog: 'This is a test console log',
      additionalData: { testKey: 'testValue' },
      latency: 250,
      createdBy: {
        id: 'user-123',
        fullname: 'Test User',
        emplCode: 'EMP001'
      },
      createdAt: new Date().toISOString()
    };

    const result = await producer.send({
      topic: 'logs.error.dlq',
      messages: [{
        key: 'test-key',
        value: JSON.stringify(testMessage)
      }]
    });

    console.log('✅ Message sent successfully:', result);
    console.log('📋 Message content:', JSON.stringify(testMessage, null, 2));

    await producer.disconnect();
    console.log('✅ Producer disconnected');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

sendTestMessage();
