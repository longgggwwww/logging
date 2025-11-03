import { run } from './src/main.js';

// ============================================
// START THE SERVICE
// ============================================
run().catch((error) => {
  console.error('💥 Failed to start realtime service:', error);
  process.exit(1);
});
