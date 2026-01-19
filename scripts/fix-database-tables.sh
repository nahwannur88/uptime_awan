#!/bin/bash

# Script to fix missing database tables
# Run this if you get "no such table" errors

DB_PATH="${DB_PATH:-./data/uptime.db}"

if [ ! -f "$DB_PATH" ]; then
    echo "Database file not found at: $DB_PATH"
    echo "The database will be created automatically on next server start."
    exit 0
fi

echo "Fixing database tables..."
echo "Database: $DB_PATH"

sqlite3 "$DB_PATH" <<EOF
-- Create email_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS email_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enabled INTEGER DEFAULT 0,
  smtp_host TEXT,
  smtp_port INTEGER DEFAULT 587,
  smtp_secure INTEGER DEFAULT 0,
  smtp_user TEXT,
  smtp_password TEXT,
  from_email TEXT,
  from_name TEXT DEFAULT 'Uptime Awan',
  recipient_email TEXT,
  report_time TEXT DEFAULT '08:00',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create email_send_status table if it doesn't exist
CREATE TABLE IF NOT EXISTS email_send_status (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_date DATE,
  status TEXT,
  attempts INTEGER DEFAULT 0,
  last_attempt DATETIME,
  error_message TEXT,
  sent_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create speedtest_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS speedtest_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enabled INTEGER DEFAULT 1,
  interval INTEGER DEFAULT 3600000,
  auto_run INTEGER DEFAULT 1,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Verify tables exist
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;
EOF

echo ""
echo "Database tables fixed!"
echo "You can now restart the server."
