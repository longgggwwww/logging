import { run } from './src/main.js';

// ============================================
// START THE SERVICE
// ============================================
run().catch((err) => {
  console.error('💥 Failed to start realtime service:', err);
  process.exit(1);
});
