# Project Structure

Complete overview of the Uptime Awan Dashboard project structure.

```
uptime-awan/
├── client/                          # React frontend application
│   ├── public/
│   │   └── index.html              # HTML template
│   ├── src/
│   │   ├── components/             # React components
│   │   │   ├── Dashboard.js        # Main stats dashboard
│   │   │   ├── Dashboard.css
│   │   │   ├── SpeedTestCard.js    # Speed test display & charts
│   │   │   ├── SpeedTestCard.css
│   │   │   ├── MonitorsList.js     # Monitors list & management
│   │   │   ├── MonitorsList.css
│   │   │   ├── AddMonitorModal.js  # Add monitor dialog
│   │   │   └── AddMonitorModal.css
│   │   ├── App.js                  # Main app component
│   │   ├── App.css                 # App styles
│   │   ├── index.js                # App entry point
│   │   └── index.css               # Global styles
│   └── package.json                # Client dependencies
│
├── server/                          # Express backend server
│   ├── routes/                      # API routes
│   │   ├── speedtest.js            # Speed test endpoints
│   │   └── monitors.js             # Monitor CRUD endpoints
│   ├── services/                    # Business logic
│   │   ├── speedtest.js            # Speed test service & scheduler
│   │   └── monitoring.js           # Monitor checking service
│   ├── database.js                 # SQLite database setup
│   └── index.js                    # Server entry point
│
├── scripts/                         # Utility scripts
│   ├── setup-raspberry-pi.sh       # Automated Pi setup
│   ├── backup-database.sh          # Database backup utility
│   └── clean-old-data.sh           # Data cleanup utility
│
├── data/                           # SQLite database (auto-created)
│   └── uptime.db                   # Main database file
│
├── backups/                        # Database backups (auto-created)
│
├── .env                            # Environment configuration
├── .env.example                    # Environment template
├── .gitignore                      # Git ignore rules
├── .dockerignore                   # Docker ignore rules
│
├── package.json                    # Server dependencies & scripts
├── Dockerfile                      # Docker container definition
├── docker-compose.yml              # Docker Compose configuration
│
├── README.md                       # Main documentation
├── QUICK_START.md                  # Quick start guide
├── RASPBERRY_PI_SETUP.md           # Detailed Pi setup guide
├── PROJECT_STRUCTURE.md            # This file
├── CHANGELOG.md                    # Version history
└── LICENSE                         # MIT License
```

## Key Components

### Backend (Node.js + Express)

**server/index.js**
- Main server setup
- WebSocket server
- Route registration
- Service initialization

**server/database.js**
- SQLite database initialization
- Table schema creation
- Database connection management

**server/services/speedtest.js**
- Speed test execution using speedtest-net
- Scheduled tests via node-cron
- Result storage and retrieval
- WebSocket broadcasting

**server/services/monitoring.js**
- HTTP endpoint checking
- Status tracking
- Uptime calculation
- Response time measurement

**server/routes/speedtest.js**
- GET /api/speedtest/latest - Get latest speed test
- GET /api/speedtest/history - Get historical data
- POST /api/speedtest/run - Run test on demand

**server/routes/monitors.js**
- GET /api/monitors - List all monitors
- POST /api/monitors - Create monitor
- DELETE /api/monitors/:id - Delete monitor
- GET /api/monitors/:id/history - Get check history
- POST /api/monitors/:id/check - Check on demand

### Frontend (React)

**client/src/App.js**
- Main application container
- WebSocket connection management
- State management
- API integration

**client/src/components/Dashboard.js**
- Overview statistics
- Total monitors, up/down count
- Average uptime percentage
- Aggregated metrics

**client/src/components/SpeedTestCard.js**
- Current speed test results
- Download/upload/ping display
- Historical chart visualization
- On-demand test triggering
- Server and ISP information

**client/src/components/MonitorsList.js**
- List of all monitors
- Status indicators
- Uptime percentages
- Monitor management
- Delete functionality

**client/src/components/AddMonitorModal.js**
- Add new monitor form
- URL and name input
- Type selection (HTTP/TCP/Ping)
- Interval and timeout configuration

### Database Schema

**speedtest_results**
```sql
- id (INTEGER PRIMARY KEY)
- timestamp (DATETIME)
- download_speed (REAL) -- Mbps
- upload_speed (REAL)   -- Mbps
- ping (REAL)           -- ms
- jitter (REAL)         -- ms
- server_name (TEXT)
- server_location (TEXT)
- isp (TEXT)
```

**monitors**
```sql
- id (INTEGER PRIMARY KEY)
- name (TEXT)
- url (TEXT)
- type (TEXT)           -- http, tcp, ping
- interval (INTEGER)    -- Check interval in ms
- timeout (INTEGER)     -- Timeout in ms
- is_active (INTEGER)   -- 1 = active, 0 = inactive
- created_at (DATETIME)
```

**monitor_checks**
```sql
- id (INTEGER PRIMARY KEY)
- monitor_id (INTEGER)
- timestamp (DATETIME)
- status (TEXT)         -- up, down
- response_time (INTEGER) -- ms
- status_code (INTEGER)
- error_message (TEXT)
```

**monitor_status**
```sql
- monitor_id (INTEGER PRIMARY KEY)
- current_status (TEXT)
- last_check (DATETIME)
- uptime_percentage (REAL)
- total_checks (INTEGER)
- successful_checks (INTEGER)
```

## Configuration Files

### .env
```
PORT=3001                    # Server port
NODE_ENV=development         # Environment
SPEEDTEST_INTERVAL=3600000   # 1 hour in ms
MONITOR_INTERVAL=60000       # 1 minute in ms
DB_PATH=./data/uptime.db     # Database location
```

### package.json (root)
```json
{
  "scripts": {
    "dev": "concurrently server & client",
    "server": "nodemon server",
    "client": "cd client && npm start",
    "build": "cd client && npm run build",
    "start": "node server/index.js"
  }
}
```

## Technology Stack

### Backend
- **Node.js 18+** - Runtime environment
- **Express 4** - Web framework
- **ws** - WebSocket server
- **sqlite3** - Database
- **axios** - HTTP client
- **node-cron** - Task scheduling
- **speedtest-net** - Network speed testing
- **cors** - CORS middleware
- **dotenv** - Environment variables

### Frontend
- **React 18** - UI framework
- **Recharts** - Data visualization
- **Axios** - HTTP client
- **Lucide React** - Icon library
- **React Scripts** - Build tooling

### Development
- **nodemon** - Auto-restart server
- **concurrently** - Run multiple commands
- **React DevTools** - Debugging

## Deployment Options

### 1. Raspberry Pi (Native)
- Systemd service
- Auto-start on boot
- Journal logging
- See: RASPBERRY_PI_SETUP.md

### 2. Docker
```bash
docker build -t uptime-awan .
docker run -p 3001:3001 -v ./data:/app/data uptime-awan
```

### 3. Docker Compose
```bash
docker-compose up -d
```

### 4. Production Server
```bash
npm install
cd client && npm install && npm run build && cd ..
NODE_ENV=production node server/index.js
```

## API Flow

### Speed Test Flow
```
1. Cron trigger (hourly) OR Manual trigger
2. speedtest.js service runs test
3. Results saved to database
4. WebSocket broadcast to clients
5. UI updates automatically
```

### Monitor Check Flow
```
1. Cron trigger (every minute)
2. monitoring.js fetches active monitors
3. HTTP request to each monitor
4. Result saved to database
5. Status updated in monitor_status table
6. WebSocket broadcast
7. UI updates
```

### Real-time Updates
```
Client ←→ WebSocket ←→ Server
              ↓
         Broadcasts:
         - speedtest_complete
         - monitor_check
```

## File Sizes (Approximate)

- **Production build**: ~500KB (client bundle)
- **node_modules**: ~150MB (server + client)
- **SQLite database**: Starts at ~50KB, grows with data
- **Total project**: ~200MB with dependencies

## Performance Characteristics

### Raspberry Pi 4 Resources
- **Memory**: ~100-150MB at idle
- **CPU**: <5% during normal operation
- **CPU during speed test**: 20-40% for 30-60 seconds
- **Disk I/O**: Minimal (SQLite writes)
- **Network**: Speed test uses full bandwidth when running

## Security Considerations

1. **No authentication by default** - Add auth middleware if needed
2. **CORS enabled** - Configure for production
3. **SQL injection protected** - Using parameterized queries
4. **XSS protected** - React escapes by default
5. **Runs as non-root** - When using systemd service

## Maintenance

### Regular Tasks
- **Weekly**: Check logs for errors
- **Monthly**: Run database cleanup script
- **Monthly**: Run database backup script
- **Quarterly**: Update dependencies

### Monitoring the Monitor
- Check systemd service status
- Monitor disk space
- Review database size
- Check network connectivity

---

For more details, see:
- [README.md](./README.md) - Overview and features
- [QUICK_START.md](./QUICK_START.md) - Getting started
- [RASPBERRY_PI_SETUP.md](./RASPBERRY_PI_SETUP.md) - Deployment guide

