import { consumer } from './kafka.js';
import { CONFIG } from './config.js';
import { processMessage } from './processor.js';
import { startSocketServer, metrics } from './socket.js';

// ============================================
// MAIN ENTRY POINT
// ============================================
export const run = async () => {
  try {
    // Start Socket.IO server first
    startSocketServer();
    console.log('✅ Socket.IO server started');

    // Connect Kafka consumer
    await consumer.connect();
    console.log('✅ Kafka consumer connected');

    // Subscribe to main topic only
    await consumer.subscribe({
      topics: CONFIG.kafka.topics,
      fromBeginning: false,
    });
    console.log(`✅ Subscribed to topic: ${CONFIG.kafka.topics.join(', ')}`);

    // Run consumer
    await consumer.run({
      autoCommit: true,
      autoCommitInterval: 5000,
      eachMessage: processMessage,
    });

    console.log(
      '\n🚀 Realtime service is running and ready to broadcast logs...\n'
    );
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
};

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
export const shutdown = async () => {
  console.log('\n⏹️  Shutting down gracefully...');

  // Log final metrics
  console.log('\n📊 Final Metrics:');
  console.log(`  - Messages received: ${metrics.messagesReceived}`);
  console.log(`  - Messages broadcast: ${metrics.messagesBroadcast}`);
  console.log(`  - Connected clients: ${metrics.connectedClients}`);
  console.log(`  - Errors: ${metrics.errors}`);
  console.log(
    `  - Uptime: ${Math.floor((Date.now() - metrics.startTime.getTime()) / 1000)}s`
  );

  try {
    await consumer.disconnect();
    console.log('✅ Kafka consumer disconnected');
  } catch (error) {
    console.error('❌ Error disconnecting consumer:', error);
  }

  process.exit(0);
};

// ============================================
// SIGNAL HANDLERS
// ============================================
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  shutdown();
});
