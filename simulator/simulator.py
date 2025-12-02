import time
import json
import random
import os
import paho.mqtt.client as mqtt
from datetime import datetime

# Configuration
BROKER = os.getenv("MQTT_BROKER", "localhost")
PORT = int(os.getenv("MQTT_PORT", 1883))
TOPIC_TEMPLATE = "vehicles/{}/telemetry"

# Simulate 5 vehicles starting around Central London
VEHICLES = [
    {"id": "v1", "lat": 51.5033, "lon": -0.1195, "speed": 40, "direction": 0.0001},   # Near London Eye
    {"id": "v2", "lat": 51.5090, "lon": -0.1337, "speed": 35, "direction": -0.0001},  # Near Piccadilly Circus
    {"id": "v3", "lat": 51.5155, "lon": -0.0722, "speed": 50, "direction": 0.0002},   # Near Shoreditch / Liverpool St
    {"id": "v4", "lat": 51.5390, "lon": -0.1426, "speed": 45, "direction": -0.0002},  # Near Camden Town
    {"id": "v5", "lat": 51.5014, "lon": -0.1419, "speed": 30, "direction": 0.0001},   # Near Buckingham Palace
]

def get_next_position(vehicle):
    # Simple simulation: move slightly in lat/lon
    # Add some random jitter
    vehicle["lat"] += vehicle["direction"] + random.uniform(-0.00005, 0.00005)
    vehicle["lon"] += random.uniform(-0.00005, 0.00005)
    
    # Randomly change speed
    vehicle["speed"] = max(0, min(100, vehicle["speed"] + random.uniform(-5, 5)))
    
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
                "timestamp": datetime.now().isoformat()
            }
            
            topic = TOPIC_TEMPLATE.format(v["id"])
            client.publish(topic, json.dumps(payload))
            print(f"Published to {topic}: {payload}")
            
        time.sleep(2)

if __name__ == "__main__":
    main()
