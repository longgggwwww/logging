import { app, initializeServer, shutdown } from "./server.js";

// ============================================
// STARTUP
// ============================================
async function startServer() {
  try {
    await initializeServer();

    app.listen(3000, () => {
      console.log("🚀 Server running on port 3000");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

startServer();
