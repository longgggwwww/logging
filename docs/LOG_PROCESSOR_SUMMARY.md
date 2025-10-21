# 📊 Log Processor Service Summary

## 🎯 Tổng Quan

Đã thiết kế và implement một service **log-processor** hoàn chỉnh sử dụng:
- **Prisma ORM** - Type-safe database client
- **PostgreSQL** - Relational database  
- **KafkaJS** - Kafka consumer
- **Docker** - Containerization

## 🗄️ Database Schema

### 1. Table `projects`
```sql
- id: UUID (Primary Key)
- name: String (Unique)
- createdAt: Timestamp
- updatedAt: Timestamp

Indexes:
- name (unique)
```

### 2. Table `functions`
```sql
- id: UUID (Primary Key)
- name: String
- projectId: UUID (Foreign Key → projects.id)
- createdAt: Timestamp
- updatedAt: Timestamp

Constraints:
- UNIQUE(projectId, name)

Indexes:
- projectId
- name
- (projectId, name) composite unique
```

### 3. Table `logs`
```sql
- id: UUID (Primary Key)
- projectId: UUID (Foreign Key → projects.id)
- functionId: UUID (Foreign Key → functions.id)

# Log Information
- method: String (GET, POST, PATCH, PUT, DELETE)
- type: String (ERROR, WARNING, INFO, SUCCESS, DEBUG)

# Request Data (All Optional, stored as JSONB)
- requestHeaders: JSONB
- requestUserAgent: Text
- requestUrl: Text
- requestParams: JSONB
- requestBody: JSONB

# Response Data (All Optional)
- responseCode: Integer
- responseSuccess: Boolean
- responseMessage: Text
- responseData: JSONB

# Additional Data
- consoleLog: Text
- additionalData: JSONB
- latency: Integer (milliseconds)

# User Information (Optional)
- createdById: String
- createdByFullname: String
- createdByEmplCode: String

# Timestamps
- createdAt: Timestamp (from message, not auto)
- updatedAt: Timestamp (auto)

Indexes:
- projectId
- functionId
- type
- method
- createdAt
- responseCode
- createdById
- (projectId, functionId) composite
- (projectId, type) composite
- (projectId, createdAt) composite
- (functionId, type) composite
```

## 🔗 Relations

```
Project (1) ──< (N) Function
Project (1) ──< (N) Log
Function (1) ──< (N) Log
```

**Cascade Delete:**
- Xóa Project → Xóa tất cả Functions và Logs
- Xóa Function → Xóa tất cả Logs

## 📁 File Structure

```
log-processor/
├── package.json              # Dependencies
├── .env                      # Environment variables
├── .gitignore               # Git ignore rules
├── Dockerfile               # Docker container config
├── index.js                 # Main consumer service
├── queries.js               # Query utility functions
├── examples.js              # Query usage examples
├── README.md                # Basic documentation
├── SETUP_GUIDE.md           # Complete setup guide
└── prisma/
    └── schema.prisma        # Prisma schema definition
```

## 🔑 Key Features

### 1. Auto-Create Projects & Functions
Service tự động tạo Project và Function nếu chưa tồn tại:
- Find or create project by `projectName`
- Find or create function by `projectId + name`

### 2. Comprehensive Indexing
Indexes được tạo cho:
- Single columns: `projectId`, `functionId`, `type`, `method`, `createdAt`
- Composite indexes: `(projectId, functionId)`, `(projectId, type)`, etc.
- Optimized cho các query phổ biến

### 3. JSONB Storage
Sử dụng PostgreSQL JSONB cho:
- Request/Response headers, body, params
- Additional data
- Efficient querying và indexing

### 4. Rich Query Utilities
File `queries.js` cung cấp:
- `getProjectsWithStats()` - Projects với số lượng functions/logs
- `getLogsByProject(projectId, page, limit)` - Logs by project với pagination
- `getRecentErrors(limit)` - Recent error logs
- `getLogStatsByType(projectId)` - Statistics by log type
- `getLogsByUser(userId, page, limit)` - Logs by user
- `getLogsByStatusCode(code, page, limit)` - Logs by HTTP status
- `getAverageLatency(projectId, functionId)` - Performance metrics
- `deleteOldLogs(daysToKeep)` - Cleanup utility

### 5. Error Handling
- Validate message structure
- Log errors without crashing
- Continue processing other messages
- Graceful shutdown (SIGTERM, SIGINT)

## 🚀 Usage

### Setup
```bash
cd log-processor
npm install
npm run prisma:generate
npm run prisma:push
```

### Run
```bash
# Development
npm run dev

# Production
npm start

# With Docker
docker-compose up -d log-processor
```

### View Data
```bash
# Prisma Studio (Web GUI)
npm run prisma:studio
# Access: http://localhost:5555

# Run query examples
node examples.js
```

## 📊 Message Processing Flow

```
1. Consumer receives message from Kafka topic: logs.error.dlq
2. Parse JSON message
3. Validate required fields (projectName, function, method, type, createdAt)
4. Find or create Project (by name)
5. Find or create Function (by projectId + name)
6. Create Log entry with full data
7. Commit offset if successful
8. Log error and continue if failed
```

## 🔧 Configuration

### Environment Variables (.env)
```env
DATABASE_URL=postgresql://kafka_user:kafka_password@localhost:5432/kafka_db
KAFKA_BROKERS=localhost:19092,localhost:29092,localhost:39092
KAFKA_GROUP_ID=log-processor-group
KAFKA_CLIENT_ID=log-processor
KAFKA_TOPIC=logs.error.dlq
NODE_ENV=development
```

### Docker Configuration
Service được thêm vào `docker-compose.yml`:
- Depends on: postgres, kafka-controller-1,2,3
- Auto-restart: unless-stopped
- Auto-push schema on startup

## 📈 Performance Optimization

1. **Indexes** - Comprehensive indexing strategy
2. **JSONB** - Native PostgreSQL JSON type
3. **Connection Pooling** - Managed by Prisma
4. **Pagination** - All list queries support pagination
5. **Batch Operations** - Can be extended for bulk inserts

## 🛡️ Security & Best Practices

✅ Environment variables không commit vào git  
✅ Input validation cho message data  
✅ Cascade delete đảm bảo data integrity  
✅ Prepared statements (via Prisma) - SQL injection safe  
✅ Type-safe queries với Prisma Client  

## 📚 Documentation Files

1. **README.md** - Overview và basic usage
2. **SETUP_GUIDE.md** - Complete setup và usage guide
3. **queries.js** - Query utilities với JSDoc comments
4. **examples.js** - Practical query examples

## 🧪 Testing

```bash
# Send test message to Kafka
./test-log-processor.sh

# View logs
docker logs -f log-processor

# Query data
cd log-processor && node examples.js
```

## ✅ Deliverables

✅ Database schema với 3 tables (Project, Function, Log)  
✅ Comprehensive indexes cho performance  
✅ Kafka consumer service  
✅ Auto-create logic cho Projects và Functions  
✅ Query utilities cho common operations  
✅ Docker integration  
✅ Complete documentation  
✅ Setup và test scripts  
✅ Example queries  
✅ Error handling và logging  
✅ Graceful shutdown  

## 🎉 Ready to Use!

Service hoàn toàn ready để:
1. Process error logs từ Kafka DLQ
2. Store vào PostgreSQL với full metadata
3. Query và analyze logs
4. Scale với Docker
5. Integrate vào existing system

Tất cả được document đầy đủ và có examples cụ thể! 🚀
