const speedTest = require('speedtest-net');
const cron = require('node-cron');
const { getDatabase } = require('../database');

async function runSpeedTest() {
  console.log('Starting speed test...');
  
  try {
    const test = await speedTest({ acceptLicense: true, acceptGdpr: true });
    
    const result = {
      download_speed: test.download.bandwidth * 8 / 1000000, // Convert to Mbps
      upload_speed: test.upload.bandwidth * 8 / 1000000, // Convert to Mbps
      ping: test.ping.latency,
      jitter: test.ping.jitter || 0,
      server_name: test.server.name,
      server_location: `${test.server.location}, ${test.server.country}`,
      isp: test.isp
    };

    // Save to database
    const db = getDatabase();
    db.run(
      `INSERT INTO speedtest_results 
       (download_speed, upload_speed, ping, jitter, server_name, server_location, isp) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        result.download_speed,
        result.upload_speed,
        result.ping,
        result.jitter,
        result.server_name,
        result.server_location,
        result.isp
      ],
      function(err) {
        if (err) {
          console.error('Error saving speed test result:', err);
        } else {
          console.log('Speed test completed and saved:', result);
          
          // Broadcast to connected clients
          if (global.broadcast) {
            global.broadcast({
              type: 'speedtest_complete',
              data: { ...result, id: this.lastID, timestamp: new Date().toISOString() }
            });
          }
        }
      }
    );

    return result;
  } catch (error) {
    console.error('Speed test failed:', error.message);
    throw error;
  }
}

let speedtestIntervalId = null;
let speedtestSettings = null;
let scheduledSpeedtestInterval = null; // Track the scheduled interval value

async function getSpeedtestSettings() {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.get(
      `SELECT * FROM speedtest_settings ORDER BY id DESC LIMIT 1`,
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          // Return defaults if no settings exist
          resolve(row || {
            enabled: 1,
            interval: 3600000, // 1 hour
            auto_run: 1
          });
        }
      }
    );
  });
}

function startSpeedTestScheduler() {
  async function scheduleSpeedTest() {
    try {
      const settings = await getSpeedtestSettings();
      speedtestSettings = settings;
      
      const interval = settings.interval || 3600000; // Default: 1 hour
      const intervalMs = parseInt(interval);
      
      // Check if already scheduled with the same interval
      if (speedtestIntervalId && scheduledSpeedtestInterval === intervalMs) {
        // Already scheduled with correct interval, skip rescheduling
        return;
      }
      
      // Clear existing interval if it exists
      if (speedtestIntervalId) {
        clearInterval(speedtestIntervalId);
        speedtestIntervalId = null;
        scheduledSpeedtestInterval = null;
      }
      
      // If disabled, don't schedule
      if (!settings.enabled || !settings.auto_run) {
        console.log('Speed test scheduler disabled in settings');
        return;
      }
      
      const intervalMinutes = Math.floor(intervalMs / 60000);
      
      // Run immediately on startup (only if not already scheduled)
      if (!speedtestIntervalId) {
        setTimeout(() => {
          runSpeedTest().catch(console.error);
        }, 5000);
      }
      
      // Schedule regular tests
      speedtestIntervalId = setInterval(() => {
        runSpeedTest().catch(console.error);
      }, intervalMs);
      
      scheduledSpeedtestInterval = intervalMs;
      console.log(`Speed test scheduler started (runs every ${intervalMinutes} minutes / ${intervalMs}ms)`);
    } catch (error) {
      console.error('Error starting speed test scheduler:', error);
      // Fallback to default
      const defaultInterval = parseInt(process.env.SPEEDTEST_INTERVAL) || 3600000;
      if (speedtestIntervalId) {
        clearInterval(speedtestIntervalId);
      }
      speedtestIntervalId = setInterval(() => {
        runSpeedTest().catch(console.error);
      }, defaultInterval);
      scheduledSpeedtestInterval = defaultInterval;
      console.log('Speed test scheduler started with default interval');
    }
  }
  
  scheduleSpeedTest();
  
  // Re-check settings every 5 minutes to allow dynamic updates (only reschedules if interval changed)
  setInterval(() => {
    scheduleSpeedTest();
  }, 300000); // 5 minutes
}

function getSpeedTestHistory(limit = 100) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.all(
      `SELECT *, datetime(timestamp, 'localtime') as local_timestamp 
       FROM speedtest_results 
       ORDER BY timestamp DESC LIMIT ?`,
      [limit],
      (err, rows) => {
        if (err) reject(err);
        else {
          // Ensure timestamps are properly formatted
          const formattedRows = rows.map(row => ({
            ...row,
            timestamp: row.local_timestamp || row.timestamp
          }));
          resolve(formattedRows);
        }
      }
    );
  });
}

function getLatestSpeedTest() {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.get(
      `SELECT *, datetime(timestamp, 'localtime') as local_timestamp 
       FROM speedtest_results 
       ORDER BY timestamp DESC LIMIT 1`,
      async (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (row) {
          row.timestamp = row.local_timestamp || row.timestamp;
          
          // Get speedtest settings to calculate next check
          try {
            const settings = await getSpeedtestSettings();
            if (settings && settings.enabled && settings.auto_run) {
              const lastCheck = new Date(row.timestamp);
              const interval = settings.interval || 3600000;
              const nextCheck = new Date(lastCheck.getTime() + interval);
              row.last_check = lastCheck.toISOString();
              row.next_check = nextCheck.toISOString();
              row.interval = interval;
            }
          } catch (error) {
            console.error('Error getting speedtest settings:', error);
          }
        }
        
        resolve(row);
      }
    );
  });
}

module.exports = {
  runSpeedTest,
  startSpeedTestScheduler,
  getSpeedTestHistory,
  getLatestSpeedTest,
  getSpeedtestSettings
};

