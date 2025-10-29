import { Metrics } from './types.js';

// ============================================
// METRICS & MONITORING
// ============================================
export const metrics: Metrics = {
  processed: 0,
  failed: 0,
  retriedSuccessfully: 0,
  sentToDLQ: 0,
  fcmErrors: 0,
  fcmSuccess: 0,
  filtered: 0, // Messages filtered out (not severe enough)
};

export const logMetrics = () => {
  console.log('\n📊 METRICS:');
  console.log(`   ✅ Processed: ${metrics.processed}`);
  console.log(`   ❌ Failed: ${metrics.failed}`);
  console.log(`   🔄 Retried Successfully: ${metrics.retriedSuccessfully}`);
  console.log(`   ⚰️  Sent to DLQ: ${metrics.sentToDLQ}`);
  console.log(`   📱 FCM Success: ${metrics.fcmSuccess}`);
  console.log(`   📵 FCM Errors: ${metrics.fcmErrors}`);
  console.log(`   🔕 Filtered (Not Severe): ${metrics.filtered}\n`);
};

// Log metrics every 30 seconds
setInterval(logMetrics, 30000);
