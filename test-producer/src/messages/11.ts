import { LogMessage } from "../types/types.js";

export const message: LogMessage = {
  project: "file-service",
  function: "upload",
  method: "POST",
  type: "ERROR",
  request: {
    headers: { "content-type": "multipart/form-data" },
    userAgent: "Uploader/1.0.0",
    url: "/api/files/upload",
    params: {},
    body: { filename: "report.pdf", size: 104857600 },
  },
  response: {
    code: 413,
    success: false,
    message: "Payload too large",
    data: [],
  },
  consoleLog: "Error: Request entity too large - upload aborted",
  createdAt: new Date().toISOString(),
  createdBy: { id: "user-file", fullname: "File Uploader", emplCode: "USR999" },
  additionalData: { maxSize: 10485760, attemptedSize: 104857600 },
  latency: 2000,
};
