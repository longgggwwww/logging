#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Testing API Service${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Health Check${NC}"
curl -s "${BASE_URL}/health" | jq '.'
echo ""
echo ""

# Test 2: Get all logs (default)
echo -e "${YELLOW}Test 2: Get all logs (default - last 24h)${NC}"
curl -s "${BASE_URL}/v1/logs" | jq '.pagination, .filters'
echo ""
echo ""

# Test 3: Get ERROR logs
echo -e "${YELLOW}Test 3: Get ERROR logs from last 24h${NC}"
curl -s "${BASE_URL}/v1/logs?level=ERROR&timeRange=24h&take=10" | jq '.pagination, .filters'
echo ""
echo ""

# Test 4: Get logs by method
echo -e "${YELLOW}Test 4: Get POST logs${NC}"
curl -s "${BASE_URL}/v1/logs?method=POST&take=10" | jq '.pagination, .filters'
echo ""
echo ""

# Test 5: Get logs with custom time range
echo -e "${YELLOW}Test 5: Get logs from last 1 hour${NC}"
curl -s "${BASE_URL}/v1/logs?timeRange=1h&take=10" | jq '.pagination, .filters'
echo ""
echo ""

# Test 6: Get statistics
echo -e "${YELLOW}Test 6: Get statistics${NC}"
curl -s "${BASE_URL}/v1/stats?timeRange=24h" | jq '.'
echo ""
echo ""

# Test 6.5: Test multiple project IDs
echo -e "${YELLOW}Test 6.5: Get logs with multiple project IDs${NC}"
# Get first 2 project IDs from projects list
PROJECT_IDS=$(curl -s "${BASE_URL}/v1/projects" | jq -r '.data[0:2] | .[].id' | tr '\n' ',' | sed 's/,$//')
if [ -n "$PROJECT_IDS" ]; then
    echo -e "${GREEN}Testing with project IDs: $PROJECT_IDS${NC}"
    curl -s "${BASE_URL}/v1/logs?projectIds=${PROJECT_IDS}&take=10" | jq '.pagination, .filters'
else
    echo -e "${YELLOW}No projects found to test${NC}"
fi
echo ""
echo ""

# Test 6.6: Test validation - more than 10 project IDs
echo -e "${YELLOW}Test 6.6: Test validation (more than 10 project IDs - should fail)${NC}"
curl -s "${BASE_URL}/v1/logs?projectIds=id1,id2,id3,id4,id5,id6,id7,id8,id9,id10,id11" | jq '.'
echo ""
echo ""

# Test 6.7: Test validation - more than 10 function IDs
echo -e "${YELLOW}Test 6.7: Test validation (more than 10 function IDs - should fail)${NC}"
curl -s "${BASE_URL}/v1/logs?functionIds=id1,id2,id3,id4,id5,id6,id7,id8,id9,id10,id11" | jq '.'
echo ""
echo ""

# Test 7: Get specific log by ID (will need a real ID)
echo -e "${YELLOW}Test 7: Get first log ID and fetch by ID${NC}"
LOG_ID=$(curl -s "${BASE_URL}/v1/logs?take=1" | jq -r '.data[0].id')
if [ "$LOG_ID" != "null" ] && [ -n "$LOG_ID" ]; then
    echo -e "${GREEN}Fetching log with ID: $LOG_ID${NC}"
    curl -s "${BASE_URL}/v1/logs/${LOG_ID}" | jq '.data | {id, method, type, createdAt}'
else
    echo -e "${RED}No logs found${NC}"
fi
echo ""
echo ""

# Test 8: Test pagination
echo -e "${YELLOW}Test 8: Test pagination${NC}"
echo -e "${GREEN}First page:${NC}"
FIRST_PAGE=$(curl -s "${BASE_URL}/v1/logs?take=5")
echo "$FIRST_PAGE" | jq '.pagination'
NEXT_CURSOR=$(echo "$FIRST_PAGE" | jq -r '.pagination.nextCursor')

if [ "$NEXT_CURSOR" != "null" ] && [ -n "$NEXT_CURSOR" ]; then
    echo -e "${GREEN}Second page with cursor:${NC}"
    curl -s "${BASE_URL}/v1/logs?take=5&cursorId=${NEXT_CURSOR}" | jq '.pagination'
else
    echo -e "${YELLOW}No more pages${NC}"
fi
echo ""
echo ""

# Test 9: Test cache hit
echo -e "${YELLOW}Test 9: Test cache (same request twice)${NC}"
echo -e "${GREEN}First request (cache miss):${NC}"
time curl -s "${BASE_URL}/v1/logs?level=ERROR&take=10" > /dev/null
echo -e "${GREEN}Second request (cache hit - should be faster):${NC}"
time curl -s "${BASE_URL}/v1/logs?level=ERROR&take=10" > /dev/null
echo ""
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Testing Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
