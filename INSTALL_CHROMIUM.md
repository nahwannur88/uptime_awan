# Install Chromium Browser on Raspberry Pi

Quick guide to install Chromium browser for kiosk mode.

## Installation

### Method 1: Standard Installation (Recommended)

```bash
sudo apt update
sudo apt install -y chromium-browser
```

### Method 2: If chromium-browser package not found

Some Raspberry Pi OS versions use a different package name:

```bash
sudo apt update
sudo apt install -y chromium chromium-browser
```

### Method 3: Install from Raspberry Pi repository

```bash
sudo apt update
sudo apt install -y chromium
```

## Verify Installation

After installation, verify Chromium is installed:

```bash
which chromium-browser
# Should show: /usr/bin/chromium-browser

# Or try:
which chromium
# Should show: /usr/bin/chromium
```

## Test Kiosk Mode

Once installed, test kiosk mode:

```bash
# If chromium-browser command works:
chromium-browser --kiosk http://localhost:3001

# Or if only chromium command works:
chromium --kiosk http://localhost:3001
```

## Update Auto-Boot Script

If your system uses `chromium` instead of `chromium-browser`, you may need to update the kiosk autostart file:

```bash
nano ~/.config/autostart/kiosk.desktop
```

Change the Exec line to use `chromium` instead of `chromium-browser`:

```ini
Exec=chromium --kiosk --noerrdialogs --disable-infobars http://localhost:3001
```

## Alternative: Use Chromium from Snap (if apt doesn't work)

```bash
# Install snapd first
sudo apt install -y snapd
sudo snap install core

# Install chromium
sudo snap install chromium
```

Then use: `/snap/bin/chromium` in your kiosk.desktop file.

## Troubleshooting

### Check available browser packages

```bash
apt search chromium
```

### Check if browser is installed but with different name

```bash
ls /usr/bin/ | grep -i chrom
ls /usr/bin/ | grep -i browser
```

### Install dependencies if needed

```bash
sudo apt install -y chromium-browser unclutter x11-xserver-utils
```
