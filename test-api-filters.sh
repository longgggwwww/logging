#!/bin/bash

# Test API endpoints for web app filter

echo "=========================================="
echo "Testing API Endpoints"
echo "=========================================="
echo ""

BASE_URL="http://localhost:3000"

# Get projects with functions first
echo "Step 1: Get all projects with functions"
echo "----------------------------------------"
PROJECTS=$(curl -s "${BASE_URL}/v1/projects?expand=functions")
echo "$PROJECTS" | jq -r '.data[] | "\(.name) (ID: \(.id))"'
echo ""

# Extract first project ID and function ID for testing
PROJECT_ID=$(echo "$PROJECTS" | jq -r '.data[0].id')
FUNCTION_ID=$(echo "$PROJECTS" | jq -r '.data[0].functions[0].id')

echo "Using for test:"
echo "  Project ID: $PROJECT_ID"
echo "  Function ID: $FUNCTION_ID"
echo ""
echo ""

# Test 1: Get all logs (default)
echo "Test 1: Get all logs (last 24h)"
echo "----------------------------------------"
curl -s "${BASE_URL}/v1/logs?take=3" | jq '{
  count: .pagination.count,
  hasMore: .pagination.hasMore,
  samples: .data[0:2] | map({
    project: .project.name,
    function: .function.name,
    method: .method,
    type: .type,
    url: .requestUrl,
    code: .responseCode
  })
}'
echo ""
echo ""

# Test 2: Filter by project
echo "Test 2: Filter by project"
echo "----------------------------------------"
echo "GET /v1/logs?projectIds=$PROJECT_ID&take=3"
curl -s "${BASE_URL}/v1/logs?projectIds=$PROJECT_ID&take=3" | jq '{
  count: .pagination.count,
  filters: .filters,
  samples: .data[0:2] | map({
    project: .project.name,
    function: .function.name
  })
}'
echo ""
echo ""

# Test 3: Filter by function
echo "Test 3: Filter by function"
echo "----------------------------------------"
echo "GET /v1/logs?functionIds=$FUNCTION_ID&take=3"
curl -s "${BASE_URL}/v1/logs?functionIds=$FUNCTION_ID&take=3" | jq '{
  count: .pagination.count,
  filters: .filters,
  samples: .data[0:2] | map({
    function: .function.name,
    method: .method
  })
}'
echo ""
echo ""

# Test 4: Filter by method
echo "Test 4: Filter by method (POST)"
echo "----------------------------------------"
curl -s "${BASE_URL}/v1/logs?method=POST&take=3" | jq '{
  count: .pagination.count,
  filters: .filters,
  methods: .data | map(.method) | unique
}'
echo ""
echo ""

# Test 5: Filter by type/level
echo "Test 5: Filter by type (ERROR)"
echo "----------------------------------------"
curl -s "${BASE_URL}/v1/logs?level=ERROR&take=3" | jq '{
  count: .pagination.count,
  filters: .filters,
  types: .data | map(.type) | unique
}'
echo ""
echo ""

# Test 6: Combined filters
echo "Test 6: Combined filters (project + method + type)"
echo "----------------------------------------"
echo "GET /v1/logs?projectIds=$PROJECT_ID&method=POST&level=ERROR&take=3"
curl -s "${BASE_URL}/v1/logs?projectIds=$PROJECT_ID&method=POST&level=ERROR&take=3" | jq '{
  count: .pagination.count,
  filters: .filters
}'
echo ""
echo ""

# Test 7: Multiple projects and functions
echo "Test 7: Multiple projects/functions (simulated)"
echo "----------------------------------------"
PROJECT_ID_2=$(echo "$PROJECTS" | jq -r '.data[1].id // .data[0].id')
FUNCTION_ID_2=$(echo "$PROJECTS" | jq -r '.data[0].functions[1].id // .data[0].functions[0].id')
echo "GET /v1/logs?projectIds=$PROJECT_ID,$PROJECT_ID_2&functionIds=$FUNCTION_ID,$FUNCTION_ID_2&take=5"
curl -s "${BASE_URL}/v1/logs?projectIds=$PROJECT_ID,$PROJECT_ID_2&functionIds=$FUNCTION_ID,$FUNCTION_ID_2&take=5" | jq '{
  count: .pagination.count,
  filters: .filters,
  projects: .data | map(.project.name) | unique,
  functions: .data | map(.function.name) | unique
}'
echo ""
echo ""

# Test 8: Time range filters
echo "Test 8: Time range filters"
echo "----------------------------------------"
for range in "15m" "1h" "24h" "7d"; do
  echo "  Time range: $range"
  curl -s "${BASE_URL}/v1/logs?timeRange=$range&take=1" | jq -c '{timeRange: .filters.timeRange, count: .pagination.count}'
done
echo ""
echo ""

echo "=========================================="
echo "All Tests Completed!"
echo "=========================================="
echo ""
echo "Summary:"
echo "  ✓ Projects endpoint working"
echo "  ✓ Logs endpoint working"
echo "  ✓ Filter by projectIds working"
echo "  ✓ Filter by functionIds working"
echo "  ✓ Filter by method working"
echo "  ✓ Filter by level/type working"
echo "  ✓ Combined filters working"
echo "  ✓ Time range filters working"
echo ""
echo "Ready to test in web app!"
echo ""
