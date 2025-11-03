import { LogMessage } from "../types.js";

export const message: LogMessage = {
  project: "crm-system",
  function: "updateCustomer",
  method: "PUT",
  type: "SUCCESS",
  request: {
    headers: {
      "content-type": "application/json",
    },
    userAgent: "CRM-App/2.1.0",
    url: "/api/customers/555",
    params: { id: "555" },
    body: {
      name: "John Updated",
      email: "john.updated@example.com",
    },
  },
  response: {
    code: 200,
    success: true,
    message: "Customer updated successfully",
    data: [{ customerId: "555", updated: true }],
  },
  consoleLog: "Success: Customer 555 updated",
  createdAt: new Date().toISOString(),
  createdBy: {
    id: "sales456",
    fullname: "Hoang Van D",
    emplCode: "SALES002",
  },
  additionalData: {
    customerId: "555",
    fieldsUpdated: ["name", "email"],
  },
  latency: 95,
};
