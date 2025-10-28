import { app, initializeServer, shutdown } from "./src/server.js";
import { CONFIG } from "./src/config.js";

// Initialize connections and start server
async function startServer() {
  try {
    await initializeServer();

    app.listen(CONFIG.port, () => {
      console.log(`🚀 API Server listening on port ${CONFIG.port}`);
      console.log(`📊 Health check: http://localhost:${CONFIG.port}/health`);
      console.log(`📝 Logs API: http://localhost:${CONFIG.port}/v1/logs`);
      console.log(
        `🏗️ Projects API: http://localhost:${CONFIG.port}/v1/projects`,
      );
      console.log(
        `⚡ Functions API: http://localhost:${CONFIG.port}/v1/functions`,
      );
      console.log(`📈 Stats API: http://localhost:${CONFIG.port}/v1/stats`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

startServer();
