import { Client, GatewayIntentBits } from 'discord.js';
import { registerCommands, setupCommandHandlers } from './commands/index.js';
import { conf } from './config.js';
import { onReady } from './events/ready.js';
import { consumer, producer } from './kafka.js';
import { processMessage, setDiscordClient } from './processor.js';

let client: Client | null = null;
let isProducerReady = false;

export const isKafkaProducerReady = (): boolean => isProducerReady;

export const initializeBot = async (): Promise<Client> => {
  client = new Client({ intents: [GatewayIntentBits.Guilds] });

  // Set Discord client for processor
  setDiscordClient(client);

  client.once('clientReady', async () => {
    console.log('🤖 Discord bot is ready!');
    onReady();

    // Register slash commands
    await registerCommands();

    // Setup command handlers
    setupCommandHandlers(client!);

    // Start Kafka consumer after bot is ready
    await startKafkaConsumer();
  });

  await client.login(conf.discord.token);

  return client;
};

const startKafkaConsumer = async (): Promise<void> => {
  try {
    // Connect producer first
    console.log('🔌 Connecting producer...');
    await producer.connect();
    isProducerReady = true;
    console.log('✅ Producer connected');

    // Connect consumer
    console.log('🔌 Connecting consumer...');
    await consumer.connect();
    console.log('✅ Consumer connected');

    // Subscribe to main topic only
    await consumer.subscribe({
      topics: [conf.topics.main],
      fromBeginning: false,
    });
    console.log(`✅ Subscribed to topic: ${conf.topics.main}`);

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
    isProducerReady = false;
    process.exit(1);
  }
};

export const shutdown = async (): Promise<void> => {
  console.log('\n⏹️  Shutting down gracefully...');
  try {
    if (isProducerReady) {
      await producer.disconnect();
      console.log('✅ Producer disconnected from Kafka');
      isProducerReady = false;
    }
    
    await consumer.disconnect();
    console.log('✅ Consumer disconnected from Kafka');

    if (client) {
      client.destroy();
      console.log('✅ Discord client destroyed');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};
