# Auto-Boot Dashboard and Prevent Sleep/Hibernate

Complete guide to make your Raspberry Pi 4 automatically boot to the dashboard on power-on and prevent sleep/hibernate.

## Prerequisites

- Raspberry Pi 4 with Raspberry Pi OS
- Dashboard already installed and running
- Desktop environment (if using kiosk mode)

## Method 1: Kiosk Mode (Recommended for Display Board)

This method automatically opens the dashboard in fullscreen browser on boot, perfect for a dedicated display board.

### Step 1: Install Required Packages

```bash
sudo apt update
sudo apt install -y chromium-browser unclutter x11-xserver-utils
```

### Step 2: Disable Screen Blanking and Power Management

```bash
# Disable screen blanking
sudo nano /etc/xdg/lxsession/LXDE-pi/autostart
```

Add these lines at the end of the file:

```bash
@xset s off
@xset -dpms
@xset s noblank
```

Save and exit (Ctrl+X, then Y, then Enter).

### Step 3: Disable Screen Saver

```bash
# Disable screen saver
sudo nano /etc/lightdm/lightdm.conf
```

Find the `[Seat:*]` section and add/modify:

```ini
[Seat:*]
xserver-command=X -s 0 -dpms
```

Save and exit.

### Step 4: Create Kiosk Autostart Script

```bash
# Create autostart directory if it doesn't exist
mkdir -p ~/.config/autostart

# Create kiosk autostart file
nano ~/.config/autostart/kiosk.desktop
```

Add the following content (replace `YOUR_PI_IP` with your Raspberry Pi's IP address or use `localhost`):

```ini
[Desktop Entry]
Type=Application
Name=Uptime Dashboard
Exec=chromium-browser --kiosk --noerrdialogs --disable-infobars --autoplay-policy=no-user-gesture-required http://localhost:3001
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
```

**Note:** If your dashboard is on a different port, change `3001` to your port number.

Save and exit.

### Step 5: Hide Cursor (Optional)

```bash
# Install unclutter if not already installed
sudo apt install -y unclutter

# Add to autostart
echo "@unclutter -idle 0.1 -root" >> ~/.config/lxsession/LXDE-pi/autostart
```

### Step 6: Disable Sleep/Hibernate in System

```bash
# Disable sleep/hibernate
sudo systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target
```

### Step 7: Disable WiFi Power Management (if using WiFi)

```bash
# Create WiFi power management config
sudo nano /etc/network/interfaces.d/wlan0
```

Add (if using wlan0):

```
allow-hotplug wlan0
iface wlan0 inet dhcp
    wireless-power off
```

Or if using NetworkManager:

```bash
sudo nano /etc/NetworkManager/conf.d/default-wifi-powersave-on.conf
```

Add:

```ini
[connection]
wifi.powersave = 2
```

### Step 8: Prevent USB Auto-Suspend

```bash
# Disable USB autosuspend
echo 'SUBSYSTEM=="usb", ATTR{power/autosuspend}="-1"' | sudo tee /etc/udev/rules.d/50-usb_power_save.rules
```

### Step 9: Reboot

```bash
sudo reboot
```

After reboot, the dashboard should automatically open in fullscreen kiosk mode.

---

## Method 2: Systemd Service (For Headless/SSH Access)

If you want the dashboard to start automatically but don't need a browser, use this method.

### Step 1: Create Systemd Service File

```bash
sudo nano /etc/systemd/system/uptime-awan.service
```

Add the following content (adjust paths as needed):

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
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=uptime-awan

[Install]
WantedBy=multi-user.target
```

**Important:** Replace `/home/pi/uptime-awan` with your actual project path.

### Step 2: Enable and Start Service

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable uptime-awan.service

# Start the service
sudo systemctl start uptime-awan.service

# Check status
sudo systemctl status uptime-awan.service
```

### Step 3: Disable Sleep/Hibernate

```bash
# Disable sleep/hibernate
sudo systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target
```

### Step 4: Verify Auto-Start

```bash
# Reboot to test
sudo reboot

# After reboot, check if service is running
sudo systemctl status uptime-awan.service
```

---

## Method 3: Combined (Service + Kiosk Browser)

Best of both worlds: Service runs in background, browser opens on desktop.

### Step 1: Set Up Systemd Service (from Method 2)

Follow Step 1 and Step 2 from Method 2.

### Step 2: Set Up Kiosk Browser (from Method 1)

Follow Steps 1-5 from Method 1.

### Step 3: Disable Sleep/Hibernate

Follow Step 6 from Method 1.

---

## Additional Power Management Settings

### Disable HDMI Power Saving

```bash
# Add to config.txt
sudo nano /boot/config.txt
```

Add:

```
hdmi_blanking=1
hdmi_force_hotplug=1
```

### Disable CPU Throttling

```bash
# Disable CPU throttling
sudo nano /boot/config.txt
```

Add:

```
force_turbo=0
arm_freq=1500
```

**Note:** Adjust `arm_freq` based on your Pi model (Pi 4 default is 1500).

### Set Performance Governor

```bash
# Set CPU governor to performance
echo 'GOVERNOR="performance"' | sudo tee /etc/default/cpufrequtils

# Or for newer kernels
echo performance | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
```

---

## Troubleshooting

### Dashboard Not Opening on Boot

1. Check if service is running:
   ```bash
   sudo systemctl status uptime-awan.service
   ```

2. Check browser autostart:
   ```bash
   cat ~/.config/autostart/kiosk.desktop
   ```

3. Check logs:
   ```bash
   journalctl -u uptime-awan.service -n 50
   ```

### Screen Still Blanks

1. Check X11 settings:
   ```bash
   xset q
   ```

2. Verify autostart file:
   ```bash
   cat ~/.config/lxsession/LXDE-pi/autostart
   ```

3. Check lightdm config:
   ```bash
   cat /etc/lightdm/lightdm.conf | grep xserver-command
   ```

### Service Not Starting on Boot

1. Check if service is enabled:
   ```bash
   sudo systemctl is-enabled uptime-awan.service
   ```

2. Check service logs:
   ```bash
   sudo journalctl -u uptime-awan.service -b
   ```

3. Verify paths in service file:
   ```bash
   sudo cat /etc/systemd/system/uptime-awan.service
   ```

### WiFi Disconnects

1. Check WiFi power management:
   ```bash
   iwconfig wlan0 | grep Power
   ```

2. Disable power saving:
   ```bash
   sudo iwconfig wlan0 power off
   ```

---

## Quick Reference Commands

```bash
# Check if service is running
sudo systemctl status uptime-awan.service

# Restart service
sudo systemctl restart uptime-awan.service

# View service logs
sudo journalctl -u uptime-awan.service -f

# Disable sleep/hibernate
sudo systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target

# Check if sleep is disabled
systemctl status sleep.target

# Disable screen blanking
xset s off
xset -dpms
xset s noblank

# Check screen settings
xset q
```

---

## Notes

- **Kiosk Mode**: Best for dedicated display boards where you want fullscreen browser
- **Service Only**: Best for headless setups or when accessing via other devices
- **Combined**: Best for display board with background service reliability
- **Port**: Default port is 3001, change in service file or `.env` if needed
- **IP Address**: Use `localhost` if browser and server are on same Pi, or use Pi's IP if accessing remotely

---

## Security Considerations

If exposing the dashboard to the network:

1. Change default port if needed
2. Consider firewall rules
3. Use HTTPS if possible (requires reverse proxy like nginx)
4. Keep system updated: `sudo apt update && sudo apt upgrade`

---

## Reverting Changes

To disable auto-boot:

```bash
# Disable service
sudo systemctl disable uptime-awan.service
sudo systemctl stop uptime-awan.service

# Remove kiosk autostart
rm ~/.config/autostart/kiosk.desktop

# Re-enable sleep (if needed)
sudo systemctl unmask sleep.target suspend.target hibernate.target hybrid-sleep.target
```
