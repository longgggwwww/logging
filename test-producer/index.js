const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'test-producer',
  brokers: ['localhost:19092', 'localhost:29092', 'localhost:39092']
});

const producer = kafka.producer();

const sendTestMessage = async () => {
  await producer.connect();
  console.log('✅ Producer đã kết nối');

  const message = {
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    message: 'Test error message từ producer',
    service: 'test-service'
  };

  await producer.send({
    topic: 'error-logs',
    messages: [
      { value: JSON.stringify(message) }
    ],
  });

  console.log('📨 Đã gửi message:', message);
  await producer.disconnect();
};

sendTestMessage().catch(console.error);
