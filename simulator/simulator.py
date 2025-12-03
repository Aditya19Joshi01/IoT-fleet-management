import time
import json
import random
import os
import math
import paho.mqtt.client as mqtt
from datetime import datetime

# Configuration
BROKER = os.getenv("MQTT_BROKER", "localhost")
PORT = int(os.getenv("MQTT_PORT", 1883))
TOPIC_TEMPLATE = "vehicles/{}/telemetry"

# Simulate 5 vehicles starting around Central London
VEHICLES = [
    {"id": "v1", "lat": 51.5033, "lon": -0.1195, "speed": 40, "direction": 0.0001, "fuel": 75, "temp": 85},
    {"id": "v2", "lat": 51.5090, "lon": -0.1337, "speed": 35, "direction": -0.0001, "fuel": 60, "temp": 82},
    {"id": "v3", "lat": 51.5155, "lon": -0.0722, "speed": 50, "direction": 0.0002, "fuel": 90, "temp": 88},
    {"id": "v4", "lat": 51.5390, "lon": -0.1426, "speed": 45, "direction": -0.0002, "fuel": 40, "temp": 90},
    {"id": "v5", "lat": 51.5014, "lon": -0.1419, "speed": 30, "direction": 0.0001, "fuel": 20, "temp": 84},
]

def calculate_heading(lat1, lon1, lat2, lon2):
    # Simple estimation of heading
    dLon = lon2 - lon1
    y = math.sin(dLon) * math.cos(lat2)
    x = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dLon)
    brng = math.degrees(math.atan2(y, x))
    return (brng + 360) % 360

def get_next_position(vehicle):
    prev_lat = vehicle["lat"]
    prev_lon = vehicle["lon"]

    # Move vehicle
    vehicle["lat"] += vehicle["direction"] + random.uniform(-0.00005, 0.00005)
    vehicle["lon"] += random.uniform(-0.00005, 0.00005)
    
    # Calculate Heading
    vehicle["heading"] = calculate_heading(prev_lat, prev_lon, vehicle["lat"], vehicle["lon"])

    # Update Speed (random fluctuation)
    vehicle["speed"] = max(0, min(100, vehicle["speed"] + random.uniform(-5, 5)))
    
    # Update Fuel (burns fuel, refills if low)
    vehicle["fuel"] -= 0.05
    if vehicle["fuel"] < 5:
        vehicle["fuel"] = 100 # Refuel
    
    # Update Engine Temp (fluctuates, gets hotter with speed)
    target_temp = 85 + (vehicle["speed"] / 10)
    vehicle["temp"] += (target_temp - vehicle["temp"]) * 0.1 + random.uniform(-0.5, 0.5)

    # Determine Status
    vehicle["status"] = "moving" if vehicle["speed"] > 1 else "idle"
    
    return vehicle

def main():
    client = mqtt.Client()
    
    print(f"Connecting to MQTT Broker at {BROKER}:{PORT}...")
    while True:
        try:
            client.connect(BROKER, PORT, 60)
            break
        except Exception as e:
            print(f"Connection failed ({e}), retrying in 5s...")
            time.sleep(5)
            
    print("Connected! Starting simulation...")
    
    while True:
        for v in VEHICLES:
            v = get_next_position(v)
            
            payload = {
                "vehicle_id": v["id"],
                "latitude": round(v["lat"], 6),
                "longitude": round(v["lon"], 6),
                "speed": round(v["speed"], 1),
                "fuel_level": round(v["fuel"], 1),
                "engine_temp": round(v["temp"], 1),
                "heading": round(v.get("heading", 0), 1),
                "status": v["status"],
                "timestamp": datetime.now().isoformat()
            }
            
            topic = TOPIC_TEMPLATE.format(v["id"])
            client.publish(topic, json.dumps(payload))
            print(f"Published to {topic}: {payload}")
            
        time.sleep(2)

if __name__ == "__main__":
    main()
