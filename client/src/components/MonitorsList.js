import React from 'react';
import './MonitorsList.css';
import { Plus, Trash2, Circle, ExternalLink } from 'lucide-react';

function MonitorsList({ monitors, onAddMonitor, onDeleteMonitor }) {
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
        <h2>Monitors</h2>
        <button className="add-monitor-btn" onClick={onAddMonitor}>
          <Plus size={16} />
          Add Monitor
        </button>
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
        ) : (
          monitors.map((monitor) => (
            <div key={monitor.id} className="monitor-item">
              <div className="monitor-status">
                <Circle 
                  size={12} 
                  fill={getStatusColor(monitor.current_status)}
                  color={getStatusColor(monitor.current_status)}
                />
              </div>
              
              <div className="monitor-info">
                <div className="monitor-name">{monitor.name}</div>
                <div className="monitor-url">
                  <a href={monitor.url} target="_blank" rel="noopener noreferrer">
                    {monitor.url}
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              <div className="monitor-stats">
                <div className="stat-item">
                  <div className="stat-label">Uptime</div>
                  <div className="stat-value">{formatUptime(monitor.uptime_percentage)}%</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Status</div>
                  <div className="stat-value status" style={{ color: getStatusColor(monitor.current_status) }}>
                    {monitor.current_status || 'unknown'}
                  </div>
                </div>
              </div>

              <button 
                className="delete-btn" 
                onClick={() => onDeleteMonitor(monitor.id)}
                title="Delete monitor"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default MonitorsList;

