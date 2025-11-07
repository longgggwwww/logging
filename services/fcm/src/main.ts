import { initializeFCMService, shutdown } from './app.js';
import { logMetrics } from './metrics.js';

// ============================================
// GRACEFUL SHUTDOWN HANDLER
// ============================================
const handleShutdown = async () => {
  console.log('\n⏹️  Shutting down gracefully...');
  logMetrics();
  await shutdown();
};

// ============================================
// SIGNAL HANDLERS
// ============================================
process.on('SIGTERM', handleShutdown);
process.on('SIGINT', handleShutdown);

// ============================================
// START APPLICATION
// ============================================
initializeFCMService().catch((error) => {
  console.error('❌ Failed to start FCM service:', error);
  process.exit(1);
});
