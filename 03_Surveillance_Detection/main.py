import cv2
import math
import time
import threading
import requests
import numpy as np
from ultralytics import YOLO
import cvzone

# --- CONFIGURATION ---
VIDEO_PATH = "traffic.mp4"  # Put your video file in the same folder!
SERVER_URL = "http://localhost:5001"
CONFIDENCE_THRESHOLD = 0.4

# Class Names (COCO Dataset)
# We care about: person(0), car(2), motorcycle(3), bus(5), truck(7)
CLASS_NAMES = ["person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck", "boat",
               "traffic light", "fire hydrant", "stop sign", "parking meter", "bench", "bird", "cat",
               "dog", "horse", "sheep", "cow", "elephant", "bear", "zebra", "giraffe", "backpack",
               "umbrella", "handbag", "tie", "suitcase", "frisbee", "skis", "snowboard", "sports ball",
               "kite", "baseball bat", "baseball glove", "skateboard", "surfboard", "tennis racket",
               "bottle", "wine glass", "cup", "fork", "knife", "spoon", "bowl", "banana", "apple",
               "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza", "donut", "cake", "chair",
               "couch", "potted plant", "bed", "dining table", "toilet", "tv", "laptop", "mouse",
               "remote", "keyboard", "cell phone", "microwave", "oven", "toaster", "sink",
               "refrigerator", "book", "clock", "vase", "scissors", "teddy bear", "hair drier",
               "toothbrush"]

# Targeted Classes for Counting
VEHICLE_CLASSES = ["car", "bus", "truck", "motorcycle"]

# --- ZONES & LINES ---
# Counting Line (Start, End) - Adjust based on your video resolution (1920x1080 usually)
# For a 1280x720 video, Y=450 is good. For 1080p, maybe Y=650.
# Let's assume 1280x720 for better performance, or resize frame.
LINE_POS = [100, 450, 1100, 450] 

# No Parking Zone (x1, y1, width, height)
# Using cvzone.CornerRect format logic: x, y, w, h
NO_PARKING_RECT = [50, 300, 200, 200] # x, y, w, h (width=200, height=200)

# --- STATE VARIABLES ---
total_vehicle_count = 0
tracked_ids = set()
violation_counter = {} # {track_id: frames_in_zone}
ambulance_detected = False
is_violation_active = False

# API Timer
last_api_time = 0

# Initialize Model
print("Loading YOLOv8 Nano model...")
model = YOLO("yolov8n.pt") # Downloads automatically if missing

# Initialize Video
cap = cv2.VideoCapture(VIDEO_PATH)

def send_data_to_server(count, violation, ambulance):
    """Sends data to the central server in a separate thread to avoid blocking video."""
    try:
        payload = {
            "junction": "Lane 1",
            "vehicle_count": count,
            "violation": violation,
            "ambulance": ambulance
        }
        # 1. Update Traffic Stats
        # requests.post(f"{SERVER_URL}/update-traffic", json=payload, timeout=0.5)
        
        # 2. Trigger Ambulance Signal (If detected)
        if ambulance:
             requests.post(f"{SERVER_URL}/emergency", json={"junction": "Lane 1"}, timeout=0.5)
             print("🚑 AMBULANCE ALERT SENT!")

        # print(f"📡 Data Sent: Count={count} | Violation={violation}")
    except Exception as e:
        pass # Ignore connection errors to keep video smooth

# --- MAIN LOOP ---
while True:
    success, img = cap.read()
    if not success:
        # Loop video
        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
        continue

    # Resize for speed (optional)
    img = cv2.resize(img, (1280, 720))
    
    # Run Detection
    results = model(img, stream=True)
    
    # Reset Per-Frame Flags
    current_ambulance_frame = False
    
    # Detections Array for Tracking (could add tracker here, but using simple centroid logic for line)
    # Ideally use model.track() for IDs, but standard predict works for basic counting if IDs provided
    # Let's use the tracker built into YOLOv8:
    results = model.track(img, persist=True, tracker="bytetrack.yaml", verbose=False)
    
    # Processing Results
    for result in results:
        boxes = result.boxes
        for box in boxes:
            # Bounding Box
            x1, y1, x2, y2 = box.xyxy[0]
            x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
            w, h = x2 - x1, y2 - y1
            
            # Confidence
            conf = math.ceil((box.conf[0] * 100)) / 100
            
            # Class
            cls = int(box.cls[0])
            current_class = CLASS_NAMES[cls]
            
            # ID (Tracker ID)
            id = int(box.id[0]) if box.id is not None else 0

            # --- FEATURE C: AMBULANCE DETECTION ---
            # COCO doesn't have "ambulance". Usually we train a custom model.
            # For this demo, we will simulate: If it's a "truck" with high confidence, check visuals?
            # Or just assume "truck" is ambulance for demo purposes if needed?
            # Let's stick to strict COCO: If specific class detected.
            # Since standard COCO lacks it, I will use "truck" as a placeholder for demo
            # OR logic: if the user provides a custom model. 
            # *For this script, I will assume 'truck' might be an ambulance for simulation.*
            if current_class == "truck" or current_class == "bus":
                 # In a real scenario, you'd use a custom trained model.
                 pass 

            # Filter for Vehicles
            if current_class in VEHICLE_CLASSES or current_class == "person":
                
                # --- VISUALS ---
                color = (0, 255, 0) # Green default
                if current_class == "person": color = (255, 0, 0) # Blue for people
                
                cvzone.cornerRect(img, (x1, y1, w, h), l=9, rt=2, colorR=color)
                cvzone.putTextRect(img, f'{id} {current_class} {conf}', (max(0, x1), max(35, y1)), scale=1, thickness=1, offset=3)
                
                # Center Point
                cx, cy = x1 + w // 2, y1 + h // 2
                cv2.circle(img, (cx, cy), 5, (255, 0, 255), cv2.FILLED)

                # --- FEATURE A: LINE COUNTING ---
                # Check if crossing the line (Y = 450)
                # We use a small buffer zone
                if LINE_POS[1] - 15 < cy < LINE_POS[1] + 15:
                    if id not in tracked_ids:
                        total_vehicle_count += 1
                        tracked_ids.add(id)
                        cv2.line(img, (LINE_POS[0], LINE_POS[1]), (LINE_POS[2], LINE_POS[3]), (0, 255, 0), 5)

                # --- FEATURE B: NO PARKING ZONE ---
                # Zone: NO_PARKING_RECT = [x, y, w, h]
                zx, zy, zw, zh = NO_PARKING_RECT
                if zx < cx < zx + zw and zy < cy < zy + zh:
                    # Object is inside the Red Zone
                    violation_counter[id] = violation_counter.get(id, 0) + 1
                    
                    # If inside for > 50 frames (~2 seconds)
                    if violation_counter[id] > 50:
                        is_violation_active = True
                        # Draw Red Warning
                        cvzone.cornerRect(img, (x1, y1, w, h), l=9, rt=5, colorR=(0, 0, 255))
                        cvzone.putTextRect(img, "ILLEGAL PARKING", (x1, y1 - 20), scale=1.5, thickness=2, colorR=(0, 0, 255))
                else:
                    # Reset counter if they leave
                    if id in violation_counter:
                        violation_counter[id] = 0

    # --- DRAW OVERLAYS ---
    
    # 1. Counting Line
    cv2.line(img, (LINE_POS[0], LINE_POS[1]), (LINE_POS[2], LINE_POS[3]), (0, 0, 255), 2)
    
    # 2. No Parking Zone
    px, py, pw, ph = NO_PARKING_RECT
    # Draw transparent rectangle logic
    # (Simple rectangle for cv2)
    cv2.rectangle(img, (px, py), (px + pw, py + ph), (0, 0, 255), 2)
    cv2.putText(img, "NO PARKING ZONE", (px, py - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)

    # 3. Dashboard UI
    cvzone.putTextRect(img, f'Count: {total_vehicle_count}', (50, 50), scale=2, thickness=2, offset=10)
    
    if is_violation_active:
        cvzone.putTextRect(img, 'VIOLATION ALERT!', (50, 150), scale=2, thickness=2, colorR=(0, 0, 255), offset=10)
        # Reset flag slightly for next frame logic (or keep it true until object leaves)
        is_violation_active = False # Reset for per-frame check logic

    # --- FEATURE 4: BACKEND SYNC ---
    current_time = time.time()
    if current_time - last_api_time > 2: # Every 2 seconds
        # Start thread
        threading.Thread(target=send_data_to_server, args=(total_vehicle_count, is_violation_active, ambulance_detected)).start()
        last_api_time = current_time

    # Show Image
    cv2.imshow("Surveillance Module - Solapur Smart City", img)
    
    # Quit on 'q'
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
