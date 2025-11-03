import { consumer } from './kafka.js';
import { conf } from './config.js';
import { processMsg } from './processor.js';
import { startSocketServer } from './socket.js';

// ============================================
// MAIN ENTRY POINT
// ============================================
export const run = async () => {
  try {
    startSocketServer();
    console.log('✅ Socket.IO server started');

    await consumer.connect();
    console.log('✅ Kafka consumer connected');

    await consumer.subscribe({
      topics: conf.kafka.topics,
      fromBeginning: false,
    });
    console.log(`✅ Subscribed to topic: ${conf.kafka.topics.join(', ')}`);

    await consumer.run({
      autoCommit: true,
      autoCommitInterval: 5000,
      eachMessage: processMsg,
    });

    console.log(
      '\n🚀 Realtime service is running and ready to broadcast logs...\n'
    );
  } catch (err) {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  }
};

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
export const shutdown = async () => {
  console.log('\n⏹️  Shutting down gracefully...');

  try {
    await consumer.disconnect();
    console.log('✅ Kafka consumer disconnected');
  } catch (err) {
    console.error('❌ Error disconnecting consumer:', err);
  }

  process.exit(0);
};

// ============================================
// SIGNAL HANDLERS
// ============================================
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  shutdown();
});
