// ============================================
// TYPE DEFINITIONS
// ============================================
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
}

export interface KafkaConfig {
  clientId: string;
  brokers: string[];
  connectionTimeout: number;
  requestTimeout: number;
  retry: {
    initialRetryTime: number;
    retries: number;
  };
}

export interface ConsumerConfig {
  groupId: string;
  sessionTimeout: number;
  heartbeatInterval: number;
  maxWaitTimeInMs: number;
}

export interface Config {
  kafka: KafkaConfig;
  consumer: ConsumerConfig;
  topics: {
    main: string;
    dlq: string;
    retry: string;
  };
  maxRetries: number;
  database: {
    url: string;
  };
  redis: {
    url: string;
  };
}

// ============================================
// CONFIGURATION
// ============================================
export const conf: Config = {
  kafka: {
    clientId: "log-processor",
    brokers: (process.env.KAFKA_BROKERS || "kafka-1,kafka-2,kafka-3").split(
      ",",
    ),
    connectionTimeout: 30000,
    requestTimeout: 30000,
    retry: {
      initialRetryTime: 300,
      retries: 8,
    },
  },
  consumer: {
    groupId: "log-processor-group",
    sessionTimeout: 30000,
    heartbeatInterval: 3000,
    maxWaitTimeInMs: 5000,
  },
  topics: {
    main: "logs",
    dlq: "logs-dlq",
    retry: "logs-retry",
  },
  maxRetries: 3,
  database: {
    url:
      process.env.MONGO_URL ||
      "mongodb://admin:123456@mongodb:27017/logs?authSource=admin",
  },
  redis: {
    url: process.env.REDIS_URL || "redis://redis:6379",
  },
};
