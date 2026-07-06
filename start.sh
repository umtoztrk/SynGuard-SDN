#!/bin/bash

echo "=================================================="
echo "🚀 SYNGUARD SDN-IDS LAUNCH SEQUENCE"
echo "=================================================="

# 0. Cleanup
echo "[*] Cleaning up Mininet artifacts..."
sudo mn -c > /dev/null 2>&1

# 1. SDN Controller
echo "[+] 1. Starting SDN Controller..."
gnome-terminal --title="SDN Controller" -- bash -c "osken-manager sdn_controller.py; exec bash"

sleep 3

# 2. Mininet Topology
echo "[+] 2. Building Mininet Topology..."
gnome-terminal --title="Mininet Topology" -- bash -c "sudo mn --topo tree,depth=3,fanout=2 --mac --controller remote --switch ovs,protocols=OpenFlow13; exec bash"

# 3. AI API Server
#sleep 3
#echo "[+] 3. Starting AI API Server..."
#gnome-terminal --title="XGBoost API Server" -- bash -c "python3 api_server_xgboost.py; exec bash"

echo "=================================================="
echo "[+] All systems successfully launched! 😎🔥"
echo "=================================================="
