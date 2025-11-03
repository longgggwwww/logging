import { Server } from 'socket.io';
import { CONFIG } from './config.js';
import { Metrics } from './types.js';

// ============================================
// METRICS
// ============================================
export const metrics: Metrics = {
  messagesReceived: 0,
  messagesBroadcast: 0,
  connectedClients: 0,
  errors: 0,
  startTime: new Date(),
};

// ============================================
// SOCKET.IO SERVER
// ============================================
export const io = new Server({
  cors: {
    origin: CONFIG.socket.corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ============================================
// CONNECTION HANDLERS
// ============================================
io.on('connection', (socket) => {
  metrics.connectedClients++;
  console.log(
    `✅ Client connected: ${socket.id} (Total: ${metrics.connectedClients})`
  );

  // Send initial connection confirmation
  socket.emit('connected', {
    message: 'Connected to realtime log service',
    clientId: socket.id,
  });

  // Handle client subscription
  socket.on('subscribe', () => {
    console.log(`📡 Client ${socket.id} subscribed to logs`);
    socket.join('logs');
  });

  // Handle client unsubscription
  socket.on('unsubscribe', () => {
    console.log(`📴 Client ${socket.id} unsubscribed from logs`);
    socket.leave('logs');
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    metrics.connectedClients--;
    console.log(
      `❌ Client disconnected: ${socket.id} (Total: ${metrics.connectedClients})`
    );
  });

  // Handle errors
  socket.on('error', (error) => {
    metrics.errors++;
    console.error(`⚠️  Socket error for ${socket.id}:`, error);
  });
});

// ============================================
// BROADCAST FUNCTIONS
// ============================================
export const broadcastLog = (logMessage: any) => {
  try {
    io.to('logs').emit('new_log', logMessage);
    metrics.messagesBroadcast++;
  } catch (error) {
    metrics.errors++;
    console.error('❌ Error broadcasting log:', error);
  }
};

export const broadcastMetrics = () => {
  try {
    const metricsData = {
      ...metrics,
      uptime: Date.now() - metrics.startTime.getTime(),
    };
    io.emit('metrics', metricsData);
  } catch (error) {
    console.error('❌ Error broadcasting metrics:', error);
  }
};

// ============================================
// START SOCKET SERVER
// ============================================
export const startSocketServer = () => {
  io.listen(CONFIG.socket.port);
  console.log(`🚀 Socket.IO server listening on port ${CONFIG.socket.port}`);
  console.log(`🔗 CORS enabled for: ${CONFIG.socket.corsOrigin}`);

  // Broadcast metrics every 30 seconds
  setInterval(broadcastMetrics, 30000);
};
