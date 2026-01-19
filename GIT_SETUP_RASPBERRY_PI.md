# Raspberry Pi Setup Guide - Git Installation

Complete guide to install and deploy Uptime Awan Dashboard on Raspberry Pi 4 from Git repository.

## Prerequisites

- Raspberry Pi 4 (2GB+ RAM recommended, 4GB ideal)
- Raspberry Pi OS (64-bit recommended)
- SD Card with at least 16GB
- Internet connection (Ethernet recommended)
- SSH access or keyboard/monitor

## Step 1: Initial System Setup

### 1.1 Update System

```bash
sudo apt update
sudo apt upgrade -y
```

### 1.2 Install Node.js

```bash
# Install Node.js 22.x (LTS) - Recommended for best compatibility
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# OR install Node.js 24.x (Latest LTS) if you want the newest features
# curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
# sudo apt install -y nodejs

# Verify installation
node --version  # Should show v22.x.x or v24.x.x
npm --version   # Should show 10.x.x or higher
```

### 1.3 Install Git (if not already installed)

```bash
sudo apt install -y git
```

### 1.4 Install Build Tools

Required for native modules (canvas, sqlite3, etc.):

```bash
sudo apt install -y build-essential python3
```

## Step 2: Clone Repository

### 2.1 Navigate to Home Directory

```bash
cd /home/pi
```

### 2.2 Clone the Repository

```bash
# Using HTTPS (recommended)
git clone https://github.com/nahwannur88/uptime_awan.git uptime-awan

# OR using SSH (if you have SSH keys set up)
# git clone git@github.com:nahwannur88/uptime_awan.git uptime-awan
```

### 2.3 Navigate to Project Directory

```bash
cd uptime-awan
```

## Step 3: Install Dependencies

### 3.1 Install Server Dependencies

```bash
npm install
```

**Note**: This may take 5-10 minutes on Raspberry Pi, especially for native modules like `canvas` and `sqlite3`.

### 3.2 Install Client Dependencies and Build

```bash
cd client
npm install
npm run build
cd ..
```

**Note**: Building the React app may take 5-10 minutes on Raspberry Pi.

## Step 4: Configure Environment

### 4.1 Create Environment File

```bash
cp .env.example .env
```

### 4.2 Edit Environment Configuration

```bash
nano .env
```

Update the configuration:

```env
PORT=3001
NODE_ENV=production

# Speed Test Configuration (in milliseconds)
# 3600000 = 1 hour, 14400000 = 4 hours
SPEEDTEST_INTERVAL=3600000

# Monitoring Configuration (in milliseconds)
# 60000 = 1 minute
MONITOR_INTERVAL=60000

# Database
DB_PATH=/home/pi/uptime-awan/data/uptime.db
```

Save and exit (Ctrl+X, then Y, then Enter)

### 4.3 Create Data Directory

```bash
mkdir -p data
chmod 755 data
```

## Step 5: Test the Application

### 5.1 Test Run

```bash
NODE_ENV=production node server/index.js
```

You should see:
```
Connected to SQLite database
Database tables initialized
Server running on port 3001
WebSocket server ready
Speed test scheduler started (runs every hour)
Monitoring service started
Email service ready
Daily report scheduled for 08:00 every day
All services started successfully
```

### 5.2 Access Dashboard

Open a browser and navigate to:
```
http://[raspberry-pi-ip]:3001
```

Find your Raspberry Pi IP:
```bash
hostname -I
```

### 5.3 Stop Test Server

Press `Ctrl+C` to stop the test server.

## Step 6: Setup Systemd Service

### 6.1 Create Service File

```bash
sudo nano /etc/systemd/system/uptime-awan.service
```

Add the following content (adjust paths if needed):

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

Save and exit (Ctrl+X, then Y, then Enter)

### 6.2 Enable and Start Service

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable uptime-awan

# Start the service
sudo systemctl start uptime-awan

# Check status
sudo systemctl status uptime-awan
```

You should see `active (running)` in green.

## Step 7: Configure Firewall (Optional but Recommended)

```bash
# Install ufw if not already installed
sudo apt install -y ufw

# Allow SSH
sudo ufw allow 22/tcp

# Allow dashboard port
sudo ufw allow 3001/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## Step 8: Verify Installation

### 8.1 Check Service Status

```bash
sudo systemctl status uptime-awan
```

### 8.2 View Logs

```bash
# View recent logs
sudo journalctl -u uptime-awan -n 50

# Follow logs in real-time
sudo journalctl -u uptime-awan -f
```

### 8.3 Test Dashboard

1. Open browser: `http://[raspberry-pi-ip]:3001`
2. You should see the dashboard
3. Try adding a monitor
4. Run a speed test

## Step 9: Configure Email Reports (Optional)

1. Click the **Mail icon** (📧) in the dashboard header
2. Configure SMTP settings:
   - **Gmail**: Use App Password (not regular password)
   - **Outlook/Yahoo**: Use your email credentials
   - **Custom**: Check with your email provider
3. Set recipient email and report time
4. Click "Send Test Email" to verify
5. Enable daily reports

See [EMAIL_REPORTING.md](./EMAIL_REPORTING.md) for detailed email setup.

## Step 10: Access from Other Devices

### 10.1 Find Raspberry Pi IP

```bash
hostname -I
```

### 10.2 Access from Network

On any device on the same network:
```
http://[raspberry-pi-ip]:3001
```

Bookmark this URL for easy access!

## Updating the Application

### Update from Git

```bash
cd /home/pi/uptime-awan

# Pull latest changes
git pull

# Install any new dependencies
npm install

# Rebuild client if needed
cd client
npm install
npm run build
cd ..

# Restart service
sudo systemctl restart uptime-awan
```

## Useful Commands

### Service Management

```bash
# Start service
sudo systemctl start uptime-awan

# Stop service
sudo systemctl stop uptime-awan

# Restart service
sudo systemctl restart uptime-awan

# Check status
sudo systemctl status uptime-awan

# View logs
sudo journalctl -u uptime-awan -f

# View logs from today
sudo journalctl -u uptime-awan --since today
```

### Database Management

```bash
# Backup database
cp /home/pi/uptime-awan/data/uptime.db /home/pi/backups/uptime-$(date +%Y%m%d).db

# View database (requires sqlite3)
sqlite3 /home/pi/uptime-awan/data/uptime.db
```

## Troubleshooting

### Service Won't Start

1. **Check logs**:
   ```bash
   sudo journalctl -u uptime-awan -n 50
   ```

2. **Check if port is in use**:
   ```bash
   sudo netstat -tulpn | grep 3001
   ```

3. **Verify Node.js installation**:
   ```bash
   node --version
   npm --version
   ```

4. **Check file permissions**:
   ```bash
   ls -la /home/pi/uptime-awan
   ```

### Dependencies Installation Fails

1. **Update system**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Install build tools**:
   ```bash
   sudo apt install -y build-essential python3
   ```

3. **Clear npm cache**:
   ```bash
   npm cache clean --force
   ```

4. **Reinstall dependencies**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### Canvas Module Issues

If `canvas` module fails to build:

```bash
# Install additional dependencies
sudo apt install -y libcairo2-dev libjpeg-dev libpango1.0-dev libgif-dev librsvg2-dev

# Rebuild
npm rebuild canvas
```

### Database Locked Error

```bash
# Stop service
sudo systemctl stop uptime-awan

# Check database permissions
ls -la /home/pi/uptime-awan/data/

# Fix permissions if needed
chmod 644 /home/pi/uptime-awan/data/uptime.db

# Start service
sudo systemctl start uptime-awan
```

### WebSocket Connection Issues

1. **Check firewall**:
   ```bash
   sudo ufw status
   ```

2. **Verify service is running**:
   ```bash
   sudo systemctl status uptime-awan
   ```

3. **Check logs for errors**:
   ```bash
   sudo journalctl -u uptime-awan | grep -i websocket
   ```

### Email Not Sending

1. **Check email settings**:
   - Verify SMTP credentials
   - For Gmail, use App Password
   - Check firewall allows outbound SMTP (port 587/465)

2. **View email logs**:
   ```bash
   sudo journalctl -u uptime-awan | grep -i email
   ```

3. **Test email configuration**:
   - Use "Send Test Email" button in dashboard
   - Check error messages

## Performance Optimization

### For Better Performance

1. **Reduce speed test frequency**:
   ```env
   SPEEDTEST_INTERVAL=14400000  # 4 hours
   ```

2. **Increase monitor check interval**:
   ```env
   MONITOR_INTERVAL=120000  # 2 minutes
   ```

3. **Limit number of monitors**:
   - Start with 5-10 monitors
   - Add more gradually

4. **Clean old data regularly**:
   ```bash
   chmod +x scripts/clean-old-data.sh
   ./scripts/clean-old-data.sh
   ```

## Security Recommendations

1. **Change default Pi password**:
   ```bash
   passwd
   ```

2. **Setup SSH key authentication**:
   - More secure than password authentication
   - See: https://www.raspberrypi.org/documentation/remote-access/ssh/passwordless.md

3. **Keep system updated**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

4. **Regular backups**:
   ```bash
   # Create backup script
   chmod +x scripts/backup-database.sh
   
   # Add to crontab for daily backups
   crontab -e
   # Add: 0 2 * * * /home/pi/uptime-awan/scripts/backup-database.sh
   ```

5. **Database file permissions**:
   ```bash
   chmod 600 /home/pi/uptime-awan/data/uptime.db
   ```

## Quick Reference

### Installation Summary

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs build-essential python3 git

# 3. Clone repository
cd /home/pi
git clone https://github.com/nahwannur88/uptime_awan.git uptime-awan
cd uptime-awan

# 4. Install dependencies
npm install
cd client && npm install && npm run build && cd ..

# 5. Configure
cp .env.example .env
nano .env  # Edit configuration
mkdir -p data

# 6. Setup service
sudo nano /etc/systemd/system/uptime-awan.service
# Paste service configuration
sudo systemctl daemon-reload
sudo systemctl enable uptime-awan
sudo systemctl start uptime-awan

# 7. Check status
sudo systemctl status uptime-awan
```

### Access Dashboard

```
http://[raspberry-pi-ip]:3001
```

Find IP: `hostname -I`

## Next Steps

1. ✅ Add your first monitor
2. ✅ Run a speed test
3. ✅ Configure email reports
4. ✅ Set up regular backups
5. ✅ Bookmark the dashboard URL

## Support

- Check logs: `sudo journalctl -u uptime-awan -f`
- View documentation: [README.md](./README.md)
- Email setup: [EMAIL_REPORTING.md](./EMAIL_REPORTING.md)
- Quick start: [QUICK_START.md](./QUICK_START.md)

---

**Happy Monitoring! 🚀**
