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
  topic: string;
}
