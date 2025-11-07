import { run } from './src/main.js';

run().catch((err) => {
  console.error('💥 Failed to start realtime service:', err);
  process.exit(1);
});
