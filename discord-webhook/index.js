const { Kafka } = require('kafkajs');
const axios = require('axios');

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
  kafka: {
    clientId: 'error-logs-consumer',
    brokers: ['localhost:19092', 'localhost:29092', 'localhost:39092'],
    connectionTimeout: 30000,
    requestTimeout: 30000
  },
  discord: {
    webhookUrl: 'https://discord.com/api/webhooks/1425882193229643818/8nmQfxFdkFYsvcDuyAw0RtU6OSVbqJrITmxLJscQeo5Fxq9DS2TVaFscb3FLy64yZAhP',
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    timeout: 5000
  },
  processing: {
    maxRetries: 3,
    retryDelay: 2000
  },
  topics: {
    main: 'error-logs',
    deadLetter: 'error-logs-dlq',
    retry: 'error-logs-retry'
  }
};

// ============================================
// KAFKA SETUP
// ============================================
const kafka = new Kafka({
  clientId: CONFIG.kafka.clientId,
  brokers: CONFIG.kafka.brokers,
  connectionTimeout: CONFIG.kafka.connectionTimeout,
  requestTimeout: CONFIG.kafka.requestTimeout,
  retry: {
    initialRetryTime: 300,
    retries: 8
  }
});

const consumer = kafka.consumer({ 
  groupId: 'discord-group',
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
  maxWaitTimeInMs: 5000
});

const producer = kafka.producer({
  allowAutoTopicCreation: true,
  transactionTimeout: 30000
});

// ============================================
// METRICS & MONITORING
// ============================================
const metrics = {
  processed: 0,
  failed: 0,
  retriedSuccessfully: 0,
  sentToDLQ: 0,
  discordErrors: 0
};

const logMetrics = () => {
  console.log('\n📊 METRICS:');
  console.log(`   ✅ Processed: ${metrics.processed}`);
  console.log(`   ❌ Failed: ${metrics.failed}`);
  console.log(`   🔄 Retried Successfully: ${metrics.retriedSuccessfully}`);
  console.log(`   ⚰️  Sent to DLQ: ${metrics.sentToDLQ}`);
  console.log(`   � Discord Errors: ${metrics.discordErrors}\n`);
};

// Log metrics every 30 seconds
setInterval(logMetrics, 30000);

// ============================================
// RETRY MECHANISM
// ============================================
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const retryWithBackoff = async (fn, maxRetries = CONFIG.discord.maxRetries, baseDelay = CONFIG.discord.retryDelay) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
      console.log(`⏳ Retry attempt ${attempt}/${maxRetries} after ${delay}ms...`);
      await sleep(delay);
    }
  }
};

// ============================================
// DISCORD WEBHOOK WITH RETRY
// ============================================
const sendToDiscord = async (logData, metadata = {}) => {
  // Xác định màu sắc dựa trên level
  const levelColors = {
    'ERROR': 0xFF0000,   // Red
    'WARNING': 0xFFA500, // Orange
    'INFO': 0x0099FF     // Blue
  };
  
  const color = levelColors[logData.level] || 0xFF0000;
  
  // Tạo emoji dựa trên level
  const levelEmojis = {
    'ERROR': '🚨',
    'WARNING': '⚠️',
    'INFO': 'ℹ️'
  };
  
  const emoji = levelEmojis[logData.level] || '🚨';
  
  // Tạo fields cho embed
  const fields = [
    { name: '🆔 ID', value: logData.id || 'N/A', inline: true },
    { name: '🕐 Timestamp', value: logData.timestamp || new Date().toISOString(), inline: true },
    { name: '📊 Level', value: logData.level || 'ERROR', inline: true },
    { name: '🔧 Service', value: logData.service || 'Unknown', inline: true }
  ];
  
  // Thêm user nếu có
  if (logData.user) {
    fields.push({ name: '👤 User', value: logData.user, inline: true });
  }
  
  // Thêm requestId nếu có
  if (logData.requestId) {
    fields.push({ name: '🔗 Request ID', value: logData.requestId, inline: true });
  }
  
  // Thêm additionalData nếu có
  if (logData.additionalData && Object.keys(logData.additionalData).length > 0) {
    fields.push({ 
      name: '📦 Additional Data', 
      value: '```json\n' + JSON.stringify(logData.additionalData, null, 2).slice(0, 1000) + '\n```',
      inline: false 
    });
  }
  
  // Tạo description với message và stackTrace
  let description = logData.message || 'No message provided';
  
  if (logData.stackTrace) {
    // Giới hạn độ dài stackTrace để không vượt quá giới hạn Discord
    const truncatedStack = logData.stackTrace.length > 500 
      ? logData.stackTrace.slice(0, 500) + '...\n[Truncated]'
      : logData.stackTrace;
    
    description += '\n\n**Stack Trace:**\n```\n' + truncatedStack + '\n```';
  }
  
  const payload = {
    embeds: [{
      title: `${emoji} ${logData.level || 'ERROR'} - ${logData.service || 'Unknown Service'}`,
      description: description,
      color: color,
      fields: fields,
      footer: { 
        text: `Kafka Partition: ${metadata.partition || 'N/A'} | Offset: ${metadata.offset || 'N/A'}` 
      },
      timestamp: new Date().toISOString()
    }]
  };

  try {
    await retryWithBackoff(async () => {
      const response = await axios.post(CONFIG.discord.webhookUrl, payload, {
        timeout: CONFIG.discord.timeout,
        headers: { 'Content-Type': 'application/json' }
      });
      return response;
    });
    
    console.log('✅ Đã gửi cảnh báo đến Discord');
    return true;
  } catch (error) {
    metrics.discordErrors++;
    console.error('❌ Lỗi gửi đến Discord sau', CONFIG.discord.maxRetries, 'lần thử:', 
      error.response?.data || error.message);
    throw error;
  }
};

// ============================================
// DEAD LETTER QUEUE (DLQ)
// ============================================
const sendToDLQ = async (originalMessage, error, metadata) => {
  try {
    const dlqMessage = {
      originalTopic: metadata.topic,
      originalPartition: metadata.partition,
      originalOffset: metadata.offset,
      error: {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      },
      originalData: originalMessage,
      attemptCount: metadata.attemptCount || 0,
      lastAttemptTime: new Date().toISOString()
    };

    await producer.send({
      topic: CONFIG.topics.deadLetter,
      messages: [{
        key: `dlq-${metadata.offset}`,
        value: JSON.stringify(dlqMessage),
        headers: {
          'original-topic': metadata.topic,
          'error-type': error.name,
          'failed-at': new Date().toISOString()
        }
      }]
    });

    metrics.sentToDLQ++;
    console.log(`⚰️  Message sent to DLQ: ${CONFIG.topics.deadLetter}`);
    return true;
  } catch (dlqError) {
    console.error('❌ CRITICAL: Failed to send to DLQ:', dlqError.message);
    return false;
  }
};

// ============================================
// RETRY QUEUE
// ============================================
const sendToRetryQueue = async (originalMessage, metadata, attemptCount) => {
  try {
    const retryMessage = {
      ...originalMessage,
      _retry: {
        attemptCount: attemptCount + 1,
        lastAttempt: new Date().toISOString(),
        nextRetryAfter: Date.now() + (CONFIG.processing.retryDelay * attemptCount)
      }
    };

    await producer.send({
      topic: CONFIG.topics.retry,
      messages: [{
        key: `retry-${metadata.offset}`,
        value: JSON.stringify(retryMessage),
        headers: {
          'retry-count': String(attemptCount + 1),
          'original-topic': metadata.topic
        }
      }]
    });

    console.log(`🔄 Message sent to retry queue (attempt ${attemptCount + 1}/${CONFIG.processing.maxRetries})`);
    return true;
  } catch (retryError) {
    console.error('❌ Failed to send to retry queue:', retryError.message);
    return false;
  }
};

// ============================================
// MESSAGE PROCESSOR
// ============================================
const processMessage = async ({ topic, partition, message }) => {
  const metadata = {
    topic,
    partition,
    offset: message.offset,
    timestamp: message.timestamp
  };

  let logData;
  let attemptCount = 0;

  try {
    // Parse message
    const rawMessage = message.value.toString();
    logData = JSON.parse(rawMessage);
    
    // Check if this is a retry message
    if (logData._retry) {
      attemptCount = logData._retry.attemptCount || 0;
      console.log(`🔄 Processing retry message (attempt ${attemptCount})`);
      
      // Check if we should delay processing
      if (logData._retry.nextRetryAfter && Date.now() < logData._retry.nextRetryAfter) {
        const delay = logData._retry.nextRetryAfter - Date.now();
        console.log(`⏸️  Delaying retry for ${delay}ms`);
        await sleep(delay);
      }
    }

    // Validate message structure theo cấu trúc mới
    if (!logData.id) {
      console.warn('⚠️  Warning: Message missing "id" field');
    }
    if (!logData.message) {
      throw new Error('Invalid message format: missing "message" field');
    }
    if (!logData.level) {
      console.warn('⚠️  Warning: Message missing "level" field, defaulting to ERROR');
      logData.level = 'ERROR';
    }
    if (!logData.service) {
      console.warn('⚠️  Warning: Message missing "service" field');
      logData.service = 'Unknown';
    }

    // Metadata cho tracking
    const discordMetadata = {
      partition,
      offset: message.offset
    };

    // Send to Discord with retry
    await sendToDiscord(logData, discordMetadata);
    
    metrics.processed++;
    if (attemptCount > 0) {
      metrics.retriedSuccessfully++;
    }

  } catch (error) {
    metrics.failed++;
    console.error(`❌ Error processing message (attempt ${attemptCount + 1}):`, error.message);

    // Decide what to do based on error type and retry count
    if (attemptCount < CONFIG.processing.maxRetries) {
      // Send to retry queue
      const retrySent = await sendToRetryQueue(logData || {}, metadata, attemptCount);
      if (!retrySent) {
        // If retry queue fails, send to DLQ
        await sendToDLQ(message.value.toString(), error, { ...metadata, attemptCount });
      }
    } else {
      // Max retries reached, send to DLQ
      console.error(`❌ Max retries (${CONFIG.processing.maxRetries}) reached for message`);
      await sendToDLQ(message.value.toString(), error, { ...metadata, attemptCount });
    }

    // Don't throw error to prevent consumer from crashing
    // Message offset will be committed, preventing reprocessing
  }
};

// ============================================
// MAIN CONSUMER
// ============================================
const run = async () => {
  try {
    // Connect producer first (needed for DLQ and retry)
    await producer.connect();
    console.log('✅ Producer connected');

    // Connect consumer
    await consumer.connect();
    console.log('✅ Consumer connected');

    // Subscribe to topics
    await consumer.subscribe({ 
      topics: [CONFIG.topics.main, CONFIG.topics.retry], 
      fromBeginning: false 
    });
    console.log(`✅ Subscribed to topics: ${CONFIG.topics.main}, ${CONFIG.topics.retry}`);

    // Run consumer
    await consumer.run({
      autoCommit: true,
      autoCommitInterval: 5000,
      eachMessage: processMessage
    });

    console.log('\n🚀 Consumer is running and ready to process messages...\n');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
};

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
const shutdown = async () => {
  console.log('\n⏹️  Shutting down gracefully...');
  logMetrics();
  
  try {
    await consumer.disconnect();
    await producer.disconnect();
    console.log('✅ Disconnected from Kafka');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// ============================================
// START APPLICATION
// ============================================
run().catch(console.error);