# Realtime Service

WebSocket service for pushing real-time log messages to web-app clients.

## Features

- Consumes log messages from Kafka
- Broadcasts logs to connected web-app clients via Socket.IO
- CORS support for web-app connection
- Real-time monitoring and metrics

## Environment Variables

```env
# Kafka Configuration
KAFKA_BROKERS=kafka1:9092,kafka2:9092,kafka3:9092
KAFKA_MAIN_TOPIC=error-logs
KAFKA_DLQ_TOPIC=error-logs-dlq
KAFKA_RETRY_TOPIC=error-logs-retry

# WebSocket Configuration
SOCKET_PORT=8080
CORS_ORIGIN=http://localhost:8000
```

## Usage

```bash
# Install dependencies
npm install

# Build
npm run build

# Start
npm start

# Development
npm run dev
```

## Socket.IO Events

### Client -> Server
- `subscribe` - Subscribe to log updates
- `unsubscribe` - Unsubscribe from log updates

### Server -> Client
- `new_log` - New log message received
- `metrics` - Service metrics update
