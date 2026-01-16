const express = require('express');
const router = express.Router();
const {
  getMonitors,
  addMonitor,
  deleteMonitor,
  getMonitorHistory,
  checkMonitor
} = require('../services/monitoring');

// Get all monitors
router.get('/', async (req, res) => {
  try {
    const monitors = await getMonitors();
    res.json({ success: true, data: monitors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add new monitor
router.post('/', async (req, res) => {
  try {
    const monitor = await addMonitor(req.body);
    res.json({ success: true, data: monitor });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete monitor
router.delete('/:id', async (req, res) => {
  try {
    const result = await deleteMonitor(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get monitor history
router.get('/:id/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const history = await getMonitorHistory(req.params.id, limit);
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check monitor on demand
router.post('/:id/check', async (req, res) => {
  try {
    const { id } = req.params;
    const monitors = await getMonitors();
    const monitor = monitors.find(m => m.id === parseInt(id));
    
    if (!monitor) {
      return res.status(404).json({ success: false, error: 'Monitor not found' });
    }

    const result = await checkMonitor(monitor);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

