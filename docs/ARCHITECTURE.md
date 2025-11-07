# 🏗️ Kafka Error Handling Architecture

## 📊 System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         KAFKA CLUSTER (KRaft)                        │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ kafka-controller │  │ kafka-controller │  │ kafka-controller │  │
│  │        -1        │  │        -2        │  │        -3        │  │
│  │   :19092/:9092   │  │   :29092/:9092   │  │   :39092/:9092   │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                       │
│  Topics (Replication Factor: 3, Partitions: 3)                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ • error-logs          (Main topic)                           │   │
│  │ • error-logs-retry    (Retry queue)                          │   │
│  │ • error-logs-dlq      (Dead Letter Queue)                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
        ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
        │  Producer 1  │  │  Producer 2  │  │  Producer N  │
        │              │  │              │  │              │
        │ (Any apps    │  │ (Services    │  │ (Monitoring  │
        │  sending     │  │  generating  │  │  systems)    │
        │  errors)     │  │  logs)       │  │              │
        └──────────────┘  └──────────────┘  └──────────────┘
                                    │
                                    │ Publish to
                                    │ 'error-logs'
                                    │
                                    ▼
            ┌───────────────────────────────────────────┐
            │     CONSUMER GROUP: discord-group         │
            │                                           │
            │  ┌─────────────────────────────────┐     │
            │  │   Consumer (index.js)           │     │
            │  │   • Subscribe: error-logs +     │     │
            │  │                error-logs-retry │     │
            │  │   • Auto-commit: 5s interval    │     │
            │  └─────────────────────────────────┘     │
            └───────────────────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │  MESSAGE PROCESSING       │
                    │  ┌─────────────────────┐  │
                    │  │ 1. Parse JSON       │  │
                    │  │ 2. Validate schema  │  │
                    │  │ 3. Check retry info │  │
                    │  └─────────────────────┘  │
                    └───────────┬───────────────┘
                                │
                        ┌───────┴───────┐
                        │               │
                     SUCCESS         FAILED
                        │               │
                        ▼               ▼
              ┌─────────────────┐  ┌────────────────┐
              │ Send to Discord │  │ Error Handler  │
              │                 │  │                │
              │ ┌─────────────┐ │  │ Attempt < Max? │
              │ │ With Retry  │ │  └────┬──────┬────┘
              │ │ - Try 1     │ │       │      │
              │ │ - Try 2     │ │      YES    NO
              │ │ - Try 3     │ │       │      │
              │ │ (backoff)   │ │       │      │
              │ └─────────────┘ │       │      │
              └────────┬────────┘       │      │
                       │                │      │
                    SUCCESS             │      │
                       │                │      │
                       ▼                ▼      ▼
              ┌─────────────────────────────────────┐
              │          Discord Webhook            │
              │  ┌───────────────────────────────┐  │
              │  │  Rich Embed Message:          │  │
              │  │  • Title: 🚨 Error Log Alert  │  │
              │  │  • Service name               │  │
              │  │  • Timestamp                  │  │
              │  │  • Error level                │  │
              │  │  • Partition/Offset info      │  │
              │  └───────────────────────────────┘  │
              └─────────────────────────────────────┘
                       │                │      │
                       │                │      │
                       │                ▼      ▼
                       │        ┌──────────────────┐
                       │        │ error-logs-retry │
                       │        │                  │
                       │        │ Retry with delay │
                       │        │ (Exponential     │
                       │        │  Backoff)        │
                       │        └─────────┬────────┘
                       │                  │
                       │                  │ Re-process
                       │                  │
                       ├──────────────────┘
                       │
                       ▼                  ▼
              ┌─────────────────┐  ┌──────────────────┐
              │ Commit Offset   │  │ error-logs-dlq   │
              │ ✅ Success      │  │                  │
              └─────────────────┘  │ Store failed msg │
                                   │ with metadata:   │
                                   │ • Original data  │
                                   │ • Error stack    │
                                   │ • Attempt count  │
                                   │ • Timestamps     │
                                   └──────────────────┘
```

## 🔄 Message Lifecycle

### 1️⃣ Normal Flow (Success)
```
Producer → error-logs → Consumer → Discord ✅ → Commit Offset
```

### 2️⃣ Retry Flow (Temporary Failure)
```
Producer → error-logs → Consumer → Discord ❌
                         ↓
                    error-logs-retry
                         ↓ (wait + backoff)
                    Consumer (retry 1) → Discord ✅ → Commit Offset
```

### 3️⃣ DLQ Flow (Permanent Failure)
```
Producer → error-logs → Consumer → Discord ❌
                         ↓
                    error-logs-retry
                         ↓ (attempt 1) ❌
                    error-logs-retry
                         ↓ (attempt 2) ❌
                    error-logs-retry
                         ↓ (attempt 3) ❌
                    error-logs-dlq ⚰️
                         ↓
                    Manual Review/Reprocess
```

## 🎯 Configuration Details

### Kafka Cluster
- **Mode**: KRaft (no Zookeeper)
- **Brokers**: 3 nodes
- **Replication**: 3x for fault tolerance
- **Partitions**: 3 per topic for parallelism
- **Ports**: 
  - Internal: 9092 (inter-broker)
  - External: 19092, 29092, 39092 (client access)

### Consumer Configuration
```javascript
{
  groupId: 'discord-group',
  sessionTimeout: 30000,      // 30s
  heartbeatInterval: 3000,    // 3s
  maxWaitTimeInMs: 5000,      // Max wait for batch
  autoCommit: true,
  autoCommitInterval: 5000    // Commit every 5s
}
```

### Retry Configuration
```javascript
Discord Retry:
  maxRetries: 3
  retryDelay: 1000ms (base)
  backoff: Exponential (1s, 2s, 4s)

Message Retry:
  maxRetries: 3
  retryDelay: 2000ms
  queue: error-logs-retry
```

## 📊 Monitoring Points

### Metrics Tracked
- ✅ **Processed**: Successfully processed messages
- ❌ **Failed**: Messages that failed processing
- 🔄 **Retried Successfully**: Messages that succeeded after retry
- ⚰️ **Sent to DLQ**: Messages sent to dead letter queue
- 🔴 **Discord Errors**: Discord webhook failures

### Health Checks
1. **Kafka Connection**: Consumer connected to brokers
2. **Consumer Lag**: Check offset lag per partition
3. **DLQ Size**: Monitor messages in DLQ
4. **Error Rate**: Track failure ratio

## 🛡️ Fault Tolerance

### Kafka Level
- ✅ Replication Factor 3 (survives 2 broker failures)
- ✅ Multiple brokers for HA
- ✅ Auto leader election

### Application Level
- ✅ Retry mechanism with backoff
- ✅ Dead Letter Queue for failed messages
- ✅ Graceful error handling (no crashes)
- ✅ Metrics for monitoring

### Network Level
- ✅ Connection timeout: 30s
- ✅ Request timeout: 30s
- ✅ Discord timeout: 5s
- ✅ Auto-reconnect on disconnect

## 📝 Topics Schema

### error-logs (Main)
```json
{
  "timestamp": "ISO 8601 string",
  "level": "ERROR|WARNING|CRITICAL",
  "message": "Error description",
  "service": "Service name"
}
```

### error-logs-retry (Retry Queue)
```json
{
  "timestamp": "ISO 8601 string",
  "level": "ERROR|WARNING|CRITICAL",
  "message": "Error description",
  "service": "Service name",
  "_retry": {
    "attemptCount": 1,
    "lastAttempt": "ISO 8601 string",
    "nextRetryAfter": 1234567890
  }
}
```

### error-logs-dlq (Dead Letter)
```json
{
  "originalTopic": "error-logs",
  "originalPartition": 0,
  "originalOffset": "12345",
  "error": {
    "message": "Error description",
    "stack": "Stack trace",
    "timestamp": "ISO 8601 string"
  },
  "originalData": {...},
  "attemptCount": 3,
  "lastAttemptTime": "ISO 8601 string"
}
```

## 🚀 Deployment Checklist

- [ ] Kafka cluster running (3 nodes)
- [ ] Topics created (error-logs, error-logs-retry, error-logs-dlq)
- [ ] Discord webhook configured
- [ ] Consumer deployed and running
- [ ] Monitoring setup (metrics logging)
- [ ] DLQ monitoring script scheduled
- [ ] Alerting for high DLQ size
- [ ] Backup strategy for DLQ messages
