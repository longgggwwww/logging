# Web App - Table List Implementation with Tree Select Filter

## Overview
Implemented a new table list page in the web-app that displays logs from the API service with a hierarchical tree select filter for projects and functions.

## Changes Made

### 1. Created Log Service (`/web-app/src/services/log/`)

#### `typings.d.ts`
- Defined TypeScript types for:
  - `LOG.Log` - Log entry interface
  - `LOG.Project` - Project interface
  - `LOG.Function` - Function interface
  - `LOG.LogListParams` - Request parameters
  - `LOG.LogListResponse` - Response interface
  - `LOG.ProjectListResponse` - Projects response
  - `LOG.FunctionListResponse` - Functions response

#### `api.ts`
- `getLogs(params)` - Fetch logs with filters
- `getProjects(params)` - Fetch all projects (with optional functions expansion)
- `getProjectFunctions(projectId)` - Fetch functions of a specific project
- `getFunctions()` - Fetch all functions

### 2. Updated Table List Page (`/web-app/src/pages/table-list/index.tsx`)

#### Features Implemented:

1. **Tree Select Filter**
   - Hierarchical structure: Project > Functions
   - Multi-select with checkboxes
   - Shows all projects with their nested functions
   - Max 3 tags displayed, then shows count
   - Auto-expands all nodes by default

2. **Filter Parameters**
   - **Project/Function Filter**: Tree select for hierarchical filtering
   - **Method**: GET, POST, PUT, PATCH, DELETE
   - **Type/Level**: DEBUG, SUCCESS, INFO, WARNING, ERROR
   - **Time Range**: 15m, 30m, 1h, 3h, 6h, 12h, 24h, 7d, 30d

3. **Table Columns**
   - Project name (colored tag)
   - Function name (colored tag)
   - HTTP Method (colored tag)
   - Log Type (badge with status)
   - Request URL (clickable for details)
   - Response Code (badge with color)
   - Latency in milliseconds (color-coded by performance)
   - Created timestamp

4. **Data Loading**
   - Loads projects with functions on component mount
   - Converts data to tree structure for TreeSelect
   - Parses filter selections to extract projectIds and functionIds
   - Sends comma-separated IDs to API: `projectIds=xxx,yyy&functionIds=aaa,bbb`

5. **Detail Drawer**
   - Opens when clicking on request URL
   - Shows full log details
   - 800px width for better readability

## API Integration

### Endpoints Used:

1. **GET /v1/projects?expand=functions**
   - Returns all projects with their functions
   - Used to build tree select data structure

2. **GET /v1/logs**
   - Query parameters:
     - `projectIds`: Comma-separated project IDs (max 10)
     - `functionIds`: Comma-separated function IDs (max 10)
     - `method`: HTTP method filter
     - `level`: Log type filter
     - `timeRange`: Predefined time range
     - `take`: Number of logs to fetch (default: 50, max: 1000)

## How It Works

### Filter Flow:
1. User selects projects/functions from tree select
2. Values are stored as `project-{id}` or `function-{id}`
3. On request, values are parsed:
   - Extract project IDs from selections starting with `project-`
   - Extract function IDs from selections starting with `function-`
4. Convert arrays to comma-separated strings
5. Send to API as query parameters

### Example Request:
```bash
curl "http://localhost:3000/v1/logs?projectIds=xxx,yyy&functionIds=aaa,bbb&level=ERROR&timeRange=24h&take=100"
```

## UI/UX Features

### Color Coding:
- **HTTP Methods**:
  - GET: green
  - POST: blue
  - PUT: orange
  - PATCH: purple
  - DELETE: red

- **Log Types**:
  - ERROR: red badge
  - WARNING: orange badge
  - INFO: blue badge
  - SUCCESS: green badge
  - DEBUG: gray badge

- **Response Codes**:
  - 2xx: success (green)
  - 3xx: processing (blue)
  - 4xx: warning (orange)
  - 5xx: error (red)

- **Latency**:
  - < 500ms: green
  - 500-1000ms: orange
  - > 1000ms: red

## Dependencies

No new dependencies required. Uses existing:
- `@ant-design/pro-components` - ProTable, ProDescriptions
- `antd` - TreeSelect, Badge, Tag, Drawer
- `@umijs/max` - request utility

## Testing

To test the implementation:

1. Ensure API service is running:
```bash
cd api-service
node index.js
```

2. Start web app:
```bash
cd web-app
npm start
```

3. Navigate to `/list` route
4. Use tree select to filter by projects/functions
5. Apply additional filters (method, type, time range)
6. Click on URLs to view log details

## Future Enhancements

1. **Cursor-based Pagination**: Currently using basic pagination, can implement cursor-based for better performance
2. **Export Functionality**: Add export to CSV/JSON
3. **Real-time Updates**: WebSocket integration for live log streaming
4. **Advanced Filters**: Add more filters like response code range, latency range
5. **Save Filter Presets**: Allow users to save commonly used filter combinations
6. **Bulk Actions**: Select multiple logs for batch operations

## Notes

- Tree select automatically expands all nodes for better UX
- Default time range is 24 hours
- Maximum 10 projects and 10 functions can be selected at once (API limit)
- Cache is handled by the API service (5 minutes TTL)
- Tree data is loaded once on component mount and cached in state
