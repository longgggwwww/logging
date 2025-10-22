import { LogMessage } from "./types.js";

export const testMessages: (LogMessage | Partial<LogMessage>)[] = [
  // 1. E-COMMERCE - Login failed
  {
    project: "ecommerce-platform",
    function: "login",
    method: "POST",
    type: "ERROR",
    request: {
      headers: {
        "content-type": "application/json",
        authorization: "Bearer token123",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      url: "/api/auth/login",
      params: {},
      body: {
        email: "customer@shop.com",
        password: "[REDACTED]",
      },
    },
    response: {
      code: 500,
      success: false,
      message: "Database connection failed",
      data: [],
    },
    consoleLog: `Error: Connection timeout
  at Database.connect (/app/db/connection.js:45:12)
  at AuthService.login (/app/services/auth.js:78:20)`,
    createdAt: new Date().toISOString(),
    createdBy: {
      id: "user123",
      fullname: "Nguyen Van A",
      emplCode: "EMP001",
    },
    additionalData: {
      database: "postgres",
      host: "db.shop.com",
      port: 5432,
    },
    latency: 30250,
  },

  // 2. E-COMMERCE - Create order success
  {
    project: "ecommerce-platform",
    function: "createOrder",
    method: "POST",
    type: "SUCCESS",
    request: {
      headers: {
        "content-type": "application/json",
        authorization: "Bearer user-token",
      },
      userAgent: "MyApp/1.0.0 (iOS 16.0)",
      url: "/api/orders",
      params: {},
      body: {
        items: [{ id: "ITEM-1", quantity: 2, price: 50.0 }],
        total: 100.0,
      },
    },
    response: {
      code: 201,
      success: true,
      message: "Order created successfully",
      data: [{ orderId: "ORD-12345", status: "pending" }],
    },
    consoleLog: "Success: Order created. Order ID: ORD-12345",
    createdAt: new Date().toISOString(),
    createdBy: {
      id: "vip123",
      fullname: "Tran Thi B",
      emplCode: "EMP002",
    },
    additionalData: {
      orderId: "ORD-12345",
      amount: 100.0,
    },
    latency: 850,
  },

  // 3. E-COMMERCE - Process payment error
  {
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
  },

  // 4. CRM - Get customer warning
  {
    project: "crm-system",
    function: "getCustomerDetails",
    method: "GET",
    type: "WARNING",
    request: {
      headers: {
        authorization: "Bearer crm-token",
      },
      userAgent: "CRM-App/2.1.0",
      url: "/api/customers/999",
      params: { id: "999" },
    },
    response: {
      code: 404,
      success: false,
      message: "Customer not found",
      data: [],
    },
    consoleLog: "Warning: Attempt to access non-existent customer ID: 999",
    createdAt: new Date().toISOString(),
    createdBy: {
      id: "sales123",
      fullname: "Le Thi C",
      emplCode: "SALES001",
    },
    additionalData: {
      requestedId: "999",
      attemptCount: 3,
    },
    latency: 120,
  },

  // 5. CRM - Update customer success
  {
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
  },

  // 6. INVENTORY - Check stock info
  {
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
  },

  // 7. INVENTORY - Low stock warning
  {
    project: "inventory-management",
    function: "checkStock",
    method: "GET",
    type: "WARNING",
    request: {
      headers: {},
      userAgent: "InventoryApp/1.5.0",
      url: "/api/inventory/check",
      params: { productId: "PROD-456" },
    },
    response: {
      code: 200,
      success: true,
      message: "Low stock alert",
      data: [{ productId: "PROD-456", quantity: 5 }],
    },
    consoleLog: "Warning: Low stock for PROD-456. Only 5 units remaining",
    createdAt: new Date().toISOString(),
    createdBy: {
      id: "wh456",
      fullname: "Tran Van F",
      emplCode: "WH002",
    },
    additionalData: {
      productId: "PROD-456",
      quantity: 5,
      threshold: 10,
    },
    latency: 55,
  },

  // 8. ANALYTICS - Generate report success
  {
    project: "analytics-dashboard",
    function: "generateReport",
    method: "POST",
    type: "SUCCESS",
    request: {
      headers: {
        "content-type": "application/json",
      },
      userAgent: "Analytics/3.0.0",
      url: "/api/reports/generate",
      params: {},
      body: {
        type: "sales",
        period: "monthly",
        year: 2025,
        month: 10,
      },
    },
    response: {
      code: 200,
      success: true,
      message: "Report generated successfully",
      data: [{ reportId: "RPT-789", url: "/reports/RPT-789.pdf" }],
    },
    consoleLog: "Success: Monthly sales report generated. ID: RPT-789",
    createdAt: new Date().toISOString(),
    createdBy: {
      id: "analyst123",
      fullname: "Pham Thi G",
      emplCode: "ANA001",
    },
    additionalData: {
      reportId: "RPT-789",
      type: "sales",
      period: "monthly",
    },
    latency: 2500,
  },

  // 9. ANALYTICS - Export data error
  {
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
  },

  // 10. HR SYSTEM - Calculate salary
  {
    project: "hr-management",
    function: "calculateSalary",
    method: "POST",
    type: "DEBUG",
    request: {
      headers: {},
      userAgent: "Internal/Debug",
      url: "/api/hr/salary/calculate",
      params: {},
      body: {
        employeeId: "EMP123",
        month: 10,
        year: 2025,
      },
    },
    response: {
      code: 200,
      success: true,
      message: "Salary calculated",
      data: [
        {
          employeeId: "EMP123",
          basicSalary: 10000000,
          bonus: 2000000,
          total: 12000000,
        },
      ],
    },
    consoleLog:
      "Debug: Salary calculation steps: base -> allowances -> tax -> final",
    createdAt: new Date().toISOString(),
    createdBy: {
      id: "hr123",
      fullname: "Nguyen Thi I",
      emplCode: "HR001",
    },
    additionalData: {
      employeeId: "EMP123",
      steps: ["base", "allowances", "tax", "final"],
    },
    latency: 180,
  },

  // 11. HR SYSTEM - Employee leave request
  {
    project: "hr-management",
    function: "createLeaveRequest",
    method: "POST",
    type: "INFO",
    request: {
      headers: {
        "content-type": "application/json",
      },
      userAgent: "HR-Portal/1.0.0",
      url: "/api/hr/leave",
      params: {},
      body: {
        employeeId: "EMP456",
        startDate: "2025-10-25",
        endDate: "2025-10-27",
        type: "annual",
      },
    },
    response: {
      code: 201,
      success: true,
      message: "Leave request created",
      data: [{ requestId: "LR-001", status: "pending" }],
    },
    consoleLog: "Info: Leave request created for EMP456",
    createdAt: new Date().toISOString(),
    createdBy: {
      id: "emp456",
      fullname: "Tran Van J",
      emplCode: "EMP456",
    },
    additionalData: {
      requestId: "LR-001",
      days: 3,
    },
    latency: 110,
  },

  // 12. NOTIFICATION - Send email success
  {
    project: "notification-service",
    function: "sendEmail",
    method: "POST",
    type: "SUCCESS",
    request: {
      headers: {
        "content-type": "application/json",
      },
      userAgent: "NotificationWorker/2.0.0",
      url: "/api/notifications/email",
      params: {},
      body: {
        to: "user@example.com",
        subject: "Order Confirmation",
        template: "order-confirm",
      },
    },
    response: {
      code: 200,
      success: true,
      message: "Email sent successfully",
      data: [{ messageId: "MSG-12345" }],
    },
    consoleLog: "Success: Email sent to user@example.com",
    createdAt: new Date().toISOString(),
    createdBy: null,
    additionalData: {
      messageId: "MSG-12345",
      provider: "sendgrid",
    },
    latency: 1200,
  },

  // 13. NOTIFICATION - SMS failed
  {
    project: "notification-service",
    function: "sendSMS",
    method: "POST",
    type: "ERROR",
    request: {
      headers: {},
      userAgent: "NotificationWorker/2.0.0",
      url: "/api/notifications/sms",
      params: {},
      body: {
        phone: "+84912345678",
        message: "Your OTP is 123456",
      },
    },
    response: {
      code: 503,
      success: false,
      message: "SMS provider unavailable",
      data: [],
    },
    consoleLog: "Error: SMS provider connection refused",
    createdAt: new Date().toISOString(),
    createdBy: null,
    additionalData: {
      provider: "twilio",
      retryCount: 3,
    },
    latency: 5000,
  },

  // 14. Message missing required fields (test error handling)
  {
    project: "test-project",
    method: "POST",
    type: "ERROR",
    createdAt: new Date().toISOString(),
    latency: 100,
    // Missing: function (required field)
  } as Partial<LogMessage>,

  // 15. Invalid message structure (test DLQ)
  {
    project: "test-project",
    function: "testInvalid",
    // Missing: method, type, createdAt, latency
  } as Partial<LogMessage>,
];
