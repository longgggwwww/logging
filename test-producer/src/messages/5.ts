import { LogMessage } from "../types.js";

export const message: LogMessage = {
  project: "inventory-management",
  function: "checkStock",
  method: "GET",
  type: "INFO",
  request: {
    headers: {},
    userAgent: "InventoryApp/1.5.0",
    url: "/api/inventory/check",
    params: { productId: "PROD-123" },
  },
  response: {
    code: 200,
    success: true,
    message: "Stock level retrieved",
    data: [{ productId: "PROD-123", quantity: 150 }],
  },
  consoleLog: "Info: Stock check for PROD-123. Current: 150 units",
  createdAt: new Date().toISOString(),
  createdBy: {
    id: "wh123",
    fullname: "Nguyen Van E",
    emplCode: "WH001",
  },
  additionalData: {
    productId: "PROD-123",
    quantity: 150,
    warehouse: "WH-A",
  },
  latency: 45,
};
