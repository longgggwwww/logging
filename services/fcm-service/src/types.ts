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
  id?: string;
  projectId?: string;
  functionId?: string;
  method?: string;
  type?: string;
  requestHeaders?: any;
  requestUserAgent?: string;
  requestUrl?: string;
  requestParams?: any;
  requestBody?: any;
  responseCode?: number;
  responseSuccess?: boolean;
  responseMessage?: string;
  responseData?: any;
  consoleLog?: string;
  additionalData?: any;
  latency?: number;
  createdById?: string;
  createdByFullname?: string;
  createdByEmplCode?: string;
  createdAt?: string;
  updatedAt?: string;
  projectName?: string; // From relation
  function?: string; // From relation
  response?: {
    code?: number;
    message?: string;
  }; // For backward compatibility
  createdBy?: {
    fullname?: string;
  }; // For backward compatibility
  request?: {
    url?: string;
  }; // For backward compatibility
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
