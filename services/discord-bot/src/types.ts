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
