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

function startSpeedTestScheduler() {
  const interval = parseInt(process.env.SPEEDTEST_INTERVAL) || 3600000; // Default: 1 hour
  const cronExpression = `*/${Math.floor(interval / 60000)} * * * *`; // Convert to minutes

  // Run immediately on startup
  setTimeout(() => {
    runSpeedTest().catch(console.error);
  }, 5000);

  // Schedule regular tests (every hour by default)
  cron.schedule('0 * * * *', () => {
    runSpeedTest().catch(console.error);
  });

  console.log('Speed test scheduler started (runs every hour)');
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
      (err, row) => {
        if (err) reject(err);
        else {
          if (row) {
            row.timestamp = row.local_timestamp || row.timestamp;
          }
          resolve(row);
        }
      }
    );
  });
}

module.exports = {
  runSpeedTest,
  startSpeedTestScheduler,
  getSpeedTestHistory,
  getLatestSpeedTest
};

