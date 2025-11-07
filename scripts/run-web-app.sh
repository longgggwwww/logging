#!/bin/bash

# Script to build and run the web-app using Docker

set -e

IMAGE_NAME="log-monitoring-web-app"
CONTAINER_NAME="log-monitoring-web-app-container"
PORT=8000  # Adjust if needed

# Environment variables for build
API_BASE_URL="${API_BASE_URL:-http://localhost:3000}"
WEBSOCKET_URL="${WEBSOCKET_URL:-http://localhost:5000}"
KEYCLOAK_URL="${KEYCLOAK_URL:-http://localhost:8080}"
KEYCLOAK_REALM="${KEYCLOAK_REALM:-master}"
KEYCLOAK_BE_CLIENT_ID="${KEYCLOAK_BE_CLIENT_ID:-api-service}"
KEYCLOAK_FE_CLIENT_ID="${KEYCLOAK_FE_CLIENT_ID:-web-app-client}"
KEYCLOAK_CLIENT_SECRET="${KEYCLOAK_CLIENT_SECRET:-keycloak-client-secret}"

echo "Building Docker image for web-app..."
docker build \
  --build-arg API_BASE_URL="$API_BASE_URL" \
  --build-arg WEBSOCKET_URL="$WEBSOCKET_URL" \
  --build-arg KEYCLOAK_URL="$KEYCLOAK_URL" \
  --build-arg KEYCLOAK_REALM="$KEYCLOAK_REALM" \
  --build-arg KEYCLOAK_BE_CLIENT_ID="$KEYCLOAK_BE_CLIENT_ID" \
  --build-arg KEYCLOAK_FE_CLIENT_ID="$KEYCLOAK_FE_CLIENT_ID" \
  --build-arg KEYCLOAK_CLIENT_SECRET="$KEYCLOAK_CLIENT_SECRET" \
  -t $IMAGE_NAME ./web-app

echo "Running web-app container..."
docker run -d --name $CONTAINER_NAME -p $PORT:80 $IMAGE_NAME

echo "Web-app is running at http://localhost:$PORT"