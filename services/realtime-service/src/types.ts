// ============================================
// TYPE DEFINITIONS
// ============================================

export interface Config {
  kafka: {
    clientId: string;
    brokers: string[];
    connectionTimeout: number;
    requestTimeout: number;
    topics: string[];
  };
  socket: {
    port: number;
    corsOrigin: string;
  };
}

export interface LogMessage {
  timestamp: string;
  hostname: string;
  appname: string;
  procid: string;
  msgid: string;
  severity: string;
  facility: string;
  message: string;
  structuredData?: Record<string, any>;
  raw?: string;
}

export interface Metrics {
  messagesReceived: number;
  messagesBroadcast: number;
  connectedClients: number;
  errors: number;
  startTime: Date;
}
