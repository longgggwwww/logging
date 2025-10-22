import { LogMessage } from "./types.js";

export const message: LogMessage = {
  project: "analytics-dashboard",
  function: "exportData",
  method: "GET",
  type: "ERROR",
  request: {
    headers: {},
    userAgent: "Analytics/3.0.0",
    url: "/api/export/customers",
    params: { format: "csv" },
  },
  response: {
    code: 500,
    success: false,
    message: "Export failed - disk space full",
    data: [],
  },
  consoleLog: "Error: ENOSPC: no space left on device",
  createdAt: new Date().toISOString(),
  createdBy: {
    id: "analyst456",
    fullname: "Le Van H",
    emplCode: "ANA002",
  },
  additionalData: {
    format: "csv",
    recordCount: 50000,
    estimatedSize: "2GB",
  },
  latency: 15000,
};