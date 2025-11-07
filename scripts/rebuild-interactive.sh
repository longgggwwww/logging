#!/bin/bash

# Interactive script to rebuild services and web-app
# Usage: ./scripts/rebuild-interactive.sh

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

SERVICES=(
  "api"
  "processor"
  "realtime"
  "discord-bot"
  "fcm"
  "web-app"
)

echo -e "${CYAN}================================================${NC}"
echo -e "${CYAN}   Service Rebuild Tool (Interactive Mode)${NC}"
echo -e "${CYAN}================================================${NC}"
echo ""

# Display available services
echo -e "${YELLOW}Available services:${NC}"
for i in "${!SERVICES[@]}"; do
  echo -e "  ${GREEN}$((i+1)).${NC} ${SERVICES[$i]}"
done
echo -e "  ${GREEN}7.${NC} All services"
echo -e "  ${GREEN}0.${NC} Exit"
echo ""

# Ask user to select service
read -p "$(echo -e ${BLUE}Select service to rebuild [0-7]: ${NC})" choice

case $choice in
  0)
    echo -e "${YELLOW}Exiting...${NC}"
    exit 0
    ;;
  1|2|3|4|5|6)
    selected_service="${SERVICES[$((choice-1))]}"
    ;;
  7)
    selected_service="all"
    ;;
  *)
    echo -e "${RED}Invalid choice!${NC}"
    exit 1
    ;;
esac

# Confirm action
echo ""
if [ "$selected_service" == "all" ]; then
  echo -e "${YELLOW}You are about to rebuild ALL services.${NC}"
else
  echo -e "${YELLOW}You are about to rebuild: ${GREEN}$selected_service${NC}"
fi
echo ""
read -p "$(echo -e ${BLUE}Are you sure? [y/N]: ${NC})" confirm

if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}Cancelled.${NC}"
  exit 0
fi

# Function to toggle rebuild flag
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
  current_value=$(cat "$rebuild_file")
  
  # Toggle value
  if [ "$current_value" == "true" ]; then
    new_value="false"
  else
    new_value="true"
  fi
  
  # Write new value
  echo "$new_value" > "$rebuild_file"
  
  echo -e "${GREEN}✓${NC} Toggled $service rebuild flag: $current_value → $new_value"
}

# Function to commit and push changes
commit_and_push() {
  local service=$1
  
  echo ""
  echo -e "${CYAN}Committing changes...${NC}"
  
  if [ "$service" == "all" ]; then
    git add services/*/.rebuild web-app/.rebuild
    commit_message="ci: trigger rebuild for all services"
  elif [ "$service" == "web-app" ]; then
    git add web-app/.rebuild
    commit_message="ci: trigger rebuild for web-app"
  else
    git add "services/$service/.rebuild"
    commit_message="ci: trigger rebuild for $service"
  fi
  
  if git diff --staged --quiet; then
    echo -e "${YELLOW}No changes to commit${NC}"
    return 0
  fi
  
  git commit -m "$commit_message"
  
  echo ""
  read -p "$(echo -e ${BLUE}Push to remote and trigger CI/CD? [y/N]: ${NC})" push_confirm
  
  if [[ "$push_confirm" =~ ^[Yy]$ ]]; then
    echo -e "${CYAN}Pushing to remote...${NC}"
    git push
    echo ""
    echo -e "${GREEN}✓ Successfully pushed! CI/CD pipeline should start shortly.${NC}"
  else
    echo -e "${YELLOW}Changes committed locally but not pushed.${NC}"
    echo -e "${YELLOW}Run 'git push' manually when ready.${NC}"
  fi
}

# Execute rebuild
echo ""
echo -e "${CYAN}Processing rebuild...${NC}"
echo ""

if [ "$selected_service" == "all" ]; then
  for service in "${SERVICES[@]}"; do
    toggle_rebuild_flag "$service"
  done
else
  toggle_rebuild_flag "$selected_service"
fi

# Ask if user wants to commit and push
echo ""
commit_and_push "$selected_service"

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}   Done!${NC}"
echo -e "${GREEN}================================================${NC}"
