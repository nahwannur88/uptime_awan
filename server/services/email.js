const nodemailer = require('nodemailer');
let ChartJSNodeCanvas = null;
try {
  // chartjs-node-canvas exports ChartJSNodeCanvas as a named export
  const { ChartJSNodeCanvas: ChartJSNodeCanvasClass } = require('chartjs-node-canvas');
  ChartJSNodeCanvas = ChartJSNodeCanvasClass;
} catch (error) {
  console.warn('chartjs-node-canvas not available - email charts will be disabled:', error.message);
}
const { getDatabase } = require('../database');
const { getMonitors } = require('./monitoring');
const { getSpeedTestHistory } = require('./speedtest');

let transporter = null;
let emailSettings = null;

// Initialize email transporter
async function initializeEmail() {
  const settings = await getEmailSettings();
  emailSettings = settings;

  if (!settings || !settings.enabled) {
    console.log('Email reporting is disabled');
    return;
  }

  if (!settings.smtp_host || !settings.smtp_user || !settings.recipient_email) {
    console.log('Email settings incomplete');
    return;
  }

  transporter = nodemailer.createTransport({
    host: settings.smtp_host,
    port: settings.smtp_port || 587,
    secure: settings.smtp_secure === 1, // true for 465, false for other ports
    auth: {
      user: settings.smtp_user,
      pass: settings.smtp_password
    }
  });

  // Verify connection
  try {
    await transporter.verify();
    console.log('Email service ready');
  } catch (error) {
    console.error('Email service configuration error:', error.message);
    transporter = null;
  }
}

// Get email settings
function getEmailSettings() {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    if (!db) {
      resolve(null);
      return;
    }
    db.get(
      `SELECT * FROM email_settings ORDER BY id DESC LIMIT 1`,
      (err, row) => {
        if (err) {
          // If table doesn't exist, return null (not configured)
          if (err.code === 'SQLITE_ERROR' && err.message.includes('no such table')) {
            resolve(null);
          } else {
            reject(err);
          }
        } else {
          resolve(row || null);
        }
      }
    );
  });
}

// Save email settings
function saveEmailSettings(settings) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    
    // Check if settings exist
    db.get(`SELECT id FROM email_settings LIMIT 1`, (err, existing) => {
      if (err) {
        reject(err);
        return;
      }

      if (existing) {
        // Update existing
        db.run(
          `UPDATE email_settings SET
           enabled = ?, smtp_host = ?, smtp_port = ?, smtp_secure = ?,
           smtp_user = ?, smtp_password = ?, from_email = ?, from_name = ?,
           recipient_email = ?, report_time = ?, updated_at = CURRENT_TIMESTAMP`,
          [
            settings.enabled ? 1 : 0,
            settings.smtp_host,
            settings.smtp_port || 587,
            settings.smtp_secure ? 1 : 0,
            settings.smtp_user,
            settings.smtp_password,
            settings.from_email,
            settings.from_name || 'Uptime Awan',
            settings.recipient_email,
            settings.report_time || '08:00'
          ],
          function(err) {
            if (err) reject(err);
            else {
              initializeEmail().then(() => resolve({ id: existing.id, ...settings }));
            }
          }
        );
      } else {
        // Insert new
        db.run(
          `INSERT INTO email_settings
           (enabled, smtp_host, smtp_port, smtp_secure, smtp_user, smtp_password,
            from_email, from_name, recipient_email, report_time)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            settings.enabled ? 1 : 0,
            settings.smtp_host,
            settings.smtp_port || 587,
            settings.smtp_secure ? 1 : 0,
            settings.smtp_user,
            settings.smtp_password,
            settings.from_email,
            settings.from_name || 'Uptime Awan',
            settings.recipient_email,
            settings.report_time || '08:00'
          ],
          function(err) {
            if (err) reject(err);
            else {
              initializeEmail().then(() => resolve({ id: this.lastID, ...settings }));
            }
          }
        );
      }
    });
  });
}

// Generate speed test chart for a specific date
async function generateSpeedTestChart(reportDate = null) {
  return new Promise(async (resolve, reject) => {
    if (!ChartJSNodeCanvas) {
      reject(new Error('Chart generation not available - canvas module not installed'));
      return;
    }
    try {
      const db = getDatabase();
      
      // Get target date range
      let targetDate;
      if (reportDate) {
        targetDate = new Date(reportDate + 'T00:00:00');
      } else {
        targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - 1);
        targetDate.setHours(0, 0, 0, 0);
      }
      
      const targetDateEnd = new Date(targetDate);
      targetDateEnd.setHours(23, 59, 59, 999);
      
      // Get speed test data for the target date
      db.all(
        `SELECT 
          strftime('%H', datetime(timestamp, 'localtime')) as hour,
          AVG(download_speed) as avg_download,
          AVG(upload_speed) as avg_upload,
          AVG(ping) as avg_ping
         FROM speedtest_results
         WHERE timestamp >= ? AND timestamp <= ?
         GROUP BY strftime('%H', datetime(timestamp, 'localtime'))
         ORDER BY hour`,
        [targetDate.toISOString(), targetDateEnd.toISOString()],
        async (err, rows) => {
          if (err) {
            reject(err);
            return;
          }

          // Create hourly data map
          const hourlyData = {};
          for (let i = 0; i < 24; i++) {
            const hour = String(i).padStart(2, '0');
            hourlyData[hour] = { download: 0, upload: 0, ping: 0 };
          }

          rows.forEach(row => {
            hourlyData[row.hour] = {
              download: row.avg_download || 0,
              upload: row.avg_upload || 0,
              ping: row.avg_ping || 0
            };
          });

          // Prepare chart data - all 24 hours (00:00 to 23:00)
          const hours = [];
          const downloadValues = [];
          const uploadValues = [];
          
          // Generate all 24 hours from 00:00 to 23:00
          for (let i = 0; i < 24; i++) {
            const hour = String(i).padStart(2, '0');
            hours.push(`${hour}:00`);
            downloadValues.push(hourlyData[hour].download || 0);
            uploadValues.push(hourlyData[hour].upload || 0);
          }
          
          // Add 24:00 at the end
          hours.push('24:00');
          downloadValues.push(downloadValues[23]);
          uploadValues.push(uploadValues[23]);

          // Create chart
          const width = 800;
          const height = 400;
          const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

          const configuration = {
            type: 'line',
            data: {
              labels: hours,
              datasets: [
                {
                  label: 'Download Speed (Mbps)',
                  data: downloadValues,
                  borderColor: 'rgb(59, 130, 246)',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  tension: 0.3,
                  fill: true,
                  pointRadius: 4,
                  pointHoverRadius: 6,
                  pointBackgroundColor: 'rgb(59, 130, 246)',
                  pointBorderColor: '#fff',
                  pointBorderWidth: 2
                },
                {
                  label: 'Upload Speed (Mbps)',
                  data: uploadValues,
                  borderColor: 'rgb(34, 197, 94)',
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  tension: 0.3,
                  fill: true,
                  pointRadius: 4,
                  pointHoverRadius: 6,
                  pointBackgroundColor: 'rgb(34, 197, 94)',
                  pointBorderColor: '#fff',
                  pointBorderWidth: 2
                }
              ]
            },
            options: {
              responsive: true,
              plugins: {
                title: {
                  display: true,
                  text: 'Network Speed Test - 24 Hour Performance',
                  font: { size: 18, weight: 'bold' },
                  padding: { top: 10, bottom: 20 }
                },
                legend: {
                  display: true,
                  position: 'top',
                  labels: {
                    font: { size: 12 },
                    padding: 15
                  }
                },
                tooltip: {
                  mode: 'index',
                  intersect: false,
                  callbacks: {
                    label: function(context) {
                      const label = context.dataset.label || '';
                      const value = context.parsed.y.toFixed(2);
                      return `${label}: ${value} Mbps`;
                    }
                  }
                }
              },
              scales: {
                y: {
                  type: 'linear',
                  display: true,
                  position: 'left',
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Speed (Mbps)',
                    font: { size: 14, weight: 'bold' },
                    padding: { top: 10, bottom: 10 }
                  },
                  ticks: {
                    font: { size: 11 },
                    callback: function(value) {
                      return value.toFixed(0) + ' Mbps';
                    }
                  },
                  grid: {
                    color: 'rgba(0, 0, 0, 0.1)',
                    drawBorder: true
                  }
                },
                x: {
                  display: true,
                  title: {
                    display: true,
                    text: 'Time (00:00 - 24:00)',
                    font: { size: 14, weight: 'bold' },
                    padding: { top: 10, bottom: 10 }
                  },
                  ticks: {
                    font: { size: 11 },
                    maxRotation: 45,
                    minRotation: 45
                  },
                  grid: {
                    color: 'rgba(0, 0, 0, 0.1)',
                    drawBorder: true
                  }
                }
              }
            }
          };

          const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
          resolve(imageBuffer);
        }
      );
    } catch (error) {
      reject(error);
    }
  });
}

// Generate hourly uptime chart
async function generateHourlyUptimeChart(monitorId, monitorName, reportDate = null) {
  return new Promise(async (resolve, reject) => {
    if (!ChartJSNodeCanvas) {
      reject(new Error('Chart generation not available - canvas module not installed'));
      return;
    }
    try {
      const db = getDatabase();
      
      // Get hourly data for target date (00:00 to 23:59)
      let targetDate;
      if (reportDate) {
        targetDate = new Date(reportDate + 'T00:00:00');
      } else {
        targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - 1);
        targetDate.setHours(0, 0, 0, 0);
      }
      
      const targetDateEnd = new Date(targetDate);
      targetDateEnd.setHours(23, 59, 59, 999);
      
      // Get all individual check records (not averaged) to show actual data points
      db.all(
        `SELECT 
          timestamp,
          response_time,
          status
         FROM monitor_checks
         WHERE monitor_id = ? AND timestamp >= ? AND timestamp <= ?
         ORDER BY timestamp ASC`,
        [monitorId, targetDate.toISOString(), targetDateEnd.toISOString()],
        async (err, rows) => {
          if (err) {
            reject(err);
            return;
          }

          // Always generate chart, even if no data (will show empty chart)
          const hasData = rows && rows.length > 0;
          if (hasData) {
            console.log(`Chart data for monitor ${monitorId}: ${rows.length} individual check records`);
          } else {
            console.log(`No data found for monitor ${monitorId} on ${reportDate || 'yesterday'}, generating empty chart`);
          }

          // Create a map of all 24 hours for x-axis labels
          const hourLabels = [];
          for (let i = 0; i < 24; i++) {
            const hour = String(i).padStart(2, '0');
            hourLabels.push(`${hour}:00`);
          }
          hourLabels.push('24:00');

          // Process actual check data - group by hour but keep actual values
          // Create data points for each hour, showing actual response times
          const chartData = [];
          const dataByHour = {};
          
          // Initialize all hours with empty arrays (no data)
          for (let i = 0; i < 24; i++) {
            const hour = String(i).padStart(2, '0');
            dataByHour[hour] = [];
          }
          
          // Group checks by hour (if we have data)
          if (hasData && rows) {
            rows.forEach(row => {
              const checkDate = new Date(row.timestamp);
              const hour = String(checkDate.getHours()).padStart(2, '0');
              if (row.response_time !== null && row.response_time !== undefined) {
                dataByHour[hour].push(parseFloat(row.response_time));
              }
            });
          }
          
          // For each hour, use the actual values (if multiple checks, use the last one or average)
          // But to match the Excel-style chart, we'll use the last check value in each hour
          const responseTimeValues = [];
          const hourTimes = [];
          
          for (let i = 0; i < 24; i++) {
            const hour = String(i).padStart(2, '0');
            hourTimes.push(`${hour}:00`);
            
            if (dataByHour[hour].length > 0) {
              // Use the last value in the hour (most recent check) to match Excel behavior
              responseTimeValues.push(dataByHour[hour][dataByHour[hour].length - 1]);
            } else {
              // No data for this hour - use null to create gap
              responseTimeValues.push(null);
            }
          }
          
          // Add 24:00 at the end
          hourTimes.push('24:00');
          // For 24:00, use the last hour's value if available
          responseTimeValues.push(responseTimeValues[23] !== null ? responseTimeValues[23] : null);

          // Create chart
          const width = 800;
          const height = 400;
          const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

          const configuration = {
            type: 'line',
            data: {
              labels: hourTimes,
              datasets: [
                {
                  label: 'Response Time (ms)',
                  data: responseTimeValues,
                  borderColor: 'rgb(59, 130, 246)',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  tension: 0.1, // Lower tension for more linear lines like Excel
                  fill: false,
                  spanGaps: false, // Don't connect across gaps - show breaks like Excel
                  pointRadius: function(context) {
                    return context.parsed.y === null ? 0 : 3;
                  },
                  pointHoverRadius: 5,
                  pointBackgroundColor: 'rgb(59, 130, 246)',
                  pointBorderColor: '#fff',
                  pointBorderWidth: 1.5,
                  showLine: true
                }
              ]
            },
            options: {
              responsive: true,
              plugins: {
                title: {
                  display: true,
                  text: `${monitorName} - 24 Hour Response Time`,
                  font: { size: 18, weight: 'bold' },
                  padding: { top: 10, bottom: 20 }
                },
                legend: {
                  display: true,
                  position: 'top',
                  labels: {
                    font: { size: 12 },
                    padding: 15
                  }
                },
                tooltip: {
                  mode: 'index',
                  intersect: false,
                  callbacks: {
                    label: function(context) {
                      if (context.parsed.y === null) {
                        return 'No data';
                      }
                      return `Response Time: ${context.parsed.y.toFixed(2)} ms`;
                    },
                    filter: function(tooltipItem) {
                      // Only show tooltip if there's actual data
                      return tooltipItem.parsed.y !== null;
                    }
                  }
                }
              },
              scales: {
                y: {
                  type: 'linear',
                  display: true,
                  position: 'left',
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Response Time (ms)',
                    font: { size: 14, weight: 'bold' },
                    padding: { top: 10, bottom: 10 }
                  },
                  ticks: {
                    font: { size: 11 },
                    callback: function(value) {
                      return value + ' ms';
                    }
                  },
                  grid: {
                    color: 'rgba(0, 0, 0, 0.1)',
                    drawBorder: true
                  }
                },
                x: {
                  display: true,
                  title: {
                    display: true,
                    text: 'Time (00:00 - 24:00)',
                    font: { size: 14, weight: 'bold' },
                    padding: { top: 10, bottom: 10 }
                  },
                  ticks: {
                    font: { size: 11 },
                    maxRotation: 45,
                    minRotation: 45
                  },
                  grid: {
                    color: 'rgba(0, 0, 0, 0.1)',
                    drawBorder: true
                  }
                }
              }
            }
          };

          const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
          resolve(imageBuffer);
        }
      );
    } catch (error) {
      reject(error);
    }
  });
}

// Generate daily report
async function generateDailyReport(reportDate = null) {
  try {
    if (!transporter || !emailSettings) {
      console.log('Email not configured, skipping report');
      return;
    }

    const monitors = await getMonitors();
    const activeMonitors = monitors.filter(m => m.is_active);
    
    if (activeMonitors.length === 0) {
      console.log('No active monitors, skipping report');
      return;
    }

    const db = getDatabase();
    // Calculate report date (default to yesterday, or use provided date)
    let targetDate;
    if (reportDate) {
      // Parse provided date (YYYY-MM-DD format)
      targetDate = new Date(reportDate + 'T00:00:00');
    } else {
      // Default to yesterday
      targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - 1);
      targetDate.setHours(0, 0, 0, 0);
    }
    
    const targetDateEnd = new Date(targetDate);
    targetDateEnd.setHours(23, 59, 59, 999);
    
    const reportDateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Get overall statistics
    const totalChecks = await new Promise((resolve, reject) => {
      db.get(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'up' THEN 1 ELSE 0 END) as up,
          AVG(response_time) as avg_response_time
         FROM monitor_checks
         WHERE timestamp >= ? AND timestamp <= ?`,
        [targetDate.toISOString(), targetDateEnd.toISOString()],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    const overallUptime = totalChecks.total > 0 
      ? ((totalChecks.up / totalChecks.total) * 100).toFixed(2)
      : '0.00';

    // Build HTML report
    let htmlReport = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 900px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
          .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
          .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; }
          .stat-value { font-size: 32px; font-weight: bold; color: #3b82f6; }
          .stat-label { color: #666; margin-top: 5px; }
          .monitor-section { margin-bottom: 40px; }
          .monitor-item { background: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
          .monitor-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
          .monitor-name { font-size: 20px; font-weight: bold; }
          .status { padding: 5px 15px; border-radius: 20px; font-weight: bold; }
          .status.up { background: #d4edda; color: #155724; }
          .status.down { background: #f8d7da; color: #721c24; }
          .monitor-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 15px; }
          .chart-container { margin-top: 20px; text-align: center; }
          .chart-container img { max-width: 100%; border: 1px solid #ddd; border-radius: 8px; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Daily Uptime Report</h1>
            <p>${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div class="stats">
            <div class="stat-card">
              <div class="stat-value">${activeMonitors.length}</div>
              <div class="stat-label">Active Monitors</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${overallUptime}%</div>
              <div class="stat-label">Overall Uptime</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${totalChecks.total || 0}</div>
              <div class="stat-label">Total Checks</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${Math.round(totalChecks.avg_response_time || 0)}ms</div>
              <div class="stat-label">Avg Response Time</div>
            </div>
          </div>
    `;

    // Add monitor details with charts
    for (const monitor of activeMonitors) {
      // Get monitor-specific stats for the target date (same date range as chart)
      const monitorStats = await new Promise((resolve, reject) => {
        db.get(
          `SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'up' THEN 1 ELSE 0 END) as up,
            AVG(response_time) as avg_response_time,
            MAX(response_time) as max_response_time,
            MIN(response_time) as min_response_time
           FROM monitor_checks
           WHERE monitor_id = ? AND timestamp >= ? AND timestamp <= ?`,
          [monitor.id, targetDate.toISOString(), targetDateEnd.toISOString()],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      // Always generate chart (even if no data, will show empty chart)
      let chartBase64 = null;
      try {
        const chartBuffer = await generateHourlyUptimeChart(monitor.id, monitor.name, reportDateStr);
        if (chartBuffer) {
          chartBase64 = chartBuffer.toString('base64');
        } else {
          console.warn(`Chart generation returned null for ${monitor.name}`);
        }
      } catch (error) {
        console.warn(`Could not generate chart for ${monitor.name}:`, error.message);
        // Continue without chart
      }

      const monitorUptime = monitorStats.total > 0
        ? ((monitorStats.up / monitorStats.total) * 100).toFixed(2)
        : '0.00';

      htmlReport += `
        <div class="monitor-section">
          <div class="monitor-item">
            <div class="monitor-header">
              <div>
                <div class="monitor-name">${monitor.name}</div>
                <div style="color: #666; margin-top: 5px;">${monitor.url}</div>
              </div>
              <span class="status ${monitor.current_status || 'unknown'}">
                ${(monitor.current_status || 'unknown').toUpperCase()}
              </span>
            </div>
            
            <div class="monitor-stats">
              <div>
                <strong>Uptime:</strong> ${monitorUptime}%
              </div>
              <div>
                <strong>Avg Response:</strong> ${Math.round(monitorStats.avg_response_time || 0)}ms
              </div>
              <div>
                <strong>Checks:</strong> ${monitorStats.total || 0}
              </div>
            </div>

            ${chartBase64 ? `
            <div class="chart-container">
              <img src="data:image/png;base64,${chartBase64}" alt="Hourly Response Time Chart" />
            </div>
            ` : monitorStats.total > 0 ? `
            <div class="chart-container">
              <p style="color: #666; text-align: center; padding: 20px;">No chart data available for this period</p>
            </div>
            ` : `
            <div class="chart-container">
              <p style="color: #999; text-align: center; padding: 20px; font-style: italic;">No monitoring data available for ${reportDateStr}</p>
            </div>
            `}
          </div>
        </div>
      `;
    }

    // Add speed test section with chart
    let speedTestChartBase64 = null;
    try {
      const speedTestChartBuffer = await generateSpeedTestChart(reportDateStr);
      speedTestChartBase64 = speedTestChartBuffer.toString('base64');
    } catch (error) {
      console.warn('Could not generate speed test chart:', error.message);
    }

    // Get speed test data for the target date
    const speedTestsForDate = await new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM speedtest_results 
         WHERE timestamp >= ? AND timestamp <= ?
         ORDER BY timestamp DESC`,
        [targetDate.toISOString(), targetDateEnd.toISOString()],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    if (speedTestsForDate && speedTestsForDate.length > 0) {
      const latestSpeedTest = speedTestsForDate[0];
      const avgDownload = speedTestsForDate.reduce((sum, test) => sum + test.download_speed, 0) / speedTestsForDate.length;
      const avgUpload = speedTestsForDate.reduce((sum, test) => sum + test.upload_speed, 0) / speedTestsForDate.length;
      const avgPing = speedTestsForDate.reduce((sum, test) => sum + test.ping, 0) / speedTestsForDate.length;

      htmlReport += `
        <div class="monitor-section">
          <h2>🌐 Network Speed Test</h2>
          <div class="monitor-item">
            <div class="monitor-stats">
              <div>
                <strong>Average Download:</strong> ${avgDownload.toFixed(2)} Mbps
              </div>
              <div>
                <strong>Average Upload:</strong> ${avgUpload.toFixed(2)} Mbps
              </div>
              <div>
                <strong>Average Ping:</strong> ${avgPing.toFixed(2)} ms
              </div>
              <div>
                <strong>Tests Performed:</strong> ${speedTestsForDate.length}
              </div>
            </div>
            <div style="margin-top: 15px; color: #666;">
              <small>Latest Test - Server: ${latestSpeedTest.server_name || 'N/A'} | ISP: ${latestSpeedTest.isp || 'N/A'}</small>
            </div>
            ${speedTestChartBase64 ? `
            <div class="chart-container">
              <img src="data:image/png;base64,${speedTestChartBase64}" alt="Speed Test Chart" />
            </div>
            ` : ''}
          </div>
        </div>
      `;
    }

    htmlReport += `
          <div class="footer">
            <p>Generated by Uptime Awan Dashboard</p>
            <p><small>This is an automated daily report</small></p>
            <p><small>CSV data file attached for detailed analysis</small></p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Generate CSV data for attachment
    const escapeCsv = (value) => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // CSV Header - Summary Section
    let csvContent = '=== MONITOR SUMMARY ===\n';
    csvContent += 'Monitor Name,URL,Type,Status,Uptime %,Avg Response (ms),Total Checks,Last Check,Next Check\n';
    
    // Add monitor summary data to CSV
    for (const monitor of activeMonitors) {
      const monitorStats = await new Promise((resolve, reject) => {
        db.get(
          `SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'up' THEN 1 ELSE 0 END) as up,
            AVG(response_time) as avg_response_time
           FROM monitor_checks
           WHERE monitor_id = ? AND timestamp >= ? AND timestamp <= ?`,
          [monitor.id, targetDate.toISOString(), targetDateEnd.toISOString()],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      const monitorUptime = monitorStats.total > 0
        ? ((monitorStats.up / monitorStats.total) * 100).toFixed(2)
        : '0.00';
      
      const lastCheck = monitor.last_check ? new Date(monitor.last_check).toLocaleString() : 'N/A';
      const nextCheck = monitor.next_check ? new Date(monitor.next_check).toLocaleString() : 'N/A';
      
      csvContent += `${escapeCsv(monitor.name)},${escapeCsv(monitor.url)},${escapeCsv(monitor.type || 'HTTP')},${escapeCsv(monitor.current_status || 'unknown')},${escapeCsv(monitorUptime)},${escapeCsv(Math.round(monitorStats.avg_response_time || 0))},${escapeCsv(monitorStats.total || 0)},${escapeCsv(lastCheck)},${escapeCsv(nextCheck)}\n`;
    }

    // CSV - All Individual Check Records
    csvContent += '\n=== ALL MONITOR CHECKS (DETAILED RECORDS) ===\n';
    csvContent += 'Monitor Name,Timestamp,Status,Response Time (ms)\n';
    
    // Get all individual check records for the day
    for (const monitor of activeMonitors) {
      const allChecks = await new Promise((resolve, reject) => {
        db.all(
          `SELECT 
            timestamp,
            status,
            response_time
           FROM monitor_checks
           WHERE monitor_id = ? AND timestamp >= ? AND timestamp <= ?
           ORDER BY timestamp ASC`,
          [monitor.id, targetDate.toISOString(), targetDateEnd.toISOString()],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
          }
        );
      });

      // Add each check record
      allChecks.forEach(check => {
        const timestamp = new Date(check.timestamp).toLocaleString();
        csvContent += `${escapeCsv(monitor.name)},${escapeCsv(timestamp)},${escapeCsv(check.status)},${escapeCsv(check.response_time || 0)}\n`;
      });
    }

    // Add speed test data to CSV if available
    if (speedTestsForDate && speedTestsForDate.length > 0) {
      csvContent += '\nSpeed Test Data\n';
      csvContent += 'Timestamp,Download (Mbps),Upload (Mbps),Ping (ms),Jitter (ms),Server,ISP\n';
      speedTestsForDate.forEach(test => {
        const timestamp = new Date(test.timestamp).toLocaleString();
        csvContent += `${escapeCsv(timestamp)},${escapeCsv(test.download_speed.toFixed(2))},${escapeCsv(test.upload_speed.toFixed(2))},${escapeCsv(test.ping.toFixed(2))},${escapeCsv(test.jitter || 0)},${escapeCsv(test.server_name || 'N/A')},${escapeCsv(test.isp || 'N/A')}\n`;
      });
    }

    // Send email with retry logic
    const mailOptions = {
      from: `"${emailSettings.from_name}" <${emailSettings.from_email}>`,
      to: emailSettings.recipient_email,
      subject: `Daily Uptime Report - ${reportDateStr}`,
      html: htmlReport,
      attachments: [
        {
          filename: `uptime_report_${reportDateStr}.csv`,
          content: csvContent,
          contentType: 'text/csv'
        }
      ]
    };

    // Update status to sending
    await updateEmailSendStatus(reportDateStr, 'sending', 0, null, null);

    // Retry logic - 3 attempts
    let lastError = null;
    let success = false;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await transporter.sendMail(mailOptions);
        success = true;
        await updateEmailSendStatus(reportDateStr, 'sent', attempt, null, new Date().toISOString());
        console.log(`Daily report sent successfully on attempt ${attempt}`);
        
        // Broadcast status update
        if (global.broadcast) {
          global.broadcast({
            type: 'email_status',
            data: {
              report_date: reportDateStr,
              status: 'sent',
              sent_at: new Date().toISOString()
            }
          });
        }
        break;
      } catch (error) {
        lastError = error;
        console.error(`Email send attempt ${attempt} failed:`, error.message);
        await updateEmailSendStatus(reportDateStr, 'failed', attempt, error.message, null);
        
        // Wait 5 seconds before retry (except on last attempt)
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }

    if (!success) {
      await updateEmailSendStatus(reportDateStr, 'failed', 3, lastError.message, null);
      console.error('Daily report failed after 3 attempts:', lastError.message);
      
      // Broadcast status update
      if (global.broadcast) {
        global.broadcast({
          type: 'email_status',
          data: {
            report_date: reportDateStr,
            status: 'failed',
            error: lastError.message,
            attempts: 3
          }
        });
      }
    }
  } catch (error) {
    console.error('Error generating daily report:', error);
    const reportDate = new Date();
    reportDate.setDate(reportDate.getDate() - 1);
    const dateStr = reportDate.toISOString().split('T')[0];
    await updateEmailSendStatus(dateStr, 'error', 0, error.message, null);
  }
}

// Update email send status
function updateEmailSendStatus(reportDate, status, attempts, errorMessage, sentAt) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    
    // Check if status exists for this date
    db.get(
      `SELECT id FROM email_send_status WHERE report_date = ?`,
      [reportDate],
      (err, existing) => {
        if (err) {
          reject(err);
          return;
        }

        if (existing) {
          // Update existing
          db.run(
            `UPDATE email_send_status SET
             status = ?, attempts = ?, last_attempt = CURRENT_TIMESTAMP,
             error_message = ?, sent_at = ?
             WHERE report_date = ?`,
            [status, attempts, errorMessage, sentAt, reportDate],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        } else {
          // Insert new
          db.run(
            `INSERT INTO email_send_status
             (report_date, status, attempts, last_attempt, error_message, sent_at)
             VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?)`,
            [reportDate, status, attempts, errorMessage, sentAt],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        }
      }
    );
  });
}

// Get email send status
function getEmailSendStatus(limit = 10) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.all(
      `SELECT * FROM email_send_status ORDER BY report_date DESC LIMIT ?`,
      [limit],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

// Get latest email send status
function getLatestEmailSendStatus() {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.get(
      `SELECT * FROM email_send_status ORDER BY report_date DESC LIMIT 1`,
      (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      }
    );
  });
}

// Start daily report scheduler
function startDailyReportScheduler() {
  // Get report time from settings
  getEmailSettings().then(settings => {
    if (!settings || !settings.enabled) {
      console.log('Daily reports disabled');
      return;
    }

    const reportTime = settings.report_time || '08:00';
    const [hour, minute] = reportTime.split(':').map(Number);

    // Schedule daily report
    const cron = require('node-cron');
    cron.schedule(`${minute} ${hour} * * *`, () => {
      console.log('Generating daily report...');
      generateDailyReport();
    });

    console.log(`Daily report scheduled for ${reportTime} every day`);
  });
}

// Send test email
async function sendTestEmail() {
  try {
    // Get latest settings
    const settings = await getEmailSettings();
    
    if (!settings || !settings.enabled) {
      return { success: false, message: 'Email reporting is not enabled. Please enable it first.' };
    }

    if (!settings.smtp_host || !settings.smtp_user || !settings.recipient_email) {
      return { success: false, message: 'Email settings are incomplete. Please fill in all required fields (SMTP Host, SMTP User, Recipient Email).' };
    }

    if (!settings.smtp_password) {
      return { success: false, message: 'SMTP password is required. Please enter your SMTP password.' };
    }

    // Create transporter for test
    const testTransporter = nodemailer.createTransport({
      host: settings.smtp_host,
      port: settings.smtp_port || 587,
      secure: settings.smtp_secure === 1,
      auth: {
        user: settings.smtp_user,
        pass: settings.smtp_password
      }
    });

    // Verify connection first
    try {
      await testTransporter.verify();
    } catch (verifyError) {
      return { success: false, message: `SMTP connection failed: ${verifyError.message}. Please check your SMTP settings.` };
    }

    const mailOptions = {
      from: `"${settings.from_name || 'Uptime Awan'}" <${settings.from_email}>`,
      to: settings.recipient_email,
      subject: 'Test Email from Uptime Awan',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>✅ Email Configuration Test</h2>
          <p>This is a test email from your Uptime Awan Dashboard.</p>
          <p>If you received this email, your email settings are configured correctly!</p>
          <p><small>Sent at ${new Date().toLocaleString()}</small></p>
        </div>
      `
    };

    await testTransporter.sendMail(mailOptions);
    
    // Reinitialize the main transporter with these settings
    await initializeEmail();
    
    return { success: true, message: 'Test email sent successfully! Check your inbox.' };
  } catch (error) {
    return { success: false, message: `Failed to send test email: ${error.message}` };
  }
}

module.exports = {
  initializeEmail,
  getEmailSettings,
  saveEmailSettings,
  generateDailyReport,
  startDailyReportScheduler,
  sendTestEmail,
  getEmailSendStatus,
  getLatestEmailSendStatus,
  updateEmailSendStatus
};
