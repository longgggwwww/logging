import { consumer, producer } from './kafka.js';
import { CONFIG } from './config.js';
import { logMetrics } from './metrics.js';
import { processMessage } from './processor.js';

const run = async (): Promise<void> => {
  try {
    // Connect producer first (needed for DLQ and retry)
    await producer.connect();
    console.log('✅ Producer connected');

    // Connect consumer
    await consumer.connect();
    console.log('✅ Consumer connected');

    // Subscribe to topics
    await consumer.subscribe({
      topics: [CONFIG.topics.main, CONFIG.topics.retry],
      fromBeginning: false,
    });
    console.log(
      `✅ Subscribed to topics: ${CONFIG.topics.main}, ${CONFIG.topics.retry}`
    );

    // Run consumer
    await consumer.run({
      autoCommit: true,
      autoCommitInterval: 5000,
      eachMessage: processMessage,
    });

    console.log('\n🚀 Consumer is running and ready to process messages...\n');
  } catch (error: any) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
};

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
const shutdown = async (): Promise<void> => {
  console.log('\n⏹️  Shutting down gracefully...');
  logMetrics();

  try {
    await consumer.disconnect();
    await producer.disconnect();
    console.log('✅ Disconnected from Kafka');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// ============================================
// START APPLICATION
// ============================================
run().catch(console.error);
