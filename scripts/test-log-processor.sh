#!/bin/bash

echo "🧪 Testing Log Processor Service"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test message
TEST_MESSAGE='{
  "projectName": "test-app",
  "function": "testFunction",
  "method": "POST",
  "type": "ERROR",
  "request": {
    "headers": {
      "content-type": "application/json",
      "authorization": "Bearer test-token"
    },
    "userAgent": "Mozilla/5.0 (Test Agent)",
    "url": "/api/test/endpoint",
    "params": {
      "id": "123"
    },
    "body": {
      "test": "data"
    }
  },
  "response": {
    "code": 500,
    "success": false,
    "message": "Internal Server Error",
    "data": []
  },
  "consoleLog": "Error: Test error message\n  at testFunction()\n  at main()",
  "createdAt": "'$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")'",
  "createdBy": {
    "id": "user123",
    "fullname": "Test User",
    "emplCode": "EMP001"
  },
  "additionalData": {
    "environment": "test",
    "version": "1.0.0"
  },
  "latency": 1250
}'

echo "📨 Sending test message to Kafka topic: logs.error.dlq"
echo ""

# Send message to Kafka
echo "$TEST_MESSAGE" | docker exec -i kafka-controller-1 \
  /opt/kafka/bin/kafka-console-producer.sh \
  --broker-list localhost:9092 \
  --topic logs.error.dlq

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Test message sent successfully${NC}"
  echo ""
  echo "🔍 Check the log-processor service logs to see if it processed the message:"
  echo "   docker logs -f log-processor"
  echo ""
  echo "📊 Or open Prisma Studio to view the data:"
  echo "   cd log-processor && npm run prisma:studio"
else
  echo -e "${RED}❌ Failed to send test message${NC}"
  exit 1
fi
