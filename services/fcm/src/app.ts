import { conf } from './config.js';
import { consumer } from './kafka.js';
import { processMessage } from './processor.js';

// ============================================
// INITIALIZE FCM SERVICE
// ============================================
export const initializeFCMService = async (): Promise<void> => {
  try {
    console.log('🚀 FCM Service initializing...');

    // Connect consumer
    console.log('🔌 Connecting consumer...');
    await consumer.connect();
    console.log('✅ Consumer connected');

    // Subscribe to main topic only (no retry topic in realtime mode)
    await consumer.subscribe({
      topics: [conf.topics.main],
      fromBeginning: false,
    });
    console.log(`✅ Subscribed to topic: ${conf.topics.main}`);

    // Run consumer
    await consumer.run({
      autoCommit: true,
      autoCommitInterval: 5000,
      eachMessage: processMessage,
    });

    console.log(
      '\n🚀 FCM Consumer is running in realtime mode (no retry/DLQ)...\n'
    );
  } catch (error: any) {
    console.error('❌ Fatal error starting FCM consumer:', error);
    process.exit(1);
  }
};

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
export const shutdown = async (): Promise<void> => {
  console.log('\n⏹️  Shutting down gracefully...');

  try {
    await consumer.disconnect();
    console.log('✅ Consumer disconnected from Kafka');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};
