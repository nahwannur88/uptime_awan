# Email Reporting Feature

Daily email reports with hourly uptime graphs for all monitored services.

## Features

- 📧 **Daily Email Reports** - Automated daily reports sent at a configured time
- 📊 **Hourly Graphs** - Beautiful charts showing 24-hour uptime and response time trends
- ⚙️ **Flexible Configuration** - Support for any SMTP provider (Gmail, Outlook, custom)
- 🎨 **Rich HTML Reports** - Professional email templates with statistics and charts
- ✅ **Test Email Function** - Verify your email configuration before enabling reports

## Setup

### 1. Access Email Settings

1. Open the dashboard
2. Click the **Mail icon** (📧) in the top-right header
3. The Email Settings modal will open

### 2. Configure SMTP Settings

#### For Gmail:

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate an App Password**:
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Create a new app password for "Mail"
   - Copy the 16-character password

3. **Configure in Dashboard**:
   - **SMTP Host**: `smtp.gmail.com`
   - **SMTP Port**: `587`
   - **Use SSL/TLS**: Unchecked (port 587 uses STARTTLS)
   - **SMTP Username**: Your Gmail address
   - **SMTP Password**: The app password (not your regular password)
   - **From Email**: Your Gmail address
   - **Recipient Email**: Where you want to receive reports

#### For Outlook/Hotmail:

- **SMTP Host**: `smtp-mail.outlook.com`
- **SMTP Port**: `587`
- **Use SSL/TLS**: Unchecked
- **SMTP Username**: Your Outlook email
- **SMTP Password**: Your Outlook password

#### For Yahoo:

- **SMTP Host**: `smtp.mail.yahoo.com`
- **SMTP Port**: `587`
- **Use SSL/TLS**: Unchecked
- **SMTP Username**: Your Yahoo email
- **SMTP Password**: Your Yahoo password

#### For Custom SMTP:

Check with your email provider for:
- SMTP server address
- Port number (usually 587 for STARTTLS or 465 for SSL)
- Authentication requirements

### 3. Configure Report Settings

- **From Name**: Name shown in email (default: "Uptime Awan")
- **Recipient Email**: Email address to receive reports
- **Report Time**: Time of day to send reports (24-hour format, e.g., 08:00)

### 4. Test Configuration

1. Click **"Send Test Email"** button
2. Check your inbox for the test email
3. If received successfully, your configuration is correct!

### 5. Enable Reports

1. Check **"Enable daily email reports"**
2. Click **"Save Settings"**
3. Reports will start being sent daily at the configured time

## Report Contents

Each daily report includes:

### Overview Statistics
- Total active monitors
- Overall uptime percentage
- Total checks performed
- Average response time

### Per-Monitor Details
For each active monitor:
- Current status (UP/DOWN)
- 24-hour uptime percentage
- Average response time
- Total checks performed
- **Hourly graph** showing:
  - Uptime percentage per hour
  - Response time per hour

### Network Speed Test
- Latest speed test results
- Download/Upload speeds
- Ping and jitter
- Server information

## Report Schedule

- Reports are sent **once per day** at the configured time
- Default time is **08:00** (8:00 AM)
- Time is in 24-hour format (HH:MM)
- Reports are sent regardless of monitor status

## Manual Report Generation

You can also generate and send a report on demand:

```bash
# Via API
curl -X POST http://localhost:3001/api/email/report
```

Or use the dashboard API interface.

## Troubleshooting

### Test Email Not Received

1. **Check SMTP Settings**:
   - Verify host, port, and credentials
   - For Gmail, ensure you're using an App Password
   - Check if your email provider requires special settings

2. **Check Firewall**:
   - Ensure outbound SMTP ports (587, 465) are not blocked
   - Some networks block SMTP traffic

3. **Check Logs**:
   ```bash
   sudo journalctl -u uptime-awan -f
   ```
   Look for email-related errors

4. **Verify Email Provider**:
   - Some providers require enabling "Less secure app access"
   - Gmail requires App Passwords for 2FA accounts

### Reports Not Being Sent

1. **Check if Enabled**:
   - Verify "Enable daily email reports" is checked
   - Check email settings are saved

2. **Check Report Time**:
   - Verify the report time is set correctly
   - Reports are sent at the exact time specified

3. **Check Logs**:
   ```bash
   sudo journalctl -u uptime-awan | grep -i email
   ```

4. **Verify SMTP Connection**:
   - Use "Send Test Email" to verify configuration
   - Check for connection errors in logs

### Chart Generation Issues

If charts are not appearing in emails:

1. **Check Canvas Library**:
   - Ensure `canvas` package is installed
   - On Raspberry Pi, may need: `sudo apt install build-essential python3`

2. **Check Data Availability**:
   - Charts require at least some monitor check data
   - New monitors may not have enough data for charts

3. **Check Logs**:
   - Look for chart generation errors
   - Verify database has monitor check data

## Security Considerations

### Password Storage

- SMTP passwords are stored in the database
- Passwords are encrypted at rest (database file)
- Passwords are never sent in API responses (masked as `***`)
- Consider restricting database file permissions:
  ```bash
  chmod 600 data/uptime.db
  ```

### Email Security

- Use App Passwords instead of main passwords when possible
- Enable 2FA on email accounts
- Use secure SMTP connections (SSL/TLS)
- Regularly rotate SMTP passwords

## API Endpoints

### Get Email Settings
```
GET /api/email/settings
```

### Save Email Settings
```
POST /api/email/settings
Content-Type: application/json

{
  "enabled": true,
  "smtp_host": "smtp.gmail.com",
  "smtp_port": 587,
  "smtp_secure": false,
  "smtp_user": "your-email@gmail.com",
  "smtp_password": "your-password",
  "from_email": "your-email@gmail.com",
  "from_name": "Uptime Awan",
  "recipient_email": "recipient@example.com",
  "report_time": "08:00"
}
```

### Send Test Email
```
POST /api/email/test
```

### Generate Report (On Demand)
```
POST /api/email/report
```

## Example Report

```
Subject: Daily Uptime Report - 2026-01-12

📊 Daily Uptime Report
Monday, January 12, 2026

Statistics:
- Active Monitors: 5
- Overall Uptime: 99.87%
- Total Checks: 7,200
- Avg Response Time: 145ms

Monitor Details:
[Each monitor with hourly graph]

Network Speed Test:
- Download: 45.23 Mbps
- Upload: 12.45 Mbps
- Ping: 23ms
```

## Best Practices

1. **Use App Passwords**: For Gmail and other providers, use app-specific passwords
2. **Test First**: Always send a test email before enabling daily reports
3. **Monitor Email Quota**: Be aware of your email provider's sending limits
4. **Regular Review**: Check reports regularly to identify patterns
5. **Backup Settings**: Keep a backup of your email configuration

## Support

For issues or questions:
1. Check the logs: `sudo journalctl -u uptime-awan -f`
2. Verify SMTP settings with your email provider
3. Test email configuration using the test button
4. Review this documentation

---

**Note**: Email reports require active monitors and check data. New installations may need to wait 24 hours before meaningful reports can be generated.
