import React, { useState, useEffect } from 'react';
import './EmailSettings.css';
import { X } from 'lucide-react';

function SpeedtestSettings({ onClose }) {
  const [formData, setFormData] = useState({
    enabled: 1,
    interval: 3600000,
    auto_run: 1
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/speedtest/settings');
      const data = await response.json();
      if (data.success && data.data) {
        setFormData({
          enabled: data.data.enabled !== undefined ? data.data.enabled : 1,
          interval: data.data.interval || 3600000,
          auto_run: data.data.auto_run !== undefined ? data.data.auto_run : 1
        });
      }
    } catch (error) {
      console.error('Error fetching speedtest settings:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/speedtest/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Speedtest settings saved successfully!' });
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving settings: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : (name === 'interval' ? parseInt(value) : value)
    }));
  };

  const formatInterval = (ms) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}${minutes > 0 ? ` ${minutes} minute${minutes > 1 ? 's' : ''}` : ''}`;
    }
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Speedtest Settings</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="enabled"
                checked={formData.enabled === 1}
                onChange={handleChange}
              />
              <span>Enable automatic speed tests</span>
            </label>
          </div>

          <div className="form-group">
            <label htmlFor="interval">Test Interval (milliseconds)</label>
            <input
              type="number"
              id="interval"
              name="interval"
              value={formData.interval}
              onChange={handleChange}
              min="60000"
              step="60000"
              required
            />
            <small>
              Current interval: {formatInterval(formData.interval)}
              <br />
              Minimum: 60,000 ms (1 minute)
            </small>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="auto_run"
                checked={formData.auto_run === 1}
                onChange={handleChange}
              />
              <span>Run test automatically on schedule</span>
            </label>
            <small>If disabled, tests will only run manually</small>
          </div>

          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SpeedtestSettings;
