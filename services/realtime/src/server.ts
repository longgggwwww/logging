import { io } from './app.js';
import { conf } from './config.js';

const PORT = conf.socket.port;

export const startServer = () => {
  io.listen(PORT);
  console.log(`🚀 Socket.IO server listening on port ${PORT}`);
  console.log(`🔗 CORS enabled for: ${conf.socket.corsOrigin}`);
};
