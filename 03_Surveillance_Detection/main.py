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

# Hawker/Vending Zone
HAWKER_ZONE = [800, 300, 300, 250]

# --- STATE VARIABLES ---
total_vehicle_count = 0
tracked_ids = set()
violation_counter = {} # {track_id: frames_in_zone}
hawker_counter = 0 # Frames with high person count in zone
ambulance_detected = False
is_violation_active = False
is_hawker_active = False

# API Timer
last_api_time = 0

# Initialize Model
print("Loading YOLOv8 Nano model...")
model = YOLO("yolov8n.pt") # Downloads automatically if missing

# Initialize Video
cap = cv2.VideoCapture(VIDEO_PATH)

def send_data_to_server(count, violation, ambulance, hawker):
    """Sends data to the central server in a separate thread to avoid blocking video."""
    try:
        # 1. Update Traffic Stats (existing)
        # 2. Report Violation
        if violation:
             requests.post(f"{SERVER_URL}/report-alert", json={
                 "type": "Illegal Parking",
                 "location": "Junction 1 - West",
                 "message": "Vehicle detected in No-Parking Zone for > 2 mins",
                 "severity": "medium"
             }, timeout=0.5)

        # 3. Report Hawkers
        if hawker:
             requests.post(f"{SERVER_URL}/report-alert", json={
                 "type": "Unauthorized Vending",
                 "location": "Main Market Sidewalk",
                 "message": "Group of hawkers detected blocking pedestrian path",
                 "severity": "high"
             }, timeout=0.5)
        
        # 4. Trigger Ambulance Signal (If detected)
        if ambulance:
             requests.post(f"{SERVER_URL}/emergency", json={"junction": "Lane 1 Market Yard"}, timeout=0.5)
             print("🚑 AMBULANCE ALERT SENT!")

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
    results = model.track(img, persist=True, tracker="bytetrack.yaml", verbose=False)
    
    # Reset Per-Frame Flags
    current_ambulance_frame = False
    people_in_hawker_zone = 0
    
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

            # Filter for Vehicles
            if current_class in VEHICLE_CLASSES or current_class == "person":
                
                # --- VISUALS ---
                color = (0, 255, 0) # Green default
                if current_class == "person": color = (255, 0, 0) # Blue for people
                
                cvzone.cornerRect(img, (x1, y1, w, h), l=9, rt=2, colorR=color)
                
                # Center Point
                cx, cy = x1 + w // 2, y1 + h // 2
                cv2.circle(img, (cx, cy), 5, (255, 0, 255), cv2.FILLED)

                # --- FEATURE A: LINE COUNTING ---
                if LINE_POS[1] - 15 < cy < LINE_POS[1] + 15:
                    if id not in tracked_ids:
                        total_vehicle_count += 1
                        tracked_ids.add(id)

                # --- FEATURE B: NO PARKING ZONE ---
                zx, zy, zw, zh = NO_PARKING_RECT
                if zx < cx < zx + zw and zy < cy < zy + zh:
                    violation_counter[id] = violation_counter.get(id, 0) + 1
                    if violation_counter[id] > 50:
                        is_violation_active = True
                        cvzone.putTextRect(img, "ILLEGAL PARKING", (x1, y1 - 20), scale=1.5, thickness=2, colorR=(0, 0, 255))
                
                # --- FEATURE C: HAWKER DETECTION ---
                hx, hy, hw, hh = HAWKER_ZONE
                if current_class == "person" and hx < cx < hx + hw and hy < cy < hy + hh:
                    people_in_hawker_zone += 1

    # Hawker logic: If > 3 people in zone for a while
    if people_in_hawker_zone >= 3:
        hawker_counter += 1
        if hawker_counter > 100: # ~4 seconds
            is_hawker_active = True
    else:
        hawker_counter = 0
        is_hawker_active = False

    # --- DRAW OVERLAYS ---
    
    # 1. Counting Line
    cv2.line(img, (LINE_POS[0], LINE_POS[1]), (LINE_POS[2], LINE_POS[3]), (0, 0, 255), 2)
    
    # 2. No Parking Zone
    px, py, pw, ph = NO_PARKING_RECT
    cv2.rectangle(img, (px, py), (px + pw, py + ph), (0, 0, 255), 2)
    cv2.putText(img, "NO PARKING", (px, py - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)

    # 3. Hawker Zone
    hx, hy, hw, hh = HAWKER_ZONE
    cv2.rectangle(img, (hx, hy), (hx + hw, hy + hh), (0, 165, 255), 2)
    cv2.putText(img, "HEDGING/HAWKER ZONE", (hx, hy - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 165, 255), 2)
    
    if is_hawker_active:
        cvzone.putTextRect(img, 'HAWKER ALERT!', (800, 150), scale=2, thickness=2, colorR=(0, 165, 255), offset=10)

    # Dashboard UI
    cvzone.putTextRect(img, f'Count: {total_vehicle_count}', (50, 50), scale=2, thickness=2, offset=10)
    
    # --- FEATURE 4: BACKEND SYNC ---
    current_time = time.time()
    if current_time - last_api_time > 5: # Every 5 seconds
        threading.Thread(target=send_data_to_server, args=(total_vehicle_count, is_violation_active, ambulance_detected, is_hawker_active)).start()
        last_api_time = current_time
        # Reset violation flags after sending
        is_violation_active = False 

    # Show Image
    cv2.imshow("Surveillance Module - Solapur Smart City", img)
    
    # Quit on 'q'
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
