import React, { useState, useEffect } from 'react';
import './EmailStatusIndicator.css';
import { Mail, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

function EmailStatusIndicator() {
  const [status, setStatus] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    fetchStatus();
    
    // Setup WebSocket connection for real-time updates
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = process.env.NODE_ENV === 'production' 
      ? window.location.host 
      : 'localhost:3001';
    const websocket = new WebSocket(`${wsProtocol}//${wsHost}`);

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'email_status') {
        fetchStatus();
      }
    };

    setWs(websocket);

    // Poll for status every 30 seconds
    const interval = setInterval(fetchStatus, 30000);

    return () => {
      clearInterval(interval);
      websocket.close();
    };
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/email/status/latest');
      const data = await response.json();
      if (data.success) {
        setStatus(data.data);
      }
    } catch (error) {
      console.error('Error fetching email status:', error);
    }
  };

  const getStatusIcon = () => {
    if (!status) return <Mail size={20} />;
    
    switch (status.status) {
      case 'sent':
        return <CheckCircle size={20} className="status-icon sent" />;
      case 'failed':
      case 'error':
        return <XCircle size={20} className="status-icon failed" />;
      case 'sending':
        return <Clock size={20} className="status-icon sending" />;
      default:
        return <AlertCircle size={20} className="status-icon unknown" />;
    }
  };

  const getStatusText = () => {
    if (!status) return 'No reports sent';
    
    switch (status.status) {
      case 'sent':
        const sentDate = new Date(status.sent_at);
        return `Report sent ${formatDate(sentDate)}`;
      case 'failed':
      case 'error':
        return `Failed (${status.attempts}/3 attempts)`;
      case 'sending':
        return 'Sending report...';
      default:
        return 'Unknown status';
    }
  };

  const formatDate = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (!status) {
    return null; // Don't show if no status available
  }

  return (
    <div 
      className={`email-status-indicator ${status.status}`}
      onClick={() => setIsExpanded(!isExpanded)}
      title="Email Report Status"
    >
      <div className="status-content">
        {getStatusIcon()}
        {isExpanded && (
          <span className="status-text">{getStatusText()}</span>
        )}
      </div>
      
      {isExpanded && status.error_message && (
        <div className="status-error">
          <small>{status.error_message}</small>
        </div>
      )}
    </div>
  );
}

export default EmailStatusIndicator;
