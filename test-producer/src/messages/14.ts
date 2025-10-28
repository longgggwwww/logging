import { LogMessage } from "../types.js";

export const message: LogMessage = {
  project: "report-service",
  function: "generatePdf",
  method: "POST",
  type: "ERROR",
  request: {
    headers: { "content-type": "application/json" },
    userAgent: "Reports/1.3.0",
    url: "/api/reports/pdf",
    params: {},
    body: { reportId: "RPT-404" },
  },
  response: {
    code: 500,
    success: false,
    message: "OutOfMemoryError while generating PDF",
    data: [],
  },
  consoleLog:
    "Error: JavaScript heap out of memory\n    at generatePdf (renderer.js:102:12)",
  createdAt: new Date().toISOString(),
  createdBy: {
    id: "svc-report",
    fullname: "Report Service",
    emplCode: "RPT001",
  },
  additionalData: { renderer: "puppeteer", attempts: 2 },
  latency: 90000,
};
