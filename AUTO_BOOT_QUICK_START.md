# Quick Start: Auto-Boot Dashboard with Service + Browser

Simple guide to set up automatic boot to dashboard with both systemd service and kiosk browser.

## Prerequisites

- Raspberry Pi 4 with Raspberry Pi OS
- Dashboard already installed (if not, follow `GIT_SETUP_RASPBERRY_PI.md` first)
- You're logged in as the user who installed the dashboard (usually `pi`)

## Quick Setup (One Command)

```bash
cd ~/uptime-awan
chmod +x scripts/setup-auto-boot.sh
./scripts/setup-auto-boot.sh
```

The script will:
- ✅ Install required packages (Chromium, unclutter, etc.)
- ✅ Create and enable systemd service (runs in background)
- ✅ Set up kiosk browser autostart (opens fullscreen on desktop)
- ✅ Disable screen blanking
- ✅ Disable sleep/hibernate
- ✅ Hide cursor after inactivity
- ✅ Disable WiFi/USB power management

## What Happens

1. **Systemd Service**: Runs the dashboard server automatically on boot (even before login)
2. **Kiosk Browser**: Opens Chromium in fullscreen mode when desktop loads
3. **No Sleep**: System won't sleep, hibernate, or blank the screen

## After Running the Script

### Test the Service

```bash
# Check if service is running
sudo systemctl status uptime-awan.service

# View service logs
sudo journalctl -u uptime-awan.service -f
```

### Reboot to Test

```bash
sudo reboot
```

After reboot:
- Service starts automatically
- Desktop loads
- Browser opens in fullscreen with dashboard
- No screen blanking or sleep

## Manual Configuration (If Script Fails)

If the script doesn't work, you can configure manually:

### 1. Create Systemd Service

```bash
sudo nano /etc/systemd/system/uptime-awan.service
```

Add (replace paths as needed):

```ini
[Unit]
Description=Uptime Awan Dashboard
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/uptime-awan
Environment="NODE_ENV=production"
Environment="PORT=3001"
ExecStart=/usr/bin/node /home/pi/uptime-awan/server/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable uptime-awan.service
sudo systemctl start uptime-awan.service
```

### 2. Create Kiosk Autostart

```bash
mkdir -p ~/.config/autostart
nano ~/.config/autostart/kiosk.desktop
```

Add:

```ini
[Desktop Entry]
Type=Application
Name=Uptime Dashboard
Exec=chromium-browser --kiosk --noerrdialogs --disable-infobars http://localhost:3001
Hidden=false
X-GNOME-Autostart-enabled=true
```

### 3. Disable Screen Blanking

```bash
echo "@xset s off" >> ~/.config/lxsession/LXDE-pi/autostart
echo "@xset -dpms" >> ~/.config/lxsession/LXDE-pi/autostart
echo "@xset s noblank" >> ~/.config/lxsession/LXDE-pi/autostart
```

### 4. Disable Sleep/Hibernate

```bash
sudo systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target
```

## Troubleshooting

### Service Not Starting

```bash
# Check service status
sudo systemctl status uptime-awan.service

# View error logs
sudo journalctl -u uptime-awan.service -n 50

# Check if Node.js path is correct
which node

# Verify project path
ls -la /home/pi/uptime-awan/server/index.js
```

### Browser Not Opening

```bash
# Check autostart file
cat ~/.config/autostart/kiosk.desktop

# Test browser manually
chromium-browser --kiosk http://localhost:3001

# Check if service is running (browser needs service)
sudo systemctl status uptime-awan.service
```

### Screen Still Blanks

```bash
# Check X11 settings
xset q

# Verify autostart
cat ~/.config/lxsession/LXDE-pi/autostart

# Manually disable blanking
xset s off
xset -dpms
xset s noblank
```

### Dashboard Not Loading in Browser

1. Wait a few seconds after boot (service needs time to start)
2. Check service is running: `sudo systemctl status uptime-awan.service`
3. Check if port is correct in kiosk.desktop
4. Try accessing manually: `http://localhost:3001` in browser

## Disable Auto-Boot (Revert)

To disable auto-boot:

```bash
# Disable service
sudo systemctl disable uptime-awan.service
sudo systemctl stop uptime-awan.service

# Remove kiosk autostart
rm ~/.config/autostart/kiosk.desktop

# Re-enable sleep (optional)
sudo systemctl unmask sleep.target suspend.target hibernate.target hybrid-sleep.target
```

## Useful Commands

```bash
# Service management
sudo systemctl start uptime-awan.service
sudo systemctl stop uptime-awan.service
sudo systemctl restart uptime-awan.service
sudo systemctl status uptime-awan.service

# View logs
sudo journalctl -u uptime-awan.service -f
sudo journalctl -u uptime-awan.service -n 100

# Check if service starts on boot
sudo systemctl is-enabled uptime-awan.service
```

## Notes

- **Service runs first**: The systemd service starts the dashboard server on boot
- **Browser opens after login**: Kiosk browser opens when desktop environment loads
- **Port**: Default is 3001, change in service file or `.env` if needed
- **URL**: Script uses `localhost:3001` by default, change if accessing remotely
- **User**: Service runs as the user who ran the script (usually `pi`)

For detailed information, see `AUTO_BOOT_DASHBOARD.md`.
