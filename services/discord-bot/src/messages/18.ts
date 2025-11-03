import { LogMessage } from "../types.js";

export const message: LogMessage = {
  project: "notification-service",
  function: "pushNotification",
  method: "POST",
  type: "ERROR",
  request: {
    headers: { "content-type": "application/json" },
    userAgent: "Notifier/1.0",
    url: "/api/notify/push",
    params: {},
    body: { deviceId: "dev-123", payload: { title: "Hi" } },
  },
  response: {
    code: 500,
    success: false,
    message: "Push provider returned 500",
    data: [],
  },
  consoleLog: "Error: ProviderError: 500 Internal Server Error",
  createdAt: new Date().toISOString(),
  createdBy: {
    id: "svc-notify",
    fullname: "Notification Service",
    emplCode: "NOT001",
  },
  additionalData: { provider: "fcm", deviceId: "dev-123" },
  latency: 980,
};
