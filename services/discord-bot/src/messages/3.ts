import { LogMessage } from '../types.js';

export const message: LogMessage = {
  project: 'crm-system',
  function: 'getCustomerDetails',
  method: 'GET',
  type: 'WARNING',
  request: {
    headers: {
      authorization: 'Bearer crm-token',
    },
    userAgent: 'CRM-App/2.1.0',
    url: '/api/customers/999',
    params: { id: '999' },
  },
  response: {
    code: 404,
    success: false,
    message: 'Customer not found',
    data: [],
  },
  consoleLog: 'Warning: Attempt to access non-existent customer ID: 999',
  createdAt: new Date().toISOString(),
  createdBy: {
    id: 'sales123',
    fullname: 'Le Thi C',
    emplCode: 'SALES001',
  },
  additionalData: {
    requestedId: '999',
    attemptCount: 3,
  },
  latency: 120,
};
