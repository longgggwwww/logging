// ============================================
// TYPE DEFINITIONS
// ============================================
export interface KafkaConfig {
  clientId: string;
  brokers: string[];
  connectionTimeout: number;
  requestTimeout: number;
}

export interface FCMConfig {
  maxRetries: number;
  retryDelay: number;
  timeout: number;
  topics: string[];
  deviceTokens: string[];
  filter: {
    enabled: boolean;
    minSeverityCode: number;
    criticalTypes: string[];
  };
}

export interface ProcessingConfig {
  maxRetries: number;
  retryDelay: number;
}

export interface TopicsConfig {
  main: string;
  deadLetter: string;
  retry: string;
}

export interface Config {
  kafka: KafkaConfig;
  fcm: FCMConfig;
  processing: ProcessingConfig;
  topics: TopicsConfig;
}

export interface LogData {
  projectName?: string;
  function?: string;
  method?: string;
  type?: string;
  createdAt?: string;
  latency?: number;
  response?: {
    code?: number;
    message?: string;
  };
  createdBy?: {
    fullname?: string;
  };
  request?: {
    url?: string;
  };
  consoleLog?: string;
  additionalData?: any;
  _retry?: {
    attemptCount: number;
    lastAttempt: string;
    nextRetryAfter: number;
  };
}

export interface Metrics {
  processed: number;
  failed: number;
  retriedSuccessfully: number;
  sentToDLQ: number;
  fcmErrors: number;
  fcmSuccess: number;
  filtered: number;
}

export type FCMDataPayload = Record<string, string>;

export interface MessageMetadata {
  topic: string;
  partition: number;
  offset: string;
  timestamp?: string;
  attemptCount?: number;
}
