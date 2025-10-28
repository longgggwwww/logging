import { producer } from "./kafka.js";
import { LogMessage } from "./types.js";
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

// ============================================
// CONSTANTS
// ============================================
const topics = process.env.TOPICS ? process.env.TOPICS.split(",") : [];

const messages: LogMessage[][] = [
  [
    msg0,
    msg1,
    msg2,
    msg3,
    msg4,
    msg5,
    msg6,
    msg7,
    msg8,
    msg9,
    msg10,
    msg11,
    msg12,
    msg13,
    msg14,
    msg15,
    msg16,
    msg17,
    msg18,
    msg19,
  ],
];

// ============================================
// MAIN RUN FUNCTION
// ============================================
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

  console.log(
    `Sending ${selectedMessages.length} messages of sample ${selectedSample}...\n`,
  );

  // Send each message in the selected sample
  for (let i = 0; i < selectedMessages.length; i++) {
    const currentMessage = selectedMessages[i];
    try {
      const messageValue = JSON.stringify(currentMessage);

      // Send to topic error-logs
      await Promise.all([
        topics.forEach(async (topic) => {
          await producer.send({
            topic: topic,
            messages: [{ value: messageValue }],
          });
        }),
      ]);

      console.log(
        `✅ Sent message ${i + 1}/${selectedMessages.length} to topics:`,
      );
      console.log(`Topics: ${topics.join(", ")}`);
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
  console.log(`   - Topics: ${topics.join(", ")}`);
  console.log("\n💡 Check consumer logs to see processing in action!");

  await producer.disconnect();
};

// ============================================
// START APPLICATION
// ============================================
run().catch(console.error);
