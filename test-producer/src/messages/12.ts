import { LogMessage } from "../types.js";

export const message: LogMessage = {
  project: "auth-service",
  function: "refreshToken",
  method: "POST",
  type: "ERROR",
  request: {
    headers: { authorization: "Bearer invalid" },
    userAgent: "AuthClient/2.0",
    url: "/api/auth/refresh",
    params: {},
    body: { refreshToken: "bad-token" },
  },
  response: {
    code: 401,
    success: false,
    message: "Invalid refresh token",
    data: [],
  },
  consoleLog: "Error: TokenExpiredError: jwt expired",
  createdAt: new Date().toISOString(),
  createdBy: { id: "unknown", fullname: "Unknown", emplCode: "N/A" },
  additionalData: { token: "bad-token" },
  latency: 75,
};
