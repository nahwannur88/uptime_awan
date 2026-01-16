import React, { useState } from 'react';
import './MonitorsList.css';
import { Plus, Trash2, ExternalLink, Edit, Search, X } from 'lucide-react';

function MonitorsList({ monitors, onAddMonitor, onDeleteMonitor, onEditMonitor }) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredMonitors = monitors
    .filter(monitor => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        monitor.name.toLowerCase().includes(query) ||
        monitor.url.toLowerCase().includes(query) ||
        (monitor.type && monitor.type.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => {
      // Priority: down > unknown > up
      const statusPriority = { 'down': 0, 'unknown': 1, 'up': 2 };
      const aPriority = statusPriority[a.current_status] ?? 2;
      const bPriority = statusPriority[b.current_status] ?? 2;
      return aPriority - bPriority;
    });

  const getStatusColor = (status) => {
    switch (status) {
      case 'up':
        return '#22c55e';
      case 'down':
        return '#ef4444';
      default:
        return '#94a3b8';
    }
  };

  const formatUptime = (percentage) => {
    return percentage ? percentage.toFixed(2) : '0.00';
  };

  return (
    <div className="monitors-list-card">
      <div className="card-header">
        <div className="header-top">
          <h2>Monitors ({monitors.length})</h2>
          <button className="add-monitor-btn" onClick={onAddMonitor}>
            <Plus size={16} />
            Add Monitor
          </button>
        </div>
        {monitors.length > 0 && (
          <div className="search-container">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search monitors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="monitors-list">
        {monitors.length === 0 ? (
          <div className="empty-state">
            <p>No monitors configured yet.</p>
            <button className="add-first-btn" onClick={onAddMonitor}>
              <Plus size={20} />
              Add Your First Monitor
            </button>
          </div>
        ) : filteredMonitors.length === 0 ? (
          <div className="empty-state">
            <p>No monitors found matching "{searchQuery}"</p>
          </div>
        ) : (
          filteredMonitors.map((monitor) => {
            const statusClass = monitor.current_status === 'up' ? 'status-up' : 
                               monitor.current_status === 'down' ? 'status-down' : 'status-unknown';
            return (
              <div key={monitor.id} className={`monitor-item ${statusClass}`}>
                <div className="monitor-header">
                  <div className="monitor-info">
                    <div className="monitor-name-row">
                      <div className="monitor-name">{monitor.name}</div>
                      <div className="monitor-uptime">{formatUptime(monitor.uptime_percentage)}%</div>
                    </div>
                    <div className="monitor-url">
                      {monitor.type === 'ping' || monitor.type === 'tcp' ? (
                        <span>{monitor.url}</span>
                      ) : (
                        <a href={monitor.url.startsWith('http') ? monitor.url : `http://${monitor.url}`} target="_blank" rel="noopener noreferrer">
                          {monitor.url}
                          <ExternalLink size={10} />
                        </a>
                      )}
                      <span className="monitor-type-badge">{monitor.type?.toUpperCase() || 'HTTP'}</span>
                    </div>
                  </div>
                  <div className="monitor-actions">
                    <button 
                      className="edit-btn" 
                      onClick={() => onEditMonitor(monitor)}
                      title="Edit monitor"
                    >
                      <Edit size={12} />
                    </button>
                    <button 
                      className="delete-btn" 
                      onClick={() => onDeleteMonitor(monitor.id)}
                      title="Delete monitor"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default MonitorsList;

