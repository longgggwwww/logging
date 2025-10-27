import { LogMessage } from "../types/types.js";

export const message: LogMessage = {
  project: "analytics-dashboard",
  function: "aggregateMetrics",
  method: "POST",
  type: "ERROR",
  request: {
    headers: {},
    userAgent: "MetricsWorker/6.1",
    url: "/api/metrics/aggregate",
    params: {},
    body: { window: "1h" },
  },
  response: {
    code: 500,
    success: false,
    message: "Unhandled exception in aggregation",
    data: [],
  },
  consoleLog: "Error: TypeError: Cannot read property 'length' of undefined\n    at aggregate (/app/metrics/agg.js:45:22)",
  createdAt: new Date().toISOString(),
  createdBy: { id: "metrics", fullname: "Metrics Worker", emplCode: "MET001" },
  additionalData: { jobId: "JOB-456" },
  latency: 600,
};
