#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🧪 Log Processor Integration Test Suite    ║${NC}"
echo -e "${BLUE}╔═══════════════════════════════════════════════╗${NC}"
echo ""

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to check if service is running
check_service() {
    local service=$1
    if docker ps | grep -q "$service"; then
        echo -e "${GREEN}✓${NC} $service is running"
        return 0
    else
        echo -e "${RED}✗${NC} $service is NOT running"
        return 1
    fi
}

# Function to send test message
send_test_message() {
    local message=$1
    local description=$2
    
    echo -e "\n${YELLOW}Testing:${NC} $description"
    
    echo "$message" | docker exec -i kafka-controller-1 \
        /opt/kafka/bin/kafka-console-producer.sh \
        --broker-list localhost:9092 \
        --topic logs.error.dlq 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Message sent successfully"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}✗${NC} Failed to send message"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# 1. Check Prerequisites
echo -e "${BLUE}═══ Step 1: Checking Prerequisites ═══${NC}"
echo ""

check_service "postgres"
POSTGRES_OK=$?

check_service "kafka-controller-1"
KAFKA_OK=$?

if [ $POSTGRES_OK -ne 0 ] || [ $KAFKA_OK -ne 0 ]; then
    echo -e "\n${RED}❌ Prerequisites not met. Please run: docker-compose up -d${NC}"
    exit 1
fi

echo -e "\n${GREEN}✓ All prerequisites OK${NC}"

# 2. Test Valid Messages
echo -e "\n${BLUE}═══ Step 2: Testing Valid Messages ═══${NC}"

# Test 2.1: Complete ERROR log
send_test_message '{
  "projectName": "test-project",
  "function": "testFunction",
  "method": "POST",
  "type": "ERROR",
  "request": {
    "headers": {"content-type": "application/json"},
    "userAgent": "Test Agent",
    "url": "/api/test",
    "params": {"id": "123"},
    "body": {"test": "data"}
  },
  "response": {
    "code": 500,
    "success": false,
    "message": "Internal Server Error",
    "data": []
  },
  "consoleLog": "Error: Test error",
  "createdAt": "'$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")'",
  "createdBy": {
    "id": "user123",
    "fullname": "Test User",
    "emplCode": "EMP001"
  },
  "additionalData": {"test": true},
  "latency": 1250
}' "Complete ERROR log with all fields"

sleep 2

# Test 2.2: Minimal valid log
send_test_message '{
  "projectName": "minimal-project",
  "function": "minimalFunction",
  "method": "GET",
  "type": "INFO",
  "createdAt": "'$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")'",
  "latency": 100
}' "Minimal valid log (only required fields)"

sleep 2

# Test 2.3: WARNING log
send_test_message '{
  "projectName": "test-project",
  "function": "warningFunction",
  "method": "PATCH",
  "type": "WARNING",
  "response": {
    "code": 429,
    "success": false,
    "message": "Rate limit exceeded"
  },
  "createdAt": "'$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")'",
  "latency": 50
}' "WARNING log with rate limit"

sleep 2

# Test 2.4: SUCCESS log
send_test_message '{
  "projectName": "test-project",
  "function": "successFunction",
  "method": "DELETE",
  "type": "SUCCESS",
  "response": {
    "code": 200,
    "success": true,
    "message": "Resource deleted successfully"
  },
  "createdAt": "'$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")'",
  "latency": 75
}' "SUCCESS log"

sleep 2

# Test 2.5: Another project to test multi-project support
send_test_message '{
  "projectName": "another-project",
  "function": "anotherFunction",
  "method": "PUT",
  "type": "ERROR",
  "response": {
    "code": 404,
    "success": false,
    "message": "Resource not found"
  },
  "createdAt": "'$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")'",
  "latency": 200
}' "Another project - testing multi-project support"

# 3. Wait for processing
echo -e "\n${BLUE}═══ Step 3: Waiting for Message Processing ═══${NC}"
echo "Waiting 5 seconds for messages to be processed..."
sleep 5

# 4. Verify Database
echo -e "\n${BLUE}═══ Step 4: Verifying Database ═══${NC}"
echo ""

# Count projects
PROJECT_COUNT=$(docker exec postgres psql -U kafka_user -d kafka_db -t -c "SELECT COUNT(*) FROM projects;" 2>/dev/null | tr -d ' ')
if [ ! -z "$PROJECT_COUNT" ] && [ "$PROJECT_COUNT" -ge 2 ]; then
    echo -e "${GREEN}✓${NC} Projects created: $PROJECT_COUNT"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗${NC} Projects not created properly"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Count functions
FUNCTION_COUNT=$(docker exec postgres psql -U kafka_user -d kafka_db -t -c "SELECT COUNT(*) FROM functions;" 2>/dev/null | tr -d ' ')
if [ ! -z "$FUNCTION_COUNT" ] && [ "$FUNCTION_COUNT" -ge 4 ]; then
    echo -e "${GREEN}✓${NC} Functions created: $FUNCTION_COUNT"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗${NC} Functions not created properly"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Count logs
LOG_COUNT=$(docker exec postgres psql -U kafka_user -d kafka_db -t -c "SELECT COUNT(*) FROM logs;" 2>/dev/null | tr -d ' ')
if [ ! -z "$LOG_COUNT" ] && [ "$LOG_COUNT" -ge 5 ]; then
    echo -e "${GREEN}✓${NC} Logs created: $LOG_COUNT"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗${NC} Logs not created properly"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# 5. Test Queries
echo -e "\n${BLUE}═══ Step 5: Testing Database Queries ═══${NC}"
echo ""

# Test query by type
ERROR_LOGS=$(docker exec postgres psql -U kafka_user -d kafka_db -t -c "SELECT COUNT(*) FROM logs WHERE type = 'ERROR';" 2>/dev/null | tr -d ' ')
if [ ! -z "$ERROR_LOGS" ] && [ "$ERROR_LOGS" -ge 2 ]; then
    echo -e "${GREEN}✓${NC} Error logs query works: $ERROR_LOGS errors found"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗${NC} Error logs query failed"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Test join query
JOIN_RESULT=$(docker exec postgres psql -U kafka_user -d kafka_db -t -c "
    SELECT COUNT(*) FROM logs l 
    JOIN projects p ON l.project_id = p.id 
    JOIN functions f ON l.function_id = f.id;" 2>/dev/null | tr -d ' ')
if [ ! -z "$JOIN_RESULT" ] && [ "$JOIN_RESULT" -ge 5 ]; then
    echo -e "${GREEN}✓${NC} Join query works: $JOIN_RESULT records"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗${NC} Join query failed"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# 6. Display Sample Data
echo -e "\n${BLUE}═══ Step 6: Sample Data ═══${NC}"
echo ""
echo "Projects:"
docker exec postgres psql -U kafka_user -d kafka_db -c "SELECT id, name, created_at FROM projects ORDER BY created_at DESC LIMIT 5;" 2>/dev/null

echo -e "\nFunctions:"
docker exec postgres psql -U kafka_user -d kafka_db -c "SELECT f.name, p.name as project FROM functions f JOIN projects p ON f.project_id = p.id ORDER BY f.created_at DESC LIMIT 5;" 2>/dev/null

echo -e "\nRecent Logs:"
docker exec postgres psql -U kafka_user -d kafka_db -c "
    SELECT 
        p.name as project,
        f.name as function,
        l.type,
        l.method,
        l.response_code,
        l.latency
    FROM logs l
    JOIN projects p ON l.project_id = p.id
    JOIN functions f ON l.function_id = f.id
    ORDER BY l.created_at DESC
    LIMIT 5;" 2>/dev/null

# 7. Summary
echo -e "\n${BLUE}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              Test Summary                     ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo "  1. View logs: docker logs -f log-processor"
    echo "  2. Open Prisma Studio: cd log-processor && npm run prisma:studio"
    echo "  3. Run query examples: cd log-processor && node examples.js"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Check the logs for details.${NC}"
    echo ""
    echo "View service logs: docker logs log-processor"
    exit 1
fi
