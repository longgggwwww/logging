#!/bin/bash

# Script to trigger CI/CD rebuild by toggling .rebuild flag
# Usage: ./scripts/trigger-rebuild.sh <service>
# Example: ./scripts/trigger-rebuild.sh api

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SERVICES=(
  "api"
  "processor"
  "realtime"
  "discord-bot"
  "fcm"
  "web-app"
)

show_usage() {
  echo -e "${YELLOW}Usage:${NC}"
  echo "  $0 <service>"
  echo ""
  echo -e "${YELLOW}Available services:${NC}"
  for service in "${SERVICES[@]}"; do
    echo "  - $service"
  done
  echo ""
  echo -e "${YELLOW}Examples:${NC}"
  echo "  $0 api              # Trigger rebuild for API service"
  echo "  $0 web-app          # Trigger rebuild for Web App"
  echo "  $0 all              # Trigger rebuild for ALL services"
}

toggle_rebuild_flag() {
  local service=$1
  local rebuild_file=""
  
  if [ "$service" == "web-app" ]; then
    rebuild_file="web-app/.rebuild"
  else
    rebuild_file="services/$service/.rebuild"
  fi
  
  if [ ! -f "$rebuild_file" ]; then
    echo -e "${RED}Error: $rebuild_file not found${NC}"
    return 1
  fi
  
  # Read current value
  local current_value=$(cat "$rebuild_file")
  
  # Toggle value (0 -> 1, 1 -> 0)
  if [ "$current_value" == "0" ]; then
    echo "1" > "$rebuild_file"
    echo -e "${GREEN}✓${NC} Toggled $service: 0 → 1"
  else
    echo "0" > "$rebuild_file"
    echo -e "${GREEN}✓${NC} Toggled $service: 1 → 0"
  fi
}

# Main script
if [ $# -eq 0 ]; then
  echo -e "${RED}Error: No service specified${NC}"
  echo ""
  show_usage
  exit 1
fi

SERVICE=$1

if [ "$SERVICE" == "help" ] || [ "$SERVICE" == "-h" ] || [ "$SERVICE" == "--help" ]; then
  show_usage
  exit 0
fi

if [ "$SERVICE" == "all" ]; then
  echo -e "${YELLOW}Triggering rebuild for ALL services...${NC}"
  echo ""
  for service in "${SERVICES[@]}"; do
    toggle_rebuild_flag "$service"
  done
  echo ""
  echo -e "${GREEN}✓ All services flagged for rebuild${NC}"
else
  # Check if service is valid
  if [[ ! " ${SERVICES[@]} " =~ " ${SERVICE} " ]]; then
    echo -e "${RED}Error: Invalid service '$SERVICE'${NC}"
    echo ""
    show_usage
    exit 1
  fi
  
  echo -e "${YELLOW}Triggering rebuild for $SERVICE...${NC}"
  echo ""
  toggle_rebuild_flag "$SERVICE"
  echo ""
  echo -e "${GREEN}✓ $SERVICE flagged for rebuild${NC}"
fi

echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Commit the changes: git add ."
echo "  2. Push to trigger CI/CD: git commit -m 'chore: trigger $SERVICE rebuild' && git push"
