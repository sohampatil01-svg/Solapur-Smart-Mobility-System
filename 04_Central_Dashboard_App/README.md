# Central Command Dashboard

The "Control Room" for the Solapur Smart Mobility System. This is a high-performance web application built for city officials to monitor and manage city-wide traffic and parking in real-time.

## 🌟 Key Features

*   **Live CCTV Matrix:** A 2x2 grid displaying live feeds from AI-processed junction cameras.
*   **Real-time Analytics:** Interactive charts showing vehicle counts and density trends across the last 24 hours.
*   **Parking Control Center:** A visual map/grid of city parking lots with reservation indicators.
*   **Active Alert Feed:** A notification sidebar showing violations (Illegal parking, hawkers detected) as they happen.
*   **Emergency Controls:** Ability to manually trigger Green Corridors for VIP or Emergency vehicle movement.

## 🛠 Tech Stack
*   **Frontend Framework:** React 18 (Vite)
*   **Styling:** Tailwind CSS
*   **Icons:** Lucide-React
*   **Charts:** Recharts
*   **State Management:** React Hooks (useEffect/useState) with robust 3-second polling.

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Launch Development Server
```bash
npm run dev
```
*Note: Ensure the Backend (Port 5001) is running first for data to appear.*

## 📂 UI Components
*   `LiveGrid.jsx`: Handles the multi-stream video matrix.
*   `ParkingView.jsx`: Visualizes parking lot layouts and slot states.
*   `TrafficCard.jsx`: Individual junction monitoring with vehicle breakdown.
*   `AnalyticsPanel.jsx`: Historical data visualization.