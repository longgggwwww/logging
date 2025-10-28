import { producer } from "./kafka/kafka.js";
import { LogMessage } from "./types/types.js";
import { CONFIG } from "./config/config.js";
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
import { message as msg10 } from "./messages/10.js";
import { message as msg11 } from "./messages/11.js";
import { message as msg12 } from "./messages/12.js";
import { message as msg13 } from "./messages/13.js";
import { message as msg14 } from "./messages/14.js";
import { message as msg15 } from "./messages/15.js";
import { message as msg16 } from "./messages/16.js";
import { message as msg17 } from "./messages/17.js";
import { message as msg18 } from "./messages/18.js";
import { message as msg19 } from "./messages/19.js";
import * as readline from "readline";

const messages: LogMessage[][] = [
  [
    msg0, msg1, msg2, msg3, msg4, msg5, msg6, msg7, msg8, msg9,
    msg10, msg11, msg12, msg13, msg14, msg15, msg16, msg17, msg18, msg19
  ]
];

export const run = async (): Promise<void> => {
  await producer.connect();
  console.log("✅ Producer connected\n");

  // Prompt for sample selection
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const selectedSample = await new Promise<number>((resolve) => {
    rl.question("Enter the sample data number (0): ", (answer) => {
      const num = parseInt(answer, 10);
      if (isNaN(num) || num !== 0) {
        console.log("Invalid input. Using sample 0.");
        resolve(0);
      } else {
        resolve(num);
      }
      rl.close();
    });
  });

  const selectedMessages = messages[selectedSample];

  console.log(`Sending ${selectedMessages.length} messages of sample ${selectedSample}...\n`);

  // Send each message in the selected sample
  for (let i = 0; i < selectedMessages.length; i++) {
    const currentMessage = selectedMessages[i];
    try {
      const messageValue = JSON.stringify(currentMessage);

      // Send to topic all_users
      await producer.send({
        topic: CONFIG.topics.allUsers,
        messages: [
          {
            value: messageValue,
          },
        ],
      });

      // Send to topic error-logs
      await producer.send({
        topic: CONFIG.topics.main,
        messages: [
          {
            value: messageValue,
          },
        ],
      });

      console.log(
        `📨 [${i + 1}/${selectedMessages.length}] Sent ${currentMessage.type || "INVALID"} message to 2 topics:`,
      );
      console.log(`   Topics: ${CONFIG.topics.allUsers}, ${CONFIG.topics.main}`);
      console.log(`   Project: ${currentMessage.project || "N/A"}`);
      console.log(`   Function: ${currentMessage.function || "[MISSING]"}`);
      console.log(`   Method: ${currentMessage.method || "[MISSING]"}`);
      if (currentMessage.response && currentMessage.response.message) {
        console.log(`   Message: ${currentMessage.response.message}`);
      }
      console.log(`   Latency: ${currentMessage.latency || "[MISSING]"}ms\n`);

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
  console.log(`   - Total messages: ${selectedMessages.length}`);
  console.log(`   - Topics: ${CONFIG.topics.allUsers}, ${CONFIG.topics.main}`);
  console.log("\n💡 Check consumer logs to see processing in action!");

  await producer.disconnect();
};

// ============================================
// START APPLICATION
// ============================================
run().catch(console.error);
