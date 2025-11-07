import { LogMessage } from '../types.js';

export const message: LogMessage = {
  project: 'ecommerce-platform',
  function: 'login',
  method: 'POST',
  type: 'ERROR',
  request: {
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer token123',
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    url: '/api/auth/login',
    params: {},
    body: {
      email: 'customer@shop.com',
      password: '[REDACTED]',
    },
  },
  response: {
    code: 500,
    success: false,
    message: 'Database connection failed',
    data: [],
  },
  consoleLog: `Error: Connection timeout
  at Database.connect (/app/db/connection.js:45:12)
  at AuthService.login (/app/services/auth.js:78:20)`,
  createdAt: new Date().toISOString(),
  createdBy: {
    id: 'user123',
    fullname: 'Nguyen Van A',
    emplCode: 'EMP001',
  },
  additionalData: {
    database: 'postgres',
    host: 'db.shop.com',
    port: 5432,
  },
  latency: 30250,
};
