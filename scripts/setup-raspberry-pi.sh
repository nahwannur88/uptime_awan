#!/bin/bash

# Uptime Awan - Raspberry Pi Setup Script
# This script automates the setup process for Raspberry Pi 4

set -e

echo "================================"
echo "Uptime Awan - Raspberry Pi Setup"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on Raspberry Pi
if [[ ! -f /proc/device-tree/model ]] || ! grep -q "Raspberry Pi" /proc/device-tree/model 2>/dev/null; then
    echo -e "${YELLOW}Warning: This script is designed for Raspberry Pi${NC}"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}This script should not be run as root${NC}"
   echo "Please run without sudo. It will ask for password when needed."
   exit 1
fi

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${GREEN}Step 1: Updating system...${NC}"
sudo apt update
sudo apt upgrade -y

echo ""
echo -e "${GREEN}Step 2: Installing Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 22.x (LTS)..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt install -y nodejs
else
    NODE_VERSION=$(node -v)
    echo "Node.js already installed: $NODE_VERSION"
    echo "Note: Recommended version is Node.js 22.x (LTS) or 24.x (LTS)"
fi

echo ""
echo -e "${GREEN}Step 3: Installing build tools...${NC}"
sudo apt install -y build-essential python3 git

echo ""
echo -e "${GREEN}Step 4: Installing dependencies...${NC}"
cd "$PROJECT_DIR"
echo "Installing server dependencies..."
npm install

echo "Installing client dependencies..."
cd client
npm install

echo ""
echo -e "${GREEN}Step 5: Building client application...${NC}"
echo "This may take 5-10 minutes on Raspberry Pi..."
npm run build

cd "$PROJECT_DIR"

echo ""
echo -e "${GREEN}Step 6: Creating environment configuration...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env file. You can edit it later if needed."
else
    echo ".env file already exists, skipping..."
fi

echo ""
echo -e "${GREEN}Step 7: Creating data directory...${NC}"
mkdir -p data
chmod 755 data

echo ""
echo -e "${GREEN}Step 8: Setting up systemd service...${NC}"

# Create systemd service file
sudo tee /etc/systemd/system/uptime-awan.service > /dev/null <<EOF
[Unit]
Description=Uptime Awan Dashboard
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$PROJECT_DIR
Environment=NODE_ENV=production
ExecStart=$(which node) $PROJECT_DIR/server/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=uptime-awan

[Install]
WantedBy=multi-user.target
EOF

echo "Systemd service file created."

echo ""
echo -e "${GREEN}Step 9: Enabling and starting service...${NC}"
sudo systemctl daemon-reload
sudo systemctl enable uptime-awan
sudo systemctl start uptime-awan

echo ""
echo -e "${GREEN}Step 10: Checking service status...${NC}"
sleep 3
if sudo systemctl is-active --quiet uptime-awan; then
    echo -e "${GREEN}✓ Service is running!${NC}"
else
    echo -e "${RED}✗ Service failed to start${NC}"
    echo "Checking logs..."
    sudo journalctl -u uptime-awan -n 20
    exit 1
fi

echo ""
echo -e "${GREEN}Step 11: Configuring firewall (optional)...${NC}"
if command -v ufw &> /dev/null; then
    read -p "Configure firewall with ufw? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo ufw allow 22/tcp comment 'SSH'
        sudo ufw allow 3001/tcp comment 'Uptime Awan'
        sudo ufw --force enable
        echo "Firewall configured."
    fi
else
    echo "ufw not installed, skipping firewall configuration."
fi

echo ""
echo "================================"
echo -e "${GREEN}Setup Complete!${NC}"
echo "================================"
echo ""
echo "Your Uptime Awan Dashboard is now running!"
echo ""
echo "Access it at:"
echo -e "  ${GREEN}http://$(hostname -I | awk '{print $1}'):3001${NC}"
echo ""
echo "Useful commands:"
echo "  View logs:        sudo journalctl -u uptime-awan -f"
echo "  Restart service:  sudo systemctl restart uptime-awan"
echo "  Stop service:     sudo systemctl stop uptime-awan"
echo "  Service status:   sudo systemctl status uptime-awan"
echo ""
echo "Configuration file: $PROJECT_DIR/.env"
echo "Database location:  $PROJECT_DIR/data/uptime.db"
echo ""
echo -e "${YELLOW}Note: First speed test will run within 5 seconds of startup${NC}"
echo -e "${YELLOW}      Subsequent tests run every hour (configurable in .env)${NC}"
echo ""
echo "For detailed documentation, see:"
echo "  - README.md"
echo "  - RASPBERRY_PI_SETUP.md"
echo ""
echo "Happy monitoring! 🚀"

