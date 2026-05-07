# Surveillance & Violation Detection

This module focuses on automated enforcement and road safety. It uses AI to monitor non-moving traffic issues that frequently disrupt flow in Solapur.

##  Key Features

*   **Illegal Parking Detection:** Monitors "No Parking" zones and flags vehicles that remain stationary for longer than the allowed threshold.
*   **Hawker & Crowd Detection:** Detects unauthorized vending activities or large clusters of people blocking pedestrian sidewalks or main roads.
*   **Automated Alerts:** Sends real-time "Report Alert" triggers to the Central Dashboard when a violation is confirmed.
*   **Geo-Tagging:** Each alert is linked to a specific city location for quick enforcement response.

##  Tech Stack
*   **Python / OpenCV:** Core video analysis.
*   **YOLOv8:** Object detection for identifying vehicles vs. pedestrians.
*   **Requests:** Communication with the central alert API.

##  How it Works
1.  Define a **Zone ROI** (Region of Interest) in the camera feed.
2.  The script tracks objects within that ROI.
3.  If an object (e.g., a car in a No-Parking zone) persists for `N` frames, an alert is triggered.
4.  Alerts are POSTed to the `/report-alert` endpoint on the main server.
