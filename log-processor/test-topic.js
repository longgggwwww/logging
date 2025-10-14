// Test script to verify topic configuration
const topic = process.env.KAFKA_TOPIC || 'error-logs';
console.log('Topic should be:', topic);
console.log('Expected: error-logs');
console.log('Match:', topic === 'error-logs' ? '✅ YES' : '❌ NO');
