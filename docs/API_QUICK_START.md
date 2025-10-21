# API Service Quick Start Guide

## 📋 Overview

API service cung cấp RESTful API để truy vấn logs với Redis caching để tối ưu hiệu suất.

## 🚀 Quick Start

### 1. Start all services

```bash
# Start Redis, PostgreSQL, Kafka, Log Processor, and API Service
docker-compose up -d

# Check services status
docker-compose ps
```

### 2. Verify API is running

```bash
# Health check
curl http://localhost:3000/health

# Should return:
# {
#   "status": "healthy",
#   "timestamp": "2025-01-14T...",
#   "services": {
#     "database": "up",
#     "redis": "up"
#   }
# }
```

### 3. Test API endpoints

```bash
# Run the test script
./test-api.sh
```

## 📖 API Endpoints

### 1. List Logs - GET /v1/logs

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| projectId | string | Filter by project ID | `?projectId=xxx` |
| functionId | string | Filter by function ID | `?functionId=yyy` |
| method | string | Filter by HTTP method | `?method=GET` |
| level | string | Filter by log level | `?level=ERROR` |
| timeRange | string | Predefined time range | `?timeRange=24h` |
| startTime | string | Custom start time (ISO 8601) | `?startTime=2025-01-01T00:00:00Z` |
| endTime | string | Custom end time (ISO 8601) | `?endTime=2025-01-31T23:59:59Z` |
| cursorId | string | Cursor for pagination | `?cursorId=xxx` |
| take | number | Number of results (max 1000) | `?take=50` |

**Time Range Options:**
- `15m` - Last 15 minutes
- `30m` - Last 30 minutes
- `1h` - Last 1 hour
- `3h` - Last 3 hours
- `6h` - Last 6 hours
- `12h` - Last 12 hours
- `24h` - Last 24 hours (default)
- `7d` - Last 7 days
- `30d` - Last 30 days

**Log Level Options:**
- `DEBUG`
- `SUCCESS`
- `INFO`
- `WARNING`
- `ERROR`

**Examples:**

```bash
# Get all ERROR logs from last 24 hours
curl "http://localhost:3000/v1/logs?level=ERROR&timeRange=24h"

# Get POST method logs from last 1 hour
curl "http://localhost:3000/v1/logs?method=POST&timeRange=1h&take=100"

# Get logs for specific project
curl "http://localhost:3000/v1/logs?projectId=xxx&take=50"

# Get logs with pagination
curl "http://localhost:3000/v1/logs?take=50"
# Then use nextCursor from response for next page
curl "http://localhost:3000/v1/logs?take=50&cursorId=xxx"

# Custom time range
curl "http://localhost:3000/v1/logs?startTime=2025-01-01T00:00:00Z&endTime=2025-01-31T23:59:59Z"

# Combine multiple filters
curl "http://localhost:3000/v1/logs?projectId=xxx&level=ERROR&method=POST&timeRange=7d&take=100"
```

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "projectId": "uuid",
      "functionId": "uuid",
      "method": "GET",
      "type": "ERROR",
      "requestHeaders": {},
      "requestUrl": "/api/endpoint",
      "responseCode": 500,
      "responseMessage": "Internal Server Error",
      "createdAt": "2025-01-14T10:00:00Z",
      "project": {
        "id": "uuid",
        "name": "my-project"
      },
      "function": {
        "id": "uuid",
        "name": "getUserById"
      }
    }
  ],
  "pagination": {
    "nextCursor": "uuid",
    "hasMore": true,
    "count": 50
  },
  "filters": {
    "projectId": null,
    "functionId": null,
    "method": null,
    "level": "ERROR",
    "timeRange": "24h"
  }
}
```

### 2. Get Log by ID - GET /v1/logs/:log_id

**Example:**

```bash
curl "http://localhost:3000/v1/logs/550e8400-e29b-41d4-a716-446655440000"
```

**Response:**

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "projectId": "uuid",
    "functionId": "uuid",
    "method": "GET",
    "type": "ERROR",
    "requestHeaders": {},
    "requestUserAgent": "Mozilla/5.0...",
    "requestUrl": "/api/endpoint",
    "requestParams": {},
    "requestBody": {},
    "responseCode": 500,
    "responseSuccess": false,
    "responseMessage": "Internal Server Error",
    "responseData": {},
    "consoleLog": "Error details...",
    "additionalData": {},
    "latency": 123,
    "createdById": "user-id",
    "createdByFullname": "John Doe",
    "createdAt": "2025-01-14T10:00:00Z",
    "updatedAt": "2025-01-14T10:00:00Z",
    "project": {
      "id": "uuid",
      "name": "my-project"
    },
    "function": {
      "id": "uuid",
      "name": "getUserById"
    }
  }
}
```

### 3. Get Statistics - GET /v1/stats

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| projectId | string | Filter by project ID | `?projectId=xxx` |
| timeRange | string | Time range (default: 24h) | `?timeRange=7d` |

**Example:**

```bash
# Get overall statistics
curl "http://localhost:3000/v1/stats?timeRange=24h"

# Get statistics for specific project
curl "http://localhost:3000/v1/stats?projectId=xxx&timeRange=7d"
```

**Response:**

```json
{
  "total": 12345,
  "byType": {
    "ERROR": 1234,
    "WARNING": 2345,
    "INFO": 5678,
    "SUCCESS": 2345,
    "DEBUG": 743
  },
  "byMethod": {
    "GET": 5000,
    "POST": 4000,
    "PUT": 2000,
    "DELETE": 1000,
    "PATCH": 345
  },
  "byProject": {
    "project-id-1": 6000,
    "project-id-2": 4000,
    "project-id-3": 2345
  },
  "timeRange": "24h"
}
```

## 🔄 Caching Strategy

### Cache TTL (Time To Live)

- **List queries**: 5 minutes (300 seconds)
- **Individual log**: 15 minutes (900 seconds)
- **Statistics**: 1 minute (60 seconds)

### Cache Keys

Cache keys are generated based on query parameters:

```
logs:list:functionId:xxx|level:ERROR|projectId:yyy|timeRange:24h
log:550e8400-e29b-41d4-a716-446655440000
stats:all:24h
```

### Cache Invalidation

Cache automatically expires based on TTL. For manual cache clearing:

```bash
# Connect to Redis
docker exec -it redis redis-cli

# Clear all cache
FLUSHALL

# Clear specific pattern
KEYS logs:list:*
DEL logs:list:...
```

## 🔍 Monitoring

### View API Logs

```bash
# View API service logs
docker logs -f api-service

# Cache hit/miss logs
# ✅ Cache hit for: logs:list:level:ERROR|timeRange:24h
# ❌ Cache miss for: logs:list:level:ERROR|timeRange:24h
```

### Check Redis

```bash
# Connect to Redis CLI
docker exec -it redis redis-cli

# Check cache keys
KEYS *

# Get cache statistics
INFO stats

# Monitor real-time commands
MONITOR
```

## 🛠️ Development

### Local Development

```bash
cd api-service

# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Generate Prisma Client
npm run prisma:generate

# Start development server (with auto-reload)
npm run dev
```

### Test with curl

```bash
# Test all endpoints
./test-api.sh

# Or test individually
curl "http://localhost:3000/health"
curl "http://localhost:3000/v1/logs?level=ERROR&take=10"
curl "http://localhost:3000/v1/stats"
```

## 📊 Performance Tips

1. **Use appropriate time ranges**: Shorter time ranges return faster
2. **Limit results**: Use `take` parameter (max 1000)
3. **Use pagination**: Don't fetch all results at once
4. **Filter wisely**: More specific filters = better performance
5. **Cache benefits**: Repeated queries are served from cache

## 🐛 Troubleshooting

### API not responding

```bash
# Check if container is running
docker-compose ps api-service

# Check logs
docker logs api-service

# Restart service
docker-compose restart api-service
```

### Cache not working

```bash
# Check Redis connection
docker exec -it redis redis-cli ping
# Should return: PONG

# Check Redis logs
docker logs redis
```

### Database connection issues

```bash
# Check PostgreSQL
docker exec -it postgres psql -U kafka_user -d kafka_db -c "SELECT COUNT(*) FROM logs;"

# Check DATABASE_URL in api-service
docker exec api-service env | grep DATABASE_URL
```

## 📝 Notes

- Default pagination size: 50 logs
- Maximum pagination size: 1000 logs
- Logs are ordered by `createdAt` DESC (newest first)
- Cursor-based pagination for better performance
- All timestamps are in ISO 8601 format (UTC)
