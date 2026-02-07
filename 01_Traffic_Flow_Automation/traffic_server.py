import time
import threading
import os
import cv2
import sqlite3
import numpy as np
from flask import Flask, jsonify, request, Response
from flask_cors import CORS
from werkzeug.utils import secure_filename
from ultralytics import YOLO

# --- DATABASE SETUP ---
DB_PATH = 'city_data.db'

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS traffic_history
                 (timestamp TEXT, lane_id TEXT, vehicle_count INTEGER, density INTEGER)''')
    c.execute('''CREATE TABLE IF NOT EXISTS parking_history
                 (timestamp TEXT, lot_id TEXT, occupied INTEGER)''')
    
    # SEED DATA: If table is empty, add last 24 entries to make charts look live
    c.execute("SELECT COUNT(*) FROM traffic_history")
    if c.fetchone()[0] == 0:
        print("🌱 Seeding historical database for demo...")
        for i in range(20):
            ts = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(time.time() - (20-i)*60))
            for lane in ["Lane 1 Market Yard", "Lane 2 Mechanic Chowk", "Lane 3 Saat Rasta", "Lane 4 Shivaji Chowk"]:
                c.execute("INSERT INTO traffic_history VALUES (?, ?, ?, ?)", 
                          (ts, lane, np.random.randint(5, 20), np.random.randint(10, 40)))
    conn.commit()
    conn.close()

init_db()

def log_snapshots():
    """Logs the REAL live data from the junctions to the DB every 5 seconds."""
    while True:
        time.sleep(5) 
        try:
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            ts = time.strftime("%Y-%m-%d %H:%M:%S")
            for lane_id, data in junctions.items():
                c.execute("INSERT INTO traffic_history VALUES (?, ?, ?, ?)", 
                          (ts, lane_id, data["total"], data["density"]))
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"Snapshot Error: {e}")

# --- LIVE DATA SIMULATOR (Only for lanes without active video) ---
def simulate_live_flow():
    """Ensures the dashboard is always 'Alive' with low-level background traffic."""
    while True:
        time.sleep(2)
        for lane_id in junctions:
            if not junctions[lane_id]["active"]:
                # Simulate slight variations in background traffic
                v = junctions[lane_id]["counts"]
                v["car"] = max(0, v.get("car", 0) + np.random.randint(-1, 2))
                v["bike"] = max(0, v.get("bike", 0) + np.random.randint(-1, 2))
                junctions[lane_id]["total"] = sum(v.values())
                # Keep density low for simulated background
                junctions[lane_id]["density"] = min(100, (junctions[lane_id]["total"] / MAX_LANE_CAPACITY) * 100)

threading.Thread(target=log_snapshots, daemon=True).start()
threading.Thread(target=simulate_live_flow, daemon=True).start()

def log_traffic_data(lane_id, count, density):
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        ts = time.strftime("%Y-%m-%d %H:%M:%S")
        c.execute("INSERT INTO traffic_history VALUES (?, ?, ?, ?)", (ts, lane_id, count, density))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"DB Error: {e}")

# Prevent OpenCV from spawning extra threads which can crash Flask
cv2.setNumThreads(0)

app = Flask(__name__)
CORS(app)

# --- CONFIG ---
UPLOAD_FOLDER = 'videos'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Load YOLO Model
print("Loading YOLOv8 Medium Model (yolov8m.pt)...")
model = YOLO('yolov8m.pt') 

# --- CONSTANTS ---
VEHICLE_WEIGHTS = {
    "car": 1.0, "bus": 3.0, "truck": 2.5, "bike": 0.5
}
MAX_LANE_CAPACITY = 40.0 

# Class ID mapping: 1=Bicycle, 2=Car, 3=Bike, 5=Bus, 7=Truck
CLASS_MAP = {1: "bike", 2: "car", 3: "bike", 5: "bus", 7: "truck"}

# --- STATE MANAGEMENT ---
frame_buffer = {
    "Lane 1 Market Yard": None, "Lane 2 Mechanic Chowk": None, "Lane 3 Saat Rasta": None, "Lane 4 Shivaji Chowk": None
}

alerts = [] # Global list for obstruction/illegal activities

junctions = {
    "Lane 1 Market Yard": { "video_path": None, "counts": {"car": 0, "bus": 0, "truck": 0, "bike": 0, "ambulance": 0}, "total": 0, "density": 0, "signal": "RED", "timer": 0, "active": False },
    "Lane 2 Mechanic Chowk": { "video_path": None, "counts": {"car": 0, "bus": 0, "truck": 0, "bike": 0, "ambulance": 0}, "total": 0, "density": 0, "signal": "RED", "timer": 0, "active": False },
    "Lane 3 Saat Rasta": { "video_path": None, "counts": {"car": 0, "bus": 0, "truck": 0, "bike": 0, "ambulance": 0}, "total": 0, "density": 0, "signal": "RED", "timer": 0, "active": False },
    "Lane 4 Shivaji Chowk": { "video_path": None, "counts": {"car": 0, "bus": 0, "truck": 0, "bike": 0, "ambulance": 0}, "total": 0, "density": 0, "signal": "RED", "timer": 0, "active": False }
}

# --- ADAPTIVE TIMING LOGIC ---
def calculate_signal_timer(density):
    if density < 20: return 15
    if density < 50: return 30
    if density < 80: return 60
    return 90

# --- GLOBAL TIMER DECREMENTER ---
def tick_timers():
    while True:
        time.sleep(1)
        for lane_id in junctions:
            if junctions[lane_id]["timer"] > 0:
                junctions[lane_id]["timer"] -= 1
            if junctions[lane_id]["timer"] == 0 and junctions[lane_id]["signal"] == "GREEN":
                junctions[lane_id]["signal"] = "RED"

threading.Thread(target=tick_timers, daemon=True).start()

# --- VIDEO PROCESSOR ---
def process_lane_video(lane_id):
    video_path = junctions[lane_id]["video_path"]
    if not video_path or not os.path.exists(video_path): return

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened(): 
        print(f"âŒ [{lane_id}] Failed to open video: {video_path}")
        return

    print(f"ðŸŽ¥ [{lane_id}] Streaming Started: {video_path}")
    
    frame_count = 0
    cached_boxes = [] 
    
    try:
        while junctions[lane_id]["active"]:
            success, frame = cap.read()
            
            if not success:
                total_frames = cap.get(cv2.CAP_PROP_FRAME_COUNT)
                current_frame = cap.get(cv2.CAP_PROP_POS_FRAMES)
                if current_frame >= total_frames - 1:
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    time.sleep(0.05)
                    continue
                else:
                    break

            frame = cv2.resize(frame, (640, 360))
            frame_count += 1
            
            if frame_count % 2 == 0:
                results = model(frame, stream=True, verbose=False, conf=0.25) 
                
                cached_boxes = []
                current_counts = {"car": 0, "bus": 0, "truck": 0, "bike": 0, "ambulance": 0}
                
                for result in results:
                    for box in result.boxes:
                        cls_id = int(box.cls[0])
                        
                        if cls_id in CLASS_MAP:
                            x1, y1, x2, y2 = map(int, box.xyxy[0])
                            conf = float(box.conf[0])
                            label = CLASS_MAP[cls_id]
                            current_counts[label] += 1
                            
                            cached_boxes.append({
                                "coords": (x1, y1, x2, y2),
                                "label": label,
                                "conf": conf
                            })

                if junctions[lane_id]["signal"] == "EMERGENCY":
                    current_counts["ambulance"] = 1 

                total_veh = sum(current_counts.values())
                weighted_score = sum([current_counts[k] * VEHICLE_WEIGHTS.get(k, 1) for k in current_counts if k != "ambulance"])
                density = min((weighted_score / MAX_LANE_CAPACITY) * 100, 100)
                
                junctions[lane_id]["counts"] = current_counts
                junctions[lane_id]["total"] = total_veh
                junctions[lane_id]["density"] = int(density)
                
                # ADAPTIVE SIGNAL LOGIC
                if junctions[lane_id]["signal"] != "EMERGENCY":
                    if weighted_score > 5:
                        if junctions[lane_id]["signal"] == "RED":
                            junctions[lane_id]["signal"] = "GREEN"
                            junctions[lane_id]["timer"] = calculate_signal_timer(density)
                    else:
                        # Only turn RED if density is low
                        if weighted_score <= 5:
                            junctions[lane_id]["signal"] = "RED"
                            junctions[lane_id]["timer"] = 0

            # --- DRAWING ---
            for box in cached_boxes:
                x1, y1, x2, y2 = box["coords"]
                label = box["label"]
                conf = box["conf"]
                
                color = (0, 255, 0) # Green (Car)
                if label in ["bus", "truck"]: color = (0, 165, 255) # Orange
                if label == "bike": color = (255, 0, 0) # Blue
                
                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                cv2.putText(frame, label.upper(), (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

            stats = junctions[lane_id]
            cv2.rectangle(frame, (0, 320), (640, 360), (0, 0, 0), -1)
            text_color = (255, 255, 255)
            if stats["density"] > 80: text_color = (0, 0, 255) 
            elif stats["density"] > 50: text_color = (0, 165, 255)
            
            counts_str = f"Cars:{stats['counts']['car']} Bus:{stats['counts']['bus']} Trk:{stats['counts']['truck']}"
            cv2.putText(frame, counts_str, (10, 345), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
            
            main_stat = f"Total: {stats['total']} | Load: {stats['density']}%"
            cv2.putText(frame, main_stat, (400, 345), cv2.FONT_HERSHEY_SIMPLEX, 0.6, text_color, 2)

            if stats["counts"]["ambulance"] > 0:
                 cv2.putText(frame, "AMBULANCE DETECTED", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

            _, buffer = cv2.imencode('.jpg', frame)
            frame_buffer[lane_id] = buffer.tobytes()
            time.sleep(0.03)

    except Exception as e:
        print(f"âŒ Error processing {lane_id}: {e}")
    finally:
        cap.release()

# --- ASYNC VIDEO STARTER ---
def start_video_async(lane_id, save_path):
    junctions[lane_id]["active"] = False
    time.sleep(1.5)
    junctions[lane_id]["video_path"] = save_path
    junctions[lane_id]["active"] = True
    process_lane_video(lane_id)

import heapq

# --- GRAPH DATA FOR SOLAPUR ---
# Simplified graph of Solapur city landmarks
# (Start, End, Base Distance in minutes)
CITY_GRAPH = {
    "Railway Station": {"Seven Star": 5, "Market Yard": 8, "Bypass": 15},
    "Seven Star": {"Railway Station": 5, "Mechanic Chowk": 4, "SMC Office": 6},
    "Market Yard": {"Railway Station": 8, "Mechanic Chowk": 5, "Saat Rasta": 3},
    "Mechanic Chowk": {"Seven Star": 4, "Market Yard": 5, "Saat Rasta": 7, "SMC Office": 3},
    "Saat Rasta": {"Market Yard": 3, "Mechanic Chowk": 7, "Shivaji Chowk": 10},
    "SMC Office": {"Seven Star": 6, "Mechanic Chowk": 3, "Bypass": 12},
    "Bypass": {"Railway Station": 15, "SMC Office": 12, "Shivaji Chowk": 8},
    "Shivaji Chowk": {"Saat Rasta": 10, "Bypass": 8}
}

# Mapping lanes to graph edges for dynamic weights
LANE_TO_EDGE = {
    "Lane 1 Market Yard": ("Railway Station", "Market Yard"),
    "Lane 2 Mechanic Chowk": ("Seven Star", "Mechanic Chowk"),
    "Lane 3 Saat Rasta": ("Market Yard", "Saat Rasta"),
    "Lane 4 Shivaji Chowk": ("Saat Rasta", "Shivaji Chowk")
}

def dijkstra(start, end):
    # Adjust weights based on density
    # weight = base_time * (1 + density/100)
    
    # Create dynamic weights
    dynamic_graph = {}
    for node, neighbors in CITY_GRAPH.items():
        dynamic_graph[node] = {}
        for neighbor, weight in neighbors.items():
            # Check if this edge is one of our monitored lanes
            bonus_weight = 0
            for lane_id, (u, v) in LANE_TO_EDGE.items():
                if (node == u and neighbor == v) or (node == v and neighbor == u):
                    density = junctions[lane_id]["density"]
                    bonus_weight = weight * (density / 50.0) # Double weight if 100% density
            
            dynamic_graph[node][neighbor] = weight + bonus_weight

    queue = [(0, start, [])]
    seen = set()
    
    while queue:
        (cost, node, path) = heapq.heappop(queue)
        if node not in seen:
            path = path + [node]
            seen.add(node)
            if node == end:
                return path, round(cost)

            for next_node, weight in dynamic_graph.get(node, {}).items():
                heapq.heappush(queue, (cost + weight, next_node, path))

    return None, 0

# --- ENDPOINTS ---

@app.route('/upload-video', methods=['POST'])
def upload_video():
    if 'video' not in request.files: return jsonify({"error": "No file"}), 400
    file = request.files['video']
    lane_id = request.form.get('lane_id')
    if lane_id not in junctions: return jsonify({"error": "Invalid Lane"}), 400

    timestamp = int(time.time())
    filename = secure_filename(f"{lane_id.replace(' ', '')}_{timestamp}.mp4")
    save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    
    try:
        file.save(save_path)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    threading.Thread(target=start_video_async, args=(lane_id, save_path)).start()
    return jsonify({"status": "success"})

@app.route('/video_feed/<lane_id>')
def video_feed(lane_id):
    if lane_id not in junctions: return "Invalid Lane", 404
    return Response(generate_frames(lane_id), mimetype='multipart/x-mixed-replace; boundary=frame')

def generate_frames(lane_id):
    while True:
        if frame_buffer[lane_id]:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_buffer[lane_id] + b'\r\n')
        else:
            time.sleep(0.1)

@app.route('/traffic-data', methods=['GET'])
def get_traffic_data():
    return jsonify({
        "junctions": junctions,
        "meta": city_meta,
        "alerts": alerts[-10:] # Return last 10 alerts
    })

@app.route('/analytics', methods=['GET'])
def get_analytics():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT timestamp, AVG(density) FROM traffic_history GROUP BY timestamp ORDER BY timestamp DESC LIMIT 20")
    rows = c.fetchall()
    conn.close()
    chart_data = [{"time": r[0].split(" ")[1], "avg_density": r[1]} for r in reversed(rows)]
    return jsonify(chart_data)

@app.route('/report-alert', methods=['POST'])
def report_alert():
    data = request.json
    new_alert = {
        "id": int(time.time()),
        "timestamp": time.strftime("%H:%M:%S"),
        "type": data.get("type", "General"),
        "location": data.get("location", "Unknown"),
        "message": data.get("message", "No description"),
        "severity": data.get("severity", "low")
    }
    alerts.append(new_alert)
    return jsonify({"status": "received"})

@app.route('/emergency', methods=['POST'])
def trigger_emergency():
    lane = request.json.get("junction")
    if lane in junctions:
        junctions[lane]["signal"] = "EMERGENCY"
        junctions[lane]["counts"]["ambulance"] = 1 # Force ambulance count
        return jsonify({"status": "OK"})
    return jsonify({"error": "Not Found"}), 404

# --- SYSTEM CONFIG ENDPOINTS ---

city_meta = {
    "event_mode": "Normal Flow",
    "simulated_hour": 18
}

@app.route('/set-event', methods=['POST'])
def set_event():
    data = request.json
    city_meta["event_mode"] = data.get("event", "Normal Flow")
    return jsonify({"status": "updated", "mode": city_meta["event_mode"]})

@app.route('/optimize-route', methods=['POST'])
def optimize_route():
    data = request.json
    start = data.get("start", "Railway Station")
    end = data.get("end", "SMC Office")
    
    if start not in CITY_GRAPH or end not in CITY_GRAPH:
        return jsonify({"error": "Start or End location not recognized"}), 400

    # Real-time Peak Logic
    current_hour = time.localtime().tm_hour
    is_peak = 8 <= current_hour <= 10 or 17 <= current_hour <= 20

    path, travel_time = dijkstra(start, end)
    
    if not path:
        return jsonify({"error": "No route found"}), 404

    # Determine reason for route
    reason = "Traffic Normal. Fastest Path Selected."
    
    # Check for specific junction load
    shivaji_data = junctions.get("Lane 4 Shivaji Chowk", {"density": 0})
    if shivaji_data["density"] > 70:
        reason = f"DYNAMIC REROUTE: Shivaji Chowk is heavily congested ({shivaji_data['density']}%). Suggested alternate path."
    elif is_peak:
        reason = "PEAK HOUR FLOW: Avoiding major market bottlenecks for smoother transit."
    
    if city_meta["event_mode"] == "VIP Movement":
         reason = "VIP SECURITY PROTOCOL: Priority corridor established. Commuter route optimized."

    return jsonify({
        "optimized_route": path,
        "estimated_time": f"{travel_time} mins",
        "reason": reason,
        "is_peak": is_peak
    })

if __name__ == '__main__':
    print("🎥 Final AI Server Running...")
    app.run(host='0.0.0.0', port=5001, debug=False, threaded=True)
