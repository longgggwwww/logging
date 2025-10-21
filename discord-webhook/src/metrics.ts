import { Metrics } from './types.js';

export const metrics: Metrics = {
  processed: 0,
  failed: 0,
  retriedSuccessfully: 0,
  sentToDLQ: 0,
  discordErrors: 0,
};

export const logMetrics = (): void => {
  console.log('\n📊 METRICS:');
  console.log(`   ✅ Processed: ${metrics.processed}`);
  console.log(`   ❌ Failed: ${metrics.failed}`);
  console.log(`   🔄 Retried Successfully: ${metrics.retriedSuccessfully}`);
  console.log(`   ⚰️  Sent to DLQ: ${metrics.sentToDLQ}`);
  console.log(`   🚨 Discord Errors: ${metrics.discordErrors}\n`);
};

// Log metrics every 30 seconds
setInterval(logMetrics, 30000);
