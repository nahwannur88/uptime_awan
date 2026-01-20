#!/bin/bash

# Uptime Awan - Auto-Boot Setup Script
# This script sets up both systemd service and kiosk browser autostart
# It also disables sleep/hibernate and screen blanking

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "================================"
echo "Uptime Awan - Auto-Boot Setup"
echo "================================"
echo ""

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}This script should not be run as root${NC}"
   echo "Please run without sudo. It will ask for password when needed."
   exit 1
fi

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Get current user
CURRENT_USER=$(whoami)
CURRENT_HOME=$(eval echo ~$CURRENT_USER)

# Default values
DASHBOARD_PORT=3001
DASHBOARD_URL="http://localhost:${DASHBOARD_PORT}"

# Ask for dashboard URL
echo -e "${BLUE}Dashboard Configuration:${NC}"
read -p "Enter dashboard URL [default: http://localhost:3001]: " USER_URL
if [ ! -z "$USER_URL" ]; then
    DASHBOARD_URL="$USER_URL"
fi
echo -e "${GREEN}Using dashboard URL: ${DASHBOARD_URL}${NC}"
echo ""

# Step 1: Install required packages
echo -e "${GREEN}Step 1: Installing required packages...${NC}"
sudo apt update
sudo apt install -y chromium-browser unclutter x11-xserver-utils || {
    echo -e "${YELLOW}Note: Some packages may already be installed${NC}"
}
echo ""

# Step 2: Create systemd service
echo -e "${GREEN}Step 2: Creating systemd service...${NC}"

# Get Node.js path
NODE_PATH=$(which node)
if [ -z "$NODE_PATH" ]; then
    echo -e "${RED}Error: Node.js not found. Please install Node.js first.${NC}"
    exit 1
fi

# Create service file
SERVICE_FILE="/etc/systemd/system/uptime-awan.service"
sudo tee "$SERVICE_FILE" > /dev/null <<EOF
[Unit]
Description=Uptime Awan Dashboard
After=network.target

[Service]
Type=simple
User=${CURRENT_USER}
WorkingDirectory=${PROJECT_DIR}
Environment="NODE_ENV=production"
Environment="PORT=${DASHBOARD_PORT}"
ExecStart=${NODE_PATH} ${PROJECT_DIR}/server/index.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=uptime-awan

[Install]
WantedBy=multi-user.target
EOF

echo -e "${GREEN}Service file created: ${SERVICE_FILE}${NC}"
echo ""

# Step 3: Enable and start service
echo -e "${GREEN}Step 3: Enabling and starting service...${NC}"
sudo systemctl daemon-reload
sudo systemctl enable uptime-awan.service
sudo systemctl start uptime-awan.service

# Wait a moment for service to start
sleep 2

# Check service status
if sudo systemctl is-active --quiet uptime-awan.service; then
    echo -e "${GREEN}✓ Service is running${NC}"
else
    echo -e "${YELLOW}⚠ Service may not be running. Check with: sudo systemctl status uptime-awan.service${NC}"
fi
echo ""

# Step 4: Disable screen blanking
echo -e "${GREEN}Step 4: Disabling screen blanking...${NC}"

# Create autostart directory
mkdir -p "${CURRENT_HOME}/.config/lxsession/LXDE-pi"

# Add screen blanking disable commands
AUTOSTART_FILE="${CURRENT_HOME}/.config/lxsession/LXDE-pi/autostart"
if ! grep -q "@xset s off" "$AUTOSTART_FILE" 2>/dev/null; then
    echo "@xset s off" >> "$AUTOSTART_FILE"
    echo "@xset -dpms" >> "$AUTOSTART_FILE"
    echo "@xset s noblank" >> "$AUTOSTART_FILE"
    echo -e "${GREEN}✓ Screen blanking disabled${NC}"
else
    echo -e "${YELLOW}⚠ Screen blanking settings already exist${NC}"
fi
echo ""

# Step 5: Configure lightdm (disable screen saver)
echo -e "${GREEN}Step 5: Configuring display manager...${NC}"

LIGHTDM_CONF="/etc/lightdm/lightdm.conf"
if [ -f "$LIGHTDM_CONF" ]; then
    if ! grep -q "xserver-command=X -s 0 -dpms" "$LIGHTDM_CONF"; then
        sudo sed -i '/\[Seat:\*\]/a xserver-command=X -s 0 -dpms' "$LIGHTDM_CONF"
        echo -e "${GREEN}✓ Display manager configured${NC}"
    else
        echo -e "${YELLOW}⚠ Display manager already configured${NC}"
    fi
else
    echo -e "${YELLOW}⚠ lightdm.conf not found, skipping${NC}"
fi
echo ""

# Step 6: Create kiosk browser autostart
echo -e "${GREEN}Step 6: Creating kiosk browser autostart...${NC}"

mkdir -p "${CURRENT_HOME}/.config/autostart"

KIOSK_FILE="${CURRENT_HOME}/.config/autostart/kiosk.desktop"
cat > "$KIOSK_FILE" <<EOF
[Desktop Entry]
Type=Application
Name=Uptime Dashboard
Exec=chromium-browser --kiosk --noerrdialogs --disable-infobars --autoplay-policy=no-user-gesture-required --disable-session-crashed-bubble --disable-restore-session-state ${DASHBOARD_URL}
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
EOF

chmod +x "$KIOSK_FILE"
echo -e "${GREEN}✓ Kiosk autostart created: ${KIOSK_FILE}${NC}"
echo ""

# Step 7: Hide cursor (optional)
echo -e "${GREEN}Step 7: Setting up cursor hiding...${NC}"

if ! grep -q "@unclutter" "$AUTOSTART_FILE" 2>/dev/null; then
    echo "@unclutter -idle 0.1 -root" >> "$AUTOSTART_FILE"
    echo -e "${GREEN}✓ Cursor will be hidden after 0.1 seconds of inactivity${NC}"
else
    echo -e "${YELLOW}⚠ Cursor hiding already configured${NC}"
fi
echo ""

# Step 8: Disable sleep/hibernate
echo -e "${GREEN}Step 8: Disabling sleep/hibernate...${NC}"

sudo systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target 2>/dev/null || {
    echo -e "${YELLOW}⚠ Some sleep targets may already be masked${NC}"
}

echo -e "${GREEN}✓ Sleep/hibernate disabled${NC}"
echo ""

# Step 9: Disable WiFi power management (if using WiFi)
echo -e "${GREEN}Step 9: Disabling WiFi power management...${NC}"

if command -v iwconfig &> /dev/null; then
    WIFI_INTERFACE=$(iwconfig 2>/dev/null | grep -o '^[^ ]*' | head -1)
    if [ ! -z "$WIFI_INTERFACE" ]; then
        echo "#!/bin/bash" | sudo tee /etc/NetworkManager/dispatcher.d/99-wifi-powersave-off > /dev/null
        echo "iwconfig $WIFI_INTERFACE power off" | sudo tee -a /etc/NetworkManager/dispatcher.d/99-wifi-powersave-off > /dev/null
        sudo chmod +x /etc/NetworkManager/dispatcher.d/99-wifi-powersave-off
        sudo iwconfig $WIFI_INTERFACE power off
        echo -e "${GREEN}✓ WiFi power management disabled for ${WIFI_INTERFACE}${NC}"
    else
        echo -e "${YELLOW}⚠ No WiFi interface found${NC}"
    fi
else
    echo -e "${YELLOW}⚠ iwconfig not found, skipping WiFi power management${NC}"
fi
echo ""

# Step 10: Disable USB autosuspend
echo -e "${GREEN}Step 10: Disabling USB autosuspend...${NC}"

USB_RULE="/etc/udev/rules.d/50-usb_power_save.rules"
if [ ! -f "$USB_RULE" ]; then
    echo 'SUBSYSTEM=="usb", ATTR{power/autosuspend}="-1"' | sudo tee "$USB_RULE" > /dev/null
    echo -e "${GREEN}✓ USB autosuspend disabled${NC}"
else
    echo -e "${YELLOW}⚠ USB autosuspend rule already exists${NC}"
fi
echo ""

# Summary
echo "================================"
echo -e "${GREEN}Setup Complete!${NC}"
echo "================================"
echo ""
echo -e "${BLUE}What was configured:${NC}"
echo "  ✓ Systemd service (auto-starts on boot)"
echo "  ✓ Kiosk browser (auto-opens on desktop login)"
echo "  ✓ Screen blanking disabled"
echo "  ✓ Sleep/hibernate disabled"
echo "  ✓ Cursor hiding enabled"
echo "  ✓ WiFi power management disabled"
echo "  ✓ USB autosuspend disabled"
echo ""
echo -e "${BLUE}Service Status:${NC}"
sudo systemctl status uptime-awan.service --no-pager -l | head -10
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Test the service: sudo systemctl status uptime-awan.service"
echo "  2. View service logs: sudo journalctl -u uptime-awan.service -f"
echo "  3. Reboot to test auto-boot: sudo reboot"
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo "  Restart service: sudo systemctl restart uptime-awan.service"
echo "  Stop service: sudo systemctl stop uptime-awan.service"
echo "  View logs: sudo journalctl -u uptime-awan.service -f"
echo "  Check service: sudo systemctl status uptime-awan.service"
echo ""
echo -e "${GREEN}After reboot, the dashboard should automatically open in fullscreen!${NC}"
echo ""
