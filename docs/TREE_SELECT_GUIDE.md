# Tree Select Filter - Visual Guide

## Tree Structure Example

```
📁 Project A
  ├─ 📄 getUserById
  ├─ 📄 createUser
  └─ 📄 deleteUser

📁 Project B
  ├─ 📄 getProducts
  ├─ 📄 updateProduct
  └─ 📄 deleteProduct

📁 Project C
  ├─ 📄 login
  └─ 📄 logout
```

## Selection Behavior

### Scenario 1: Select entire project
```
User selects: [✓] Project A
API receives: ?projectIds=project-a-id
Result: All logs from Project A (all functions included)
```

### Scenario 2: Select specific functions
```
User selects: 
  [✓] getUserById (from Project A)
  [✓] login (from Project C)

API receives: ?functionIds=getUserById-id,login-id
Result: Only logs from these two specific functions
```

### Scenario 3: Mixed selection
```
User selects:
  [✓] Project A (entire project)
  [✓] login (from Project C)

API receives: ?projectIds=project-a-id&functionIds=login-id
Result: All logs from Project A + logs from login function in Project C
```

## Filter UI Layout

```
┌─────────────────────────────────────────────────────────┐
│  Logs                                                    │
├─────────────────────────────────────────────────────────┤
│  Search Form:                                            │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Project/Function: [▼ Select projects/functions] │   │
│  │ Method:          [▼ GET/POST/PUT/PATCH/DELETE ] │   │
│  │ Type:            [▼ ERROR/WARNING/INFO/...     ] │   │
│  │ Time Range:      [▼ Last 24 hours              ] │   │
│  │                                  [Search] [Reset] │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  Table:                                                  │
│  ┌────────────────────────────────────────────────────┐ │
│  │Project│Function│Method│Type│URL│Code│Latency│Time│ │
│  ├────────────────────────────────────────────────────┤ │
│  │ [Proj] │ [Func] │ GET  │ ⚫ │ /api│ 200│ 50ms │...│ │
│  │ [Proj] │ [Func] │ POST │ 🔴 │ /api│ 500│ 150ms│...│ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Tree Select Dropdown

When clicking the Project/Function filter:

```
┌─────────────────────────────────────────────┐
│ Select projects or functions                │
├─────────────────────────────────────────────┤
│ [✓] Project A                               │
│   ├─ [✓] getUserById                        │
│   ├─ [✓] createUser                         │
│   └─ [✓] deleteUser                         │
│                                             │
│ [ ] Project B                               │
│   ├─ [ ] getProducts                        │
│   ├─ [ ] updateProduct                      │
│   └─ [ ] deleteProduct                      │
│                                             │
│ [ ] Project C                               │
│   ├─ [✓] login                              │
│   └─ [ ] logout                             │
└─────────────────────────────────────────────┘
```

## Selected Tags Display

When multiple items are selected:

```
┌─────────────────────────────────────────────────────┐
│ [Project A ✕] [login ✕] [logout ✕] +2 more...     │
└─────────────────────────────────────────────────────┘
```

## API Call Examples

### Example 1: Filter by 2 projects
```bash
GET /v1/logs?projectIds=proj-id-1,proj-id-2&timeRange=24h&take=100
```

### Example 2: Filter by 3 specific functions
```bash
GET /v1/logs?functionIds=func-id-1,func-id-2,func-id-3&level=ERROR&take=50
```

### Example 3: Mixed filter with all parameters
```bash
GET /v1/logs?projectIds=proj-id-1&functionIds=func-id-2,func-id-3&method=POST&level=ERROR&timeRange=1h&take=100
```

### Example 4: Full filter
```bash
curl "http://localhost:3000/v1/logs?projectIds=xxx,yyy&functionIds=aaa,bbb&method=POST&level=ERROR&timeRange=24h&take=100"
```

## Response Structure

```json
{
  "data": [
    {
      "id": "log-uuid",
      "projectId": "project-uuid",
      "functionId": "function-uuid",
      "method": "GET",
      "type": "ERROR",
      "requestUrl": "/api/users/123",
      "responseCode": 500,
      "latency": 123,
      "createdAt": "2025-10-17T10:00:00Z",
      "project": {
        "id": "project-uuid",
        "name": "User Service"
      },
      "function": {
        "id": "function-uuid",
        "name": "getUserById"
      }
    }
  ],
  "pagination": {
    "nextCursor": "next-log-id",
    "hasMore": true,
    "count": 50
  },
  "filters": {
    "projectIds": "xxx,yyy",
    "functionIds": "aaa,bbb",
    "method": "POST",
    "level": "ERROR",
    "timeRange": "24h"
  }
}
```

## Implementation Code Snippet

```tsx
<TreeSelect
  treeData={[
    {
      title: 'Project A',
      value: 'project-xxx',
      key: 'project-xxx',
      children: [
        { title: 'getUserById', value: 'function-aaa', key: 'function-aaa' },
        { title: 'createUser', value: 'function-bbb', key: 'function-bbb' },
      ]
    }
  ]}
  placeholder="Select project or function"
  treeCheckable
  showCheckedStrategy={TreeSelect.SHOW_ALL}
  treeDefaultExpandAll
  maxTagCount={3}
/>
```

## Benefits

1. **Hierarchical Navigation**: Easy to understand project structure
2. **Flexible Filtering**: Select at project or function level
3. **Multi-select**: Filter by multiple projects/functions at once
4. **Visual Clarity**: Tree structure shows relationships clearly
5. **Space Efficient**: Nested structure saves screen space
6. **User-Friendly**: Familiar tree interface for users
