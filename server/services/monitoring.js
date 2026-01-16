const axios = require('axios');
const { getDatabase } = require('../database');

async function checkMonitor(monitor) {
  const startTime = Date.now();
  
  try {
    const response = await axios({
      method: 'GET',
      url: monitor.url,
      timeout: monitor.timeout || 5000,
      validateStatus: () => true // Don't throw on any status code
    });

    const responseTime = Date.now() - startTime;
    const isSuccess = response.status >= 200 && response.status < 300;

    const checkResult = {
      monitor_id: monitor.id,
      status: isSuccess ? 'up' : 'down',
      response_time: responseTime,
      status_code: response.status,
      error_message: isSuccess ? null : `HTTP ${response.status}`
    };

    saveCheckResult(checkResult);
    updateMonitorStatus(monitor.id);

    return checkResult;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    const checkResult = {
      monitor_id: monitor.id,
      status: 'down',
      response_time: responseTime,
      status_code: null,
      error_message: error.message
    };

    saveCheckResult(checkResult);
    updateMonitorStatus(monitor.id);

    return checkResult;
  }
}

function saveCheckResult(result) {
  const db = getDatabase();
  db.run(
    `INSERT INTO monitor_checks 
     (monitor_id, status, response_time, status_code, error_message) 
     VALUES (?, ?, ?, ?, ?)`,
    [
      result.monitor_id,
      result.status,
      result.response_time,
      result.status_code,
      result.error_message
    ],
    function(err) {
      if (err) {
        console.error('Error saving check result:', err);
      } else {
        // Broadcast to connected clients
        if (global.broadcast) {
          global.broadcast({
            type: 'monitor_check',
            data: { ...result, id: this.lastID, timestamp: new Date().toISOString() }
          });
        }
      }
    }
  );
}

function updateMonitorStatus(monitorId) {
  const db = getDatabase();
  
  // Calculate uptime percentage based on last 24 hours
  db.get(
    `SELECT 
       COUNT(*) as total_checks,
       SUM(CASE WHEN status = 'up' THEN 1 ELSE 0 END) as successful_checks,
       (SUM(CASE WHEN status = 'up' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as uptime_percentage
     FROM monitor_checks
     WHERE monitor_id = ? AND timestamp > datetime('now', '-24 hours')`,
    [monitorId],
    (err, stats) => {
      if (err) {
        console.error('Error calculating uptime:', err);
        return;
      }

      db.get(
        `SELECT status FROM monitor_checks WHERE monitor_id = ? ORDER BY timestamp DESC LIMIT 1`,
        [monitorId],
        (err, lastCheck) => {
          if (err) {
            console.error('Error getting last check:', err);
            return;
          }

          db.run(
            `INSERT OR REPLACE INTO monitor_status 
             (monitor_id, current_status, last_check, uptime_percentage, total_checks, successful_checks)
             VALUES (?, ?, datetime('now'), ?, ?, ?)`,
            [
              monitorId,
              lastCheck ? lastCheck.status : 'unknown',
              stats.uptime_percentage || 0,
              stats.total_checks || 0,
              stats.successful_checks || 0
            ]
          );
        }
      );
    }
  );
}

async function startMonitoringService() {
  const db = getDatabase();
  
  // Check all active monitors
  setInterval(() => {
    db.all(
      `SELECT * FROM monitors WHERE is_active = 1`,
      async (err, monitors) => {
        if (err) {
          console.error('Error fetching monitors:', err);
          return;
        }

        for (const monitor of monitors) {
          await checkMonitor(monitor);
        }
      }
    );
  }, parseInt(process.env.MONITOR_INTERVAL) || 60000); // Default: 1 minute

  console.log('Monitoring service started');
}

function getMonitors() {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.all(
      `SELECT m.*, ms.current_status, ms.last_check, ms.uptime_percentage
       FROM monitors m
       LEFT JOIN monitor_status ms ON m.id = ms.monitor_id
       ORDER BY m.created_at DESC`,
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

function addMonitor(monitor) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.run(
      `INSERT INTO monitors (name, url, type, interval, timeout, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        monitor.name,
        monitor.url,
        monitor.type || 'http',
        monitor.interval || 60000,
        monitor.timeout || 5000,
        monitor.is_active !== undefined ? monitor.is_active : 1
      ],
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, ...monitor });
      }
    );
  });
}

function deleteMonitor(id) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.run(`DELETE FROM monitors WHERE id = ?`, [id], function(err) {
      if (err) reject(err);
      else resolve({ deleted: this.changes });
    });
  });
}

function getMonitorHistory(monitorId, limit = 100) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.all(
      `SELECT * FROM monitor_checks WHERE monitor_id = ? ORDER BY timestamp DESC LIMIT ?`,
      [monitorId, limit],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

module.exports = {
  checkMonitor,
  startMonitoringService,
  getMonitors,
  addMonitor,
  deleteMonitor,
  getMonitorHistory
};

