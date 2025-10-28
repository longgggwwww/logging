// Entry point - imports and runs the main application
import { run } from "./src/main.js";

// Start the application
run().catch((error) => {
  console.error("❌ Failed to start application:", error);
  process.exit(1);
});
