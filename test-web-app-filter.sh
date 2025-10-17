#!/bin/bash

# Test Web App Tree Select Filter Implementation

echo "=========================================="
echo "Testing Web App - Tree Select Filter"
echo "=========================================="
echo ""

BASE_URL="http://localhost:3000"

# Test 1: Get projects with functions (for tree select)
echo "1. Get projects with functions (Tree Select Data)"
echo "GET /v1/projects?expand=functions"
curl -s "${BASE_URL}/v1/projects?expand=functions" | jq '{
  total: .total,
  projects: .data | map({
    name: .name,
    functions: .functions | map(.name)
  })
}'
echo ""
echo ""

# Test 2: Get logs filtered by multiple projects
echo "2. Get logs filtered by multiple projects"
echo "Example: ?projectIds=xxx,yyy"
echo "GET /v1/logs?timeRange=24h&take=5"
curl -s "${BASE_URL}/v1/logs?timeRange=24h&take=5" | jq '{
  count: .pagination.count,
  filters: .filters,
  sample_log: .data[0] | {
    project: .project.name,
    function: .function.name,
    method: .method,
    type: .type,
    url: .requestUrl
  }
}'
echo ""
echo ""

# Test 3: Get logs with method and type filters
echo "3. Get logs with method and type filters"
echo "GET /v1/logs?method=POST&level=ERROR&timeRange=24h&take=5"
curl -s "${BASE_URL}/v1/logs?method=POST&level=ERROR&timeRange=24h&take=5" | jq '{
  count: .pagination.count,
  filters: .filters
}'
echo ""
echo ""

# Test 4: Get logs with time range filter
echo "4. Get logs with different time ranges"
echo "GET /v1/logs?timeRange=1h&take=5"
curl -s "${BASE_URL}/v1/logs?timeRange=1h&take=5" | jq '{
  count: .pagination.count,
  timeRange: .filters.timeRange
}'
echo ""
echo ""

echo "=========================================="
echo "Testing Complete!"
echo "=========================================="
echo ""
echo "Next Steps:"
echo "1. Start the web app: cd web-app && npm start"
echo "2. Navigate to: http://localhost:8000/list"
echo "3. Test the tree select filter"
echo "4. Select projects/functions and observe the API calls"
echo ""
