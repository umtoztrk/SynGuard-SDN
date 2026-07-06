// Simulates live traffic, attacks (XGBoost inference output), and OS-Ken events
function startSimulation(io, db) {
    let packetFlow = 1500;
    let activeFlows = 50;
    let isAttackActive = false;

    setInterval(() => {
        // Randomly adjust stats to look alive
        packetFlow = isAttackActive ? packetFlow + Math.floor(Math.random() * 5000 + 5000) : packetFlow + Math.floor(Math.random() * 200 - 100);
        activeFlows = isAttackActive ? activeFlows + Math.floor(Math.random() * 200 + 100) : activeFlows + Math.floor(Math.random() * 10 - 5);

        // Keep values in reasonable ranges
        if (packetFlow < 0) packetFlow = 100;
        if (activeFlows < 1) activeFlows = 10;

        const timestamp = new Date().toISOString();

        // Save to DB (only keep recent 100 for simplicity in this demo, let's just insert)
        db.run('INSERT INTO TrafficLogs (timestamp, packet_flow, active_flows) VALUES (?, ?, ?)', [timestamp, packetFlow, activeFlows]);

        // Emit live traffic
        io.emit('traffic-update', { timestamp, packetFlow, activeFlows });

        // Randomly simulate an attack every 30-60 seconds if not already attacking
        if (!isAttackActive && Math.random() < 0.05) { // 5% chance every second
            triggerAttack(io, db, timestamp);
        } else if (!isAttackActive) {
            // Normal event
            if (Math.random() < 0.2) {
                io.emit('terminal-event', `[Normal] Flow-Mod OK. Target: 10.0.0.${Math.floor(Math.random() * 5 + 1)}`);
            }
        }

    }, 1000);

    function triggerAttack(io, db, timestamp) {
        isAttackActive = true;
        const sourceIp = `10.0.0.${Math.floor(Math.random() * 255)}`;
        
        io.emit('xai-alert', {
            probability: 92,
            reason: 'High Failed Handshake Ratio (82%)',
            type: 'TCP SYN Flood',
            sourceIp: sourceIp
        });

        io.emit('terminal-event', `[WARN] High anomalous traffic detected from ${sourceIp}. Probability: 92%`);

        // Log incident to DB
        db.run('INSERT INTO Incidents (timestamp, source_ip, attack_type, severity) VALUES (?, ?, ?, ?)', [timestamp, sourceIp, 'TCP SYN Flood', 'Critical'], function(err) {
            if (!err) {
                // tell frontend a new incident was added
                io.emit('incident-logged', { id: this.lastID, timestamp, sourceIp, type: 'TCP SYN Flood', severity: 'Critical' });
            }
        });

        // attack lasts 10 seconds
        setTimeout(() => {
            isAttackActive = false;
            packetFlow = 1500; // reset
            activeFlows = 50;
            io.emit('terminal-event', `[INFO] Traffic returning to normal levels.`);
            io.emit('xai-alert', null); // clear alert
        }, 10000);
    }
}

module.exports = { startSimulation };
