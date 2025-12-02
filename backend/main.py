import os
import json
import asyncio
import logging
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import asyncpg
import paho.mqtt.client as mqtt

# Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/fleet_db")
MQTT_BROKER = os.getenv("MQTT_BROKER", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", 1883))
MQTT_TOPIC = "vehicles/+/telemetry"

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Global DB Pool
db_pool = None
loop = None

# Pydantic Models
class VehicleData(BaseModel):
    vehicle_id: str
    latitude: float
    longitude: float
    speed: float
    timestamp: datetime

# Database Setup
async def init_db():
    global db_pool
    try:
        db_pool = await asyncpg.create_pool(DATABASE_URL)
        async with db_pool.acquire() as conn:
            # Create table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS vehicle_telemetry (
                    time        TIMESTAMPTZ       NOT NULL,
                    vehicle_id  TEXT              NOT NULL,
                    latitude    DOUBLE PRECISION  NOT NULL,
                    longitude   DOUBLE PRECISION  NOT NULL,
                    speed       DOUBLE PRECISION  NOT NULL
                );
            """)
            # Convert to hypertable (TimescaleDB specific)
            try:
                await conn.execute("SELECT create_hypertable('vehicle_telemetry', 'time', if_not_exists => TRUE);")
                logger.info("Verified vehicle_telemetry is a hypertable")
            except Exception as e:
                logger.warning(f"Hypertable creation skipped (might already exist or not supported): {e}")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise e

# MQTT Handlers
async def save_telemetry(data: dict):
    if not db_pool:
        logger.warning("DB Pool not ready, skipping save")
        return
    try:
        # Ensure timestamp is parsed
        ts = data.get('timestamp')
        if isinstance(ts, str):
            ts = datetime.fromisoformat(ts)
        
        async with db_pool.acquire() as conn:
            await conn.execute("""
                INSERT INTO vehicle_telemetry (time, vehicle_id, latitude, longitude, speed)
                VALUES ($1, $2, $3, $4, $5)
            """, ts, data['vehicle_id'], data['latitude'], data['longitude'], data['speed'])
        logger.info(f"Saved data for {data['vehicle_id']}")
    except Exception as e:
        logger.error(f"DB Insert Error: {e}")

def on_connect(client, userdata, flags, rc):
    logger.info(f"Connected to MQTT Broker with result code {rc}")
    client.subscribe(MQTT_TOPIC)

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        # Fire and forget async task
        if loop:
            asyncio.run_coroutine_threadsafe(save_telemetry(payload), loop)
    except Exception as e:
        logger.error(f"Error processing message: {e}")

# MQTT Client Setup
mqtt_client = mqtt.Client()
mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message

# Lifecycle Events
@app.on_event("startup")
async def startup_event():
    global loop
    loop = asyncio.get_event_loop()
    await init_db()
    
    # Connect MQTT
    try:
        mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
        mqtt_client.loop_start() # Runs in background thread
        logger.info("MQTT Client started")
    except Exception as e:
        logger.error(f"Failed to connect to MQTT: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    mqtt_client.loop_stop()
    if db_pool:
        await db_pool.close()

# API Endpoints
@app.get("/")
async def root():
    return {"status": "online", "db": "connected" if db_pool else "disconnected"}

@app.get("/vehicles")
async def get_recent_vehicles():
    if not db_pool:
        raise HTTPException(status_code=503, detail="Database not ready")
    
    # Get the latest position for each vehicle
    query = """
        SELECT DISTINCT ON (vehicle_id) vehicle_id, latitude, longitude, speed, time
        FROM vehicle_telemetry
        ORDER BY vehicle_id, time DESC;
    """
    async with db_pool.acquire() as conn:
        rows = await conn.fetch(query)
    
    # Convert to dict and handle datetime serialization if needed (FastAPI handles datetime usually)
    return [dict(row) for row in rows]

@app.get("/history/{vehicle_id}")
async def get_vehicle_history(vehicle_id: str):
    if not db_pool:
        raise HTTPException(status_code=503, detail="Database not ready")

    query = """
        SELECT time, latitude, longitude, speed
        FROM vehicle_telemetry
        WHERE vehicle_id = $1
        ORDER BY time DESC
        LIMIT 100;
    """
    async with db_pool.acquire() as conn:
        rows = await conn.fetch(query, vehicle_id)
    return [dict(row) for row in rows]
