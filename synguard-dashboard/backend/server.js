const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3001; 
const JWT_SECRET = "synguard-super-secret-key-123"; // Password for security token

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// ==========================================
// 1. DATABASE (SQLite) SETUP AND TABLES
// ==========================================
const db = new sqlite3.Database('./db_data/synguard.db', (err) => {
    if (err) console.error("[-] Database Error:", err.message);
    else console.log("[+] SQLite Database Connection Successful (synguard.db)");
});

db.serialize(() => {
    // VERY CRITICAL: Forcefully enabling Relational Database (Foreign Key) feature!
    db.run("PRAGMA foreign_keys = ON;");

    // Users (Admins) Table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Incidents Table - 🔗 UPDATED WITH FOREIGN KEY
    db.run(`CREATE TABLE IF NOT EXISTS incidents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        source_ip TEXT,
        attack_type TEXT,
        severity TEXT,
        detection_time TEXT,
        probability REAL,
        user_id INTEGER,                  -- New: Which admin handled this?
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )`);

    // Create Default Admin Account (If no users exist)
    db.get(`SELECT count(*) as count FROM users`, async (err, row) => {
        if (row && row.count === 0) {
            const hashedPw = await bcrypt.hash("admin123", 10);
            db.run(`INSERT INTO users (username, password, role) VALUES (?, ?, ?)`, 
                ["admin", hashedPw, "admin"]);
            console.log("[!] Default Admin added to the system (Username: admin, Password: admin123)");
        }
    });
});

// Variable to hold the ID of the active admin currently viewing the screen
let activeAdminId = null; 

io.on('connection', (socket) => {
    console.log(`🟢 Frontend Connected! Socket ID: ${socket.id}`);

    // When the "I logged in, I'm looking at the screen" signal comes from the UI:
    socket.on('admin-active', (userId) => {
        activeAdminId = userId;
        console.log(`[+] On-duty Admin is online. Active User ID: ${activeAdminId}`);
    });

    socket.on('disconnect', () => {
        console.log(`🔴 A user disconnected from the UI.`);
        // Note: We don't immediately set activeAdminId to null here to prevent data loss on page refreshes.
    });
});

// ==========================================
// 2. SECURE LOGIN API
// ==========================================
const loginHandler = (req, res) => {
    const { username, password } = req.body;

    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
        if (err) return res.status(500).json({ success: false, message: "Database error!" });
        if (!user) return res.status(401).json({ success: false, message: "User not found!" });

        // Cryptographically Compare Password
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ success: false, message: "Incorrect password!" });

        // Login Successful -> Generate JWT Token
        const token = jwt.sign({ id: user.id, role: user.role, username: user.username }, JWT_SECRET, { expiresIn: '8h' });
        
        res.status(200).json({ 
            success: true, 
            message: "Login Successful", 
            token: token,
            role: user.role,
            username: user.username,
            user_id: user.id
        });
    });
};

// CONNECTING ALL UI LOGIN TABS (User/Admin) TO THE SAME DATABASE!
app.post('/api/login', loginHandler);
app.post('/api/admin/login', loginHandler);
app.post('/api/auth/login', loginHandler);

// ==========================================
// 3. PERSISTENT INCIDENT LOGS API
// ==========================================
app.get('/api/incidents', (req, res) => {
    // Newest attacks on top (ORDER BY timestamp DESC)
    db.all(`SELECT * FROM incidents ORDER BY timestamp DESC LIMIT 100`, [], (err, rows) => {
        if (err) res.status(500).json({ error: err.message });
        else res.json(rows);
    });
});

// ==========================================
// 4. DATA INCOMING FROM PYTHON AI ENGINE
// ==========================================
const WHITE_LIST = ["10.0.0.2"]; 

app.post('/api/traffic-log', (req, res) => {
    const { src_ip, status, probability, detection_time } = req.body; 
    const logTime = new Date().toLocaleTimeString('en-US', { hour12: false });
    
    let dangerLevel = probability * 100;

    if (WHITE_LIST.includes(src_ip)) {
        dangerLevel = 2; 
    }

    const isAttack = status.includes("DROP") || dangerLevel > 85;

    // A. GRAPHS AND RIGHT-SIDE PERCENTAGE GAUGE
    const realisticTraffic = isAttack ? Math.floor(Math.random() * 1500 + 500) : Math.floor(Math.random() * 50 + 10);
    
    io.emit('traffic-update', {
        src_ip: src_ip,
        status: isAttack ? "DROP" : "ALLOW", 
        probability: dangerLevel,  
        confidence: dangerLevel,   
        packetFlow: realisticTraffic,
        timestamp: Date.now()
    });

    // B. ON-SCREEN TERMINAL
    io.emit('terminal-event', `[${logTime}] AI DETECTION | Target IP: ${src_ip} | Result: ${isAttack ? 'DDoS (DROP)' : 'Normal (ALLOW)'} | Probability: ${dangerLevel.toFixed(1)}%`);

    // C. ATTACK STATUS -> PERSISTENT RECORD IN SQL DATABASE
    if (isAttack) {
        io.emit('xai-alert', {
            probability: dangerLevel.toFixed(0),
            reason: `High-frequency Anomaly / DDoS detected. IP: ${src_ip}`,
            alertTime: logTime,
            attacker_ip: src_ip,
            threat_level: "CRITICAL",
            detection_time: detection_time
        });

        // 🚨 Writing directly to the SQL Database instead of RAM!
        const stmt = db.prepare(`INSERT INTO incidents (timestamp, source_ip, attack_type, severity, detection_time, probability, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)`);
        stmt.run(new Date().toISOString(), src_ip, "DDoS L4 Flood", "CRITICAL", detection_time, dangerLevel.toFixed(2), activeAdminId);
        stmt.finalize();

    } else {
        io.emit('xai-alert', null);
    }

    res.status(200).send({ message: "Data processed and saved to database!" });
});

// ==========================================
// 5. USER MANAGEMENT (Admins Only)
// ==========================================
app.get('/api/users', (req, res) => {
    db.all(`SELECT id, username, role, created_at FROM users`, [], (err, rows) => {
        if (err) res.status(500).json({ error: err.message });
        else res.json(rows);
    });
});

app.post('/api/users', async (req, res) => {
    const { username, password, role } = req.body;
    try {
        const hashedPw = await bcrypt.hash(password, 10);
        db.run(`INSERT INTO users (username, password, role) VALUES (?, ?, ?)`, [username, hashedPw, role], function(err) {
            if (err) return res.status(400).json({ error: "Username already exists or an error occurred." });
            res.json({ id: this.lastID, username, role });
        });
    } catch (error) {
        res.status(500).json({ error: "Encryption error" });
    }
});

// 🛡️ SECURE DELETE: The last admin in the system cannot be deleted!
app.delete('/api/users/:id', (req, res) => {
    const userId = req.params.id;

    // First check the role of the user to be deleted
    db.get(`SELECT role FROM users WHERE id = ?`, [userId], (err, user) => {
        if (err || !user) return res.status(404).json({ error: "User not found!" });

        if (user.role === 'admin') {
            // If trying to delete an admin, count how many admins are left in the system
            db.get(`SELECT count(*) as adminCount FROM users WHERE role = 'admin'`, (err, row) => {
                if (row.adminCount <= 1) {
                    return res.status(400).json({ error: "You cannot delete the LAST admin in the system! You cannot lock out the system." });
                }
                // If there are other admins, proceed with deletion
                deleteUser(userId, res);
            });
        } else {
            // If it's a normal user, delete directly without mercy
            deleteUser(userId, res);
        }
    });
});

function deleteUser(id, res) {
    db.run(`DELETE FROM users WHERE id = ?`, id, function(err) {
        if (err) res.status(500).json({ error: err.message });
        else res.json({ deleted: this.changes, message: "User successfully deleted." });
    });
}

// 🔐 NEW FEATURE: PASSWORD CHANGE API
app.post('/api/users/change-password', async (req, res) => {
    const { username, oldPassword, newPassword } = req.body;

    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
        if (err) return res.status(500).json({ success: false, message: "Database error!" });
        if (!user) return res.status(404).json({ success: false, message: "User not found!" });

        // Is the old password correct?
        const match = await bcrypt.compare(oldPassword, user.password);
        if (!match) return res.status(400).json({ success: false, message: "You entered your current password incorrectly!" });

        // Encrypt and save the new password
        try {
            const hashedNewPw = await bcrypt.hash(newPassword, 10);
            db.run(`UPDATE users SET password = ? WHERE username = ?`, [hashedNewPw, username], function(err) {
                if (err) return res.status(500).json({ success: false, message: "Password could not be updated!" });
                res.status(200).json({ success: true, message: "Your password has been successfully changed!" });
            });
        } catch (error) {
            res.status(500).json({ success: false, message: "Encryption error" });
        }
    });
});

server.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 SYNGUARD Backend Started on Port ${PORT}`);
    console.log(`🔐 SQL Database and Encryption Active!`);
    console.log(`=========================================`);
});
