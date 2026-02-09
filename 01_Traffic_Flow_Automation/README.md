# AI Traffic Flow Automation

This module serves as the brain of the **Solapur Smart Mobility System**. It processes live video feeds from city junctions using computer vision to dynamically manage traffic signals.

## 🌟 Key Features

*   **AI-Powered Density Estimation:** Uses **YOLOv8 Nano** to detect and count vehicles (cars, buses, trucks, bikes) in real-time.
*   **Adaptive Signal Control:** Signal timers are not fixed; they adjust automatically:
    *   **Heavy Traffic (>70% density):** Long Green window (60-90s).
    *   **Smooth Traffic (<30% density):** Short Green window or Red to prioritize other lanes.
*   **Emergency "Green Corridor":** Instantly detects ambulances (or via API trigger) to force a GREEN signal for the emergency lane while holding all others at RED.
*   **Live MJPEG Streaming:** Provides a low-latency video stream with AI bounding boxes for the central dashboard.
*   **Historical Logging:** Saves traffic snapshots every 5 seconds to an SQLite database for trend analysis.

## 🛠 Tech Stack
*   **Python / Flask** (Backend API & Web Server)
*   **OpenCV** (Video Processing)
*   **Ultralytics YOLOv8** (Object Detection)
*   **SQLite3** (Data Persistence)

## 🚀 Setup & Execution

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run the AI Server
```bash
python traffic_server.py
```
The server runs on `http://localhost:5001`.

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/traffic-data` | Returns real-time counts, signals, and parking data. |
| `POST` | `/upload-video` | Upload an `.mp4` file to simulate a live junction feed. |
| `GET` | `/video_feed/<lane_id>` | Returns an MJPEG stream with AI detection overlays. |
| `POST` | `/emergency` | Manually trigger a Green Corridor for a specific lane. |

## 📍 Junctions Monitored
1.  **Market Yard** (Lane 1)
2.  **Mechanic Chowk** (Lane 2)
3.  **Saat Rasta** (Lane 3)
4.  **Shivaji Chowk** (Lane 4)
