import { LogMessage } from "../types.js";

export const message: LogMessage = {
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
};
