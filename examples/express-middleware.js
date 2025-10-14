/**
 * Express.js Logging Middleware
 * Middleware để tự động log tất cả requests vào Kafka theo cấu trúc mới
 */

const { Kafka } = require('kafkajs');

// ============================================
// KAFKA SETUP
// ============================================
const kafka = new Kafka({
  clientId: 'express-logger',
  brokers: ['localhost:19092', 'localhost:29092', 'localhost:39092']
});

const producer = kafka.producer();
let producerConnected = false;

// Connect producer
const connectProducer = async () => {
  if (!producerConnected) {
    await producer.connect();
    producerConnected = true;
    console.log('✅ Kafka producer connected');
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  if (producerConnected) {
    await producer.disconnect();
  }
});

// ============================================
// MIDDLEWARE
// ============================================

/**
 * Middleware để track request start time
 */
const requestTimeMiddleware = (req, res, next) => {
  req.startTime = Date.now();
  next();
};

/**
 * Middleware để log request/response vào Kafka
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.projectName - Tên project (required)
 * @param {boolean} options.logSuccess - Log successful requests (default: false)
 * @param {boolean} options.logInfo - Log info level requests (default: false)
 * @param {number} options.successThreshold - Response code threshold cho success (default: 400)
 * @param {Array<string>} options.excludePaths - Paths to exclude from logging
 * @param {Function} options.getFunctionName - Custom function to get function name
 */
const kafkaLoggingMiddleware = (options = {}) => {
  const {
    projectName = 'myapp',
    logSuccess = false,
    logInfo = false,
    successThreshold = 400,
    excludePaths = ['/health', '/ping'],
    getFunctionName = null
  } = options;

  // Ensure producer is connected
  connectProducer().catch(console.error);

  return async (req, res, next) => {
    // Skip excluded paths
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // Override res.json to capture response
    const originalJson = res.json;
    const originalSend = res.send;
    let responseBody = null;

    res.json = function(data) {
      responseBody = data;
      return originalJson.call(this, data);
    };

    res.send = function(data) {
      if (!responseBody) {
        responseBody = data;
      }
      return originalSend.call(this, data);
    };

    // Wait for response to finish
    res.on('finish', async () => {
      try {
        const latency = Date.now() - req.startTime;
        const statusCode = res.statusCode;
        const isSuccess = statusCode < successThreshold;

        // Determine type
        let type;
        if (statusCode >= 500) {
          type = 'ERROR';
        } else if (statusCode >= 400) {
          type = 'WARNING';
        } else if (logSuccess && isSuccess) {
          type = 'SUCCESS';
        } else if (logInfo) {
          type = 'INFO';
        } else {
          // Skip logging for successful requests if not configured
          return;
        }

        // Get function name
        let functionName;
        if (getFunctionName && typeof getFunctionName === 'function') {
          functionName = getFunctionName(req);
        } else if (req.route && req.route.path) {
          functionName = req.route.path;
        } else {
          functionName = req.path;
        }

        // Parse response
        let responseMessage = 'Request processed';
        let responseData = [];
        
        if (responseBody) {
          try {
            const parsed = typeof responseBody === 'string' 
              ? JSON.parse(responseBody) 
              : responseBody;
            
            responseMessage = parsed.message || parsed.error || responseMessage;
            responseData = parsed.data || [];
          } catch (e) {
            // Response is not JSON
          }
        }

        // Build log message
        const logMessage = {
          projectName,
          function: functionName,
          method: req.method,
          type,
          request: {
            headers: sanitizeHeaders(req.headers),
            userAgent: req.headers['user-agent'] || 'Unknown',
            url: req.originalUrl || req.url,
            params: req.params || {},
            ...(req.method !== 'GET' && { body: sanitizeBody(req.body) })
          },
          response: {
            code: statusCode,
            success: isSuccess,
            message: responseMessage,
            data: Array.isArray(responseData) ? responseData : [responseData]
          },
          consoleLog: type === 'ERROR' 
            ? `${req.method} ${req.originalUrl} - ${statusCode} - ${latency}ms`
            : `${req.method} ${req.originalUrl} - ${statusCode} - ${latency}ms`,
          createdAt: new Date().toISOString(),
          createdBy: req.user ? {
            id: String(req.user.id || req.user._id || 'unknown'),
            fullname: req.user.fullname || req.user.name || 'Unknown',
            emplCode: req.user.emplCode || req.user.employeeCode || 'N/A'
          } : null,
          additionalData: {
            ip: req.ip || req.connection.remoteAddress,
            ...(req.session && { sessionId: req.session.id })
          },
          latency
        };

        // Send to Kafka
        if (producerConnected) {
          await producer.send({
            topic: 'error-logs',
            messages: [{
              value: JSON.stringify(logMessage)
            }]
          });
        }

      } catch (error) {
        console.error('❌ Error logging to Kafka:', error.message);
      }
    });

    next();
  };
};

/**
 * Function để log explicitly từ code
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {string} type - Log type (ERROR, WARNING, INFO, SUCCESS, DEBUG)
 * @param {string} message - Log message
 * @param {Object} additionalData - Additional data to log
 */
const logToKafka = async (req, res, type, message, additionalData = {}) => {
  try {
    if (!producerConnected) {
      await connectProducer();
    }

    const latency = req.startTime ? Date.now() - req.startTime : 0;

    const logMessage = {
      projectName: process.env.PROJECT_NAME || 'myapp',
      function: req.route?.path || req.path,
      method: req.method,
      type,
      request: {
        headers: sanitizeHeaders(req.headers),
        userAgent: req.headers['user-agent'] || 'Unknown',
        url: req.originalUrl || req.url,
        params: req.params || {},
        ...(req.method !== 'GET' && { body: sanitizeBody(req.body) })
      },
      response: {
        code: res.statusCode,
        success: res.statusCode < 400,
        message,
        data: []
      },
      consoleLog: type === 'ERROR' ? new Error().stack : message,
      createdAt: new Date().toISOString(),
      createdBy: req.user ? {
        id: String(req.user.id || req.user._id || 'unknown'),
        fullname: req.user.fullname || req.user.name || 'Unknown',
        emplCode: req.user.emplCode || req.user.employeeCode || 'N/A'
      } : null,
      additionalData,
      latency
    };

    await producer.send({
      topic: 'error-logs',
      messages: [{
        value: JSON.stringify(logMessage)
      }]
    });

  } catch (error) {
    console.error('❌ Error logging to Kafka:', error.message);
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Sanitize headers - remove sensitive information
 */
const sanitizeHeaders = (headers) => {
  const sanitized = { ...headers };
  
  // Remove sensitive headers
  const sensitiveHeaders = [
    'authorization',
    'cookie',
    'x-api-key',
    'x-auth-token'
  ];
  
  sensitiveHeaders.forEach(header => {
    if (sanitized[header]) {
      sanitized[header] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

/**
 * Sanitize request body - remove sensitive information
 */
const sanitizeBody = (body) => {
  if (!body) return undefined;
  
  const sanitized = { ...body };
  
  // Remove sensitive fields
  const sensitiveFields = [
    'password',
    'confirmPassword',
    'token',
    'accessToken',
    'refreshToken',
    'apiKey',
    'secret'
  ];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  // Limit size
  const jsonString = JSON.stringify(sanitized);
  if (jsonString.length > 1000) {
    return JSON.parse(jsonString.slice(0, 1000) + '"}');
  }
  
  return sanitized;
};

// ============================================
// EXPORTS
// ============================================

module.exports = {
  requestTimeMiddleware,
  kafkaLoggingMiddleware,
  logToKafka,
  connectProducer
};

// ============================================
// USAGE EXAMPLE
// ============================================

/*
const express = require('express');
const { 
  requestTimeMiddleware, 
  kafkaLoggingMiddleware,
  logToKafka 
} = require('./kafka-logging-middleware');

const app = express();

// Apply middlewares
app.use(express.json());
app.use(requestTimeMiddleware);
app.use(kafkaLoggingMiddleware({
  projectName: 'myapp',
  logSuccess: false,      // Don't log successful requests automatically
  logInfo: false,         // Don't log info level
  excludePaths: ['/health', '/ping']
}));

// Routes
app.post('/api/login', async (req, res) => {
  try {
    const user = await authService.login(req.body);
    
    // Explicitly log success
    await logToKafka(req, res, 'SUCCESS', 'Login successful', {
      userId: user.id
    });
    
    res.json({ success: true, user });
  } catch (error) {
    res.status(500);
    
    // Explicitly log error with details
    await logToKafka(req, res, 'ERROR', error.message, {
      errorCode: error.code,
      errorType: error.name
    });
    
    res.json({ success: false, message: error.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const order = await orderService.create(req.body, req.user);
    
    // Log important business operations
    await logToKafka(req, res, 'INFO', 'Order created', {
      orderId: order.id,
      amount: order.total,
      itemCount: order.items.length
    });
    
    res.status(201).json({ success: true, order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
*/
