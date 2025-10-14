# 📊 Log Processor Service - Setup & Usage Guide

## 🎯 Overview

Service **log-processor** là một Kafka consumer xử lý các error logs từ DLQ (Dead Letter Queue) và lưu trữ vào PostgreSQL database sử dụng Prisma ORM.

## 🏗️ Database Schema

### Tables & Relations

```
┌─────────────┐
│  Project    │
│─────────────│      1:N
│ id (PK)     │◄──────────┐
│ name (UQ)   │           │
│ createdAt   │           │
│ updatedAt   │           │
└─────────────┘           │
                          │
                    ┌─────┴──────┐
                    │  Function  │
                    │────────────│      1:N
                    │ id (PK)    │◄──────────┐
                    │ name       │           │
                    │ projectId  │           │
                    │ createdAt  │           │
                    │ updatedAt  │           │
                    └────────────┘           │
                                             │
                                       ┌─────┴────┐
                                       │   Log    │
                                       │──────────│
                                       │ id (PK)  │
                                       │ projectId│
                                       │ functionId│
                                       │ method   │
                                       │ type     │
                                       │ request* │
                                       │ response*│
                                       │ ...      │
                                       └──────────┘
```

### Indexes

**Project:**
- `name` (unique index)

**Function:**
- `(projectId, name)` (unique composite)
- `projectId`
- `name`

**Log:**
- `projectId`
- `functionId`
- `type`
- `method`
- `createdAt`
- `(projectId, functionId)` (composite)
- `(projectId, type)` (composite)
- `(projectId, createdAt)` (composite)
- `(functionId, type)` (composite)
- `responseCode`
- `createdById`

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
cd log-processor
npm install
```

### 2. Configure Environment

File `.env` đã được tạo sẵn với cấu hình mặc định:

```env
DATABASE_URL="postgresql://kafka_user:kafka_password@localhost:5432/kafka_db?schema=public"
KAFKA_BROKERS=localhost:19092,localhost:29092,localhost:39092
KAFKA_GROUP_ID=log-processor-group
KAFKA_CLIENT_ID=log-processor
KAFKA_TOPIC=logs.error.dlq
NODE_ENV=development
```

### 3. Setup Database Schema

```bash
# Generate Prisma Client
npm run prisma:generate

# Push schema to database (recommended for development)
npm run prisma:push

# Or create migration (recommended for production)
npm run prisma:migrate
```

### 4. Start Service

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

## 🐳 Docker Deployment

Service đã được cấu hình trong `docker-compose.yml`:

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker logs -f log-processor

# Stop service
docker-compose stop log-processor

# Rebuild service
docker-compose up -d --build log-processor
```

## 📨 Message Format

Service expects messages in the following format:

```json
{
  "projectName": "myapp",
  "function": "login",
  "method": "POST",
  "type": "ERROR",
  "request": {
    "headers": {},
    "userAgent": "Mozilla/5.0...",
    "url": "/api/auth/login",
    "params": {},
    "body": {}
  },
  "response": {
    "code": 500,
    "success": false,
    "message": "Login failed",
    "data": []
  },
  "consoleLog": "Error: Database connection failed",
  "createdAt": "2023-10-05T12:34:56.789Z",
  "createdBy": {
    "id": "user123",
    "fullname": "Nguyen Van A",
    "emplCode": "EMP001"
  },
  "additionalData": {},
  "latency": 1250
}
```

### Required Fields
- `projectName` (String)
- `function` (String)
- `method` (String)
- `type` (String)
- `createdAt` (ISO 8601 timestamp)

### Optional Fields
- `request`, `response`, `consoleLog`, `createdBy`, `additionalData`, `latency`

## 🧪 Testing

### Send Test Message

```bash
# Make script executable
chmod +x test-log-processor.sh

# Run test
./test-log-processor.sh
```

### Run Query Examples

```bash
cd log-processor
node examples.js
```

## 🔍 Querying Data

### Using Prisma Studio (GUI)

```bash
cd log-processor
npm run prisma:studio
```

Access at: http://localhost:5555

### Using Code

Import query utilities:

```javascript
import {
  getProjectsWithStats,
  getLogsByProject,
  getRecentErrors,
  getLogStatsByType
} from './queries.js';

// Get all projects with counts
const projects = await getProjectsWithStats();

// Get logs by project (with pagination)
const logs = await getLogsByProject(projectId, page, limit);

// Get recent errors
const errors = await getRecentErrors(50);

// Get statistics
const stats = await getLogStatsByType(projectId);
```

## 📊 Common Queries

### 1. Find all errors in last 24 hours

```javascript
const errors = await prisma.log.findMany({
  where: {
    type: 'ERROR',
    createdAt: {
      gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
    }
  },
  include: {
    project: true,
    function: true
  }
});
```

### 2. Get error count by project

```javascript
const stats = await prisma.log.groupBy({
  by: ['projectId'],
  where: { type: 'ERROR' },
  _count: true
});
```

### 3. Find slowest requests

```javascript
const slowRequests = await prisma.log.findMany({
  where: {
    latency: { gte: 5000 } // > 5 seconds
  },
  orderBy: { latency: 'desc' },
  take: 10
});
```

### 4. Get logs by user

```javascript
const userLogs = await prisma.log.findMany({
  where: {
    createdById: 'user123'
  },
  include: {
    project: true,
    function: true
  }
});
```

## 🔧 Maintenance

### Cleanup Old Logs

```javascript
import { deleteOldLogs } from './queries.js';

// Delete logs older than 90 days
const result = await deleteOldLogs(90);
console.log(`Deleted ${result.count} old logs`);
```

### Database Backup

```bash
# Backup database
docker exec postgres pg_dump -U kafka_user kafka_db > backup.sql

# Restore database
docker exec -i postgres psql -U kafka_user kafka_db < backup.sql
```

## 📈 Performance Tips

1. **Indexes**: Schema đã có indexes cho các query phổ biến
2. **JsonB**: Sử dụng `@db.JsonB` cho JSON fields (tối ưu cho PostgreSQL)
3. **Pagination**: Luôn sử dụng pagination cho large datasets
4. **Connection Pooling**: Prisma tự động quản lý connection pool

## 🛡️ Error Handling

Service có xử lý các trường hợp:

1. **Invalid message format**: Log error nhưng không crash
2. **Database connection lost**: Retry logic (managed by Prisma)
3. **Kafka connection issues**: Auto-reconnect (managed by KafkaJS)
4. **Duplicate projects/functions**: Auto-detect và sử dụng existing records

## 🔐 Security Notes

- `.env` file không được commit vào git
- Database credentials được bảo vệ
- Input validation cho message data
- Cascade delete đảm bảo data integrity

## 📝 Scripts Reference

```bash
npm start              # Start service
npm run dev            # Development mode with auto-reload
npm run prisma:generate # Generate Prisma Client
npm run prisma:migrate  # Create/run migrations
npm run prisma:push     # Push schema (dev only)
npm run prisma:studio   # Open Prisma Studio GUI
node examples.js        # Run query examples
```

## 🐛 Troubleshooting

### Issue: "Can't reach database server"

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check connection
docker exec postgres psql -U kafka_user -d kafka_db -c "SELECT 1"
```

### Issue: "Kafka connection timeout"

```bash
# Check Kafka brokers
docker ps | grep kafka

# Check topics
docker exec kafka-controller-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 --list
```

### Issue: "Prisma Client not generated"

```bash
cd log-processor
npm run prisma:generate
```

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [KafkaJS Documentation](https://kafka.js.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 🎉 Success Indicators

Service is working correctly when you see:

```
✅ Connected to PostgreSQL
✅ Connected to Kafka
✅ Subscribed to topic: logs.error.dlq
🚀 Log processor service is running...
```

When processing messages:

```
📨 Received message from logs.error.dlq [0] at offset 123
✅ Processed log: ERROR - myapp/login - POST
```
