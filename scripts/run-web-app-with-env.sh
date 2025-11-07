#!/bin/bash

# Script to run web-app with predefined environment variables or from .env file

set -e

# Default values
DEFAULT_API_BASE_URL=http://localhost:3000
DEFAULT_WEBSOCKET_URL=http://localhost:5000
DEFAULT_KEYCLOAK_URL=https://keycloak.iit.vn
DEFAULT_KEYCLOAK_REALM=master
DEFAULT_KEYCLOAK_BE_CLIENT_ID=BE-log-monitoring
DEFAULT_KEYCLOAK_FE_CLIENT_ID=FE-log-monitoring
DEFAULT_KEYCLOAK_CLIENT_SECRET=KExgFbvftbzjJKkytIVaZiyf9fDjNw9w

# Parse command line arguments
ENV_FILE=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --env-file)
      ENV_FILE="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--env-file <path-to-env-file>]"
      exit 1
      ;;
  esac
done

# Load environment variables from file if specified
if [ -n "$ENV_FILE" ]; then
  if [ -f "$ENV_FILE" ]; then
    echo "Loading environment variables from $ENV_FILE..."
    set -a
    source "$ENV_FILE"
    set +a
  else
    echo "Error: Environment file '$ENV_FILE' not found"
    exit 1
  fi
else
  # Use default values if no env file specified
  export API_BASE_URL=${API_BASE_URL:-$DEFAULT_API_BASE_URL}
  export WEBSOCKET_URL=${WEBSOCKET_URL:-$DEFAULT_WEBSOCKET_URL}
  export KEYCLOAK_URL=${KEYCLOAK_URL:-$DEFAULT_KEYCLOAK_URL}
  export KEYCLOAK_REALM=${KEYCLOAK_REALM:-$DEFAULT_KEYCLOAK_REALM}
  export KEYCLOAK_BE_CLIENT_ID=${KEYCLOAK_BE_CLIENT_ID:-$DEFAULT_KEYCLOAK_BE_CLIENT_ID}
  export KEYCLOAK_FE_CLIENT_ID=${KEYCLOAK_FE_CLIENT_ID:-$DEFAULT_KEYCLOAK_FE_CLIENT_ID}
  export KEYCLOAK_CLIENT_SECRET=${KEYCLOAK_CLIENT_SECRET:-$DEFAULT_KEYCLOAK_CLIENT_SECRET}
fi

# Run the web-app script
./scripts/run-web-app.sh