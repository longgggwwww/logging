# 📊 Log Processor Service

Service xử lý error logs từ Kafka DLQ và lưu vào PostgreSQL sử dụng Prisma ORM.

## 🏗️ Architecture

```
Kafka (logs.error.dlq) 
    ↓
Log Processor Consumer
    ↓
Prisma ORM
    ↓
PostgreSQL Database
```

## 📦 Database Schema

### Tables

1. **Projects** - Quản lý các dự án
   - `id`: UUID (Primary Key)
   - `name`: String (Unique)
   - `createdAt`, `updatedAt`: Timestamps

2. **Functions** - Quản lý các function/endpoint
   - `id`: UUID (Primary Key)
   - `name`: String
   - `projectId`: Foreign Key → Projects
   - Unique constraint: `(projectId, name)`

3. **Logs** - Lưu trữ log messages
   - `id`: UUID (Primary Key)
   - `projectId`: Foreign Key → Projects
   - `functionId`: Foreign Key → Functions
   - Message fields: method, type, request, response, etc.
   - User info: createdBy data
   - Timestamps: createdAt, updatedAt

### Indexes

Đã tạo indexes cho các truy vấn phổ biến:
- `projectId`, `functionId`
- `type`, `method`
- `createdAt`
- `responseCode`, `createdById`
- Composite indexes: `(projectId, functionId)`, `(projectId, type)`, etc.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd log-processor
npm install
```

### 2. Setup Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations (create tables)
npm run prisma:migrate

# Or push schema (for development)
npm run prisma:push
```

### 3. Configure Environment

Edit `.env` file:

```env
DATABASE_URL="postgresql://kafka_user:kafka_password@localhost:5432/kafka_db?schema=public"
KAFKA_BROKERS=localhost:19092,localhost:29092,localhost:39092
KAFKA_GROUP_ID=log-processor-group
KAFKA_CLIENT_ID=log-processor
KAFKA_TOPIC=logs.error.dlq
```

### 4. Run Service

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

## 🔧 Prisma Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Create migration
npm run prisma:migrate

# Push schema to database (development)
npm run prisma:push

# Open Prisma Studio (Database GUI)
npm run prisma:studio
```

## 📊 Prisma Studio

Để xem và quản lý dữ liệu qua giao diện web:

```bash
npm run prisma:studio
```

Truy cập: http://localhost:5555

## 🔍 Query Examples

### Find logs by project

```javascript
const logs = await prisma.log.findMany({
  where: { projectId: 'project-uuid' },
  include: {
    project: true,
    function: true
  }
});
```

### Find error logs

```javascript
const errorLogs = await prisma.log.findMany({
  where: { type: 'ERROR' },
  orderBy: { createdAt: 'desc' },
  take: 10
});
```

### Statistics by project

```javascript
const stats = await prisma.log.groupBy({
  by: ['projectId', 'type'],
  _count: true,
  where: {
    createdAt: {
      gte: new Date('2024-01-01')
    }
  }
});
```

## 🔄 Message Processing Flow

1. Consumer nhận message từ Kafka topic `logs.error.dlq`
2. Parse JSON message
3. Validate required fields
4. Tìm hoặc tạo mới Project (by name)
5. Tìm hoặc tạo mới Function (by projectId + name)
6. Tạo Log entry với đầy đủ thông tin
7. Commit offset nếu thành công

## 🛡️ Error Handling

- Validate message structure trước khi xử lý
- Log errors nhưng không crash service
- Có thể implement retry logic hoặc secondary DLQ

## 📈 Performance Optimization

- Sử dụng indexes cho các trường thường xuyên query
- JSON fields sử dụng `@db.JsonB` cho PostgreSQL
- Composite indexes cho các query phức tạp
- Connection pooling được quản lý bởi Prisma

## 🔐 Security

- Sensitive data trong `.env` không commit vào git
- Database credentials được bảo vệ
- Input validation cho message data

## 📝 Notes

- Service tự động tạo Project và Function nếu chưa tồn tại
- Timestamps được lưu theo thời gian trong message, không phải thời gian nhận
- Cascade delete: Xóa project sẽ xóa tất cả functions và logs liên quan
