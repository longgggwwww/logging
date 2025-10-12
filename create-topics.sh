#!/bin/bash

# Script để tạo các Kafka topics

echo "🚀 Đang tạo Kafka topics..."

# Tạo topic error-logs (main topic)
echo "📝 Creating main topic: error-logs"
docker exec kafka-controller-1 /opt/kafka/bin/kafka-topics.sh \
  --create \
  --topic error-logs \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 3 \
  --if-not-exists

# Tạo topic retry queue
echo "📝 Creating retry topic: error-logs-retry"
docker exec kafka-controller-1 /opt/kafka/bin/kafka-topics.sh \
  --create \
  --topic error-logs-retry \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 3 \
  --if-not-exists

# Tạo Dead Letter Queue
echo "📝 Creating dead letter queue: error-logs-dlq"
docker exec kafka-controller-1 /opt/kafka/bin/kafka-topics.sh \
  --create \
  --topic error-logs-dlq \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 3 \
  --if-not-exists

echo "✅ Hoàn thành!"

# Liệt kê tất cả topics
echo ""
echo "📋 Danh sách topics hiện tại:"
docker exec kafka-controller-1 /opt/kafka/bin/kafka-topics.sh \
  --list \
  --bootstrap-server localhost:9092

# Hiển thị chi tiết của từng topic
echo ""
echo "📊 Chi tiết các topics:"
for topic in error-logs error-logs-retry error-logs-dlq; do
  echo ""
  echo "Topic: $topic"
  docker exec kafka-controller-1 /opt/kafka/bin/kafka-topics.sh \
    --describe \
    --topic $topic \
    --bootstrap-server localhost:9092 2>/dev/null || echo "  (chưa tồn tại)"
done
