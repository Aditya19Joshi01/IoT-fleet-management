import json
import asyncio
import logging
import paho.mqtt.client as mqtt
from datetime import datetime
from .config import Config
from .database import save_telemetry

logger = logging.getLogger(__name__)
loop = None

def on_connect(client, userdata, flags, rc):
    logger.info(f"Connected to MQTT Broker with result code {rc}")
    client.subscribe(Config.MQTT_TOPIC)

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        
        # Ensure timestamp is parsed
        if isinstance(payload.get('timestamp'), str):
            payload['timestamp'] = datetime.fromisoformat(payload['timestamp'])
            
        # Fire and forget async task
        if loop:
            asyncio.run_coroutine_threadsafe(save_telemetry(payload), loop)
    except Exception as e:
        logger.error(f"Error processing message: {e}")

def start_mqtt(event_loop):
    global loop
    loop = event_loop
    
    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_message = on_message
    
    try:
        client.connect(Config.MQTT_BROKER, Config.MQTT_PORT, 60)
        client.loop_start()
        logger.info("MQTT Client started")
        return client
    except Exception as e:
        logger.error(f"Failed to connect to MQTT: {e}")
        return None
