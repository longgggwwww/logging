import { app, shutdown } from "./src/main.js";
import { CONFIG } from "./src/config.js";

// Graceful shutdown
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// Start server
app.listen(CONFIG.port, () => {
  console.log(`🚀 API Server listening on port ${CONFIG.port}`);
  console.log(`📊 Health check: http://localhost:${CONFIG.port}/health`);
  console.log(`📝 Logs API: http://localhost:${CONFIG.port}/v1/logs`);
  console.log(`🏗️ Projects API: http://localhost:${CONFIG.port}/v1/projects`);
  console.log(`⚡ Functions API: http://localhost:${CONFIG.port}/v1/functions`);
  console.log(`📈 Stats API: http://localhost:${CONFIG.port}/v1/stats`);
});
