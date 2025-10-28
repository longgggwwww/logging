import { LogMessage } from "../types.js";

export const message: LogMessage = {
  project: "api-gateway",
  function: "proxyRequest",
  method: "GET",
  type: "ERROR",
  request: {
    headers: {},
    userAgent: "Gateway/0.9",
    url: "/proxy/service-a/health",
    params: {},
  },
  response: {
    code: 504,
    success: false,
    message: "Upstream service timed out",
    data: [],
  },
  consoleLog: "Error: ETIMEDOUT at connect (net.js:100:20)",
  createdAt: new Date().toISOString(),
  createdBy: { id: "gateway", fullname: "API Gateway", emplCode: "GW001" },
  additionalData: { upstream: "service-a", timeoutMs: 30000 },
  latency: 30500,
};
