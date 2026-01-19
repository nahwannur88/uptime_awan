const axios = require('axios');
const net = require('net');
const ping = require('ping');
const dns = require('dns').promises;
const { getDatabase } = require('../database');

// Helper function to parse IP:Port or IP address
function parseAddress(url) {
  // Check if it's an IP address with port (e.g., 192.168.1.1:8080)
  const ipPortMatch = url.match(/^(\d+\.\d+\.\d+\.\d+):(\d+)$/);
  if (ipPortMatch) {
    return { host: ipPortMatch[1], port: parseInt(ipPortMatch[2]) };
  }
  
  // Check if it's just an IP address
  const ipMatch = url.match(/^(\d+\.\d+\.\d+\.\d+)$/);
  if (ipMatch) {
    return { host: ipMatch[1], port: null };
  }
  
  // Try to parse as URL
  try {
    const urlObj = new URL(url);
    return { host: urlObj.hostname, port: urlObj.port ? parseInt(urlObj.port) : (urlObj.protocol === 'https:' ? 443 : 80) };
  } catch (e) {
    return { host: url, port: null };
  }
}

// Check TCP connection
async function checkTCP(host, port, timeout) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let resolved = false;
    
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        socket.destroy();
        resolve({ success: false, error: 'Connection timeout' });
      }
    }, timeout);
    
    socket.connect(port, host, () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        socket.destroy();
        resolve({ success: true });
      }
    });
    
    socket.on('error', (error) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve({ success: false, error: error.message });
      }
    });
  });
}

// Check Ping
async function checkPing(host, timeout) {
  try {
    let ipAddress = host;
    let resolvedIp = null;
    
    // Check if host is already an IP address
    const isIP = /^\d+\.\d+\.\d+\.\d+$/.test(host);
    
    if (!isIP) {
      // Resolve hostname to IP address (like Windows ping command)
      try {
        const addresses = await dns.resolve4(host);
        if (addresses && addresses.length > 0) {
          ipAddress = addresses[0]; // Use first IPv4 address
          resolvedIp = ipAddress;
          console.log(`Resolved ${host} to ${ipAddress}`);
        }
      } catch (dnsError) {
        // If DNS resolution fails, try the hostname anyway
        console.warn(`DNS resolution failed for ${host}, trying hostname directly:`, dnsError.message);
      }
    }
    
    // Ping the IP address (or hostname if resolution failed)
    const result = await ping.promise.probe(ipAddress, {
      timeout: timeout / 1000, // Convert to seconds
      min_reply: 1
    });
    
    return {
      success: result.alive,
      responseTime: result.time ? parseFloat(result.time) : null,
      error: result.alive ? null : 'Host unreachable',
      resolvedIp: resolvedIp || (isIP ? ipAddress : null),
      originalHost: host
    };
  } catch (error) {
    return {
      success: false,
      responseTime: null,
      error: error.message,
      resolvedIp: null,
      originalHost: host
    };
  }
}

async function checkMonitor(monitor) {
  const startTime = Date.now();
  const monitorType = monitor.type || 'http';
  
  try {
    let checkResult;
    
    if (monitorType === 'tcp') {
      // TCP monitoring
      const address = parseAddress(monitor.url);
      if (!address.port) {
        throw new Error('TCP monitoring requires port (e.g., 192.168.1.1:8080)');
      }
      
      const result = await checkTCP(address.host, address.port, monitor.timeout || 5000);
      const responseTime = Date.now() - startTime;
      
      checkResult = {
        monitor_id: monitor.id,
        status: result.success ? 'up' : 'down',
        response_time: responseTime,
        status_code: result.success ? 200 : null,
        error_message: result.success ? null : result.error
      };
      
    } else if (monitorType === 'ping') {
      // Ping monitoring
      const address = parseAddress(monitor.url);
      const hostToPing = address.host;
      
      console.log(`Checking Ping monitor: ${monitor.name} -> ${hostToPing}`);
      
      const result = await checkPing(hostToPing, monitor.timeout || 5000);
      const responseTime = result.responseTime || (Date.now() - startTime);
      
      if (result.success) {
        const ipInfo = result.resolvedIp ? ` (resolved to ${result.resolvedIp})` : '';
        console.log(`✓ ${monitor.name} is UP${ipInfo} - ${Math.round(responseTime)}ms`);
      } else {
        console.log(`✗ ${monitor.name} is DOWN - ${result.error || 'Host unreachable'}`);
      }
      
      checkResult = {
        monitor_id: monitor.id,
        status: result.success ? 'up' : 'down',
        response_time: Math.round(responseTime),
        status_code: result.success ? 200 : null,
        error_message: result.success ? null : (result.error || 'Host unreachable')
      };
      
    } else {
      // HTTP/HTTPS monitoring (default)
      // Support both URLs and IP addresses
      let url = monitor.url.trim();
      const originalUrl = url;
      
      // If URL doesn't have a protocol, add one
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        // For IP addresses, use HTTP
        if (/^\d+\.\d+\.\d+\.\d+(:\d+)?$/.test(url)) {
          url = `http://${url}`;
        } else {
          // For domain names, try HTTPS first (most modern sites use HTTPS)
          url = `https://${url}`;
        }
      }
      
      console.log(`Checking HTTP monitor: ${monitor.name} (${originalUrl}) -> ${url}`);
      
      let response;
      let lastError = null;
      
      // Try the URL, and if HTTPS fails with certain errors, try HTTP
      try {
        response = await axios({
          method: 'GET',
          url: url,
          timeout: monitor.timeout || 5000,
          validateStatus: () => true, // Don't throw on any status code
          headers: {
            'User-Agent': 'Uptime-Awan/1.0'
          },
          maxRedirects: 5
        });
      } catch (error) {
        lastError = error;
        // If HTTPS failed, try HTTP as fallback
        if (url.startsWith('https://')) {
          try {
            const httpUrl = url.replace('https://', 'http://');
            console.log(`HTTPS failed for ${monitor.name}, trying HTTP: ${httpUrl}`);
            response = await axios({
              method: 'GET',
              url: httpUrl,
              timeout: monitor.timeout || 5000,
              validateStatus: () => true,
              headers: {
                'User-Agent': 'Uptime-Awan/1.0'
              },
              maxRedirects: 5
            });
            url = httpUrl; // Update url for logging
            console.log(`HTTP fallback successful for ${monitor.name}`);
          } catch (httpError) {
            lastError = httpError;
            console.error(`HTTP check failed for ${monitor.name}:`, httpError.message);
            throw httpError;
          }
        } else {
          console.error(`HTTP check failed for ${monitor.name}:`, error.message);
          throw error;
        }
      }

      const responseTime = Date.now() - startTime;
      const isSuccess = response && response.status >= 200 && response.status < 300;

      if (isSuccess) {
        console.log(`✓ ${monitor.name} is UP (${response.status}) - ${responseTime}ms`);
      } else {
        console.log(`✗ ${monitor.name} is DOWN (${response ? response.status : 'no response'})`);
      }

      checkResult = {
        monitor_id: monitor.id,
        status: isSuccess ? 'up' : 'down',
        response_time: responseTime,
        status_code: response ? response.status : null,
        error_message: isSuccess ? null : (response ? `HTTP ${response.status}` : (lastError?.message || 'Connection failed'))
      };
    }

    saveCheckResult(checkResult);
    updateMonitorStatus(monitor.id);

    return checkResult;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Better error message handling
    let errorMessage = error.message;
    if (error.code === 'ENOTFOUND') {
      errorMessage = 'DNS lookup failed - hostname not found';
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Connection refused - service may be down';
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      errorMessage = 'Connection timeout';
    } else if (error.code === 'CERT_HAS_EXPIRED' || error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
      errorMessage = 'SSL certificate error';
    } else if (error.code === 'ERR_INVALID_URL') {
      errorMessage = 'Invalid URL format';
    }
    
    const checkResult = {
      monitor_id: monitor.id,
      status: 'down',
      response_time: responseTime,
      status_code: null,
      error_message: errorMessage
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

const monitorIntervals = new Map(); // Track intervals for each monitor

async function startMonitoringService() {
  const db = getDatabase();
  
  function scheduleMonitorCheck(monitor) {
    // Skip if already scheduled (unless we're updating)
    if (monitorIntervals.has(monitor.id)) {
      return;
    }
    
    // Clear existing interval for this monitor (safety check)
    if (monitorIntervals.has(monitor.id)) {
      clearInterval(monitorIntervals.get(monitor.id));
    }
    
    const interval = monitor.interval || 60000; // Default: 1 minute
    const intervalMs = parseInt(interval);
    
    // Check immediately
    checkMonitor(monitor).catch(console.error);
    
    // Schedule recurring checks
    const intervalId = setInterval(() => {
      checkMonitor(monitor).catch(console.error);
    }, intervalMs);
    
    monitorIntervals.set(monitor.id, intervalId);
  }
  
  function rescheduleMonitor(monitor) {
    // Clear existing interval
    if (monitorIntervals.has(monitor.id)) {
      clearInterval(monitorIntervals.get(monitor.id));
      monitorIntervals.delete(monitor.id);
    }
    
    // Schedule with new interval
    scheduleMonitorCheck(monitor);
  }
  
  function refreshAllMonitors() {
    db.all(
      `SELECT * FROM monitors WHERE is_active = 1`,
      async (err, monitors) => {
        if (err) {
          console.error('Error fetching monitors:', err);
          return;
        }

        // Get current active monitor IDs
        const activeIds = new Set(monitors.map(m => m.id));
        
        // Remove intervals for monitors that are no longer active
        for (const [monitorId, intervalId] of monitorIntervals.entries()) {
          if (!activeIds.has(monitorId)) {
            clearInterval(intervalId);
            monitorIntervals.delete(monitorId);
          }
        }
        
        // Schedule checks for all active monitors
        for (const monitor of monitors) {
          scheduleMonitorCheck(monitor);
        }
      }
    );
  }
  
  // Initial load
  refreshAllMonitors();
  
  // Refresh every 30 seconds to pick up new/changed monitors
  setInterval(refreshAllMonitors, 30000);
  
  console.log('Monitoring service started (respects individual monitor intervals)');
}

function getMonitors() {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.all(
      `SELECT m.*, ms.current_status, ms.last_check, ms.uptime_percentage,
              datetime(ms.last_check, '+' || (m.interval / 1000) || ' seconds') as next_check
       FROM monitors m
       LEFT JOIN monitor_status ms ON m.id = ms.monitor_id
       ORDER BY m.created_at DESC`,
      (err, rows) => {
        if (err) reject(err);
        else {
          // Format the timestamps
          const formattedRows = rows.map(row => ({
            ...row,
            last_check: row.last_check ? new Date(row.last_check).toISOString() : null,
            next_check: row.next_check ? new Date(row.next_check).toISOString() : null
          }));
          resolve(formattedRows);
        }
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

function updateMonitor(id, monitor) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.run(
      `UPDATE monitors 
       SET name = ?, url = ?, type = ?, interval = ?, timeout = ?, is_active = ?
       WHERE id = ?`,
      [
        monitor.name,
        monitor.url,
        monitor.type || 'http',
        monitor.interval || 60000,
        monitor.timeout || 5000,
        monitor.is_active !== undefined ? monitor.is_active : 1,
        id
      ],
      function(err) {
        if (err) {
          reject(err);
        } else {
          // Reschedule this monitor if it's active
          if (monitor.is_active !== 0) {
            db.get(`SELECT * FROM monitors WHERE id = ?`, [id], (err, updatedMonitor) => {
              if (!err && updatedMonitor) {
                rescheduleMonitor(updatedMonitor);
              }
            });
          } else {
            // Remove interval if monitor is deactivated
            if (monitorIntervals.has(id)) {
              clearInterval(monitorIntervals.get(id));
              monitorIntervals.delete(id);
            }
          }
          
          // Return updated monitor
          db.get(`SELECT * FROM monitors WHERE id = ?`, [id], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        }
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
  updateMonitor,
  deleteMonitor,
  getMonitorHistory
};

