import { httpServer, io } from './app.js';
import { conf } from './config.js';

const PORT = conf.socket.port;

export const startServer = () => {
  httpServer.listen(PORT, () => {
    console.log(`🚀 HTTP server listening on port ${PORT}`);
    console.log(`🔗 Socket.IO ready at ws://localhost:${PORT}/socket.io`);
    console.log(`🔗 CORS enabled for: ${conf.socket.corsOrigin}`);
  });
};
