import { LogMessage } from "../types.js";

export const message: LogMessage = {
  project: "payment-service",
  function: "refund",
  method: "POST",
  type: "ERROR",
  request: {
    headers: { "content-type": "application/json" },
    userAgent: "PaymentsWorker/4.2.0",
    url: "/api/payments/refund",
    params: {},
    body: { paymentId: "PAY-9988", amount: 49.99 },
  },
  response: {
    code: 502,
    success: false,
    message: "Upstream gateway error",
    data: [],
  },
  consoleLog: `Error: EPIPE: broken pipe\n    at Socket.write (net.js:668:20)`,
  createdAt: new Date().toISOString(),
  createdBy: {
    id: "svc-pay",
    fullname: "Payments Service",
    emplCode: "SVC001",
  },
  additionalData: { upstream: "bank-gateway", retryable: true },
  latency: 12045,
};
