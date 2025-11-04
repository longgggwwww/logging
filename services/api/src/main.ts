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
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

startServer();
