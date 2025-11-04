import { LogMessage } from '../types.js';

export const message: LogMessage = {
  project: 'parser-service',
  function: 'parseCsv',
  method: 'POST',
  type: 'ERROR',
  request: {
    headers: { 'content-type': 'text/csv' },
    userAgent: 'Parser/2.2',
    url: '/api/parse/csv',
    params: {},
    body: 'name,age\nAlice,not-a-number',
  },
  response: {
    code: 400,
    success: false,
    message: 'CSV parse error',
    data: [],
  },
  consoleLog: 'Error: TypeError: Unexpected token in number at CSVParser.parse',
  createdAt: new Date().toISOString(),
  createdBy: { id: 'svc-parser', fullname: 'Parser', emplCode: 'PSR001' },
  additionalData: { line: 2, column: 7 },
  latency: 30,
};
