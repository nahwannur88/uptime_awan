import React from 'react';
import './Dashboard.css';
import { Activity, CheckCircle, XCircle, Clock } from 'lucide-react';

function Dashboard({ monitors }) {
  const activeMonitors = monitors.filter(m => m.is_active);
  const upMonitors = monitors.filter(m => m.current_status === 'up').length;
  const downMonitors = monitors.filter(m => m.current_status === 'down').length;
  
  const averageUptime = monitors.length > 0
    ? (monitors.reduce((acc, m) => acc + (m.uptime_percentage || 0), 0) / monitors.length).toFixed(2)
    : 0;

  const averageResponseTime = monitors.length > 0
    ? Math.round(monitors.reduce((acc, m) => {
        return acc + (m.avg_response_time || 0);
      }, 0) / monitors.length)
    : 0;

  return (
    <div className="dashboard-stats">
      <div className="stat-card">
        <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
          <Activity size={24} style={{ color: '#3b82f6' }} />
        </div>
        <div className="stat-content">
          <div className="stat-label">Total Monitors</div>
          <div className="stat-value">{activeMonitors.length}</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
          <CheckCircle size={24} style={{ color: '#22c55e' }} />
        </div>
        <div className="stat-content">
          <div className="stat-label">Up</div>
          <div className="stat-value">{upMonitors}</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
          <XCircle size={24} style={{ color: '#ef4444' }} />
        </div>
        <div className="stat-content">
          <div className="stat-label">Down</div>
          <div className="stat-value">{downMonitors}</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
          <Clock size={24} style={{ color: '#8b5cf6' }} />
        </div>
        <div className="stat-content">
          <div className="stat-label">Avg Uptime</div>
          <div className="stat-value">{averageUptime}%</div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

