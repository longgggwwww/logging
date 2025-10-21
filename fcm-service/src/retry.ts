import { CONFIG } from './config.js';

// ============================================
// RETRY MECHANISM
// ============================================
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const retryWithBackoff = async (
  fn: () => Promise<any>,
  maxRetries: number = CONFIG.fcm.maxRetries,
  baseDelay: number = CONFIG.fcm.retryDelay
): Promise<any> => {
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
};
