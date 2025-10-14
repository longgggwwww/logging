import { PrismaClient } from '@prisma/client';
import { Kafka } from 'kafkajs';

const prisma = new PrismaClient();

// Kafka configuration
const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'log-processor',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:19092,localhost:29092,localhost:39092').split(','),
  connectionTimeout: 30000,
  requestTimeout: 30000,
  retry: {
    initialRetryTime: 300,
    retries: 8
  }
});

const consumer = kafka.consumer({ 
  groupId: process.env.KAFKA_GROUP_ID || 'log-processor-group',
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
  maxWaitTimeInMs: 5000
});

// Graceful shutdown
async function shutdown() {
  console.log('⏳ Shutting down gracefully...');
  try {
    await consumer.disconnect();
    await prisma.$disconnect();
    console.log('✅ Kafka consumer disconnected');
    console.log('✅ Prisma client disconnected');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Main processing function
async function processLogMessage(message) {
  try {
    const log = JSON.parse(message.value.toString());
    
    // Validate required fields
    if (!log.projectName || !log.function || !log.method || !log.type || !log.createdAt) {
      console.error('❌ Invalid log message - missing required fields:', log);
      return;
    }

    // Find or create project
    let project = await prisma.project.findUnique({
      where: { name: log.projectName }
    });

    if (!project) {
      project = await prisma.project.create({
        data: { name: log.projectName }
      });
      console.log(`✅ Created new project: ${log.projectName}`);
    }

    // Find or create function
    let func = await prisma.function.findUnique({
      where: { 
        projectId_name: {
          projectId: project.id,
          name: log.function
        }
      }
    });

    if (!func) {
      func = await prisma.function.create({
        data: {
          name: log.function,
          projectId: project.id
        }
      });
      console.log(`✅ Created new function: ${log.function} for project: ${log.projectName}`);
    }

    // Create log entry
    await prisma.log.create({
      data: {
        projectId: project.id,
        functionId: func.id,
        method: log.method,
        type: log.type,
        
        // Request data
        requestHeaders: log.request?.headers || null,
        requestUserAgent: log.request?.userAgent || null,
        requestUrl: log.request?.url || null,
        requestParams: log.request?.params || null,
        requestBody: log.request?.body || null,
        
        // Response data
        responseCode: log.response?.code || null,
        responseSuccess: log.response?.success ?? null,
        responseMessage: log.response?.message || null,
        responseData: log.response?.data || null,
        
        // Additional data
        consoleLog: log.consoleLog || null,
        additionalData: log.additionalData || null,
        latency: log.latency || null,
        
        // User data
        createdById: log.createdBy?.id || null,
        createdByFullname: log.createdBy?.fullname || null,
        createdByEmplCode: log.createdBy?.emplCode || null,
        
        // Timestamps
        createdAt: new Date(log.createdAt),
      }
    });

    console.log(`✅ Processed log: ${log.type} - ${log.projectName}/${log.function} - ${log.method}`);
  } catch (error) {
    console.error('❌ Error processing message:', error);
    throw error;
  }
}

// Start consumer
async function run() {
  const topic = process.env.KAFKA_TOPIC || 'error-logs';
  
  try {
    // Connect to Kafka
    console.log('🔌 Connecting to Kafka...');
    await consumer.connect();
    console.log('✅ Connected to Kafka');

    // Wait a bit for metadata to sync
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Subscribe to topic
    console.log(`📝 Subscribing to topic: ${topic}...`);
    await consumer.subscribe({ 
      topic,
      fromBeginning: true 
    });
    console.log(`✅ Subscribed to topic: ${topic}`);
    console.log(`🔍 Topic value confirmed: ${topic}`);

    // Run consumer
    await consumer.run({
      autoCommit: true,
      autoCommitInterval: 5000,
      eachMessage: async ({ topic, partition, message }) => {
        console.log(`\n📨 Received message from ${topic} [${partition}] at offset ${message.offset}`);
        console.log(`📋 Message value: ${message.value.toString().substring(0, 100)}...`);
        try {
          await processLogMessage(message);
        } catch (error) {
          console.error('❌ Failed to process message:', error);
          console.error('Error details:', error.message);
          console.error('Error stack:', error.stack);
          // Could implement retry logic or send to another DLQ here
        }
      },
    });

    console.log('🚀 Log processor service is running...');
    console.log(`👂 Listening for messages on topic: ${topic}`);
  } catch (error) {
    console.error('❌ Error starting consumer:', error);
    console.error('Error details:', error.message);
    
    if (error.type === 'UNKNOWN_TOPIC_OR_PARTITION') {
      console.error(`\n💡 Topic "${topic}" might not exist or is not ready.`);
      console.error('Please ensure the topic exists by running:');
      console.error(`docker exec kafka-controller-1 /opt/kafka/bin/kafka-topics.sh \\`);
      console.error(`  --bootstrap-server localhost:9092 \\`);
      console.error(`  --create --if-not-exists \\`);
      console.error(`  --topic ${topic} \\`);
      console.error(`  --partitions 3 \\`);
      console.error(`  --replication-factor 3`);
    }
    
    console.error('\n⏳ Retrying in 10 seconds...');
    setTimeout(() => {
      run();
    }, 10000);
  }
}

// Test database connection
prisma.$connect()
  .then(() => {
    console.log('✅ Connected to PostgreSQL');
    run();
  })
  .catch((error) => {
    console.error('❌ Failed to connect to PostgreSQL:', error);
    process.exit(1);
  });
