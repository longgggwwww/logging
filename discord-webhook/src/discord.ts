import axios from 'axios';
import { CONFIG } from './config.js';
import { LogData } from './types.js';
import { metrics } from './metrics.js';

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = CONFIG.discord.maxRetries,
  baseDelay: number = CONFIG.discord.retryDelay
): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
      console.log(
        `⏳ Retry attempt ${attempt}/${maxRetries} after ${delay}ms...`
      );
      await sleep(delay);
    }
  }
  throw new Error('Retry failed');
};

export const sendToDiscord = async (
  logData: LogData,
  metadata: { partition?: number; offset?: string } = {}
): Promise<boolean> => {
  // Define color based on type
  const typeColors: Record<string, number> = {
    ERROR: 0xff0000, // Red
    WARNING: 0xffa500, // Orange
    INFO: 0x0099ff, // Blue
    SUCCESS: 0x00ff00, // Green
    DEBUG: 0x808080, // Gray
  };

  const color = typeColors[logData.type || 'ERROR'] || 0xff0000;

  // Create emoji based on type
  const typeEmojis: Record<string, string> = {
    ERROR: '🚨',
    WARNING: '⚠️',
    INFO: 'ℹ️',
    SUCCESS: '✅',
    DEBUG: '🔍',
  };

  const emoji = typeEmojis[logData.type || 'ERROR'] || '🚨';

  // Create fields for embed
  const fields: Array<{ name: string; value: string; inline: boolean }> = [
    { name: '📱 Project', value: logData.projectName || 'N/A', inline: true },
    { name: '⚡ Function', value: logData.function || 'N/A', inline: true },
    { name: '🔧 Method', value: logData.method || 'N/A', inline: true },
    { name: '📊 Type', value: logData.type || 'ERROR', inline: true },
    {
      name: '🕒 Created At',
      value: logData.createdAt || new Date().toISOString(),
      inline: true,
    },
    {
      name: '⏱️ Latency',
      value: logData.latency !== undefined ? `${logData.latency}ms` : 'N/A',
      inline: true,
    },
  ];

  // Add user information (createdBy) if available
  if (logData.createdBy) {
    const userInfo =
      logData.createdBy.fullname || logData.createdBy.id || 'N/A';
    const emplCode = logData.createdBy.emplCode
      ? ` (${logData.createdBy.emplCode})`
      : '';
    fields.push({
      name: '👤 Created By',
      value: userInfo + emplCode,
      inline: true,
    });
  }

  // Add response code if available
  if (logData.response && logData.response.code !== undefined) {
    const statusEmoji = logData.response.success ? '✅' : '❌';
    fields.push({
      name: '📡 Response Code',
      value: `${statusEmoji} ${logData.response.code}`,
      inline: true,
    });
  }

  // Add request URL if available
  if (logData.request && logData.request.url) {
    fields.push({
      name: '🌐 URL',
      value: logData.request.url,
      inline: false,
    });
  }

  // Create description with response message and consoleLog
  let description = '';

  if (logData.response && logData.response.message) {
    description += `**Message:** ${logData.response.message}\n`;
  }

  if (logData.consoleLog) {
    // Limit consoleLog length to avoid exceeding Discord limits
    const truncatedLog =
      logData.consoleLog.length > 800
        ? logData.consoleLog.slice(0, 800) + '...\n[Truncated]'
        : logData.consoleLog;

    description += '\n**Console Log:**\n```\n' + truncatedLog + '\n```';
  }

  // Include additionalData if present
  if (
    logData.additionalData &&
    Object.keys(logData.additionalData).length > 0
  ) {
    const additionalDataStr = JSON.stringify(logData.additionalData, null, 2);
    const truncatedData =
      additionalDataStr.length > 400
        ? additionalDataStr.slice(0, 400) + '...\n[Truncated]'
        : additionalDataStr;

    description +=
      '\n**Additional Data:**\n```json\n' + truncatedData + '\n```';
  }

  if (!description) {
    description = 'No detailed information available';
  }

  const payload = {
    embeds: [
      {
        title: `${emoji} ${logData.type || 'ERROR'} - ${
          logData.projectName || 'Unknown Project'
        } - ${logData.function || 'Unknown Function'}`,
        description: description,
        color: color,
        fields: fields,
        footer: {
          text: `Kafka Partition: ${metadata.partition || 'N/A'} | Offset: ${
            metadata.offset || 'N/A'
          }`,
        },
        timestamp: logData.createdAt || new Date().toISOString(),
      },
    ],
  };

  try {
    await retryWithBackoff(async () => {
      const response = await axios.post(CONFIG.discord.webhookUrl, payload, {
        timeout: CONFIG.discord.timeout,
        headers: { 'Content-Type': 'application/json' },
      });
      return response;
    });

    console.log('✅ Đã gửi cảnh báo đến Discord');
    return true;
  } catch (error: any) {
    metrics.discordErrors++;
    console.error(
      '❌ Lỗi gửi đến Discord sau',
      CONFIG.discord.maxRetries,
      'lần thử:',
      error.response?.data || error.message
    );
    throw error;
  }
};
