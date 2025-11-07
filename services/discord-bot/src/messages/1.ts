import { LogMessage } from '../types.js';

export const message: LogMessage = {
  project: 'ecommerce-platform',
  function: 'createOrder',
  method: 'POST',
  type: 'SUCCESS',
  request: {
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer user-token',
    },
    userAgent: 'MyApp/1.0.0 (iOS 16.0)',
    url: '/api/orders',
    params: {},
    body: {
      items: [{ id: 'ITEM-1', quantity: 2, price: 50.0 }],
      total: 100.0,
    },
  },
  response: {
    code: 201,
    success: true,
    message: 'Order created successfully',
    data: [{ orderId: 'ORD-12345', status: 'pending' }],
  },
  consoleLog: 'Success: Order created. Order ID: ORD-12345',
  createdAt: new Date().toISOString(),
  createdBy: {
    id: 'vip123',
    fullname: 'Tran Thi B',
    emplCode: 'EMP002',
  },
  additionalData: {
    orderId: 'ORD-12345',
    amount: 100.0,
  },
  latency: 850,
};
