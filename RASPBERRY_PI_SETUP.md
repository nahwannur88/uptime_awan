# Raspberry Pi 4 Setup Guide

Complete guide to deploy Uptime Awan Dashboard on Raspberry Pi 4.

## Prerequisites

- Raspberry Pi 4 (2GB+ RAM recommended, 4GB ideal)
- Raspberry Pi OS (64-bit recommended)
- SD Card with at least 16GB
- Internet connection (Ethernet recommended for monitoring)
- SSH access or keyboard/monitor

## Step 1: Initial Raspberry Pi Setup

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

### 1.3 Install Git

```bash
sudo apt install -y git
```

### 1.4 Install Build Tools (Required for native modules)

```bash
sudo apt install -y build-essential python3
```

## Step 2: Clone and Setup Application

### 2.1 Create Application Directory

```bash
cd /home/pi
git clone https://github.com/yourusername/uptime-awan.git
cd uptime-awan
```

Or if you're transferring files manually:

```bash
mkdir -p /home/pi/uptime-awan
cd /home/pi/uptime-awan
# Transfer your files here
```

### 2.2 Install Dependencies

```bash
# Install server dependencies
npm install

# Install client dependencies and build
cd client
npm install
npm run build
cd ..
```

**Note**: Building on Raspberry Pi may take 5-10 minutes. Be patient!

### 2.3 Configure Environment

```bash
cp .env.example .env
nano .env
```

Update the configuration:

```env
PORT=3001
NODE_ENV=production

# Speed Test - Run every 4 hours to save bandwidth
SPEEDTEST_INTERVAL=14400000

# Monitor checks - Every minute
MONITOR_INTERVAL=60000

# Database
DB_PATH=/home/pi/uptime-awan/data/uptime.db
```

Save and exit (Ctrl+X, then Y, then Enter)

### 2.4 Create Data Directory

```bash
mkdir -p data
chmod 755 data
```

## Step 3: Test the Application

```bash
# Test run
NODE_ENV=production node server/index.js
```

Open a browser and navigate to `http://[raspberry-pi-ip]:3001`

If everything works, press Ctrl+C to stop the server.

## Step 4: Setup Systemd Service

### 4.1 Create Service File

```bash
sudo nano /etc/systemd/system/uptime-awan.service
```

Add the following content:

```ini
[Unit]
Description=Uptime Awan Dashboard
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/uptime-awan
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=uptime-awan

[Install]
WantedBy=multi-user.target
```

Save and exit (Ctrl+X, then Y, then Enter)

### 4.2 Enable and Start Service

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

You should see "active (running)" in green.

## Step 5: Configure Firewall (Optional but Recommended)

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

## Step 6: Setup Nginx Reverse Proxy (Optional)

For production use with a domain name:

### 6.1 Install Nginx

```bash
sudo apt install -y nginx
```

### 6.2 Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/uptime-awan
```

Add configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or IP

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 6.3 Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/uptime-awan /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Allow HTTP through firewall
sudo ufw allow 80/tcp
```

## Step 7: Auto-Start on Boot

The systemd service is already configured to start on boot. To verify:

```bash
sudo systemctl is-enabled uptime-awan
```

Should return "enabled"

## Step 8: Monitoring and Maintenance

### View Logs

```bash
# View recent logs
sudo journalctl -u uptime-awan -n 50

# Follow logs in real-time
sudo journalctl -u uptime-awan -f

# View logs from today
sudo journalctl -u uptime-awan --since today
```

### Restart Service

```bash
sudo systemctl restart uptime-awan
```

### Stop Service

```bash
sudo systemctl stop uptime-awan
```

### Check Status

```bash
sudo systemctl status uptime-awan
```

### Update Application

```bash
cd /home/pi/uptime-awan
git pull  # If using git

# Rebuild client if needed
cd client
npm run build
cd ..

# Restart service
sudo systemctl restart uptime-awan
```

## Performance Tips for Raspberry Pi

### 1. Reduce Speed Test Frequency

Edit `.env` and increase `SPEEDTEST_INTERVAL`:

```env
# Run every 6 hours instead of every hour
SPEEDTEST_INTERVAL=21600000
```

### 2. Limit Monitor Checks

For many monitors, increase check interval:

```env
# Check every 2 minutes instead of 1
MONITOR_INTERVAL=120000
```

### 3. Database Maintenance

Clean old data periodically:

```bash
# Connect to database
sqlite3 /home/pi/uptime-awan/data/uptime.db

# Delete speed tests older than 30 days
DELETE FROM speedtest_results WHERE timestamp < datetime('now', '-30 days');

# Delete monitor checks older than 7 days
DELETE FROM monitor_checks WHERE timestamp < datetime('now', '-7 days');

# Optimize database
VACUUM;

# Exit
.exit
```

### 4. Monitor Resource Usage

```bash
# Check memory usage
free -h

# Check CPU usage
top

# Check disk space
df -h
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs for errors
sudo journalctl -u uptime-awan -n 100

# Check if port is already in use
sudo netstat -tulpn | grep 3001

# Verify Node.js is installed
node --version
```

### High CPU Usage

- Reduce speed test frequency
- Increase monitor check intervals
- Limit number of active monitors

### Database Locked Error

```bash
# Stop the service
sudo systemctl stop uptime-awan

# Check if database file exists and has correct permissions
ls -la /home/pi/uptime-awan/data/

# Fix permissions if needed
chmod 644 /home/pi/uptime-awan/data/uptime.db

# Start service
sudo systemctl start uptime-awan
```

### WebSocket Not Connecting

- Check firewall rules
- Verify service is running
- Check nginx configuration if using reverse proxy

### Speed Test Fails

```bash
# Test manually
cd /home/pi/uptime-awan
node -e "require('speedtest-net')({ acceptLicense: true, acceptGdpr: true }).then(console.log)"
```

## Security Recommendations

1. **Change default Pi password**:
   ```bash
   passwd
   ```

2. **Setup SSH key authentication** instead of password

3. **Keep system updated**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

4. **Use strong passwords** for any web authentication you add

5. **Consider VPN** if accessing remotely

6. **Regular backups** of the database:
   ```bash
   cp /home/pi/uptime-awan/data/uptime.db /home/pi/backups/uptime-$(date +%Y%m%d).db
   ```

## Automatic Setup Script

For quick setup, use the included script:

```bash
chmod +x scripts/setup-raspberry-pi.sh
sudo ./scripts/setup-raspberry-pi.sh
```

The script will:
- Install all dependencies
- Build the application
- Create systemd service
- Start the dashboard

## Accessing Your Dashboard

- **Local network**: `http://[raspberry-pi-ip]:3001`
- **With Nginx**: `http://[raspberry-pi-ip]`
- **With domain**: `http://your-domain.com`

Find your Raspberry Pi IP:

```bash
hostname -I
```

## Next Steps

1. Add your first monitor
2. Run a speed test
3. Configure check intervals
4. Set up database backups
5. Consider adding HTTPS with Let's Encrypt

---

Need help? Check the logs first:
```bash
sudo journalctl -u uptime-awan -f
```

