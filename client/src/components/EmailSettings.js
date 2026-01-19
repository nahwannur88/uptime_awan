import React, { useState, useEffect } from 'react';
import './EmailSettings.css';
import { Mail, Send, CheckCircle, XCircle, Settings, X } from 'lucide-react';

function EmailSettings({ onClose }) {
  const [settings, setSettings] = useState({
    enabled: false,
    smtp_host: '',
    smtp_port: 587,
    smtp_secure: false,
    smtp_user: '',
    smtp_password: '',
    from_email: '',
    from_name: 'Uptime Awan',
    recipient_email: '',
    report_time: '08:00'
  });
  const [reportDate, setReportDate] = useState(() => {
    // Default to yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/email/settings');
      const data = await response.json();
      if (data.success && data.data) {
        setSettings({
          ...data.data,
          smtp_password: '' // Don't show existing password
        });
      }
    } catch (error) {
      console.error('Error fetching email settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (settings.enabled) {
      if (!settings.smtp_host) newErrors.smtp_host = 'SMTP host is required';
      if (!settings.smtp_user) newErrors.smtp_user = 'SMTP user is required';
      if (!settings.smtp_password && !settings.id) newErrors.smtp_password = 'SMTP password is required';
      if (!settings.from_email) newErrors.from_email = 'From email is required';
      if (!settings.recipient_email) newErrors.recipient_email = 'Recipient email is required';
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (settings.from_email && !emailRegex.test(settings.from_email)) {
        newErrors.from_email = 'Invalid email format';
      }
      if (settings.recipient_email && !emailRegex.test(settings.recipient_email)) {
        newErrors.recipient_email = 'Invalid email format';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/email/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();
      if (data.success) {
        setTestResult({ success: true, message: 'Settings saved successfully!' });
        setTimeout(() => {
          setTestResult(null);
          onClose();
        }, 2000);
      } else {
        setTestResult({ success: false, message: data.error || 'Failed to save settings' });
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Error saving settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleSendReport = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/email/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reportDate }),
      });

      const data = await response.json();
      if (data.success) {
        setTestResult({ success: true, message: `Daily report for ${reportDate} sent successfully! Check your inbox.` });
      } else {
        setTestResult({ success: false, message: data.error || 'Failed to send report' });
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Error sending report: ' + error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    // Validate required fields for test email
    const testErrors = {};
    
    if (!settings.smtp_host) {
      testErrors.smtp_host = 'SMTP host is required';
    }
    if (!settings.smtp_user) {
      testErrors.smtp_user = 'SMTP user is required';
    }
    if (!settings.smtp_password && !settings.id) {
      testErrors.smtp_password = 'SMTP password is required';
    }
    if (!settings.from_email) {
      testErrors.from_email = 'From email is required';
    }
    if (!settings.recipient_email) {
      testErrors.recipient_email = 'Recipient email is required';
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (settings.from_email && !emailRegex.test(settings.from_email)) {
      testErrors.from_email = 'Invalid email format';
    }
    if (settings.recipient_email && !emailRegex.test(settings.recipient_email)) {
      testErrors.recipient_email = 'Invalid email format';
    }

    if (Object.keys(testErrors).length > 0) {
      setErrors(testErrors);
      const missingFields = Object.keys(testErrors).join(', ').replace(/_/g, ' ');
      setTestResult({ 
        success: false, 
        message: `Please configure the following fields: ${missingFields}` 
      });
      return;
    }

    // Save settings first
    try {
      setSaving(true);
      const saveResponse = await fetch('/api/email/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      const saveData = await saveResponse.json();
      if (!saveData.success) {
        setTestResult({ success: false, message: saveData.error || 'Failed to save settings before test' });
        return;
      }

      // Send test email
      const testResponse = await fetch('/api/email/test', {
        method: 'POST',
      });

      const testData = await testResponse.json();
      if (testData.success) {
        setTestResult({ success: true, message: 'Test email sent successfully! Check your inbox.' });
      } else {
        setTestResult({ success: false, message: testData.error || 'Failed to send test email' });
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Error sending test email: ' + error.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content email-settings-modal" onClick={(e) => e.stopPropagation()}>
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content email-settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Settings size={24} />
            <h2>Email Settings</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {testResult && (
          <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
            {testResult.success ? <CheckCircle size={20} /> : <XCircle size={20} />}
            <span>{testResult.message}</span>
          </div>
        )}

        <form onSubmit={handleSave}>
          <div className="form-section">
            <h3>Email Reporting</h3>
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="enabled"
                  checked={settings.enabled}
                  onChange={handleChange}
                />
                <span>Enable daily email reports</span>
              </label>
            </div>
          </div>

          {settings.enabled && (
            <>
              <div className="form-section">
                <h3>SMTP Configuration</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="smtp_host">SMTP Host *</label>
                    <input
                      type="text"
                      id="smtp_host"
                      name="smtp_host"
                      value={settings.smtp_host}
                      onChange={handleChange}
                      placeholder="smtp.gmail.com"
                      required
                    />
                    {errors.smtp_host && <span className="error-text">{errors.smtp_host}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="smtp_port">SMTP Port *</label>
                    <input
                      type="number"
                      id="smtp_port"
                      name="smtp_port"
                      value={settings.smtp_port}
                      onChange={handleChange}
                      placeholder="587"
                      required
                    />
                  </div>
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="smtp_secure"
                      checked={settings.smtp_secure}
                      onChange={handleChange}
                    />
                    <span>Use SSL/TLS (port 465)</span>
                  </label>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="smtp_user">SMTP Username *</label>
                    <input
                      type="text"
                      id="smtp_user"
                      name="smtp_user"
                      value={settings.smtp_user}
                      onChange={handleChange}
                      placeholder="your-email@gmail.com"
                      required
                    />
                    {errors.smtp_user && <span className="error-text">{errors.smtp_user}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="smtp_password">SMTP Password *</label>
                    <input
                      type="password"
                      id="smtp_password"
                      name="smtp_password"
                      value={settings.smtp_password}
                      onChange={handleChange}
                      placeholder={settings.id ? "Leave blank to keep existing" : "Enter password"}
                      required={!settings.id}
                    />
                    {errors.smtp_password && <span className="error-text">{errors.smtp_password}</span>}
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Email Details</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="from_email">From Email *</label>
                    <input
                      type="email"
                      id="from_email"
                      name="from_email"
                      value={settings.from_email}
                      onChange={handleChange}
                      placeholder="noreply@example.com"
                      required
                    />
                    {errors.from_email && <span className="error-text">{errors.from_email}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="from_name">From Name</label>
                    <input
                      type="text"
                      id="from_name"
                      name="from_name"
                      value={settings.from_name}
                      onChange={handleChange}
                      placeholder="Uptime Awan"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="recipient_email">Recipient Email *</label>
                  <input
                    type="email"
                    id="recipient_email"
                    name="recipient_email"
                    value={settings.recipient_email}
                    onChange={handleChange}
                    placeholder="recipient@example.com"
                    required
                  />
                  {errors.recipient_email && <span className="error-text">{errors.recipient_email}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="report_time">Daily Report Time</label>
                  <input
                    type="time"
                    id="report_time"
                    name="report_time"
                    value={settings.report_time}
                    onChange={handleChange}
                  />
                  <small>Reports will be sent daily at this time</small>
                </div>
              </div>

              <div className="form-section">
                <div className="info-box">
                  <Mail size={20} />
                  <div>
                    <strong>Popular SMTP Settings:</strong>
                    <ul>
                      <li><strong>Gmail:</strong> smtp.gmail.com:587 (use App Password)</li>
                      <li><strong>Outlook:</strong> smtp-mail.outlook.com:587</li>
                      <li><strong>Yahoo:</strong> smtp.mail.yahoo.com:587</li>
                      <li><strong>Custom:</strong> Check with your email provider</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Manual Report</h3>
                <div className="form-group">
                  <label htmlFor="report_date">Select Report Date</label>
                  <input
                    type="date"
                    id="report_date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]} // Can't select future dates
                  />
                  <small>Select a date to generate and send a report for that day</small>
                </div>
              </div>
            </>
          )}

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            {settings.enabled && (
              <>
                <button type="button" className="test-btn" onClick={handleTestEmail} disabled={saving}>
                  <Send size={16} />
                  Send Test Email
                </button>
                <button type="button" className="report-btn" onClick={handleSendReport} disabled={saving}>
                  <Send size={16} />
                  Send Report Now
                </button>
              </>
            )}
            <button type="submit" className="submit-btn" disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EmailSettings;
