import * as dotenv from 'dotenv';
import { Client, GatewayIntentBits } from 'discord.js';
// import { loadCommands } from './commands';
import { onReady } from './events/ready.js';
import { consumer, producer } from './kafka.js';
import { CONFIG } from './config.js';
import { processMessage, setDiscordClient } from './processor.js';

// Load environment variables
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Set Discord client for processor
setDiscordClient(client);

client.once('clientReady', async () => {
  console.log('🤖 Discord bot is ready!');
  onReady();

  // Start Kafka consumer after bot is ready
  await startKafkaConsumer();
});

// loadCommands(client);

client.login(process.env.DISCORD_TOKEN);

const startKafkaConsumer = async (): Promise<void> => {
  try {
    // Connect producer first (needed for DLQ and retry if implemented)
    await producer.connect();
    console.log('✅ Producer connected');

    // Connect consumer
    await consumer.connect();
    console.log('✅ Consumer connected');

    // Subscribe to topics
    await consumer.subscribe({
      topics: [CONFIG.topics.main, CONFIG.topics.retry],
      fromBeginning: false,
    });
    console.log(
      `✅ Subscribed to topics: ${CONFIG.topics.main}, ${CONFIG.topics.retry}`
    );

    // Run consumer
    await consumer.run({
      autoCommit: true,
      autoCommitInterval: 5000,
      eachMessage: processMessage,
    });

    console.log(
      '\n🚀 Kafka consumer is running and ready to process messages...\n'
    );
  } catch (error: any) {
    console.error('❌ Fatal error starting Kafka consumer:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️  Shutting down gracefully...');
  try {
    await consumer.disconnect();
    await producer.disconnect();
    console.log('✅ Disconnected from Kafka');
    client.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});
