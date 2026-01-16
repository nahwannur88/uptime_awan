require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');

const { initDatabase } = require('./database');
const speedTestRouter = require('./routes/speedtest');
const monitorsRouter = require('./routes/monitors');
const emailRouter = require('./routes/email');
const { startSpeedTestScheduler } = require('./services/speedtest');
const { startMonitoringService } = require('./services/monitoring');
const { initializeEmail, startDailyReportScheduler } = require('./services/email');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database (async)
let dbInitialized = false;
initDatabase()
  .then(() => {
    dbInitialized = true;
    console.log('Database ready');
  })
  .catch((err) => {
    console.error('Database initialization failed:', err);
    process.exit(1);
  });

// WebSocket connection handling
const clients = new Set();

wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');
  clients.add(ws);

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

// Broadcast function for real-time updates
global.broadcast = (data) => {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

// API Routes
app.use('/api/speedtest', speedTestRouter);
app.use('/api/monitors', monitorsRouter);
app.use('/api/email', emailRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// Start server
server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready`);
  
  // Wait for database to be ready
  while (!dbInitialized) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Initialize email service
  try {
    await initializeEmail();
  } catch (error) {
    console.error('Email service initialization error (non-fatal):', error.message);
  }
  
  // Start scheduled services
  startSpeedTestScheduler();
  startMonitoringService();
  startDailyReportScheduler();
  
  console.log('All services started successfully');
});

