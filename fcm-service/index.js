const { Kafka } = require('kafkajs');
const admin = require('firebase-admin');
const path = require('path');

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
  kafka: {
    clientId: 'fcm-error-logs-consumer',
    brokers: ['localhost:19092', 'localhost:29092', 'localhost:39092'],
    connectionTimeout: 30000,
    requestTimeout: 30000
  },
  fcm: {
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    timeout: 10000,
    // Danh sách device tokens - cập nhật các token thực tế của bạn
    deviceTokens: [
      // 'DEVICE_TOKEN_1',
      // 'DEVICE_TOKEN_2',
      // Thêm các device token ở đây
    ],
    // Filter settings - chỉ gửi thông báo cho lỗi nghiêm trọng
    filter: {
      enabled: true,
      minSeverityCode: 500, // Chỉ gửi khi response code >= 500
      criticalTypes: ['ERROR'] // Chỉ gửi cho type ERROR
    }
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
// FIREBASE ADMIN SETUP
// ============================================
try {
  const serviceAccount = require(path.join(__dirname, 'service-account.json'));
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin:', error.message);
  process.exit(1);
}

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
  groupId: 'fcm-group',
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
  fcmErrors: 0,
  fcmSuccess: 0,
  filtered: 0 // Messages filtered out (not severe enough)
};

const logMetrics = () => {
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

// ============================================
// RETRY MECHANISM
// ============================================
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const retryWithBackoff = async (fn, maxRetries = CONFIG.fcm.maxRetries, baseDelay = CONFIG.fcm.retryDelay) => {
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
// SEVERITY FILTER
// ============================================
const shouldSendNotification = (logData) => {
  // Nếu filter không được enable, gửi tất cả
  if (!CONFIG.fcm.filter.enabled) {
    return true;
  }

  // Chỉ gửi cho ERROR type
  if (!CONFIG.fcm.filter.criticalTypes.includes(logData.type)) {
    console.log(`🔕 Filtered: Type '${logData.type}' is not critical`);
    return false;
  }

  // Kiểm tra response code
  const responseCode = logData.response?.code;
  if (!responseCode) {
    console.log('⚠️  No response code found, sending notification anyway');
    return true;
  }

  // Chỉ gửi khi response code >= minSeverityCode (500)
  if (responseCode < CONFIG.fcm.filter.minSeverityCode) {
    console.log(`🔕 Filtered: Response code ${responseCode} < ${CONFIG.fcm.filter.minSeverityCode} (not severe enough)`);
    return false;
  }

  console.log(`✅ Severity check passed: ${logData.type} with code ${responseCode}`);
  return true;
};

// ============================================
// FCM NOTIFICATION WITH RETRY
// ============================================
const sendFCMNotification = async (logData, metadata = {}) => {
  // Filter: Kiểm tra xem có nên gửi notification không
  if (!shouldSendNotification(logData)) {
    metrics.filtered++;
    return false;
  }

  // Kiểm tra có device tokens không
  if (!CONFIG.fcm.deviceTokens || CONFIG.fcm.deviceTokens.length === 0) {
    console.warn('⚠️  Warning: No FCM device tokens configured. Skipping FCM notification.');
    return false;
  }

  // Xác định emoji và priority dựa trên type
  const typeEmojis = {
    'ERROR': '🚨',
    'WARNING': '⚠️',
    'INFO': 'ℹ️',
    'SUCCESS': '✅',
    'DEBUG': '🔍'
  };
  
  const typePriority = {
    'ERROR': 'high',
    'WARNING': 'high',
    'INFO': 'normal',
    'SUCCESS': 'normal',
    'DEBUG': 'normal'
  };
  
  const emoji = typeEmojis[logData.type] || '🚨';
  const priority = typePriority[logData.type] || 'high';
  
  // Tạo notification title theo cấu trúc mới
  const title = `${emoji} ${logData.type || 'ERROR'} - ${logData.projectName || 'Unknown Project'}`;
  
  // Tạo notification body với thông tin mới
  let body = '';
  
  // Thêm function và method
  if (logData.function) {
    body += `⚡ ${logData.function}`;
  }
  if (logData.method) {
    body += ` [${logData.method}]`;
  }
  
  // Thêm response message
  if (logData.response && logData.response.message) {
    body += `\n💬 ${logData.response.message}`;
  }
  
  // Thêm response code
  if (logData.response && logData.response.code) {
    const codeEmoji = logData.response.code >= 500 ? '🔴' : logData.response.code >= 400 ? '🟠' : '🟢';
    body += `\n${codeEmoji} Code: ${logData.response.code}`;
  }
  
  // Thêm user nếu có
  if (logData.createdBy && logData.createdBy.fullname) {
    body += `\n� ${logData.createdBy.fullname}`;
  }
  
  // Thêm latency
  if (logData.latency) {
    body += `\n⏱️ ${logData.latency}ms`;
  }
  
  // Giới hạn độ dài body (FCM có giới hạn 4KB cho toàn bộ payload)
  if (body.length > 200) {
    body = body.slice(0, 197) + '...';
  }
  
  // Tạo data payload với thông tin chi tiết theo cấu trúc mới
  const dataPayload = {
    projectName: logData.projectName || 'N/A',
    function: logData.function || 'N/A',
    method: logData.method || 'N/A',
    type: logData.type || 'ERROR',
    createdAt: logData.createdAt || new Date().toISOString(),
    latency: String(logData.latency || 0),
    responseCode: String(logData.response?.code || 'N/A'),
    responseMessage: logData.response?.message || 'No message',
    kafkaPartition: String(metadata.partition || 'N/A'),
    kafkaOffset: String(metadata.offset || 'N/A')
  };
  
  // Thêm các trường optional nếu có
  if (logData.createdBy) {
    dataPayload.createdBy = JSON.stringify(logData.createdBy);
  }
  if (logData.request?.url) {
    dataPayload.url = logData.request.url;
  }
  if (logData.consoleLog) {
    // Giới hạn consoleLog vì FCM có giới hạn kích thước
    dataPayload.consoleLog = logData.consoleLog.slice(0, 500);
  }
  if (logData.additionalData) {
    dataPayload.additionalData = JSON.stringify(logData.additionalData).slice(0, 500);
  }

  // Tạo FCM message
  const message = {
    notification: {
      title: title,
      body: body
    },
    data: dataPayload,
    android: {
      priority: priority,
      notification: {
        channelId: 'error_logs',
        priority: priority,
        defaultSound: true,
        defaultVibrateTimings: true,
        color: logData.type === 'ERROR' ? '#FF0000' : 
               logData.type === 'WARNING' ? '#FFA500' : 
               logData.type === 'SUCCESS' ? '#00FF00' : '#0099FF'
      }
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1
        }
      }
    }
  };

  // Gửi notification đến tất cả device tokens
  const results = {
    success: 0,
    failure: 0,
    errors: []
  };

  for (const token of CONFIG.fcm.deviceTokens) {
    try {
      await retryWithBackoff(async () => {
        const response = await admin.messaging().send({
          ...message,
          token: token
        });
        return response;
      });
      
      results.success++;
      console.log(`✅ FCM notification sent successfully to token: ${token.slice(0, 20)}...`);
    } catch (error) {
      results.failure++;
      results.errors.push({
        token: token.slice(0, 20) + '...',
        error: error.message
      });
      console.error(`❌ Failed to send FCM to token ${token.slice(0, 20)}...:`, error.message);
    }
  }

  // Log kết quả
  console.log(`📱 FCM Results: ${results.success} success, ${results.failure} failed`);
  
  if (results.success > 0) {
    metrics.fcmSuccess += results.success;
    return true;
  } else {
    metrics.fcmErrors += results.failure;
    throw new Error(`All FCM sends failed: ${JSON.stringify(results.errors)}`);
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
    if (!logData.projectName) {
      console.warn('⚠️  Warning: Message missing "projectName" field');
      logData.projectName = 'Unknown';
    }
    if (!logData.function) {
      console.warn('⚠️  Warning: Message missing "function" field');
    }
    if (!logData.type) {
      console.warn('⚠️  Warning: Message missing "type" field, defaulting to ERROR');
      logData.type = 'ERROR';
    }
    if (!logData.method) {
      console.warn('⚠️  Warning: Message missing "method" field');
    }
    if (!logData.createdAt) {
      console.warn('⚠️  Warning: Message missing "createdAt" field');
      logData.createdAt = new Date().toISOString();
    }

    // Metadata cho tracking
    const fcmMetadata = {
      partition,
      offset: message.offset
    };

    // Send FCM notification with retry
    await sendFCMNotification(logData, fcmMetadata);
    
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

    console.log('\n🚀 FCM Consumer is running and ready to process messages...\n');

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
