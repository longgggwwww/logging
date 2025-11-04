import { LogMessage } from '../types.js';

export const message: LogMessage = {
  project: 'analytics-dashboard',
  function: 'generateReport',
  method: 'POST',
  type: 'SUCCESS',
  request: {
    headers: {
      'content-type': 'application/json',
    },
    userAgent: 'Analytics/3.0.0',
    url: '/api/reports/generate',
    params: {},
    body: {
      type: 'sales',
      period: 'monthly',
      year: 2025,
      month: 10,
    },
  },
  response: {
    code: 200,
    success: true,
    message: 'Report generated successfully',
    data: [{ reportId: 'RPT-789', url: '/reports/RPT-789.pdf' }],
  },
  consoleLog: 'Success: Monthly sales report generated. ID: RPT-789',
  createdAt: new Date().toISOString(),
  createdBy: {
    id: 'analyst123',
    fullname: 'Pham Thi G',
    emplCode: 'ANA001',
  },
  additionalData: {
    reportId: 'RPT-789',
    type: 'sales',
    period: 'monthly',
  },
  latency: 2500,
};
