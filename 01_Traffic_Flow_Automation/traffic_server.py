import time
import random
import threading
import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# --- SMART CITY DATABASE ---
junctions = {
    "Shivaji Chowk": {"density": 0, "signal": "RED", "timer": 0, "ambulance": False},
    "Saat Rasta":    {"density": 0, "signal": "RED", "timer": 0, "ambulance": False},
    "Mechanic Chowk":{"density": 0, "signal": "RED", "timer": 0, "ambulance": False},
    "Market Yard":   {"density": 0, "signal": "RED", "timer": 0, "ambulance": False}
}

# Global City Status
city_status = {
    "event_mode": "Normal Flow",  # Options: Normal, VIP Movement, Religious Procession
    "simulated_hour": 8           # Start simulation at 8 AM
}

# --- 1. INTELLIGENT TRAFFIC LOGIC (Solves "Static Timings" & "Peak Hours") ---
def update_traffic_simulation():
    while True:
        # Simulate time passing (1 hour every 10 seconds of real time)
        city_status["simulated_hour"] += 1
        if city_status["simulated_hour"] > 23:
            city_status["simulated_hour"] = 0
            
        current_hour = city_status["simulated_hour"]
        print(f"🕒 Simulating Time: {current_hour}:00 | Event: {city_status['event_mode']}")

        for name, data in junctions.items():
            # BASE DENSITY depends on Time of Day (Predictive Planning)
            if 8 <= current_hour <= 11: # Morning Peak
                base_traffic = random.randint(70, 90)
            elif 17 <= current_hour <= 20: # Evening Peak
                base_traffic = random.randint(80, 100)
            elif current_hour <= 5: # Late Night
                base_traffic = random.randint(5, 20)
            else:
                base_traffic = random.randint(30, 60)

            # EVENT OVERRIDE
            if city_status["event_mode"] == "Religious Procession" and name == "Market Yard":
                base_traffic = 100 # Jammed completely
            
            data["density"] = base_traffic

            # AMBULANCE OVERRIDE
            if data["ambulance"]:
                data["signal"] = "GREEN (EMERGENCY)"
                data["timer"] = 120
                continue

            # ADAPTIVE SIGNAL ALGORITHM
            if data["density"] > 80:
                data["signal"] = "GREEN"
                data["timer"] = 60
            elif data["density"] > 40:
                data["signal"] = "GREEN"
                data["timer"] = 30
            else:
                data["signal"] = "RED"
                data["timer"] = 15

        time.sleep(5) # Update every 5 seconds

# Start the brain in background
simulation_thread = threading.Thread(target=update_traffic_simulation)
simulation_thread.daemon = True
simulation_thread.start()

# --- API ENDPOINTS ---

@app.route('/traffic-data', methods=['GET'])
def get_traffic_data():
    return jsonify({
        "junctions": junctions,
        "city_meta": city_status
    })

# --- 2. ROUTE OPTIMIZATION API (Solves "Lack of route optimization") ---
@app.route('/optimize-route', methods=['POST'])
def optimize_route():
    data = request.json
    start = data.get("start")
    end = data.get("end")
    
    # Simple Mock Graph Logic
    # If Shivaji Chowk is jammed, suggest Ring Road.
    path = []
    if junctions["Shivaji Chowk"]["density"] > 80:
        path = [start, "Ring Road (Bypass)", "Hotgi Road", end]
        note = "⚠️ Avoided Shivaji Chowk due to congestion."
    else:
        path = [start, "Shivaji Chowk", "Main Street", end]
        note = "✅ taking shortest standard route."

    return jsonify({
        "optimized_route": path,
        "estimated_time": "15 mins" if len(path) < 4 else "25 mins",
        "reason": note
    })

# --- 3. EVENT PLANNING API (Solves "Planning for events") ---
@app.route('/set-event', methods=['POST'])
def set_event():
    data = request.json
    new_event = data.get("event") # e.g., "Religious Procession"
    city_status["event_mode"] = new_event
    return jsonify({"message": f"City Mode updated to {new_event}"})

@app.route('/emergency', methods=['POST'])
def trigger_emergency():
    data = request.json
    junction_name = data.get("junction")
    if junction_name in junctions:
        junctions[junction_name]["ambulance"] = True
        # Reset after 10s
        threading.Timer(10.0, lambda: reset_ambulance(junction_name)).start()
        return jsonify({"status": "Success"})
    return jsonify({"error": "Junction not found"}), 404

def reset_ambulance(name):
    junctions[name]["ambulance"] = False

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
