// ============================================
// TYPES
// ============================================
export interface FilterConfig {
  enabled: boolean;
  minSeverityCode: number;
  criticalTypes: string[];
}

export interface KafkaConfig {
  clientId: string;
  brokers: string[];
  connectionTimeout: number;
  requestTimeout: number;
}

export interface DiscordConfig {
  token: string;
  guildId: string;
  maxRetries: number;
  retryDelay: number;
  timeout: number;
  filter: FilterConfig;
  generalChannelFilter: FilterConfig;
}

export interface ProcessingConfig {
  maxRetries: number;
  retryDelay: number;
}

export interface TopicConfig {
  main: string;
}

// ============================================
// CONFIGURATION
// ============================================
export const conf = {
  kafka: {
    clientId: 'discord-bot-consumer',
    brokers: (
      process.env.KAFKA_BROKERS ||
      'localhost:19092,localhost:29092,localhost:39092'
    ).split(','),
    connectionTimeout: 30000,
    requestTimeout: 30000,
  },
  discord: {
    token: process.env.DISCORD_TOKEN || '',
    guildId: process.env.DISCORD_GUILD_ID || '',
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    timeout: 5000,
    filter: {
      enabled: true,
      minSeverityCode: parseInt(process.env.DISCORD_MIN_SEVERITY_CODE || '500'),
      criticalTypes: process.env.DISCORD_CRITICAL_TYPES?.split(',') || [
        'ERROR',
      ],
    },
    generalChannelFilter: {
      enabled: true,
      minSeverityCode: parseInt(
        process.env.DISCORD_GENERAL_MIN_SEVERITY_CODE || '400'
      ),
      criticalTypes: process.env.DISCORD_GENERAL_CRITICAL_TYPES?.split(',') || [
        'WARNING',
        'ERROR',
      ],
    },
  },
  processing: {
    maxRetries: 3,
    retryDelay: 2000,
  },
  topics: {
    main: 'logs'
  },
} as const;
