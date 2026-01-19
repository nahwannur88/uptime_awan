#!/usr/bin/env node

/**
 * Node.js script to fix missing database tables
 * Run this if you get "no such table" errors
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data/uptime.db');

if (!fs.existsSync(DB_PATH)) {
  console.log('Database file does not exist. It will be created on next server start.');
  process.exit(0);
}

console.log('Connecting to database:', DB_PATH);

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
  
  console.log('Connected to database. Adding missing tables...\n');
  
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
        console.error('❌ Error creating email_settings:', err);
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
        console.error('❌ Error creating email_send_status:', err);
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
        console.error('❌ Error creating speedtest_settings:', err);
      } else {
        console.log('✅ speedtest_settings table created/verified');
      }
      
      // List all tables
      db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", (err, rows) => {
        if (err) {
          console.error('Error listing tables:', err);
        } else {
          console.log('\n📊 All tables in database:');
          rows.forEach(row => {
            console.log(`   - ${row.name}`);
          });
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
});
