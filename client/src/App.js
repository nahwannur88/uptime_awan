import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import SpeedTestCard from './components/SpeedTestCard';
import MonitorsList from './components/MonitorsList';
import AddMonitorModal from './components/AddMonitorModal';
import EmailSettings from './components/EmailSettings';
import EmailStatusIndicator from './components/EmailStatusIndicator';
import SpeedtestSettings from './components/SpeedtestSettings';
import { Activity, Wifi, Mail, Settings } from 'lucide-react';

function App() {
  const [monitors, setMonitors] = useState([]);
  const [speedTestData, setSpeedTestData] = useState(null);
  const [speedTestHistory, setSpeedTestHistory] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEmailSettingsOpen, setIsEmailSettingsOpen] = useState(false);
  const [isSpeedtestSettingsOpen, setIsSpeedtestSettingsOpen] = useState(false);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    // Fetch initial data
    fetchMonitors();
    fetchSpeedTestData();
    
    // Setup WebSocket connection
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = process.env.NODE_ENV === 'production' 
      ? window.location.host 
      : 'localhost:3001';
    const websocket = new WebSocket(`${wsProtocol}//${wsHost}`);

    websocket.onopen = () => {
      console.log('WebSocket connected');
    };

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'speedtest_complete') {
        setSpeedTestData(message.data);
        fetchSpeedTestHistory();
      } else if (message.type === 'monitor_check') {
        // Update monitors immediately when check completes
        fetchMonitors();
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      // Don't auto-reload - just log the disconnection
      // WebSocket will reconnect automatically on next interaction if needed
      // This prevents interrupting user actions like configuring settings
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, []);

  const fetchMonitors = async () => {
    try {
      const response = await fetch('/api/monitors');
      const data = await response.json();
      if (data.success) {
        setMonitors(data.data);
      }
    } catch (error) {
      console.error('Error fetching monitors:', error);
    }
  };

  const fetchSpeedTestData = async () => {
    try {
      const [latestResponse, historyResponse] = await Promise.all([
        fetch('/api/speedtest/latest'),
        fetch('/api/speedtest/history?limit=24')
      ]);
      
      const latest = await latestResponse.json();
      const history = await historyResponse.json();
      
      if (latest.success && latest.data) {
        setSpeedTestData(latest.data);
      }
      
      if (history.success) {
        setSpeedTestHistory(history.data);
      }
    } catch (error) {
      console.error('Error fetching speed test data:', error);
    }
  };

  const fetchSpeedTestHistory = async () => {
    try {
      const response = await fetch('/api/speedtest/history?limit=24');
      const data = await response.json();
      if (data.success) {
        setSpeedTestHistory(data.data);
      }
    } catch (error) {
      console.error('Error fetching speed test history:', error);
    }
  };

  const [editingMonitor, setEditingMonitor] = useState(null);

  const handleAddMonitor = async (monitorData) => {
    try {
      const response = await fetch('/api/monitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(monitorData),
      });
      
      const data = await response.json();
      if (data.success) {
        fetchMonitors();
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error('Error adding monitor:', error);
    }
  };

  const handleUpdateMonitor = async (id, monitorData) => {
    try {
      const response = await fetch(`/api/monitors/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(monitorData),
      });
      
      const data = await response.json();
      if (data.success) {
        fetchMonitors();
        setIsModalOpen(false);
        setEditingMonitor(null);
      }
    } catch (error) {
      console.error('Error updating monitor:', error);
    }
  };

  const handleEditMonitor = (monitor) => {
    setEditingMonitor(monitor);
    setIsModalOpen(true);
  };

  const handleDeleteMonitor = async (id) => {
    // Find the monitor to get its name for the confirmation message
    const monitor = monitors.find(m => m.id === id);
    const monitorName = monitor ? monitor.name : 'this monitor';
    
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete "${monitorName}"?\n\nThis action cannot be undone.`
    );
    
    if (!confirmed) {
      return; // User cancelled, don't proceed
    }
    
    try {
      const response = await fetch(`/api/monitors/${id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      if (data.success) {
        fetchMonitors();
      }
    } catch (error) {
      console.error('Error deleting monitor:', error);
      alert('Failed to delete monitor. Please try again.');
    }
  };

  const handleRunSpeedTest = async () => {
    try {
      await fetch('/api/speedtest/run', {
        method: 'POST',
      });
      // The result will be received via WebSocket
    } catch (error) {
      console.error('Error running speed test:', error);
    }
  };

  const handleRunAllTests = async () => {
    try {
      // Run speed test
      await fetch('/api/speedtest/run', {
        method: 'POST',
      });
      
      // Check all monitors
      await fetch('/api/monitors/check-all', {
        method: 'POST',
      });
      
      // Refresh monitors after a short delay to see updated results
      setTimeout(() => {
        fetchMonitors();
      }, 2000);
    } catch (error) {
      console.error('Error running all tests:', error);
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <Activity size={32} className="logo-icon" />
            <h1>Uptime Awan Dashboard</h1>
          </div>
          <div className="header-right">
            <div className="live-indicator" title="Live Updates Active">
              <div className="live-dot"></div>
              <span>Live</span>
            </div>
            <button 
              className="header-icon-btn" 
              onClick={() => setIsEmailSettingsOpen(true)}
              title="Email Settings"
            >
              <Mail size={24} />
            </button>
            <button 
              className="header-icon-btn" 
              onClick={() => setIsSpeedtestSettingsOpen(true)}
              title="Speedtest Settings"
            >
              <Settings size={24} />
            </button>
            <button 
              className="header-icon-btn" 
              onClick={handleRunAllTests}
              title="Run Speed Test & Check All Monitors"
            >
              <Wifi size={24} />
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <Dashboard monitors={monitors} />
        
        <div className="dashboard-grid">
          <SpeedTestCard
            data={speedTestData}
            history={speedTestHistory}
            onRunTest={handleRunSpeedTest}
          />
          
          <MonitorsList
            monitors={monitors}
            onAddMonitor={() => {
              setEditingMonitor(null);
              setIsModalOpen(true);
            }}
            onDeleteMonitor={handleDeleteMonitor}
            onEditMonitor={handleEditMonitor}
          />
        </div>
      </main>

      {isModalOpen && (
        <AddMonitorModal
          onClose={() => {
            setIsModalOpen(false);
            setEditingMonitor(null);
          }}
          onAdd={handleAddMonitor}
          onUpdate={handleUpdateMonitor}
          monitor={editingMonitor}
        />
      )}

      {isEmailSettingsOpen && (
        <EmailSettings
          onClose={() => setIsEmailSettingsOpen(false)}
        />
      )}

      {isSpeedtestSettingsOpen && (
        <SpeedtestSettings
          onClose={() => setIsSpeedtestSettingsOpen(false)}
        />
      )}

      <EmailStatusIndicator />
    </div>
  );
}

export default App;

