import { LogMessage } from '../types.js';

export const message: LogMessage = {
  project: 'inventory-management',
  function: 'checkStock',
  method: 'GET',
  type: 'WARNING',
  request: {
    headers: {},
    userAgent: 'InventoryApp/1.5.0',
    url: '/api/inventory/check',
    params: { productId: 'PROD-456' },
  },
  response: {
    code: 200,
    success: true,
    message: 'Low stock alert',
    data: [{ productId: 'PROD-456', quantity: 5 }],
  },
  consoleLog: 'Warning: Low stock for PROD-456. Only 5 units remaining',
  createdAt: new Date().toISOString(),
  createdBy: {
    id: 'wh456',
    fullname: 'Tran Van F',
    emplCode: 'WH002',
  },
  additionalData: {
    productId: 'PROD-456',
    quantity: 5,
    threshold: 10,
  },
  latency: 55,
};
