import { Server } from 'socket.io';
import { conf } from './config.js';

// ============================================
// SOCKET.IO SERVER
// ============================================
export const io = new Server({
  cors: {
    origin: conf.socket.corsOrigin,
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
  console.log(`✅ Client connected: ${socket.id}`);

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
    console.log(`❌ Client disconnected: ${socket.id}`);
  });

  // Handle errors
  socket.on('error', (err) => {
    console.error(`⚠️  Socket error for ${socket.id}:`, err);
  });
});

// ============================================
// BROADCAST FUNCTIONS
// ============================================
export const broadcastLog = (data: any) => {
  try {
    io.to('logs').emit('new-log', data);
  } catch (err) {
    console.error('❌ Error broadcasting log:', err);
  }
};

// ============================================
// START SOCKET SERVER
// ============================================
export const startSocketServer = () => {
  io.listen(3000);
  console.log(`🚀 Socket.IO server listening on port 3000`);
  console.log(`🔗 CORS enabled for: ${conf.socket.corsOrigin}`);
};
