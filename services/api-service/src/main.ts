import { app, initializeServer, shutdown } from "./server.js";

// Start the server
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await initializeServer();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
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
