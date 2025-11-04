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
    corsOrigin: string;
  };
}