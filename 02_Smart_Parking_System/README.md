# Smart Parking Module

This module manages the digital parking ecosystem for Solapur. It addresses the issue of "cruising for parking"—one of the leading causes of city-center congestion—by providing real-time availability and reservation capabilities.

##  Key Features

*   **Zone-Based Tracking:** Manages multiple parking lots across Solapur (e.g., SMC Main Market, Railway Station).
*   **Real-time Occupancy:** Tracks available vs. occupied slots using a simulated IOT sensor feed.
*   **Digital Reservations:** API support for booking slots in advance.
*   **Dynamic Pricing:** Supports hourly rates based on lot location and demand.

##  Tech Stack
*   **Flask API:** Integrated into the main traffic server for unified data access.
*   **React Integration:** Live visualization of parking grids in the command center.

##  Parking Zones
1.  **SMC Main Market:** 50 Total Slots (Higher rate, high demand).
2.  **Railway Station North:** 100 Total Slots (Mixed vehicle support).

##  API Reference (Integrated in Port 5001)

### Get Parking Status
Included in the main `GET /traffic-data` response under the `parking` key.

### Reserve a Slot
`POST /reserve-parking`
```json
{
    "lot_id": "SMC_Main_Market",
    "slot_id": 12
}
```
