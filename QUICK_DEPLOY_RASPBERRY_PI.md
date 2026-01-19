# Quick Deploy to Raspberry Pi

Simple guide to deploy Uptime Awan Dashboard to your Raspberry Pi.

## Method 1: Automated Setup (Easiest) ⚡

### Step 1: Connect to Your Raspberry Pi

```bash
# SSH into your Raspberry Pi
ssh pi@192.168.100.213
# Or use your Raspberry Pi's IP address
```

### Step 2: Clone the Repository

```bash
cd /home/pi
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git uptime-awan
cd uptime-awan
```

**Replace `YOUR_USERNAME` and `YOUR_REPO` with your actual GitHub repository details.**

### Step 3: Run the Setup Script

```bash
chmod +x scripts/setup-raspberry-pi.sh
./scripts/setup-raspberry-pi.sh
```

The script will automatically:
- ✅ Update system packages
- ✅ Install Node.js 18.x
- ✅ Install build tools
- ✅ Install all dependencies
- ✅ Build the React frontend
- ✅ Create systemd service
- ✅ Start the application

### Step 4: Access Your Dashboard

After setup completes, access your dashboard at:
```
http://192.168.100.213:3001
```
(Replace with your Raspberry Pi's IP address)

---

## Method 2: Manual Setup (Step-by-Step)

### Step 1: Update System

```bash
sudo apt update
sudo apt upgrade -y
```

### Step 2: Install Node.js

```bash
# Install Node.js 22.x (LTS) - Recommended
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# OR Node.js 24.x (Latest LTS) for newest features
# curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
# sudo apt install -y nodejs

# Verify
node --version  # Should show v22.x.x or v24.x.x
npm --version   # Should show 10.x.x or higher
```

### Step 3: Install Build Tools

```bash
sudo apt install -y build-essential python3 git
```

### Step 4: Clone Repository

```bash
cd /home/pi
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git uptime-awan
cd uptime-awan
```

### Step 5: Install Dependencies

```bash
# Install server dependencies
npm install

# Install client dependencies and build
cd client
npm install
npm run build
cd ..
```

**Note:** This may take 5-10 minutes on Raspberry Pi. Be patient!

### Step 6: Configure Environment

```bash
cp .env.example .env
nano .env
```

Update these settings:
```env
PORT=3001
NODE_ENV=production
SPEEDTEST_INTERVAL=3600000
MONITOR_INTERVAL=60000
DB_PATH=/home/pi/uptime-awan/data/uptime.db
```

Save: `Ctrl+X`, then `Y`, then `Enter`

### Step 7: Create Data Directory

```bash
mkdir -p data
chmod 755 data
```

### Step 8: Create Systemd Service

```bash
sudo nano /etc/systemd/system/uptime-awan.service
```

Paste this content:
```ini
[Unit]
Description=Uptime Awan Dashboard
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/uptime-awan
Environment=NODE_ENV=production
ExecStart=/usr/bin/node /home/pi/uptime-awan/server/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=uptime-awan

[Install]
WantedBy=multi-user.target
```

Save: `Ctrl+X`, then `Y`, then `Enter`

### Step 9: Start the Service

```bash
sudo systemctl daemon-reload
sudo systemctl enable uptime-awan
sudo systemctl start uptime-awan
```

### Step 10: Check Status

```bash
sudo systemctl status uptime-awan
```

You should see "active (running)".

---

## Accessing Your Dashboard

### Find Your Raspberry Pi IP

```bash
hostname -I
```

### Open in Browser

```
http://[raspberry-pi-ip]:3001
```

Example: `http://192.168.100.213:3001`

---

## Useful Commands

### View Logs
```bash
sudo journalctl -u uptime-awan -f
```

### Restart Service
```bash
sudo systemctl restart uptime-awan
```

### Stop Service
```bash
sudo systemctl stop uptime-awan
```

### Check Service Status
```bash
sudo systemctl status uptime-awan
```

### View Recent Logs
```bash
sudo journalctl -u uptime-awan -n 50
```

---

## Troubleshooting

### Service Won't Start

1. Check logs:
   ```bash
   sudo journalctl -u uptime-awan -n 50
   ```

2. Verify Node.js is installed:
   ```bash
   node --version
   ```

3. Check if port 3001 is in use:
   ```bash
   sudo netstat -tulpn | grep 3001
   ```

### Can't Access from Another Computer

1. Check firewall:
   ```bash
   sudo ufw allow 3001/tcp
   ```

2. Verify service is running:
   ```bash
   sudo systemctl status uptime-awan
   ```

3. Check Raspberry Pi IP:
   ```bash
   hostname -I
   ```

### Dependencies Installation Failed

1. Install missing build tools:
   ```bash
   sudo apt install -y build-essential python3
   ```

2. Rebuild native modules:
   ```bash
   npm rebuild
   ```

---

## Next Steps

1. **Configure Email Settings**: Click the mail icon in the dashboard to set up daily reports
2. **Add Monitors**: Click "Add Monitor" to start monitoring servers
3. **Configure Speed Test**: Adjust speed test interval in settings
4. **Access from Network**: The dashboard is accessible from any device on your network

---

## Need More Help?

- See `RASPBERRY_PI_SETUP.md` for detailed instructions
- See `GIT_SETUP_RASPBERRY_PI.md` for Git-specific setup
- See `README.md` for general documentation
