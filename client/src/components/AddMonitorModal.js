import React, { useState } from 'react';
import './AddMonitorModal.css';
import { X } from 'lucide-react';

function AddMonitorModal({ onClose, onAdd }) {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    type: 'http',
    interval: 60000,
    timeout: 5000,
    is_active: 1
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'interval' || name === 'timeout' ? parseInt(value) : value
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Monitor</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Monitor Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="My Website"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="url">URL</label>
            <input
              type="url"
              id="url"
              name="url"
              value={formData.url}
              onChange={handleChange}
              placeholder="https://example.com"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="type">Type</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
              >
                <option value="http">HTTP(S)</option>
                <option value="tcp">TCP</option>
                <option value="ping">Ping</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="interval">Interval (ms)</label>
              <input
                type="number"
                id="interval"
                name="interval"
                value={formData.interval}
                onChange={handleChange}
                min="10000"
                step="1000"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="timeout">Timeout (ms)</label>
            <input
              type="number"
              id="timeout"
              name="timeout"
              value={formData.timeout}
              onChange={handleChange}
              min="1000"
              step="1000"
              required
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              Add Monitor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddMonitorModal;

