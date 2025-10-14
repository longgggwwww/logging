# 🏗️ Log Processor Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         KAFKA CLUSTER (3 Brokers)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │  Controller  │  │  Controller  │  │  Controller  │                 │
│  │      1       │  │      2       │  │      3       │                 │
│  └──────────────┘  └──────────────┘  └──────────────┘                 │
│                                                                          │
│  Topics:                                                                 │
│  • error-logs                                                           │
│  • error-logs-retry                                                     │
│  • error-logs-dlq                                                       │
│  • logs.error.dlq  ◄─── Log Processor consumes from this               │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Kafka Consumer
                                    │ (KafkaJS)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        LOG PROCESSOR SERVICE                            │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  index.js - Main Consumer Service                              │   │
│  │  • Connect to Kafka                                             │   │
│  │  • Subscribe to logs.error.dlq                                  │   │
│  │  • Process messages                                             │   │
│  │  • Validate & parse JSON                                        │   │
│  │  • Find/Create Project & Function                               │   │
│  │  • Insert Log record                                            │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│                                    │ Prisma Client                      │
│                                    │ (Type-safe ORM)                    │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  Prisma ORM Layer                                               │   │
│  │  • Schema validation                                            │   │
│  │  • Connection pooling                                           │   │
│  │  • Query builder                                                │   │
│  │  • Type-safe operations                                         │   │
│  └────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ SQL Queries
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         PostgreSQL DATABASE                             │
│                                                                          │
│  ┌──────────────────┐     ┌──────────────────┐     ┌────────────────┐ │
│  │    projects      │     │    functions     │     │      logs      │ │
│  │──────────────────│     │──────────────────│     │────────────────│ │
│  │ id (PK)          │◄─┐  │ id (PK)          │◄─┐  │ id (PK)        │ │
│  │ name (UQ)        │  │  │ name             │  │  │ projectId (FK) │─┤
│  │ createdAt        │  └──│ projectId (FK)   │  └──│ functionId (FK)│─┤
│  │ updatedAt        │     │ createdAt        │     │ method         │ │
│  │                  │     │ updatedAt        │     │ type           │ │
│  │ Indexes:         │     │                  │     │ request*       │ │
│  │ • name           │     │ Indexes:         │     │ response*      │ │
│  └──────────────────┘     │ • projectId      │     │ consoleLog     │ │
│                            │ • name           │     │ latency        │ │
│                            │ • (projectId,    │     │ createdBy*     │ │
│                            │    name) UQ      │     │ createdAt      │ │
│                            └──────────────────┘     │ updatedAt      │ │
│                                                      │                │ │
│                                                      │ Indexes:       │ │
│                                                      │ • projectId    │ │
│                                                      │ • functionId   │ │
│                                                      │ • type         │ │
│                                                      │ • method       │ │
│                                                      │ • createdAt    │ │
│                                                      │ • responseCode │ │
│                                                      │ • + composites │ │
│                                                      └────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Queries
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         QUERY INTERFACES                                │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  Prisma Studio (Web GUI)                                        │   │
│  │  http://localhost:5555                                          │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  queries.js - Utility Functions                                 │   │
│  │  • getProjectsWithStats()                                       │   │
│  │  • getLogsByProject(projectId, page, limit)                     │   │
│  │  • getRecentErrors(limit)                                       │   │
│  │  • getLogStatsByType(projectId)                                 │   │
│  │  • getLogsByUser(userId, page, limit)                           │   │
│  │  • getAverageLatency(projectId, functionId)                     │   │
│  │  • ... and more                                                 │   │
│  └────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Message Flow

```
1. Application Error Occurs
         │
         ▼
2. Error Message Sent to Kafka
         │
         ├─► error-logs (main topic)
         │       │
         │       ├─► Discord Webhook Service
         │       └─► FCM Service
         │
         └─► logs.error.dlq (DLQ topic)
                 │
                 ▼
3. Log Processor Consumes Message
         │
         ├─► Validate Message
         │
         ├─► Parse JSON
         │
         ├─► Find/Create Project
         │       │
         │       └─► SELECT * FROM projects WHERE name = ?
         │           If not found: INSERT INTO projects
         │
         ├─► Find/Create Function  
         │       │
         │       └─► SELECT * FROM functions 
         │           WHERE projectId = ? AND name = ?
         │           If not found: INSERT INTO functions
         │
         └─► Insert Log Record
                 │
                 └─► INSERT INTO logs (
                       projectId, functionId, method, type,
                       requestHeaders, requestUserAgent, requestUrl,
                       requestParams, requestBody, responseCode,
                       responseSuccess, responseMessage, responseData,
                       consoleLog, additionalData, latency,
                       createdById, createdByFullname, 
                       createdByEmplCode, createdAt
                     )
                     │
                     ▼
4. Data Stored Successfully
         │
         └─► Available for Querying
                 │
                 ├─► Prisma Studio
                 ├─► Query Functions
                 └─► Analytics
```

## Data Relationships

```
Project "myapp"
    │
    ├─► Function "login"
    │       │
    │       ├─► Log #1 (ERROR - 500)
    │       ├─► Log #2 (ERROR - 401)
    │       └─► Log #3 (SUCCESS - 200)
    │
    ├─► Function "register"
    │       │
    │       └─► Log #4 (ERROR - 400)
    │
    └─► Function "getUserById"
            │
            ├─► Log #5 (ERROR - 404)
            └─► Log #6 (SUCCESS - 200)
```

## Query Examples Flow

```
User Request: "Get all error logs for myapp project"
         │
         ▼
getLogsByProject("myapp-uuid", 1, 20)
         │
         ▼
Prisma Query:
    SELECT logs.*, projects.*, functions.*
    FROM logs
    JOIN projects ON logs.projectId = projects.id
    JOIN functions ON logs.functionId = functions.id
    WHERE logs.projectId = 'myapp-uuid'
    ORDER BY logs.createdAt DESC
    LIMIT 20 OFFSET 0
         │
         ▼
Result: Paginated list of logs with relations
         │
         └─► {
               data: [ {...}, {...}, ... ],
               pagination: {
                 page: 1,
                 limit: 20,
                 total: 150,
                 totalPages: 8
               }
             }
```

## Docker Deployment

```
┌─────────────────────────────────────────────────────────────┐
│  Docker Compose Network: kafka-network                      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  PostgreSQL  │  │    Kafka     │  │     Kafka    │     │
│  │  Container   │  │ Controller 1 │  │ Controller 2 │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │             │
│         │                  │                  │             │
│  ┌──────▼──────────────────▼──────────────────▼───────┐   │
│  │                                                      │   │
│  │           Log Processor Container                   │   │
│  │                                                      │   │
│  │  • Auto push Prisma schema on startup               │   │
│  │  • Connect to PostgreSQL                            │   │
│  │  • Connect to Kafka                                 │   │
│  │  • Start consuming messages                         │   │
│  │  • Restart: unless-stopped                          │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Index Strategy Visualization

```
logs table: 1,000,000 records

Query: "Get errors for project X in last 24h"
         │
         ▼
WHERE projectId = 'X'        ◄── Uses index: projectId
  AND type = 'ERROR'         ◄── Uses index: (projectId, type) composite
  AND createdAt > '...'      ◄── Uses index: (projectId, createdAt) composite
         │
         ▼
Result: Fast query (~10ms) instead of full table scan (~5000ms)
```

## Scalability

```
Current:
  1 Log Processor Instance
  1 PostgreSQL Instance
  3 Kafka Brokers

Scale Horizontally:
  ├─► Add more Log Processor instances
  │   (Kafka consumer group will auto-balance partitions)
  │
  ├─► Add PostgreSQL read replicas
  │   (For analytics queries)
  │
  └─► Add more Kafka partitions
      (Better parallelism)

Scale Vertically:
  ├─► Increase PostgreSQL resources
  │   (More RAM for caching, faster disk)
  │
  └─► Increase Log Processor resources
      (More CPU for message processing)
```
