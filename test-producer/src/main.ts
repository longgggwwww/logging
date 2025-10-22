import { producer } from "./kafka/kafka.js";
import { LogMessage } from "./types/types.js";
import { message as msg0 } from "./messages/0.js";
import { message as msg1 } from "./messages/1.js";
import { message as msg2 } from "./messages/2.js";
import { message as msg3 } from "./messages/3.js";
import { message as msg4 } from "./messages/4.js";
import { message as msg5 } from "./messages/5.js";
import { message as msg6 } from "./messages/6.js";
import { message as msg7 } from "./messages/7.js";
import { message as msg8 } from "./messages/8.js";
import { message as msg9 } from "./messages/9.js";
import * as readline from "readline";

const messages: LogMessage[] = [msg0, msg1, msg2, msg3, msg4, msg5, msg6, msg7, msg8, msg9];

export const run = async (): Promise<void> => {
  await producer.connect();
  console.log("✅ Producer connected\n");

  // Prompt for sample selection and quantity
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const selectedSample = await new Promise<number>((resolve) => {
    rl.question("Enter the sample data number (0-9): ", (answer) => {
      const num = parseInt(answer, 10);
      if (isNaN(num) || num < 0 || num > 9) {
        console.log("Invalid input. Using sample 0.");
        resolve(0);
      } else {
        resolve(num);
      }
    });
  });

  const quantity = await new Promise<number>((resolve) => {
    rl.question("Enter the quantity to send: ", (answer) => {
      const num = parseInt(answer, 10);
      if (isNaN(num) || num < 1) {
        console.log("Invalid input. Using 1.");
        resolve(1);
      } else {
        resolve(num);
      }
      rl.close();
    });
  });

  console.log(`Sending ${quantity} messages of sample ${selectedSample}...\n`);

  const selectedMessage = messages[selectedSample];

  // Send the selected message quantity times
  for (let i = 0; i < quantity; i++) {
    try {
      const messageValue = JSON.stringify(selectedMessage);

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

      console.log(
        `📨 [${i + 1}/${quantity}] Sent ${selectedMessage.type || "INVALID"} message to 2 topics:`,
      );
      console.log(`   Topics: all_users, error-logs`);
      console.log(`   Project: ${selectedMessage.project || "N/A"}`);
      console.log(`   Function: ${selectedMessage.function || "[MISSING]"}`);
      console.log(`   Method: ${selectedMessage.method || "[MISSING]"}`);
      if (selectedMessage.response && selectedMessage.response.message) {
        console.log(`   Message: ${selectedMessage.response.message}`);
      }
      console.log(`   Latency: ${selectedMessage.latency || "[MISSING]"}ms\n`);

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
  console.log(`   - Sample: ${selectedSample}`);
  console.log(`   - Total messages: ${quantity}`);
  console.log(`   - Project: ${selectedMessage.project || "N/A"}`);
  console.log(`   - Type: ${selectedMessage.type || "INVALID"}`);
  console.log("   - Topics: all_users, error-logs");
  console.log("\n💡 Check consumer logs to see processing in action!");

  await producer.disconnect();
};

// ============================================
// START APPLICATION
// ============================================
run().catch(console.error);
