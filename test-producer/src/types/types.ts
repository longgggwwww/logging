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

export interface Config {
  kafka: {
    clientId: string;
    brokers: string[];
    connectionTimeout: number;
    requestTimeout: number;
  };
  topics: {
    main: string;
    allUsers: string;
  };
  logCreator: () => ({ level, log }: { level: string; log: any }) => void;
}
