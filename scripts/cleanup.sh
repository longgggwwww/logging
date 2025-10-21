#!/bin/bash

# Script để reset consumer group và xóa tất cả messages trong topics

echo "🧹 Kafka Cleanup Script"
echo "======================="
echo ""
echo "⚠️  WARNING: This will:"
echo "   - Delete consumer group offsets"
echo "   - Clear all messages from topics"
echo "   - Reset the system to fresh state"
echo ""
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ Cancelled"
  exit 0
fi

echo ""
echo "🗑️  Deleting consumer group..."
docker exec kafka-controller-1 /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --delete \
  --group discord-group 2>/dev/null || echo "  (group doesn't exist or already deleted)"

echo ""
echo "🗑️  Deleting topics..."
for topic in error-logs error-logs-retry error-logs-dlq; do
  echo "  Deleting topic: $topic"
  docker exec kafka-controller-1 /opt/kafka/bin/kafka-topics.sh \
    --delete \
    --topic $topic \
    --bootstrap-server localhost:9092 2>/dev/null || echo "  (topic doesn't exist)"
done

echo ""
echo "⏳ Waiting for topics to be deleted..."
sleep 3

echo ""
echo "📝 Recreating topics..."
./create-topics.sh

echo ""
echo "✅ Cleanup complete! System is ready for fresh start."
echo ""
echo "Next steps:"
echo "  1. Start consumer: cd discord-webhook && node index.js"
echo "  2. Test: node test-producer.js"
