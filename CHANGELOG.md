# Changelog

All notable changes to Uptime Awan Dashboard will be documented in this file.

## [1.1.0] - 2026-01-12

### Added
- 📧 **Daily Email Reports** - Automated daily email reports with hourly uptime graphs
- ⚙️ **Email Settings UI** - Complete email configuration interface
- 📊 **Hourly Charts in Reports** - Beautiful 24-hour uptime and response time graphs
- ✅ **Test Email Function** - Verify email configuration before enabling
- 🔧 **SMTP Configuration** - Support for Gmail, Outlook, Yahoo, and custom SMTP servers
- 📝 **Email Reporting Documentation** - Comprehensive guide in EMAIL_REPORTING.md

### Technical
- Added `nodemailer` for email sending
- Added `chartjs-node-canvas` for chart generation in emails
- Added `canvas` dependency for server-side chart rendering
- New `email_settings` database table
- Email service with daily scheduler
- Email settings API endpoints

## [1.0.0] - 2026-01-12

### Added
- ✨ Initial release
- 📊 Real-time monitoring dashboard with WebSocket updates
- 🚀 Automated network speed testing with speedtest-net
- 📈 Historical data visualization with charts
- 💾 SQLite database for lightweight data storage
- 🎯 HTTP/HTTPS endpoint monitoring
- 📱 Responsive design for mobile and desktop
- 🔔 Real-time status updates without page refresh
- ⚙️ Configurable check intervals and timeouts
- 🐧 Raspberry Pi 4 optimized setup scripts
- 📝 Comprehensive documentation
- 🔧 Systemd service configuration
- 🔒 Security best practices
- 📦 Database backup utilities
- 🧹 Data cleanup scripts

### Features
- Monitor multiple websites/services with uptime tracking
- Automatic speed tests with download/upload/ping metrics
- Beautiful dark-themed dashboard UI
- RESTful API for all operations
- WebSocket for real-time updates
- SQLite database with automatic schema creation
- Cron-based scheduling for automated tests
- Uptime percentage calculation (24-hour rolling)
- Response time tracking
- Server information display
- ISP detection
- Historical data charts
- On-demand speed tests
- On-demand monitor checks

### Documentation
- README.md with complete feature list
- RASPBERRY_PI_SETUP.md with detailed setup instructions
- QUICK_START.md for fast deployment
- API documentation
- Configuration examples
- Troubleshooting guide
- Security recommendations

### Scripts
- Automatic Raspberry Pi setup script
- Database backup script
- Old data cleanup script
- Systemd service template

### Technical Details
- Node.js backend with Express
- React frontend with modern UI
- WebSocket for real-time communication
- SQLite for data persistence
- Recharts for data visualization
- Lucide React for icons
- Axios for HTTP requests
- node-cron for scheduling
- speedtest-net for network testing

### Optimizations
- Lightweight for Raspberry Pi 4
- Efficient database queries
- Optimized bundle size
- Smart caching
- Minimal resource usage
- Production-ready build configuration

## Future Enhancements (Planned)

### Version 1.2.0
- [ ] Webhook notifications
- [ ] Multiple notification channels
- [ ] Advanced alerting rules
- [ ] Custom dashboard themes
- [ ] Multi-user support with authentication

### Version 1.2.0
- [ ] TCP and Ping monitoring types
- [ ] SSL certificate expiry monitoring
- [ ] Keyword monitoring in responses
- [ ] Status pages for public viewing
- [ ] Mobile app

### Version 2.0.0
- [ ] Docker support
- [ ] Kubernetes deployment
- [ ] Multi-node distributed monitoring
- [ ] Advanced analytics
- [ ] Machine learning for anomaly detection

---

For more information, see [README.md](./README.md)

