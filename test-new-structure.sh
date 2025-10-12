#!/bin/bash

echo "🧪 Testing New Message Structure"
echo "================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Kafka is running
echo -e "${BLUE}1. Checking Kafka status...${NC}"
if docker ps | grep -q kafka-controller; then
    echo -e "${GREEN}✓ Kafka is running${NC}"
else
    echo -e "${RED}✗ Kafka is not running. Please start it first with 'docker-compose up -d'${NC}"
    exit 1
fi

echo ""

# Check topics
echo -e "${BLUE}2. Checking topics...${NC}"
docker exec kafka-controller-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --list | grep "error-logs"

echo ""

# Send test messages
echo -e "${BLUE}3. Sending test messages with new structure...${NC}"
echo -e "${YELLOW}   (7 messages: 6 valid + 1 invalid for testing)${NC}"
echo ""

cd test-producer && node index.js

echo ""
echo -e "${GREEN}✓ Test messages sent!${NC}"
echo ""
echo -e "${BLUE}4. Next steps:${NC}"
echo "   - Check Discord for notifications"
echo "   - Monitor DLQ with: ./monitor-dlq.sh"
echo "   - Check consumer logs for processing details"
echo ""
echo -e "${YELLOW}Message structure details: See MESSAGE_STRUCTURE.md${NC}"
