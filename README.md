# 🛡️ SYNGUARD
**Intelligent Software-Defined Networking (SDN) Intrusion Detection System**

![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![SQLite](https://img.shields.io/badge/sqlite-%2307405e.svg?style=for-the-badge&logo=sqlite&logoColor=white)

## 📖 About The Project
SYNGUARD is an advanced, AI-powered Intrusion Detection System (IDS) tailored for Software-Defined Networks (SDN). By combining the flexibility of Mininet and the analytical power of XGBoost machine learning algorithms, SYNGUARD detects and mitigates L4 DDoS attacks in real-time. 

The entire backend, AI engine, and real-time dashboard are fully containerized using Docker, ensuring a seamless, platform-agnostic deployment with zero configuration headaches.

## 📸 Screenshots

### 🔐 Login Screen
<img width="1846" height="792" alt="admin login" src="https://github.com/user-attachments/assets/4f98d631-571e-4e3a-ab58-9c3e9b0d8a73" />
<img width="1848" height="785" alt="user login" src="https://github.com/user-attachments/assets/346c82ca-49ef-4474-86e4-6b5b1318a2e3" />

### 🚨 Live Traffic & Incident Logs
<img width="1850" height="883" alt="LiveTraffic" src="https://github.com/user-attachments/assets/489ccd03-99e7-4e31-ba9c-6696ee113b7d" />
<img width="1845" height="793" alt="Incident Logs" src="https://github.com/user-attachments/assets/465086bb-945a-4f59-b6c1-be430a2c189a" />

### 🕸️ SDN Topology Map
<img width="1849" height="878" alt="Topology Map" src="https://github.com/user-attachments/assets/1fcbcf0e-4840-4a00-9cbf-cbca87200507" />

### 💻 OS-Ken SDN Controller Terminal
<img width="1849" height="790" alt="osken terminal" src="https://github.com/user-attachments/assets/5cf05f31-49ac-412d-9d28-4976c5cb5c3e" />

### 👥 User Management
<img width="1849" height="786" alt="user management" src="https://github.com/user-attachments/assets/93882474-b0d3-41b0-b8cf-503f1ee28a47" />

## ✨ Key Features
* **Real-Time Traffic Analysis:** Monitors network flow and detects anomalies in milliseconds.
* **AI-Powered Detection:** Utilizes a highly trained XGBoost machine learning model for high-accuracy DDoS mitigation.
* **100% Dockerized Architecture:** Microservices-based deployment ensures isolated and secure environments.
* **Persistent Incident Logs:** Secure, volume-mapped SQLite database guarantees no data loss between container reboots.
* **Live Dashboard:** React/Vite-based modern UI with WebSocket integration for live attack visualization and management.

## 🏗️ System Architecture
1. **Network Layer:** Mininet generates realistic benign and malicious traffic.
2. **Control Layer:** Osken SDN Controller captures flow statistics and routes them to the AI engine.
3. **AI Layer:** The Python API analyzes packets instantly using the XGBoost model.
4. **Backend & Database:** Node.js securely logs the incidents into a persistent SQLite volume and broadcasts WebSocket alerts.
5. **Presentation Layer:** The React dashboard visualizes the data for the on-duty admin.

## 🚀 Quick Start

### Prerequisites
* Docker & Docker Compose
* Git
* Mininet (for network simulation on the host machine)

### Installation
**1. Clone the repository**
```bash
git clone https://github.com/yourusername/SYNGUARD.git
cd SYNGUARD
```
**2. Start the Dockerized Services (Backend, AI, UI, Database)**
```bash
docker-compose up -d --build
```
**3. Launch the SDN & Network Simulation**
Open a new terminal on your host machine and run the initialization script. This will clean up previous artifacts and automatically spawn separate terminal windows for the SDN Controller and Mininet Topology:
```bash
./start.sh
```
**4. Generate and Trigger Network Traffic**
Once the Mininet terminal is ready, generate the traffic scenario file and execute it to start simulating both benign and attack (DDoS) traffic simultaneously:
```bash
./generate_traffic.sh
source scenario.cli
```
**5. Access the Live Dashboard**
Open your browser and navigate to the monitoring UI to watch the AI detect and mitigate the attacks in real-time:
http://localhost:5173

## 📂 Folder Structure
```text
SYNGUARD/
├── api_server_xgboost.py       # AI Engine (XGBoost prediction API)
├── sdn_controller.py           # Osken SDN Manager/Controller script
├── start.sh                    # Automated Launch sequence (SDN & Mininet)
├── generate_traffic.sh         # Mininet Traffic Generator setup
├── attack_traffic.sh           # DDoS attack simulation script
├── benign_traffic.sh           # Normal network behavior simulation script
├── scenario.cli                # Mininet CLI automated commands
├── docker-compose.yml          # Container orchestration configuration
├── Dockerfile                  # Root Docker configuration
├── requirements.txt            # Python dependencies for AI and SDN
├── .gitignore                  # Git ignore rules (protects DB & cache)
└── xgboost_model.json          # Compiled XGBoost model weights
└── synguard-dashboard/         # Full Stack Application
    ├── backend/                # Node.js Server & SQLite DB Logic
    │   ├── server.js           # Main API and WebSocket server
    │   ├── db.js               # Database configuration
    │   └── Dockerfile          # Backend container setup
    └── frontend/               # React/Vite User Interface
        ├── src/                # UI source code and components
        └── Dockerfile          # Frontend container setup
```

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.
