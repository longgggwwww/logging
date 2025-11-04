import { CONFIG } from './config.js';
import { shouldSendNotification } from './filter.js';
import { admin, isFirebaseReady } from './firebase.js';
import { metrics } from './metrics.js';
import { FCMDataPayload, LogData } from './types.js';

// ============================================
// FCM NOTIFICATION (REALTIME MODE - NO RETRY)
// ============================================
export const sendFCMNotification = async (
  logData: LogData,
  metadata: { partition?: number; offset?: string } = {}
): Promise<boolean> => {
  // Check if Firebase is initialized
  if (!isFirebaseReady()) {
    console.warn('⚠️  Firebase not initialized. Skipping FCM notification.');
    metrics.filtered++;
    return false;
  }

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

  // Create data payload with detailed information according to Log model structure
  const dataPayload: FCMDataPayload = {
    id: logData.id || 'null',
    projectId: logData.projectId || 'null',
    functionId: logData.functionId || 'null',
    method: logData.method || 'null',
    type: logData.type || 'ERROR',
    requestHeaders: logData.requestHeaders
      ? JSON.stringify(logData.requestHeaders)
      : 'null',
    requestUserAgent: logData.requestUserAgent || 'null',
    requestUrl: logData.requestUrl || 'null',
    requestParams: logData.requestParams
      ? JSON.stringify(logData.requestParams)
      : 'null',
    requestBody: logData.requestBody
      ? JSON.stringify(logData.requestBody)
      : 'null',
    responseCode:
      logData.responseCode !== undefined
        ? String(logData.responseCode)
        : 'null',
    responseSuccess:
      logData.responseSuccess !== undefined
        ? String(logData.responseSuccess)
        : 'null',
    responseMessage: logData.responseMessage || 'null',
    responseData: logData.responseData
      ? JSON.stringify(logData.responseData)
      : 'null',
    consoleLog: logData.consoleLog || 'null',
    additionalData: logData.additionalData
      ? JSON.stringify(logData.additionalData)
      : 'null',
    latency: logData.latency !== undefined ? String(logData.latency) : 'null',
    createdById: logData.createdById || 'null',
    createdByFullname: logData.createdByFullname || 'null',
    createdByEmplCode: logData.createdByEmplCode || 'null',
    createdAt: logData.createdAt || 'null',
    updatedAt: logData.updatedAt || 'null',
    kafkaPartition: String(metadata.partition || 'null'),
    kafkaOffset: String(metadata.offset || 'null'),
    page: '/log',
  };

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
        // Realtime mode: Send once, no retry
        await admin.messaging().send({
          ...baseMessage,
          topic: topic,
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
        // Realtime mode: Send once, no retry
        await admin.messaging().send({
          ...baseMessage,
          token: token,
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
