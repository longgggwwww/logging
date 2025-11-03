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
    generalChannelFilter: {
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

export interface LogMessage {
  project: string;
  function: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD";
  type: "ERROR" | "SUCCESS" | "WARNING" | "INFO" | "DEBUG";
  request: {
    headers: Record<string, any>;
    userAgent: string;
    url: string;
    params: Record<string, any>;
    body?: any;
  };
  response: {
    code: number;
    success: boolean;
    message: string;
    data: any[];
  };
  consoleLog: string;
  createdAt: string;
  createdBy: {
    id: string;
    fullname: string;
    emplCode: string;
  } | null;
  additionalData: Record<string, any>;
  latency: number;
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
