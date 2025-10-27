import { LogMessage } from "../types/types.js";

export const message: LogMessage = {
  project: "storage-service",
  function: "readFile",
  method: "GET",
  type: "ERROR",
  request: {
    headers: {},
    userAgent: "StorageClient/3.0",
    url: "/api/storage/read",
    params: { path: "/data/config.yaml" },
  },
  response: {
    code: 404,
    success: false,
    message: "File not found",
    data: [],
  },
  consoleLog: "Error: ENOENT: no such file or directory, open '/data/config.yaml'",
  createdAt: new Date().toISOString(),
  createdBy: { id: "svc-storage", fullname: "Storage Service", emplCode: "STG001" },
  additionalData: { path: "/data/config.yaml" },
  latency: 15,
};
