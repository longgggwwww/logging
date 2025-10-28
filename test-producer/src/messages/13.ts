import { LogMessage } from "../types.js";

export const message: LogMessage = {
  project: "search-service",
  function: "indexDocuments",
  method: "POST",
  type: "ERROR",
  request: {
    headers: {},
    userAgent: "Indexer/5.0",
    url: "/api/search/index",
    params: {},
    body: { batchSize: 1000 },
  },
  response: {
    code: 500,
    success: false,
    message: "Elasticsearch cluster unreachable",
    data: [],
  },
  consoleLog: `Error: NoLivingConnectionsError: No alive nodes found in your cluster`,
  createdAt: new Date().toISOString(),
  createdBy: { id: "svc-index", fullname: "Indexer", emplCode: "IDX001" },
  additionalData: { cluster: "es-prod", nodes: 0 },
  latency: 45000,
};
