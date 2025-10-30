import { app, initializeServer, shutdown } from "./src/server.js";

// Initialize connections and start server
async function startServer() {
  try {
    await initializeServer();

    app.listen(3000, () => {
      console.log(`🚀 API Server listening on port 3000`);
      console.log(`📊 Health check: http://localhost:3000/health`);
      console.log(`📝 Logs API: http://localhost:3000/v1/logs`);
      console.log(`🏗️ Projects API: http://localhost:3000/v1/projects`);
      console.log(`⚡ Functions API: http://localhost:3000/v1/functions`);
      console.log(`📈 Stats API: http://localhost:3000/v1/stats`);
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
