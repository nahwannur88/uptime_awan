import React, { useState, useEffect, useRef } from 'react';
import './MonitorsList.css';
import { Plus, Trash2, ExternalLink, Edit, Search, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function MonitorsList({ monitors, onAddMonitor, onDeleteMonitor, onEditMonitor }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [flippedMonitors, setFlippedMonitors] = useState(new Set());
  const [monitorHistory, setMonitorHistory] = useState({});
  const flipTimeoutsRef = useRef({});
  
  const fetchMonitorHistory = async (monitorId) => {
    // Only fetch if not already loaded
    if (monitorHistory[monitorId]) {
      return;
    }
    
    try {
      const response = await fetch(`/api/monitors/${monitorId}/history?limit=24`);
      const data = await response.json();
      if (data.success && data.data) {
        // Process history data for chart
        const chartData = data.data
          .slice()
          .reverse() // Reverse to show oldest to newest
          .map(item => {
            const date = new Date(item.timestamp);
            return {
              time: date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true
              }),
              responseTime: item.response_time || 0,
              status: item.status,
              fullDate: date.getTime()
            };
          });
        
        setMonitorHistory(prev => ({
          ...prev,
          [monitorId]: chartData
        }));
      }
    } catch (error) {
      console.error(`Error fetching history for monitor ${monitorId}:`, error);
    }
  };
  
  const toggleFlip = (monitorId) => {
    // Clear existing timeout for this monitor
    if (flipTimeoutsRef.current[monitorId]) {
      clearTimeout(flipTimeoutsRef.current[monitorId]);
      delete flipTimeoutsRef.current[monitorId];
    }
    
    setFlippedMonitors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(monitorId)) {
        newSet.delete(monitorId);
      } else {
        newSet.add(monitorId);
        // Fetch history when flipping to back side
        fetchMonitorHistory(monitorId);
        // Set timeout to auto-flip back after 1 minute
        flipTimeoutsRef.current[monitorId] = setTimeout(() => {
          setFlippedMonitors(prevSet => {
            const updatedSet = new Set(prevSet);
            updatedSet.delete(monitorId);
            return updatedSet;
          });
          delete flipTimeoutsRef.current[monitorId];
        }, 60000); // 1 minute
      }
      return newSet;
    });
  };
  
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(flipTimeoutsRef.current).forEach(timeout => clearTimeout(timeout));
    };
  }, []);
  
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
            <Plus size={14} />
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
            const isFlipped = flippedMonitors.has(monitor.id);
            return (
              <div key={monitor.id} className={`monitor-item-wrapper ${statusClass}`}>
                <div 
                  className={`monitor-item ${isFlipped ? 'flipped' : ''}`}
                  onClick={() => toggleFlip(monitor.id)}
                >
                  <div className="monitor-card-inner">
                  {/* Front side */}
                  <div className="monitor-card-front">
                    <div className="monitor-header">
                      <div className="monitor-info">
                        <div className="monitor-name-row">
                          <div className="monitor-name">{monitor.name}</div>
                          <div className="monitor-uptime">{formatUptime(monitor.uptime_percentage)}%</div>
                        </div>
                        <div className="monitor-status-badge">
                          <span className={`status-indicator ${monitor.current_status || 'unknown'}`}>
                            {monitor.current_status?.toUpperCase() || 'UNKNOWN'}
                          </span>
                        </div>
                      </div>
                      <div className="monitor-actions" onClick={(e) => e.stopPropagation()}>
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
                  
                  {/* Back side */}
                  <div className="monitor-card-back">
                    <div className="monitor-details">
                      <div className="detail-row">
                        <span className="detail-label-inline">URL / IP:</span>
                        <span className="detail-value-inline">
                          {monitor.type === 'ping' || monitor.type === 'tcp' ? (
                            monitor.url
                          ) : (
                            <a href={monitor.url.startsWith('http') ? monitor.url : `http://${monitor.url}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                              {monitor.url}
                              <ExternalLink size={10} />
                            </a>
                          )}
                        </span>
                      </div>
                      {monitor.last_check && (
                        <div className="detail-row">
                          <span className="detail-label-inline">Last:</span>
                          <span className="detail-value-inline">{new Date(monitor.last_check).toLocaleString()}</span>
                        </div>
                      )}
                      {monitor.next_check && (
                        <div className="detail-row">
                          <span className="detail-label-inline">Next:</span>
                          <span className="detail-value-inline">{new Date(monitor.next_check).toLocaleString()}</span>
                        </div>
                      )}
                      {monitorHistory[monitor.id] && monitorHistory[monitor.id].length > 0 && (
                        <div className="monitor-history-chart">
                          <div className="history-chart-container">
                            <ResponsiveContainer width="100%" height={120}>
                              <LineChart data={monitorHistory[monitor.id]}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis 
                                  dataKey="time" 
                                  stroke="#94a3b8"
                                  tick={{ fontSize: 10 }}
                                  angle={-45}
                                  textAnchor="end"
                                  height={40}
                                />
                                <YAxis 
                                  stroke="#94a3b8"
                                  tick={{ fontSize: 10 }}
                                  label={{ value: 'ms', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }}
                                />
                                <Tooltip 
                                  contentStyle={{ 
                                    background: '#1e293b', 
                                    border: '1px solid #334155',
                                    borderRadius: '8px',
                                    color: '#e2e8f0',
                                    fontSize: '11px'
                                  }} 
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="responseTime" 
                                  stroke="#3b82f6" 
                                  strokeWidth={2}
                                  dot={false}
                                  name="Response Time (ms)"
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
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

