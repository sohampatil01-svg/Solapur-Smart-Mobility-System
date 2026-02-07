import time
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# --- SMART PARKING STATE ---
parking_lots = {
    "SMC_Main_Market": {
        "total_slots": 50,
        "occupied": 32,
        "slots": [
            {"id": i, "status": "occupied" if i < 32 else "available", "type": "car"} for i in range(1, 51)
        ],
        "hourly_rate": 20,
        "location": "Solapur Market Yard"
    },
    "Railway_Station_North": {
        "total_slots": 100,
        "occupied": 85,
        "slots": [
            {"id": i, "status": "occupied" if i < 85 else "available", "type": "mixed"} for i in range(1, 101)
        ],
        "hourly_rate": 30,
        "location": "Station Road"
    }
}

@app.route('/parking-data', methods=['GET'])
def get_parking_data():
    return jsonify(parking_lots)

@app.route('/reserve-parking', methods=['POST'])
def reserve_parking():
    data = request.json
    lot_id = data.get("lot_id")
    slot_id = data.get("slot_id")

    if lot_id in parking_lots:
        lot = parking_lots[lot_id]
        for slot in lot["slots"]:
            if slot["id"] == slot_id:
                if slot["status"] == "available":
                    slot["status"] = "occupied"
                    lot["occupied"] += 1
                    return jsonify({"status": "success", "message": f"Slot {slot_id} reserved at {lot_id}"})
                else:
                    return jsonify({"error": "Slot already occupied"}), 400
    return jsonify({"error": "Lot or Slot not found"}), 404

if __name__ == '__main__':
    print("🅿️ Smart Parking Server Running on Port 5002...")
    app.run(host='0.0.0.0', port=5002, debug=False)
