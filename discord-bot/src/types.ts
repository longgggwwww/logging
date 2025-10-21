export interface Config {
  kafka: {
    clientId: string;
    brokers: string[];
    connectionTimeout: number;
    requestTimeout: number;
  };
  discord: {
    guildId: string;
    maxRetries: number;
    retryDelay: number;
    timeout: number;
    filter: {
      enabled: boolean;
      minSeverityCode: number;
      criticalTypes: string[];
    };
  };
  processing: {
    maxRetries: number;
    retryDelay: number;
  };
  topics: {
    main: string;
    deadLetter: string;
    retry: string;
  };
}

export interface LogData {
  projectName?: string;
  function?: string;
  method?: string;
  type?: string;
  createdAt?: string;
  latency?: number;
  createdBy?: {
    fullname?: string;
    id?: string;
    emplCode?: string;
  };
  response?: {
    code?: number;
    success?: boolean;
    message?: string;
  };
  request?: {
    url?: string;
  };
  consoleLog?: string;
  _retry?: {
    attemptCount: number;
    nextRetryAfter?: number;
  };
}

export interface MessageMetadata {
  topic: string;
  partition: number;
  offset: string;
  timestamp: string;
}