const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'synguard.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// Initialize database
db.serialize(() => {
    // Users Table — with role column
    db.run(`CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user'
    )`);

    // Add role column if it doesn't exist (migration for existing DB)
    db.run(`ALTER TABLE Users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'`, (err) => {
        // Ignore error if column already exists
        if (!err) {
            console.log('Added role column to Users table.');
        }
    });

    // Incidents Table
    db.run(`CREATE TABLE IF NOT EXISTS Incidents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        source_ip TEXT NOT NULL,
        attack_type TEXT NOT NULL,
        severity TEXT NOT NULL
    )`);

    // TrafficLogs Table
    db.run(`CREATE TABLE IF NOT EXISTS TrafficLogs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        packet_flow INTEGER NOT NULL,
        active_flows INTEGER NOT NULL
    )`);

    // Insert mock admin user if not exists (password_hash is just plain 'admin' for demo)
    db.run(`INSERT OR IGNORE INTO Users (username, password_hash, role) VALUES ('admin', 'admin', 'admin')`);

    // Make sure existing admin user has admin role
    db.run(`UPDATE Users SET role = 'admin' WHERE username = 'admin'`);
});

module.exports = db;
