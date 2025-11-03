import { LogMessage } from "../types.js";

export const message: LogMessage = {
  project: "ecommerce-platform",
  function: "processPayment",
  method: "POST",
  type: "ERROR",
  request: {
    headers: {},
    userAgent: "MyApp/1.0.0 (Android 13)",
    url: "/api/payments/process",
    params: {},
    body: {
      orderId: "ORD-67890",
      amount: 299.99,
      method: "stripe",
    },
  },
  response: {
    code: 504,
    success: false,
    message: "Payment gateway timeout",
    data: [],
  },
  consoleLog: "Error: Timeout after 30000ms at PaymentGateway.charge",
  createdAt: new Date().toISOString(),
  createdBy: {
    id: "customer789",
    fullname: "Pham Van D",
    emplCode: "N/A",
  },
  additionalData: {
    gateway: "stripe",
    orderId: "ORD-67890",
    amount: 299.99,
  },
  latency: 30500,
};
