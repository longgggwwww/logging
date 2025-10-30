#!/bin/bash

# Script to build and run the web-app using Docker

set -e

IMAGE_NAME="syslog-web-app"
CONTAINER_NAME="syslog-web-app-container"
PORT=8080  # Adjust if needed

# Environment variables for build
REACT_APP_API_BASE_URL="${REACT_APP_API_BASE_URL:-http://localhost:3000}"
KEYCLOAK_SERVER_URL="${KEYCLOAK_SERVER_URL:-http://localhost:8080}"
KEYCLOAK_REALM="${KEYCLOAK_REALM:-master}"
KEYCLOAK_API_CLIENT_ID="${KEYCLOAK_API_CLIENT_ID:-api-service}"
KEYCLOAK_PUBLIC_CLIENT_ID="${KEYCLOAK_PUBLIC_CLIENT_ID:-web-app-client}"
KEYCLOAK_CLIENT_SECRET="${KEYCLOAK_CLIENT_SECRET:-keycloak-client-secret}"

echo "Building Docker image for web-app..."
docker build \
  --build-arg REACT_APP_API_BASE_URL="$REACT_APP_API_BASE_URL" \
  --build-arg KEYCLOAK_SERVER_URL="$KEYCLOAK_SERVER_URL" \
  --build-arg KEYCLOAK_REALM="$KEYCLOAK_REALM" \
  --build-arg KEYCLOAK_API_CLIENT_ID="$KEYCLOAK_API_CLIENT_ID" \
  --build-arg KEYCLOAK_PUBLIC_CLIENT_ID="$KEYCLOAK_PUBLIC_CLIENT_ID" \
  --build-arg KEYCLOAK_CLIENT_SECRET="$KEYCLOAK_CLIENT_SECRET" \
  -t $IMAGE_NAME ./web-app

echo "Running web-app container..."
docker run -d --name $CONTAINER_NAME -p $PORT:80 $IMAGE_NAME

echo "Web-app is running at http://localhost:$PORT"