import React, { useState } from 'react';
import './AddMonitorModal.css';
import { X } from 'lucide-react';

function AddMonitorModal({ onClose, onAdd, onUpdate, monitor = null }) {
  const isEditMode = monitor !== null;
  
  const [formData, setFormData] = useState({
    name: monitor?.name || '',
    url: monitor?.url || '',
    type: monitor?.type || 'http',
    interval: monitor?.interval || 60000,
    timeout: monitor?.timeout || 5000,
    is_active: monitor?.is_active !== undefined ? monitor.is_active : 1
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEditMode && onUpdate) {
      onUpdate(monitor.id, formData);
    } else {
      onAdd(formData);
    }
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
          <h2>{isEditMode ? 'Edit Monitor' : 'Add New Monitor'}</h2>
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
            <label htmlFor="url">URL or IP Address</label>
            <input
              type="text"
              id="url"
              name="url"
              value={formData.url}
              onChange={handleChange}
              placeholder={formData.type === 'tcp' ? '192.168.1.1:8080' : formData.type === 'ping' ? '192.168.1.1' : 'https://example.com or 192.168.1.1'}
              required
            />
            <small>
              {formData.type === 'http' && 'Enter URL (https://example.com) or IP address (192.168.1.1)'}
              {formData.type === 'tcp' && 'Enter IP:Port (e.g., 192.168.1.1:8080)'}
              {formData.type === 'ping' && 'Enter IP address or hostname (e.g., 192.168.1.1)'}
            </small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="type">Type</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={(e) => {
                  handleChange(e);
                  // Update placeholder based on type
                  const placeholder = e.target.value === 'tcp' ? '192.168.1.1:8080' : 
                                     e.target.value === 'ping' ? '192.168.1.1' : 
                                     'https://example.com or 192.168.1.1';
                  setFormData(prev => ({ ...prev, url: '' }));
                }}
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
              {isEditMode ? 'Update Monitor' : 'Add Monitor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddMonitorModal;

