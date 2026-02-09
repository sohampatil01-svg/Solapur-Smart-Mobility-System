# Solapur Smart Mobility System
**An Integrated AI Platform for SMC (Solapur Municipal Corporation)**

![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![Python](https://img.shields.io/badge/Backend-Python/Flask-green)
![React](https://img.shields.io/badge/Frontend-React/Vite-61DAFB)
![YOLO](https://img.shields.io/badge/AI-YOLOv8-orange)

## 📌 Project Overview
Solapur is growing fast, and so is its traffic. Major hotspots like the Railway Station, Market Yard, and Saat Rasta often face heavy congestion due to static signal timings and unauthorized roadside activities. 

This project is a modern solution designed for **Solapur Municipal Corporation** to manage city mobility smarter. It uses real-time AI to adjust traffic signals based on actual vehicle density, detects illegal parking or hawkers blocking roads, and provides a central dashboard for city officials to monitor everything from a single command center.

---

## 🚀 Core Modules

### 1. AI Traffic Flow Automation
*   **Adaptive Signaling:** Uses YOLOv8 to estimate vehicle density in real-time. Instead of fixed timers, the green light duration changes based on whether a lane is "Heavy" or "Smooth".
*   **Green Corridor (Ambulance Priority):** Automatically detects emergency vehicles and forces a "Full Green" signal for that lane while keeping others red.
*   **Multi-Lane Support:** Processes 4+ lanes simultaneously using MJPEG live streaming.

### 2. Smart Parking Management
*   **Real-time Occupancy:** Tracks available slots in zones like SMC Main Market and Railway Station North.
*   **Digital Reservations:** API-driven slot booking to reduce "cruising" for parking, which is a major cause of congestion.

### 3. Surveillance & Obstruction Detection
*   **Illegal Parking:** Flags vehicles idling in "No Parking" zones for extended periods.
*   **Hawker/Crowd Detection:** Identifies unauthorized vending activities or clusters of people blocking pedestrian paths near markets.

### 4. Central Command Dashboard
*   **Live CCTV Grid:** A 2x2 grid view of live traffic feeds with AI bounding boxes.
*   **Data Analytics:** Historical charts (using Recharts) showing peak-hour trends stored in an SQLite database.
*   **System Config:** Global control to switch city modes (e.g., "Normal Flow" vs "Event Mode").

---

## 🛠 Tech Stack
*   **Frontend:** React (Vite), Tailwind CSS, Lucide Icons, Recharts, Axios.
*   **Backend:** Python, Flask, Flask-CORS.
*   **AI/Computer Vision:** OpenCV, Ultralytics YOLOv8 (Nano model for CPU optimization).
*   **Database:** SQLite3 (for traffic history and parking logs).

---

## 📦 Project Structure
```text
Solapur-Smart-Mobility-System/
├── 01_Traffic_Flow_Automation/   # Flask Server & AI Processing
│   ├── traffic_server.py         # Main entry point for AI/API
│   ├── yolov8n.pt                # AI Model Weights
│   └── videos/                   # Storage for uploaded traffic footage
├── 02_Smart_Parking_System/      # Parking Logic & API
├── 03_Surveillance_Detection/    # Standalone Violation Detection Scripts
└── 04_Central_Dashboard_App/     # React Frontend (Vite)
    ├── src/components/           # Reusable UI (LiveGrid, ParkingView, etc.)
    └── src/pages/                # Main Dashboard Layout
```

---

## 🔧 Installation & Setup

### 1. Prerequisites
*   Python 3.8+
*   Node.js (v16+)
*   npm or yarn

### 2. Backend Setup
```bash
cd 01_Traffic_Flow_Automation
pip install -r requirements.txt
python traffic_server.py
```
*The server will start at `http://localhost:5001`.*

### 3. Frontend Setup
```bash
cd 04_Central_Dashboard_App
npm install
npm run dev
```
*Open `http://localhost:5173` in your browser.*

---

## 🚦 Usage Guide
1.  **Upload Video:** In the dashboard, click the "Upload" icon on any lane to feed a traffic video file.
2.  **Monitor AI:** Watch the AI recognize Cars, Buses, Trucks, and Ambulances.
3.  **Manage Parking:** Switch to the "Parking Control" tab to see slot availability.
4.  **Emergency Test:** When an ambulance is spotted by the AI, notice the signal automatically switching to Green.

---

## 📈 Future Roadmap
*   [ ] Integration with actual IOT hardware (IR/Ultrasonic sensors).
*   [ ] SMS/Push notification alerts for traffic police on violations.
*   [ ] Multi-junction coordination (Green wave logic).
*   [ ] Mobile app for citizens to book parking on the go.

---

## 👥 Contributors
*   **Team ELITEE STREETS**
*   Developed for the SMC Urban Innovation Challenge.