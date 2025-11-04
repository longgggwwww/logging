// Entry point - imports and runs the main application
import { run } from "./src/main.js";

// Start the application
run().catch((err) => {
  console.error("❌ Failed to start application:", err);
  process.exit(1);
});
