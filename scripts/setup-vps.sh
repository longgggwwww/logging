#!/bin/bash
# Script để setup VPS cho GitHub Actions deployment

set -e

echo "================================================"
echo "   VPS Setup for GitHub Actions Deployment"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo -e "${RED}Please don't run this script as root${NC}"
    echo "Run as regular user with sudo privileges"
    exit 1
fi

echo -e "${YELLOW}This script will:${NC}"
echo "  1. Install Docker and Docker Compose"
echo "  2. Setup project directory structure"
echo "  3. Configure SSH for GitHub Actions"
echo "  4. Setup environment files"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Update system
echo -e "\n${GREEN}[1/6] Updating system...${NC}"
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
echo -e "\n${GREEN}[2/6] Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm get-docker.sh
    
    # Add user to docker group
    sudo usermod -aG docker $USER
    echo -e "${YELLOW}You'll need to log out and back in for docker group to take effect${NC}"
else
    echo "Docker already installed"
fi

# Install Docker Compose
echo -e "\n${GREEN}[3/6] Installing Docker Compose...${NC}"
if ! command -v docker compose &> /dev/null; then
    sudo apt-get install docker-compose-plugin -y
else
    echo "Docker Compose already installed"
fi

# Create project directory
echo -e "\n${GREEN}[4/6] Creating project directory...${NC}"
mkdir -p ~/log-monitoring
cd ~/log-monitoring

# Setup SSH for GitHub Actions
echo -e "\n${GREEN}[5/6] Setting up SSH...${NC}"
mkdir -p ~/.ssh
chmod 700 ~/.ssh

if [ ! -f ~/.ssh/authorized_keys ]; then
    touch ~/.ssh/authorized_keys
    chmod 600 ~/.ssh/authorized_keys
fi

echo -e "\n${YELLOW}SSH Public Key Setup:${NC}"
echo "On your local machine, generate an SSH key:"
echo "  ssh-keygen -t rsa -b 4096 -f ~/.ssh/github-actions -N \"\""
echo ""
echo "Then, add the public key to this VPS:"
echo "  cat ~/.ssh/github-actions.pub"
echo ""
echo "Copy the output and paste it here (or press Enter to skip):"
read -r SSH_PUBLIC_KEY

if [ -n "$SSH_PUBLIC_KEY" ]; then
    echo "$SSH_PUBLIC_KEY" >> ~/.ssh/authorized_keys
    echo -e "${GREEN}SSH public key added!${NC}"
else
    echo -e "${YELLOW}Skipped. You can add it later to ~/.ssh/authorized_keys${NC}"
fi

# Create environment file template
echo -e "\n${GREEN}[6/6] Creating environment file template...${NC}"
cat > ~/log-monitoring/.env << 'EOF'
# Database Configuration
POSTGRES_DB=kafka
POSTGRES_USER=longgggwww
POSTGRES_PASSWORD=CHANGE_ME_SECURE_PASSWORD

MONGO_USERNAME=longgggwww
MONGO_PASSWORD=CHANGE_ME_SECURE_PASSWORD
MONGO_DATABASE=logs
MONGO_URL=mongodb://longgggwww:CHANGE_ME_SECURE_PASSWORD@mongodb:27017/logs?authSource=admin

# Redis
REDIS_URL=redis://redis:6379

# Kafka
KAFKA_EXTERNAL_HOST=localhost

# Keycloak
KEYCLOAK_URL=https://your-keycloak-url.com
KEYCLOAK_BE_CLIENT_ID=your-backend-client-id
KEYCLOAK_FE_CLIENT_ID=web-app-client
KEYCLOAK_REALM=master
KEYCLOAK_CLIENT_SECRET=CHANGE_ME_CLIENT_SECRET

# Session
SESSION_SECRET=CHANGE_ME_SESSION_SECRET

# Discord Bot (Optional)
DISCORD_BOT_TOKEN=
DISCORD_GUILD_ID=
DISCORD_CLIENT_ID=

# Web App
API_BASE_URL=http://localhost:3000
WEBSOCKET_URL=http://localhost:5000
WEBSOCKET_CORS_ORIGIN=*
EOF

echo -e "${GREEN}Environment file created at ~/log-monitoring/.env${NC}"
echo -e "${YELLOW}IMPORTANT: Edit this file and change all CHANGE_ME values!${NC}"

# Create deployment directory
mkdir -p ~/log-monitoring/deployment

# Summary
echo -e "\n${GREEN}================================================${NC}"
echo -e "${GREEN}   Setup Complete!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Edit environment file:"
echo "   nano ~/log-monitoring/.env"
echo ""
echo "2. Add GitHub Secrets in your repository:"
echo "   VPS_SSH_PRIVATE_KEY: Content of ~/.ssh/github-actions (from local machine)"
echo "   VPS_HOST: $(curl -s ifconfig.me)"
echo "   VPS_USER: $USER"
echo ""
echo "3. If you haven't already, log out and back in to apply docker group:"
echo "   exit"
echo ""
echo "4. Test Docker:"
echo "   docker ps"
echo "   docker compose version"
echo ""
echo -e "${GREEN}VPS is ready for GitHub Actions deployment!${NC}"
