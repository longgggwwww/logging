import { createServer } from 'http';
import { Server } from 'socket.io';
import { conf } from './config.js';

export const httpServer = createServer();

export const io = new Server(httpServer, {
  cors: {
    origin: conf.socket.corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  allowEIO3: true,
});

io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  socket.emit('connected', {
    message: 'Connected to realtime log service',
    clientId: socket.id,
  });

  socket.on('subscribe', () => {
    console.log(`📡 Client ${socket.id} subscribed to logs`);
    socket.join('logs');
  });

  socket.on('unsubscribe', () => {
    console.log(`📴 Client ${socket.id} unsubscribed from logs`);
    socket.leave('logs');
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });

  socket.on('error', (err) => {
    console.error(`⚠️  Socket error for ${socket.id}:`, err);
  });
});

export const broadcastLog = (data: any) => {
  try {
    io.to('logs').emit('new-log', data);
  } catch (err) {
    console.error('❌ Error broadcasting log:', err);
  }
};
