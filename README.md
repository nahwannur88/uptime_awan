# Uptime Awan Dashboard

A comprehensive network monitoring dashboard with integrated speed testing, designed for Raspberry Pi 4. Similar to Uptime Kuma but with built-in speed test functionality.

![Dashboard Preview](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Platform](https://img.shields.io/badge/Platform-Raspberry%20Pi%204-red)
![License](https://img.shields.io/badge/License-MIT-blue)

## Features

- 🚀 **Real-time Monitoring** - Track uptime and response times for multiple endpoints
- 📊 **Network Speed Testing** - Automated speed tests with historical data
- 📈 **Beautiful Dashboard** - Modern, responsive UI with live updates
- 🔔 **WebSocket Updates** - Real-time notifications without page refresh
- 📧 **Daily Email Reports** - Automated reports with hourly uptime graphs
- 💾 **SQLite Database** - Lightweight data storage perfect for Raspberry Pi
- 🎯 **Easy Setup** - Simple installation and configuration
- 📱 **Mobile Responsive** - Works perfectly on phones and tablets

## Screenshots

### Main Dashboard
- Live monitoring status for all configured endpoints
- Real-time speed test results with download/upload/ping metrics
- Historical charts showing network performance over time
- Uptime percentage and response time statistics

## Requirements

- Raspberry Pi 4 (2GB+ RAM recommended)
- Node.js 16+ and npm
- Internet connection

## Access from Other Devices

**Yes!** You can access the dashboard from any computer, phone, or tablet on the same network.

Simply use: `http://[raspberry-pi-ip]:3001`

Find your Pi's IP: `hostname -I` (on Raspberry Pi)

See [NETWORK_ACCESS.md](./NETWORK_ACCESS.md) for detailed instructions.

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/uptime-awan.git
cd uptime-awan
```

### 2. Install Dependencies

```bash
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` file as needed:

```env
PORT=3001
CLIENT_PORT=3000
NODE_ENV=development

# Speed Test Configuration (in milliseconds)
SPEEDTEST_INTERVAL=3600000  # Run speed test every hour

# Monitoring Configuration (in milliseconds)
MONITOR_INTERVAL=60000      # Check monitors every minute

# Database
DB_PATH=./data/uptime.db
```

### 4. Start Development Server

```bash
npm run dev
```

The dashboard will be available at `http://localhost:3000`

### 5. Build for Production

```bash
cd client
npm run build
cd ..
NODE_ENV=production npm start
```

## Raspberry Pi Deployment

### Option 1: Install from Git (Recommended)

```bash
# Clone repository
cd /home/pi
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git uptime-awan
cd uptime-awan

# Follow the setup guide
```

See [GIT_SETUP_RASPBERRY_PI.md](./GIT_SETUP_RASPBERRY_PI.md) for complete step-by-step instructions.

### Option 2: Automatic Setup Script

```bash
chmod +x scripts/setup-raspberry-pi.sh
sudo ./scripts/setup-raspberry-pi.sh
```

### Option 3: Manual Setup

See [RASPBERRY_PI_SETUP.md](./RASPBERRY_PI_SETUP.md) for detailed instructions.

## API Endpoints

### Speed Test

- `GET /api/speedtest/latest` - Get latest speed test result
- `GET /api/speedtest/history?limit=100` - Get speed test history
- `POST /api/speedtest/run` - Run speed test on demand

### Monitors

- `GET /api/monitors` - Get all monitors
- `POST /api/monitors` - Add new monitor
- `DELETE /api/monitors/:id` - Delete monitor
- `GET /api/monitors/:id/history` - Get monitor check history
- `POST /api/monitors/:id/check` - Check monitor on demand

### Health Check

- `GET /api/health` - Server health status

## Usage

### Adding a Monitor

1. Click "Add Monitor" button
2. Enter monitor details:
   - **Name**: Friendly name for the monitor
   - **URL**: Full URL to monitor (e.g., https://example.com)
   - **Type**: HTTP(S), TCP, or Ping
   - **Interval**: Check interval in milliseconds (default: 60000 = 1 minute)
   - **Timeout**: Request timeout in milliseconds (default: 5000 = 5 seconds)
3. Click "Add Monitor"

### Running Speed Tests

- Speed tests run automatically every hour
- Click "Run Test" button for an on-demand speed test
- View historical data in the chart below

### Email Reporting

- Configure email settings via the Mail icon (📧) in the header
- Daily reports sent automatically at configured time
- Reports include hourly uptime graphs for each monitor
- See [EMAIL_REPORTING.md](./EMAIL_REPORTING.md) for detailed setup

## Configuration

### Speed Test Settings

Edit `server/services/speedtest.js` to customize:
- Test frequency
- Server selection
- Data retention

### Monitor Settings

Each monitor can be configured with:
- Custom check intervals
- Timeout values
- Active/inactive status

## Database Schema

### Tables

- `speedtest_results` - Speed test results with download/upload/ping data
- `monitors` - Monitor configurations
- `monitor_checks` - Individual monitor check results
- `monitor_status` - Current status summary for each monitor

## Performance Optimization for Raspberry Pi

The application is optimized for Raspberry Pi 4:

1. **Lightweight SQLite database** - No heavy database server needed
2. **Efficient WebSocket connections** - Minimal overhead for real-time updates
3. **Optimized speed test library** - Uses `speedtest-net` with minimal resource usage
4. **Production build** - Minified and optimized React frontend
5. **Smart scheduling** - Cron jobs don't overlap or overload the system

## Systemd Service

The application runs as a systemd service on Raspberry Pi for:
- Automatic startup on boot
- Automatic restart on failure
- Easy log management with journalctl

```bash
# Check service status
sudo systemctl status uptime-awan

# View logs
sudo journalctl -u uptime-awan -f

# Restart service
sudo systemctl restart uptime-awan
```

## Troubleshooting

### Speed Test Not Running

- Check internet connectivity
- Verify `speedtest-net` package is installed correctly
- Check logs: `sudo journalctl -u uptime-awan -n 50`

### WebSocket Connection Issues

- Ensure port 3001 is not blocked by firewall
- Check if service is running: `sudo systemctl status uptime-awan`
- Verify network configuration

### High Memory Usage

- Reduce speed test frequency in `.env`
- Decrease monitor check frequency
- Limit historical data retention

## Development

### Project Structure

```
uptime-awan/
├── server/
│   ├── index.js              # Main server file
│   ├── database.js           # Database initialization
│   ├── routes/
│   │   ├── speedtest.js      # Speed test endpoints
│   │   └── monitors.js       # Monitor endpoints
│   └── services/
│       ├── speedtest.js      # Speed test service
│       └── monitoring.js     # Monitoring service
├── client/
│   ├── public/
│   └── src/
│       ├── components/       # React components
│       ├── App.js           # Main app component
│       └── index.js         # Entry point
├── data/                    # SQLite database (auto-created)
├── scripts/                 # Setup and deployment scripts
└── package.json
```

### Adding New Features

1. Backend: Add routes in `server/routes/`
2. Services: Add business logic in `server/services/`
3. Frontend: Add components in `client/src/components/`
4. Update API documentation in this README

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review systemd logs for errors

## Acknowledgments

- Inspired by Uptime Kuma
- Built with React, Express, and SQLite
- Speed test powered by speedtest-net
- Charts by Recharts

---

**Made with ❤️ for Raspberry Pi enthusiasts**

