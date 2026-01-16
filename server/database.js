const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || './data/uptime.db';
const DB_DIR = path.dirname(DB_PATH);

let db = null;

async function initDatabase() {
  // Create data directory if it doesn't exist
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
      } else {
        console.log('Connected to SQLite database');
        createTables()
          .then(() => resolve(db))
          .catch(reject);
      }
    });
  });
}

function createTables() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Speed test results table
      db.run(`
        CREATE TABLE IF NOT EXISTS speedtest_results (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          download_speed REAL,
          upload_speed REAL,
          ping REAL,
          jitter REAL,
          server_name TEXT,
          server_location TEXT,
          isp TEXT
        )
      `);

      // Monitors table
      db.run(`
        CREATE TABLE IF NOT EXISTS monitors (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          url TEXT NOT NULL,
          type TEXT DEFAULT 'http',
          interval INTEGER DEFAULT 60000,
          timeout INTEGER DEFAULT 5000,
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Monitor checks table
      db.run(`
        CREATE TABLE IF NOT EXISTS monitor_checks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          monitor_id INTEGER,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          status TEXT,
          response_time INTEGER,
          status_code INTEGER,
          error_message TEXT,
          FOREIGN KEY (monitor_id) REFERENCES monitors(id) ON DELETE CASCADE
        )
      `);

      // Monitor status summary table
      db.run(`
        CREATE TABLE IF NOT EXISTS monitor_status (
          monitor_id INTEGER PRIMARY KEY,
          current_status TEXT,
          last_check DATETIME,
          uptime_percentage REAL,
          total_checks INTEGER DEFAULT 0,
          successful_checks INTEGER DEFAULT 0,
          FOREIGN KEY (monitor_id) REFERENCES monitors(id) ON DELETE CASCADE
        )
      `);

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
          console.error('Error creating email_settings table:', err);
          reject(err);
          return;
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
          console.error('Error creating email_send_status table:', err);
          reject(err);
          return;
        }
        
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
            console.error('Error creating speedtest_settings table:', err);
            reject(err);
            return;
          }
          console.log('Database tables initialized');
          resolve();
        });
      });
    });
  });
}

function getDatabase() {
  return db;
}

module.exports = {
  initDatabase,
  getDatabase
};

