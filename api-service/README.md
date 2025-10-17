# API Service

API service for querying logs with Redis caching.

## Endpoints

### 1. GET /v1/logs - List logs with filters and pagination

Query parameters:
- `projectIds` (optional): Filter by project IDs (comma-separated, max 10 IDs)
- `functionIds` (optional): Filter by function IDs (comma-separated, max 10 IDs)
- `method` (optional): Filter by HTTP method (GET, POST, PUT, PATCH, DELETE)
- `level` (optional): Filter by log level/type (DEBUG, SUCCESS, INFO, WARNING, ERROR)
- `timeRange` (optional): Predefined time range (15m, 30m, 1h, 3h, 6h, 12h, 24h, 7d, 30d)
- `startTime` (optional): Start time (ISO 8601 format)
- `endTime` (optional): End time (ISO 8601 format)
- `cursorId` (optional): Cursor for pagination (ID of the last log from previous page)
- `take` (optional): Number of logs to return (default: 50, max: 1000)

Example:
```bash
# Get all ERROR logs from last 24 hours
curl "http://localhost:3000/v1/logs?level=ERROR&timeRange=24h"

# Get logs for specific projects and functions (multiple IDs)
curl "http://localhost:3000/v1/logs?projectIds=xxx,yyy&functionIds=aaa,bbb&take=100"

# Get logs for single project
curl "http://localhost:3000/v1/logs?projectIds=xxx&take=100"

# Pagination - get next page
curl "http://localhost:3000/v1/logs?cursorId=xxx&take=50"

# Custom time range
curl "http://localhost:3000/v1/logs?startTime=2025-01-01T00:00:00Z&endTime=2025-01-31T23:59:59Z"
```

Response:
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
      "requestUserAgent": "...",
      "requestUrl": "...",
      "requestParams": {},
      "requestBody": {},
      "responseCode": 500,
      "responseSuccess": false,
      "responseMessage": "...",
      "responseData": {},
      "consoleLog": "...",
      "additionalData": {},
      "latency": 123,
      "createdById": "...",
      "createdByFullname": "...",
      "createdByEmplCode": "...",
      "createdAt": "2025-01-14T10:00:00Z",
      "updatedAt": "2025-01-14T10:00:00Z",
      "project": {
        "id": "uuid",
        "name": "project-name"
      },
      "function": {
        "id": "uuid",
        "name": "function-name"
      }
    }
  ],
  "pagination": {
    "nextCursor": "uuid",
    "hasMore": true,
    "count": 50
  },
  "filters": {
    "projectIds": ["uuid1", "uuid2"],
    "functionIds": ["uuid3"],
    "method": null,
    "level": "ERROR",
    "timeRange": "24h",
    "startTime": null,
    "endTime": null
  }
}
```

### 2. GET /v1/logs/:log_id - Get log by ID

Example:
```bash
curl "http://localhost:3000/v1/logs/550e8400-e29b-41d4-a716-446655440000"
```

Response:
```json
{
  "data": {
    "id": "uuid",
    "projectId": "uuid",
    "functionId": "uuid",
    "method": "GET",
    "type": "ERROR",
    "requestHeaders": {},
    "requestUserAgent": "...",
    "requestUrl": "...",
    "requestParams": {},
    "requestBody": {},
    "responseCode": 500,
    "responseSuccess": false,
    "responseMessage": "...",
    "responseData": {},
    "consoleLog": "...",
    "additionalData": {},
    "latency": 123,
    "createdById": "...",
    "createdByFullname": "...",
    "createdByEmplCode": "...",
    "createdAt": "2025-01-14T10:00:00Z",
    "updatedAt": "2025-01-14T10:00:00Z",
    "project": {
      "id": "uuid",
      "name": "project-name"
    },
    "function": {
      "id": "uuid",
      "name": "function-name"
    }
  }
}
```

### 3. GET /v1/stats - Get statistics

Query parameters:
- `projectId` (optional): Filter by project ID
- `timeRange` (optional): Time range (default: 24h)

Example:
```bash
curl "http://localhost:3000/v1/stats?timeRange=24h"
```

Response:
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

### 4. GET /health - Health check

Example:
```bash
curl "http://localhost:3000/health"
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-14T10:00:00.000Z",
  "services": {
    "database": "up",
    "redis": "up"
  }
}
```

## Caching

- List queries are cached for 5 minutes
- Individual log queries are cached for 15 minutes
- Statistics are cached for 1 minute
- Cache keys are generated based on query parameters

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (production/development)

## Development

```bash
# Install dependencies
npm install

# Generate Prisma Client
npm run prisma:generate

# Start development server
npm run dev

# Start production server
npm start
```
