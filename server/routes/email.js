const express = require('express');
const router = express.Router();
const {
  getEmailSettings,
  saveEmailSettings,
  sendTestEmail,
  generateDailyReport,
  getEmailSendStatus,
  getLatestEmailSendStatus
} = require('../services/email');

// Get email settings
router.get('/settings', async (req, res) => {
  try {
    const settings = await getEmailSettings();
    // Don't send password in response
    if (settings && settings.smtp_password) {
      settings.smtp_password = '***'; // Mask password
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save email settings
router.post('/settings', async (req, res) => {
  try {
    const settings = await saveEmailSettings(req.body);
    // Don't send password in response
    if (settings && settings.smtp_password) {
      settings.smtp_password = '***';
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send test email
router.post('/test', async (req, res) => {
  try {
    const result = await sendTestEmail();
    if (result.success) {
      res.json({ success: true, message: result.message });
    } else {
      res.status(400).json({ success: false, error: result.message });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate and send report on demand
router.post('/report', async (req, res) => {
  try {
    const reportDate = req.body.reportDate || null; // Optional date parameter (YYYY-MM-DD)
    await generateDailyReport(reportDate);
    res.json({ success: true, message: 'Report sent successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get email send status
router.get('/status', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const status = await getEmailSendStatus(limit);
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get latest email send status
router.get('/status/latest', async (req, res) => {
  try {
    const status = await getLatestEmailSendStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
