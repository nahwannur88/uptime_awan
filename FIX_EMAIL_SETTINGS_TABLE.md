# Fix "no such table: email_settings" Error

## Problem

You're getting this error when starting the server:
```
Error: SQLITE_ERROR: no such table: email_settings
```

This happens when the database was created before the `email_settings` table was added to the code.

## Solution

### Option 1: Delete and Recreate Database (Easiest - Loses Data)

⚠️ **Warning:** This will delete all your existing data (monitors, speed tests, etc.)

```bash
cd ~/uptime-awan

# Stop the service if running
sudo systemctl stop uptime-awan

# Backup old database (optional)
cp data/uptime.db data/uptime.db.backup

# Delete database
rm -f data/uptime.db

# Start service - it will recreate the database with all tables
sudo systemctl start uptime-awan

# Check status
sudo systemctl status uptime-awan
```

### Option 2: Manually Add Missing Table (Keeps Data)

This keeps your existing data:

```bash
cd ~/uptime-awan

# Stop the service if running
sudo systemctl stop uptime-awan

# Run the fix script
chmod +x scripts/fix-database-tables.sh
./scripts/fix-database-tables.sh

# Or manually add the table using sqlite3
sqlite3 data/uptime.db <<EOF
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

CREATE TABLE IF NOT EXISTS speedtest_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enabled INTEGER DEFAULT 1,
  interval INTEGER DEFAULT 3600000,
  auto_run INTEGER DEFAULT 1,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
EOF

# Start the service
sudo systemctl start uptime-awan
```

### Option 3: Use Node.js Script (Recommended)

Create and run this script:

```bash
cd ~/uptime-awan

cat > fix-tables.js <<'EOF'
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || './data/uptime.db';

if (!fs.existsSync(DB_PATH)) {
  console.log('Database file does not exist. It will be created on next start.');
  process.exit(0);
}

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
  
  console.log('Connected to database. Adding missing tables...');
  
  db.serialize(() => {
    // Email settings table
    db.run(`
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
      )
    `, (err) => {
      if (err) {
        console.error('Error creating email_settings:', err);
      } else {
        console.log('✅ email_settings table created/verified');
      }
    });
    
    // Email send status table
    db.run(`
      CREATE TABLE IF NOT EXISTS email_send_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_date DATE,
        status TEXT,
        attempts INTEGER DEFAULT 0,
        last_attempt DATETIME,
        error_message TEXT,
        sent_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating email_send_status:', err);
      } else {
        console.log('✅ email_send_status table created/verified');
      }
    });
    
    // Speedtest settings table
    db.run(`
      CREATE TABLE IF NOT EXISTS speedtest_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        enabled INTEGER DEFAULT 1,
        interval INTEGER DEFAULT 3600000,
        auto_run INTEGER DEFAULT 1,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating speedtest_settings:', err);
      } else {
        console.log('✅ speedtest_settings table created/verified');
      }
      
      console.log('\n✅ All tables verified!');
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
          process.exit(1);
        }
        console.log('Database connection closed.');
        process.exit(0);
      });
    });
  });
});
EOF

# Run the script
node fix-tables.js

# Clean up
rm fix-tables.js

# Start the service
sudo systemctl start uptime-awan
```

## Verify the Fix

After fixing, verify the tables exist:

```bash
# Using sqlite3 (if installed)
sqlite3 data/uptime.db ".tables"

# Should show:
# email_settings
# email_send_status
# monitor_checks
# monitor_status
# monitors
# speedtest_results
# speedtest_settings
```

Or start the server and check logs:

```bash
sudo systemctl start uptime-awan
sudo journalctl -u uptime-awan -f
```

Should see:
- ✅ "Connected to SQLite database"
- ✅ "Database tables initialized"
- ✅ No errors about missing tables

## Why This Happened

The database was created before the `email_settings` table was added to the code. The `CREATE TABLE IF NOT EXISTS` statement only creates tables if they don't exist, but if the database initialization failed silently for that table, it might not have been created.

## Prevention

After pulling latest code, always ensure tables are created:

```bash
# Pull latest code
git pull origin main

# Stop service
sudo systemctl stop uptime-awan

# Run fix script
./scripts/fix-database-tables.sh

# Or delete and recreate (if you don't need old data)
rm -f data/uptime.db

# Start service
sudo systemctl start uptime-awan
```
