const express = require('express');
const router = express.Router();
const {
  runSpeedTest,
  getSpeedTestHistory,
  getLatestSpeedTest
} = require('../services/speedtest');
const { getDatabase } = require('../database');

// Get speedtest settings
router.get('/settings', (req, res) => {
  try {
    const db = getDatabase();
    db.get(
      `SELECT * FROM speedtest_settings ORDER BY id DESC LIMIT 1`,
      (err, row) => {
        if (err) {
          return res.status(500).json({ success: false, error: err.message });
        }
        
        // If no settings exist, return defaults
        if (!row) {
          return res.json({
            success: true,
            data: {
              enabled: 1,
              interval: 3600000, // 1 hour in milliseconds
              auto_run: 1
            }
          });
        }
        
        res.json({ success: true, data: row });
      }
    );
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update speedtest settings
router.post('/settings', (req, res) => {
  try {
    const { enabled, interval, auto_run } = req.body;
    const db = getDatabase();
    
    // Check if settings exist
    db.get(
      `SELECT id FROM speedtest_settings ORDER BY id DESC LIMIT 1`,
      (err, row) => {
        if (err) {
          return res.status(500).json({ success: false, error: err.message });
        }
        
        if (row) {
          // Update existing settings
          db.run(
            `UPDATE speedtest_settings 
             SET enabled = ?, interval = ?, auto_run = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [enabled !== undefined ? enabled : 1, interval || 3600000, auto_run !== undefined ? auto_run : 1, row.id],
            function(updateErr) {
              if (updateErr) {
                return res.status(500).json({ success: false, error: updateErr.message });
              }
              res.json({ success: true, message: 'Speedtest settings updated' });
            }
          );
        } else {
          // Insert new settings
          db.run(
            `INSERT INTO speedtest_settings (enabled, interval, auto_run)
             VALUES (?, ?, ?)`,
            [enabled !== undefined ? enabled : 1, interval || 3600000, auto_run !== undefined ? auto_run : 1],
            function(insertErr) {
              if (insertErr) {
                return res.status(500).json({ success: false, error: insertErr.message });
              }
              res.json({ success: true, message: 'Speedtest settings saved' });
            }
          );
        }
      }
    );
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Run speed test on demand
router.post('/run', async (req, res) => {
  try {
    const result = await runSpeedTest();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get speed test history
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const results = await getSpeedTestHistory(limit);
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get latest speed test
router.get('/latest', async (req, res) => {
  try {
    const result = await getLatestSpeedTest();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
