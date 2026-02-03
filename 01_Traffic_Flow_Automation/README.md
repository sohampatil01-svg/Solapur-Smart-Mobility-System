# Traffic Flow Automation Module

This module is part of the **Solapur Smart Mobility System**. It provides a backend service that simulates real-time traffic density at key junctions in Solapur and adjusts traffic signals adaptively. It also supports an emergency override mode for ambulances.

## Features

*   **Real-time Simulation:** Simulates traffic density (0-100%) updates every 5 seconds.
*   **Adaptive Signal Control:**
    *   High Density (>80%): Green Light (60s)
    *   Medium Density (>40%): Green Light (30s)
    *   Low Density (<=40%): Red Light (15s)
*   **Emergency Mode:** API to immediately force a Green signal (120s) for emergency vehicles.
*   **REST API:** JSON endpoints for frontend integration.

## Setup Instructions

### Prerequisites
*   Python 3.x installed.

### Installation

1.  Navigate to the module directory:
    ```bash
    cd "01_Traffic_Flow_Automation"
    ```

2.  Install the required dependencies:
    ```bash
    pip install -r requirements.txt
    ```

## Running the Server

Start the traffic server using the following command:

```bash
python traffic_server.py
```

The server will start on **port 5001**.
*   **Host:** `0.0.0.0` (Accessible on local network)
*   **Port:** `5001`

## API Documentation

### 1. Get Traffic Data
Retrieves the current status (density, signal, timer) for all junctions.

*   **Endpoint:** `GET /traffic-data`
*   **Response Example:**
    ```json
    {
        "Shivaji Chowk": {
            "density": 85,
            "signal": "GREEN",
            "timer": 60,
            "emergency_until": 0.0
        },
        "Saat Rasta": {
            "density": 20,
            "signal": "RED",
            "timer": 15,
            "emergency_until": 0.0
        },
        ...
    }
    ```

### 2. Trigger Emergency
Activates emergency mode for a specific junction, forcing the signal to GREEN for 120 seconds.

*   **Endpoint:** `POST /emergency`
*   **Headers:** `Content-Type: application/json`
*   **Body:**
    ```json
    {
        "junction": "Shivaji Chowk"
    }
    ```
*   **Response:**
    ```json
    {
        "status": "success",
        "message": "Emergency mode activated for Shivaji Chowk. Signal GREEN for 120s."
    }
    ```

## Junctions Covered
*   Shivaji Chowk
*   Saat Rasta
*   Mechanic Chowk
*   Market Yard