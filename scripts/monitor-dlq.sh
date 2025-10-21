#!/bin/bash

# Script để monitor Dead Letter Queue

echo "🔍 Monitoring Dead Letter Queue (error-logs-dlq)"
echo "================================================"

# Kiểm tra số lượng messages trong DLQ
echo ""
echo "📊 Checking message count..."
docker exec kafka-controller-1 /opt/kafka/bin/kafka-run-class.sh \
  kafka.tools.GetOffsetShell \
  --broker-list localhost:9092 \
  --topic error-logs-dlq

# Đọc messages từ DLQ
echo ""
echo "📨 Latest messages in DLQ (last 10):"
echo "-----------------------------------"
docker exec kafka-controller-1 /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic error-logs-dlq \
  --from-beginning \
  --max-messages 10 \
  --timeout-ms 5000 \
  2>/dev/null || echo "No messages in DLQ"

echo ""
echo "✅ Monitoring complete"
