const express = require('express');
const router = express.Router();
const {
  runSpeedTest,
  getSpeedTestHistory,
  getLatestSpeedTest
} = require('../services/speedtest');

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

