# Hướng Dẫn Sử Dụng Filter - Web App

## Tổng Quan

Trang `/list` hiện đã được cài đặt với hệ thống filter đầy đủ cho logs, bao gồm:
- **Tree Select** cho Project/Function (chọn theo cấu trúc cây)
- **Method** (GET, POST, PUT, PATCH, DELETE)
- **Type/Level** (DEBUG, SUCCESS, INFO, WARNING, ERROR)
- **Time Range** (15 phút đến 30 ngày)

## Cách Hoạt Động

### 1. Tree Select Filter (Project/Function)

#### Cấu trúc dữ liệu:
```typescript
[
  {
    title: "Project Name",      // Tên project hiển thị
    value: "project-{uuid}",     // Giá trị khi chọn project
    key: "project-{uuid}",       // Key unique
    projectId: "{uuid}",         // ID thực của project
    children: [                  // Các function con
      {
        title: "Function Name",
        value: "function-{uuid}",
        key: "function-{uuid}",
        functionId: "{uuid}",
        projectId: "{uuid}"      // Liên kết với project cha
      }
    ]
  }
]
```

#### Xử lý khi submit:
```typescript
// Người dùng chọn:
// - Project A (toàn bộ)
// - Function X từ Project B
// - Function Y từ Project C

// Giá trị nhận được:
filter = [
  "project-{id-a}",
  "function-{id-x}",
  "function-{id-y}"
]

// Xử lý:
projectIds = ["id-a"]           // Lọc ra project IDs
functionIds = ["id-x", "id-y"]  // Lọc ra function IDs

// Gửi đến API:
?projectIds=id-a&functionIds=id-x,id-y
```

### 2. Method Filter

```typescript
// Dropdown với các giá trị:
{
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE'
}

// Gửi đến API:
?method=POST
```

### 3. Type/Level Filter

```typescript
// Dropdown với các giá trị:
{
  DEBUG: 'DEBUG',
  SUCCESS: 'SUCCESS',
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR'
}

// Gửi đến API:
?level=ERROR
```

### 4. Time Range Filter

```typescript
// Dropdown với các giá trị:
{
  '15m': 'Last 15 minutes',
  '30m': 'Last 30 minutes',
  '1h': 'Last 1 hour',
  '3h': 'Last 3 hours',
  '6h': 'Last 6 hours',
  '12h': 'Last 12 hours',
  '24h': 'Last 24 hours',   // Mặc định
  '7d': 'Last 7 days',
  '30d': 'Last 30 days'
}

// Gửi đến API:
?timeRange=24h
```

## Ví Dụ API Calls

### Ví dụ 1: Lọc theo 1 project
```bash
# User action: Chọn "User Service" project
# Tree Select value: ["project-abc-123"]

# API call:
GET /v1/logs?projectIds=abc-123&timeRange=24h&take=50

# Response:
{
  "data": [...logs từ User Service...],
  "pagination": {
    "nextCursor": "...",
    "hasMore": true,
    "count": 50
  },
  "filters": {
    "projectIds": "abc-123",
    "timeRange": "24h"
  }
}
```

### Ví dụ 2: Lọc theo nhiều functions
```bash
# User action: 
# - Chọn "getUserById" từ User Service
# - Chọn "createProduct" từ Product Service
# Tree Select value: ["function-aaa-111", "function-bbb-222"]

# API call:
GET /v1/logs?functionIds=aaa-111,bbb-222&timeRange=24h&take=50

# Response:
{
  "data": [...logs từ 2 functions...],
  "pagination": {...},
  "filters": {
    "functionIds": "aaa-111,bbb-222",
    "timeRange": "24h"
  }
}
```

### Ví dụ 3: Lọc kết hợp
```bash
# User action:
# - Tree Select: Chọn "User Service" project
# - Method: POST
# - Type: ERROR
# - Time Range: 1h

# Tree Select value: ["project-abc-123"]

# API call:
GET /v1/logs?projectIds=abc-123&method=POST&level=ERROR&timeRange=1h&take=50

# Response:
{
  "data": [...chỉ ERROR logs từ POST requests trong User Service...],
  "pagination": {...},
  "filters": {
    "projectIds": "abc-123",
    "method": "POST",
    "level": "ERROR",
    "timeRange": "1h"
  }
}
```

### Ví dụ 4: Lọc phức tạp (project + functions)
```bash
# User action:
# - Chọn toàn bộ "User Service" project
# - Chọn thêm "createProduct" từ Product Service
# - Method: POST
# - Type: ERROR

# Tree Select value: ["project-abc-123", "function-xyz-456"]

# API call:
GET /v1/logs?projectIds=abc-123&functionIds=xyz-456&method=POST&level=ERROR&timeRange=24h&take=50

# Kết quả: 
# - Tất cả POST ERROR logs từ User Service (mọi function)
# - PLUS: POST ERROR logs từ createProduct function trong Product Service
```

## Flow Chart

```
User Interface
     │
     ├─> Tree Select ──┐
     ├─> Method       ──┼──> Parse Parameters ──> Build Request ──> API Call
     ├─> Type/Level   ──┤                              │
     └─> Time Range  ──┘                               │
                                                        ↓
                                              GET /v1/logs?
                                              projectIds=xxx,yyy&
                                              functionIds=aaa,bbb&
                                              method=POST&
                                              level=ERROR&
                                              timeRange=1h&
                                              take=50
                                                        │
                                                        ↓
                                                   API Response
                                                        │
                                                        ↓
                                              {
                                                data: [...],
                                                pagination: {...},
                                                filters: {...}
                                              }
                                                        │
                                                        ↓
                                                 Display Table
```

## Code Implementation

### Phần request trong ProTable:

```typescript
request={async (params: any) => {
  console.log('📊 Filter params received:', params);
  
  // 1. Parse tree select values
  const filter = params.filter;
  let projectIds: string[] = [];
  let functionIds: string[] = [];

  if (filter && Array.isArray(filter)) {
    filter.forEach((item: string) => {
      if (item.startsWith('project-')) {
        projectIds.push(item.replace('project-', ''));
      } else if (item.startsWith('function-')) {
        functionIds.push(item.replace('function-', ''));
      }
    });
  }

  // 2. Build request parameters
  const requestParams: LOG.LogListParams = {
    take: params.pageSize || 50,
  };

  if (params.method) requestParams.method = params.method;
  if (params.level) requestParams.level = params.level;
  if (params.timeRange) requestParams.timeRange = params.timeRange;
  else requestParams.timeRange = '24h';

  if (projectIds.length > 0) {
    requestParams.projectIds = projectIds.join(',');
  }
  if (functionIds.length > 0) {
    requestParams.functionIds = functionIds.join(',');
  }

  console.log('🔍 API request params:', requestParams);

  // 3. Call API
  try {
    const response = await getLogs(requestParams);
    console.log('✅ API response:', {
      count: response.data.length,
      hasMore: response.pagination.hasMore,
    });

    return {
      data: response.data,
      success: true,
      total: response.pagination.count,
    };
  } catch (error) {
    console.error('❌ Failed to fetch logs:', error);
    return {
      data: [],
      success: false,
      total: 0,
    };
  }
}}
```

## Testing

### 1. Kiểm tra trong Browser Console

Khi filter được apply, bạn sẽ thấy console logs:

```
📊 Filter params received: {
  filter: ["project-xxx", "function-yyy"],
  method: "POST",
  level: "ERROR",
  timeRange: "1h",
  pageSize: 50
}

🔍 API request params: {
  projectIds: "xxx",
  functionIds: "yyy",
  method: "POST",
  level: "ERROR",
  timeRange: "1h",
  take: 50
}

✅ API response: {
  count: 25,
  hasMore: false
}
```

### 2. Kiểm tra Network Tab

Trong Chrome DevTools > Network, tìm request đến `/v1/logs`:

```
Request URL: http://localhost:3000/v1/logs?projectIds=xxx&functionIds=yyy&method=POST&level=ERROR&timeRange=1h&take=50

Response:
{
  "data": [...],
  "pagination": {
    "nextCursor": null,
    "hasMore": false,
    "count": 25
  },
  "filters": {
    "projectIds": "xxx",
    "functionIds": "yyy",
    "method": "POST",
    "level": "ERROR",
    "timeRange": "1h"
  }
}
```

## Troubleshooting

### Lỗi thường gặp:

1. **Không có dữ liệu**
   - Kiểm tra API service đang chạy: `curl http://localhost:3000/health`
   - Kiểm tra database có dữ liệu không
   - Xem console logs để debug

2. **Tree Select trống**
   - Kiểm tra endpoint `/v1/projects?expand=functions`
   - Xem console error khi load projects

3. **Filter không hoạt động**
   - Mở DevTools Console
   - Xem request parameters được gửi đi
   - So sánh với API documentation

## Next Steps

1. Start API service:
```bash
cd api-service
node index.js
```

2. Start web app:
```bash
cd web-app
npm start
```

3. Navigate to: `http://localhost:8000/list`

4. Test filters:
   - Chọn projects/functions từ tree select
   - Apply method filter
   - Apply type filter
   - Apply time range
   - Click "Search"
   - Xem kết quả trong bảng
