import * as dotenv from 'dotenv';
import { Client, GatewayIntentBits } from 'discord.js';
import { registerCommands, setupCommandHandlers } from './commands/index.js';
import { onReady } from './events/ready.js';
import { consumer } from './kafka.js';
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

  // Register slash commands
  await registerCommands();

  // Setup command handlers
  setupCommandHandlers(client);

  // Start Kafka consumer after bot is ready
  await startKafkaConsumer();
});

client.login(process.env.DISCORD_TOKEN);

const startKafkaConsumer = async (): Promise<void> => {
  try {
    // Connect consumer
    await consumer.connect();
    console.log('✅ Consumer connected');

    // Subscribe to main topic only
    await consumer.subscribe({
      topics: [CONFIG.topics.main],
      fromBeginning: false,
    });
    console.log(
      `✅ Subscribed to topic: ${CONFIG.topics.main}`
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
    console.log('✅ Disconnected from Kafka');
    client.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});
