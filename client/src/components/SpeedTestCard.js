import React, { useState } from 'react';
import './SpeedTestCard.css';
import { ArrowDown, ArrowUp, Zap, Play, Loader } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function SpeedTestCard({ data, history, onRunTest }) {
  const [isRunning, setIsRunning] = useState(false);

  const handleRunTest = async () => {
    setIsRunning(true);
    await onRunTest();
    setTimeout(() => setIsRunning(false), 3000);
  };

  const formatSpeed = (speed) => {
    return speed ? speed.toFixed(2) : '0.00';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      // Convert to local time and format
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return '';
    }
  };

  // Process chart data - ensure proper timezone and chronological order
  const chartData = history
    .slice(0, 12)
    .map(item => {
      const date = new Date(item.timestamp);
      return {
        time: formatDate(item.timestamp),
        download: parseFloat((item.download_speed || 0).toFixed(2)),
        upload: parseFloat((item.upload_speed || 0).toFixed(2)),
        ping: parseFloat((item.ping || 0).toFixed(2)),
        fullDate: date.getTime()
      };
    })
    .sort((a, b) => a.fullDate - b.fullDate); // Sort chronologically (oldest to newest)

  return (
    <div className="speed-test-card">
      <div className="card-header">
        <h2>Internet Speed test</h2>
        <button 
          className="run-test-btn" 
          onClick={handleRunTest}
          disabled={isRunning}
        >
          {isRunning ? (
            <>
              <Loader size={14} className="spinning" />
              Running...
            </> 
          ) : (
            <>
              <Play size={14} />
              Run Test
            </>
          )}
        </button>
      </div>

      {data && (
        <>
          <div className="speed-metrics">
            <div className="speed-metric">
              <div className="metric-icon download">
                <ArrowDown size={18} />
              </div>
              <div className="metric-info">
                <div className="metric-label">Download</div>
                <div className="metric-value">{formatSpeed(data.download_speed)} <span>Mbps</span></div>
              </div>
            </div>

            <div className="speed-metric">
              <div className="metric-icon upload">
                <ArrowUp size={18} />
              </div>
              <div className="metric-info">
                <div className="metric-label">Upload</div>
                <div className="metric-value">{formatSpeed(data.upload_speed)} <span>Mbps</span></div>
              </div>
            </div>

            <div className="speed-metric">
              <div className="metric-icon ping">
                <Zap size={18} />
              </div>
              <div className="metric-info">
                <div className="metric-label">Ping</div>
                <div className="metric-value">{formatSpeed(data.ping)} <span>ms</span></div>
              </div>
            </div>
          </div>

          <div className="speed-info">
            <div className="info-item">
              <span className="info-label">Server:</span>
              <span className="info-value">{data.server_name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Location:</span>
              <span className="info-value">{data.server_location}</span>
            </div>
            <div className="info-item">
              <span className="info-label">ISP:</span>
              <span className="info-value">{data.isp}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Last Test:</span>
              <span className="info-value">{data.last_check ? new Date(data.last_check).toLocaleString() : (data.timestamp ? new Date(data.timestamp).toLocaleString() : 'Never')}</span>
            </div>
            {data.next_check && (
              <div className="info-item">
                <span className="info-label">Next Test:</span>
                <span className="info-value">{new Date(data.next_check).toLocaleString()}</span>
              </div>
            )}
          </div>
        </>
      )}

      {chartData && chartData.length > 0 ? (
        <div className="speed-chart">
          <h3>Speed History</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ 
                  background: '#1e293b', 
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#e2e8f0'
                }} 
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="download" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Download (Mbps)"
              />
              <Line 
                type="monotone" 
                dataKey="upload" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                name="Upload (Mbps)"
              />
            </LineChart>
          </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="speed-chart">
          <h3>Speed History</h3>
          <div className="chart-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
            No history data available
          </div>
        </div>
      )}
    </div>
  );
}

export default SpeedTestCard;

