import { LogData } from './types.js';
import { CONFIG } from './config.js';

// ============================================
// SEVERITY FILTER
// ============================================
export const shouldSendNotification = (logData: LogData): boolean => {
  // If filter is not enabled, send all
  if (!CONFIG.fcm.filter.enabled) {
    return true;
  }

  // Only send for ERROR type
  if (
    !logData.type ||
    !CONFIG.fcm.filter.criticalTypes.includes(logData.type)
  ) {
    console.log(
      `🔕 Filtered: Type '${logData.type || 'undefined'}' is not critical`
    );
    return false;
  }

  // Check response code
  const responseCode = logData.response?.code;
  if (!responseCode) {
    console.log('⚠️  No response code found, sending notification anyway');
    return true;
  }

  // Only send when response code >= minSeverityCode (500)
  if (responseCode < CONFIG.fcm.filter.minSeverityCode) {
    console.log(
      `🔕 Filtered: Response code ${responseCode} < ${CONFIG.fcm.filter.minSeverityCode} (not severe enough)`
    );
    return false;
  }

  console.log(
    `✅ Severity check passed: ${logData.type} with code ${responseCode}`
  );
  return true;
};
