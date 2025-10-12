const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'test-producer',
  brokers: ['localhost:19092', 'localhost:29092', 'localhost:39092']
});

const producer = kafka.producer();

const testMessages = [
  // Valid message
  {
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    message: '✅ Test error message - This should work',
    service: 'test-service'
  },
  // Valid message 2
  {
    timestamp: new Date().toISOString(),
    level: 'CRITICAL',
    message: '🔥 Critical system failure detected',
    service: 'database-service'
  },
  // Valid message 3
  {
    timestamp: new Date().toISOString(),
    level: 'WARNING',
    message: '⚠️ High memory usage detected',
    service: 'monitoring-service'
  },
  // Invalid message - missing required field (will trigger retry then DLQ)
  {
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    service: 'broken-service'
    // Missing 'message' field - will fail validation
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
    console.log('   - Valid messages: 3');
    console.log('   - Invalid messages (will go to DLQ): 2');
    console.log('\n💡 Check consumer logs to see error handling in action!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await producer.disconnect();
  }
};

sendTestMessages().catch(console.error);
