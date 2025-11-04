import { app, initializeServer, shutdown } from "./server.js";

const PORT = process.env.PORT || 3000;

// ============================================
// START SERVER
// ============================================
async function start() {
  try {
    await initializeServer();
    app.listen(PORT, () => {
      console.log(`🚀 API Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

// ============================================
// SIGNAL HANDLERS
// ============================================
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

start();
