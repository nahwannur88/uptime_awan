import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import SpeedTestCard from './components/SpeedTestCard';
import MonitorsList from './components/MonitorsList';
import AddMonitorModal from './components/AddMonitorModal';
import EmailSettings from './components/EmailSettings';
import EmailStatusIndicator from './components/EmailStatusIndicator';
import { Activity, Wifi, Mail } from 'lucide-react';

function App() {
  const [monitors, setMonitors] = useState([]);
  const [speedTestData, setSpeedTestData] = useState(null);
  const [speedTestHistory, setSpeedTestHistory] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEmailSettingsOpen, setIsEmailSettingsOpen] = useState(false);
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
        fetchMonitors();
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        window.location.reload();
      }, 5000);
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

  const handleDeleteMonitor = async (id) => {
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

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <Activity size={32} className="logo-icon" />
            <h1>Uptime Awan Dashboard</h1>
          </div>
          <div className="header-right">
            <button 
              className="header-icon-btn" 
              onClick={() => setIsEmailSettingsOpen(true)}
              title="Email Settings"
            >
              <Mail size={24} />
            </button>
            <Wifi size={24} />
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
            onAddMonitor={() => setIsModalOpen(true)}
            onDeleteMonitor={handleDeleteMonitor}
          />
        </div>
      </main>

      {isModalOpen && (
        <AddMonitorModal
          onClose={() => setIsModalOpen(false)}
          onAdd={handleAddMonitor}
        />
      )}

      {isEmailSettingsOpen && (
        <EmailSettings
          onClose={() => setIsEmailSettingsOpen(false)}
        />
      )}

      <EmailStatusIndicator />
    </div>
  );
}

export default App;

