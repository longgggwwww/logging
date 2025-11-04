import * as dotenv from 'dotenv';
import { initializeBot, shutdown } from './bot.js';

// Load environment variables
dotenv.config();

// ============================================
// START BOT
// ============================================
async function start() {
  try {
    await initializeBot();
    console.log('🚀 Discord bot initialized successfully');
  } catch (err) {
    console.error('❌ Failed to initialize bot:', err);
    process.exit(1);
  }
}

// ============================================
// SIGNAL HANDLERS
// ============================================
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();
