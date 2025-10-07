#!/bin/bash

echo "🧹 Cleaning up previous containers..."
docker-compose down -v

echo "🚀 Starting Kafka cluster with KRaft..."
docker-compose up -d

echo "⏳ Waiting for cluster to be ready..."
sleep 50

echo "🔍 Checking cluster status..."
docker exec kafka1 kafka-topics --list --bootstrap-server localhost:9092

echo "✅ Cluster is ready!"
echo "📊 Kafka UI: http://localhost:8080"
echo "🔗 Brokers: localhost:9092, localhost:9093, localhost:9094"
echo "🗄️  PostgreSQL: localhost:5432"
echo "🔴 Redis: localhost:6379"