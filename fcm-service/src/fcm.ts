import { admin } from './firebase.js';
import { CONFIG } from './config.js';
import { metrics } from './metrics.js';
import { retryWithBackoff } from './retry.js';
import { shouldSendNotification } from './filter.js';
import { LogData, MessageMetadata, FCMDataPayload } from './types.js';

// ============================================
// FCM NOTIFICATION WITH RETRY
// ============================================
export const sendFCMNotification = async (
  logData: LogData,
  metadata: Partial<MessageMetadata> = {}
): Promise<boolean> => {
  // Filter: Check if notification should be sent
  if (!shouldSendNotification(logData)) {
    metrics.filtered++;
    return false;
  }

  // Check if there are topics or device tokens
  const hasTopics = CONFIG.fcm.topics && CONFIG.fcm.topics.length > 0;
  const hasDeviceTokens =
    CONFIG.fcm.deviceTokens && CONFIG.fcm.deviceTokens.length > 0;

  if (!hasTopics && !hasDeviceTokens) {
    console.warn(
      '⚠️  Warning: No FCM topics or device tokens configured. Skipping FCM notification.'
    );
    return false;
  }

  // Determine emoji and priority based on type
  const typeEmojis = {
    ERROR: '🚨',
    WARNING: '⚠️',
    INFO: 'ℹ️',
    SUCCESS: '✅',
    DEBUG: '🔍',
  };

  const typePriority = {
    ERROR: 'high',
    WARNING: 'high',
    INFO: 'normal',
    SUCCESS: 'normal',
    DEBUG: 'normal',
  };

  const emoji =
    (logData.type && typeEmojis[logData.type as keyof typeof typeEmojis]) ||
    '🚨';
  const priority =
    (logData.type && typePriority[logData.type as keyof typeof typePriority]) ||
    'high';

  // Create notification title according to new structure
  const title = `${emoji} ${logData.type || 'ERROR'} - ${logData.projectName || 'Unknown Project'}`;

  // Create notification body with new information
  let body = '';

  // Add function and method
  if (logData.function) {
    body += `⚡ ${logData.function}`;
  }
  if (logData.method) {
    body += ` [${logData.method}]`;
  }

  // Add response message
  if (logData.response && logData.response.message) {
    body += `\n💬 ${logData.response.message}`;
  }

  // Add response code
  if (logData.response && logData.response.code) {
    const codeEmoji =
      logData.response.code >= 500
        ? '🔴'
        : logData.response.code >= 400
          ? '🟠'
          : '🟢';
    body += `\n${codeEmoji} Code: ${logData.response.code}`;
  }

  // Add user if available
  if (logData.createdBy && logData.createdBy.fullname) {
    body += `\n👤 ${logData.createdBy.fullname}`;
  }

  // Add latency
  if (logData.latency) {
    body += `\n⏱️ ${logData.latency}ms`;
  }

  // Limit body length (FCM has 4KB limit for entire payload)
  if (body.length > 200) {
    body = body.slice(0, 197) + '...';
  }

  // Create data payload with detailed information according to new structure
  const dataPayload: FCMDataPayload = {
    projectName: logData.projectName || 'N/A',
    function: logData.function || 'N/A',
    method: logData.method || 'N/A',
    type: logData.type || 'ERROR',
    createdAt: logData.createdAt || new Date().toISOString(),
    latency: String(logData.latency || 0),
    responseCode: String(logData.response?.code || 'N/A'),
    responseMessage: logData.response?.message || 'No message',
    kafkaPartition: String(metadata.partition || 'N/A'),
    kafkaOffset: String(metadata.offset || 'N/A'),
    page: '/log',
  };

  // Add optional fields if available
  if (logData.createdBy) {
    dataPayload.createdBy = JSON.stringify(logData.createdBy);
  }
  if (logData.request?.url) {
    dataPayload.url = logData.request.url;
  }
  if (logData.consoleLog) {
    // Limit consoleLog because FCM has size limits
    dataPayload.consoleLog = logData.consoleLog.slice(0, 500);
  }
  if (logData.additionalData) {
    dataPayload.additionalData = JSON.stringify(logData.additionalData).slice(
      0,
      500
    );
  }

  // Create FCM message (base message without token/topic)
  const baseMessage = {
    notification: {
      title: title,
      body: body,
    },
    data: dataPayload,
    android: {
      priority: priority as 'high' | 'normal',
      notification: {
        channelId: 'error_logs',
        priority: (priority === 'high' ? 'high' : 'default') as
          | 'high'
          | 'default'
          | 'min'
          | 'low'
          | 'max',
        defaultSound: true,
        defaultVibrateTimings: true,
        color:
          logData.type === 'ERROR'
            ? '#FF0000'
            : logData.type === 'WARNING'
              ? '#FFA500'
              : logData.type === 'SUCCESS'
                ? '#00FF00'
                : '#0099FF',
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
    },
  };

  const results = {
    success: 0,
    failure: 0,
    errors: [] as { target: string; error: string }[],
  };

  // Send notification to FCM topics (priority)
  if (hasTopics) {
    console.log(`📡 Sending to ${CONFIG.fcm.topics.length} FCM topic(s)...`);

    for (const topic of CONFIG.fcm.topics) {
      try {
        await retryWithBackoff(async () => {
          const response = await admin.messaging().send({
            ...baseMessage,
            topic: topic,
          });
          return response;
        });

        results.success++;
        console.log(`✅ FCM notification sent successfully to topic: ${topic}`);
      } catch (error) {
        results.failure++;
        results.errors.push({
          target: `topic:${topic}`,
          error: (error as Error).message,
        });
        console.error(
          `❌ Failed to send FCM to topic ${topic}:`,
          (error as Error).message
        );
      }
    }
  }

  // Send notification to device tokens (if configured)
  if (hasDeviceTokens) {
    console.log(
      `📱 Sending to ${CONFIG.fcm.deviceTokens.length} device token(s)...`
    );

    for (const token of CONFIG.fcm.deviceTokens) {
      try {
        await retryWithBackoff(async () => {
          const response = await admin.messaging().send({
            ...baseMessage,
            token: token,
          });
          return response;
        });

        results.success++;
        console.log(
          `✅ FCM notification sent successfully to token: ${token.slice(0, 20)}...`
        );
      } catch (error) {
        results.failure++;
        results.errors.push({
          target: `token:${token.slice(0, 20)}...`,
          error: (error as Error).message,
        });
        console.error(
          `❌ Failed to send FCM to token ${token.slice(0, 20)}...:`,
          (error as Error).message
        );
      }
    }
  }

  // Log results
  console.log(
    `📊 FCM Results: ${results.success} success, ${results.failure} failed`
  );

  if (results.success > 0) {
    metrics.fcmSuccess += results.success;
    return true;
  } else {
    metrics.fcmErrors += results.failure;
    throw new Error(`All FCM sends failed: ${JSON.stringify(results.errors)}`);
  }
};
