import type { TimeFilter } from "./types.js";

// Helper function to generate cache key
export function generateCacheKey(
  prefix: string,
  params: Record<string, any>,
): string {
  const sorted = Object.keys(params)
    .sort()
    .map((key) => `${key}:${params[key]}`)
    .join("|");
  return `${prefix}:${sorted}`;
}

// Helper function to parse time range
export function getTimeRangeFilter(
  timeRange?: string,
  startTime?: string,
  endTime?: string,
): TimeFilter | undefined {
  const now = new Date();
  const filter: TimeFilter = {};

  if (timeRange) {
    let startDate: Date;
    switch (timeRange) {
      case "15m":
        startDate = new Date(now.getTime() - 15 * 60 * 1000);
        break;
      case "30m":
        startDate = new Date(now.getTime() - 30 * 60 * 1000);
        break;
      case "1h":
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case "3h":
        startDate = new Date(now.getTime() - 3 * 60 * 60 * 1000);
        break;
      case "6h":
        startDate = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        break;
      case "12h":
        startDate = new Date(now.getTime() - 12 * 60 * 60 * 1000);
        break;
      case "24h":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // default 24h
    }
    filter.$gte = startDate;
  } else if (startTime || endTime) {
    if (startTime) {
      filter.$gte = new Date(startTime);
    }
    if (endTime) {
      filter.$lte = new Date(endTime);
    }
  }

  return Object.keys(filter).length > 0 ? filter : undefined;
}
