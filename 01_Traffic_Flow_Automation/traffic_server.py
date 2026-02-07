import time
import threading
import os
import cv2
import numpy as np
from flask import Flask, jsonify, request, Response
from flask_cors import CORS
from werkzeug.utils import secure_filename
from ultralytics import YOLO

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
    "Lane 1": None, "Lane 2": None, "Lane 3": None, "Lane 4": None
}

junctions = {
    "Lane 1": { "video_path": None, "counts": {"car": 0, "bus": 0, "truck": 0, "bike": 0, "ambulance": 0}, "total": 0, "density": 0, "signal": "RED", "timer": 0, "active": False },
    "Lane 2": { "video_path": None, "counts": {"car": 0, "bus": 0, "truck": 0, "bike": 0, "ambulance": 0}, "total": 0, "density": 0, "signal": "RED", "timer": 0, "active": False },
    "Lane 3": { "video_path": None, "counts": {"car": 0, "bus": 0, "truck": 0, "bike": 0, "ambulance": 0}, "total": 0, "density": 0, "signal": "RED", "timer": 0, "active": False },
    "Lane 4": { "video_path": None, "counts": {"car": 0, "bus": 0, "truck": 0, "bike": 0, "ambulance": 0}, "total": 0, "density": 0, "signal": "RED", "timer": 0, "active": False }
}

# --- VIDEO PROCESSOR ---
def process_lane_video(lane_id):
    video_path = junctions[lane_id]["video_path"]
    if not video_path or not os.path.exists(video_path): return

    # Removed explicit CAP_FFMPEG to let OpenCV choose best backend (MSMF often better on Windows)
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
                    # Video stream broken
                    break

            # Resize
            frame = cv2.resize(frame, (640, 360))
            frame_count += 1
            
            # --- AI LOGIC (Every 2nd Frame) ---
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

                # Check for Emergency Signal (Manual Trigger)
                if junctions[lane_id]["signal"] == "EMERGENCY":
                    current_counts["ambulance"] = 1 # Simulate 1 ambulance if emergency active

                # Update Stats
                total_veh = sum(current_counts.values())
                weighted_score = sum([current_counts[k] * VEHICLE_WEIGHTS.get(k, 1) for k in current_counts if k != "ambulance"])
                density = min((weighted_score / MAX_LANE_CAPACITY) * 100, 100)
                
                junctions[lane_id]["counts"] = current_counts
                junctions[lane_id]["total"] = total_veh
                junctions[lane_id]["density"] = int(density)
                
                # Signal Logic
                if junctions[lane_id]["signal"] != "EMERGENCY":
                    if weighted_score > 15:
                        junctions[lane_id]["signal"] = "GREEN"
                        if junctions[lane_id]["timer"] < 5: junctions[lane_id]["timer"] = 60 
                    else:
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
                # Minimal Label
                cv2.putText(frame, label.upper(), (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

            # --- NEW BOTTOM OVERLAY ---
            stats = junctions[lane_id]
            
            # Bottom Bar Background (Semi-transparent Black)
            cv2.rectangle(frame, (0, 320), (640, 360), (0, 0, 0), -1)
            
            # Stats Text
            text_color = (255, 255, 255)
            if stats["density"] > 80: text_color = (0, 0, 255) # Red text if high density
            elif stats["density"] > 50: text_color = (0, 165, 255)
            
            # Left Side: Counts
            counts_str = f"Cars:{stats['counts']['car']} Bus:{stats['counts']['bus']} Trk:{stats['counts']['truck']}"
            cv2.putText(frame, counts_str, (10, 345), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
            
            # Right Side: Density & Total
            main_stat = f"Total: {stats['total']} | Load: {stats['density']}%"
            cv2.putText(frame, main_stat, (400, 345), cv2.FONT_HERSHEY_SIMPLEX, 0.6, text_color, 2)

            if stats["counts"]["ambulance"] > 0:
                 cv2.putText(frame, "AMBULANCE DETECTED", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

            # Update Buffer
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
        "meta": city_meta
    })

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
    start = data.get("start", "Start")
    end = data.get("end", "End")
    
    # Simple Mock Logic for Demo
    # In a real app, this would use Dijkstra's algorithm on a graph
    
    if city_meta["event_mode"] == "VIP Movement":
         return jsonify({
            "optimized_route": [start, "Ring Road", "Bypass", end],
            "estimated_time": "45 mins",
            "reason": "City Center Blocked for VIP. Taking Bypass."
        })
    
    if junctions["Lane 1"]["density"] > 70 or junctions["Lane 4"]["density"] > 70:
        return jsonify({
            "optimized_route": [start, "Old Market Road", "Station Back Gate", end],
            "estimated_time": "22 mins",
            "reason": "Traffic High on Main Lanes. Avoided."
        })

    return jsonify({
        "optimized_route": [start, "Main High Street", "Station Circle", end],
        "estimated_time": "12 mins",
        "reason": "Traffic Normal. Fastest Path Selected."
    })

if __name__ == '__main__':
    print("🎥 Final AI Server Running...")
    app.run(host='0.0.0.0', port=5001, debug=False, threaded=True)
