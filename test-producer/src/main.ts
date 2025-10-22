import { producer } from "./kafka.js";
import { testMessages } from "./messages.js";
import { LogMessage } from "./types.js";
import * as readline from "readline";

export const run = async (): Promise<void> => {
  await producer.connect();
  console.log("✅ Producer connected\n");

  // Prompt for number of messages
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const numMessages = await new Promise<number>((resolve) => {
    rl.question("Enter the number of messages to send (max " + testMessages.length + "): ", (answer) => {
      const num = parseInt(answer, 10);
      if (isNaN(num) || num < 1 || num > testMessages.length) {
        console.log("Invalid input. Using all messages.");
        resolve(testMessages.length);
      } else {
        resolve(num);
      }
      rl.close();
    });
  });

  console.log(`Sending ${numMessages} messages...\n`);

  // Send each message to both topics
  for (let i = 0; i < numMessages; i++) {
    try {
      const messageValue = JSON.stringify(testMessages[i]);

      // Send to topic all_users
      await producer.send({
        topic: "all_users",
        messages: [
          {
            value: messageValue,
          },
        ],
      });

      // Send to topic error-logs
      await producer.send({
        topic: "error-logs",
        messages: [
          {
            value: messageValue,
          },
        ],
      });

      const msg = testMessages[i] as LogMessage;
      console.log(
        `📨 [${i + 1}/${testMessages.length}] Sent ${msg.type || "INVALID"} message to 2 topics:`,
      );
      console.log(`   Topics: all_users, error-logs`);
      console.log(`   Project: ${msg.project || "N/A"}`);
      console.log(`   Function: ${msg.function || "[MISSING]"}`);
      console.log(`   Method: ${msg.method || "[MISSING]"}`);
      if (msg.response && msg.response.message) {
        console.log(`   Message: ${msg.response.message}`);
      }
      console.log(`   Latency: ${msg.latency || "[MISSING]"}ms\n`);

      // Delay between messages
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(
        `❌ Error sending message ${i + 1}:`,
        (error as Error).message,
      );
    }
  }

  console.log("\n✅ Sent all test messages");
  console.log("📋 Summary:");
  console.log(`   - Total messages: ${numMessages}`);
  console.log(
    "   - Projects: 6 (ecommerce, crm, inventory, analytics, hr, notification)",
  );
  console.log("   - Valid messages: 13");
  console.log("   - Invalid messages (will go to DLQ): 2");
  console.log("   - Topics: all_users, error-logs");
  console.log("\n💡 Check consumer logs to see processing in action!");

  await producer.disconnect();
};

// ============================================
// START APPLICATION
// ============================================
run().catch(console.error);
