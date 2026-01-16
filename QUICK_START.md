# Quick Start Guide

Get Uptime Awan Dashboard running in minutes!

## For Raspberry Pi 4

### Option 1: Automatic Setup (Recommended)

```bash
# Transfer files to Raspberry Pi
# SSH into your Raspberry Pi
ssh pi@[raspberry-pi-ip]

# Navigate to project directory
cd /home/pi/uptime-awan

# Run setup script
chmod +x scripts/setup-raspberry-pi.sh
sudo ./scripts/setup-raspberry-pi.sh
```

The script will install everything and start the service automatically!

**Access your dashboard at**: `http://[raspberry-pi-ip]:3001`

### Option 2: Manual Setup

See [RASPBERRY_PI_SETUP.md](./RASPBERRY_PI_SETUP.md) for detailed step-by-step instructions.

## For Development (Any OS)

### Prerequisites
- Node.js 16+ installed
- npm installed

### Steps

1. **Install dependencies**:
   ```bash
   npm install
   cd client && npm install && cd ..
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Open browser**:
   - Dashboard: http://localhost:3000
   - API: http://localhost:3001

## First Steps After Installation

### 1. Add Your First Monitor

1. Click "Add Monitor" button
2. Fill in the details:
   - **Name**: "My Website"
   - **URL**: "https://your-website.com"
   - **Type**: HTTP(S)
   - **Interval**: 60000 (check every minute)
   - **Timeout**: 5000 (5 seconds)
3. Click "Add Monitor"

### 2. Run Your First Speed Test

1. Look for the "Network Speed Test" card
2. Click "Run Test" button
3. Wait 30-60 seconds for results
4. View download/upload speeds and ping

### 3. View Real-Time Updates

- Monitor status updates automatically
- Speed tests run hourly (configurable)
- Dashboard updates via WebSocket (no refresh needed)

## Configuration

### Change Speed Test Frequency

Edit `.env` file:

```env
# Run every 2 hours (7200000 ms)
SPEEDTEST_INTERVAL=7200000
```

Restart service:
```bash
sudo systemctl restart uptime-awan
```

### Change Monitor Check Frequency

Edit `.env` file:

```env
# Check every 2 minutes (120000 ms)
MONITOR_INTERVAL=120000
```

Restart service:
```bash
sudo systemctl restart uptime-awan
```

## Useful Commands (Raspberry Pi)

```bash
# View logs
sudo journalctl -u uptime-awan -f

# Restart service
sudo systemctl restart uptime-awan

# Check status
sudo systemctl status uptime-awan

# Stop service
sudo systemctl stop uptime-awan

# Start service
sudo systemctl start uptime-awan
```

## Access From Other Devices

1. Find your Raspberry Pi IP:
   ```bash
   hostname -I
   ```

2. On any device on the same network, open browser:
   ```
   http://[raspberry-pi-ip]:3001
   ```

3. Bookmark for easy access!

## Troubleshooting

### Dashboard Won't Load

1. Check if service is running:
   ```bash
   sudo systemctl status uptime-awan
   ```

2. Check logs for errors:
   ```bash
   sudo journalctl -u uptime-awan -n 50
   ```

3. Verify port is not blocked:
   ```bash
   sudo netstat -tulpn | grep 3001
   ```

### Speed Test Not Running

1. Check internet connection
2. View logs:
   ```bash
   sudo journalctl -u uptime-awan -f
   ```
3. Try manual test:
   ```bash
   curl -X POST http://localhost:3001/api/speedtest/run
   ```

### Monitor Shows "Unknown" Status

- Wait 1-2 minutes for first check to complete
- Verify URL is accessible from Raspberry Pi
- Check monitor configuration

## Performance Tips

For optimal performance on Raspberry Pi:

1. **Limit monitors**: Start with 5-10 monitors
2. **Adjust intervals**: Use 2-5 minute check intervals
3. **Reduce speed tests**: Run every 2-4 hours
4. **Clean old data**: Run cleanup script monthly

```bash
chmod +x scripts/clean-old-data.sh
./scripts/clean-old-data.sh
```

## Next Steps

- ✅ Add more monitors for websites/services you want to track
- ✅ Set up regular database backups
- ✅ Configure Nginx reverse proxy for custom domain
- ✅ Set up firewall rules
- ✅ Customize check intervals based on your needs

## Need Help?

1. Check [README.md](./README.md) for detailed documentation
2. Check [RASPBERRY_PI_SETUP.md](./RASPBERRY_PI_SETUP.md) for setup details
3. View logs: `sudo journalctl -u uptime-awan -f`
4. Open an issue on GitHub

---

**Happy Monitoring! 🚀**

