import asyncpg
import logging
from .config import Config

logger = logging.getLogger(__name__)
db_pool = None

async def get_db_pool():
    global db_pool
    if not db_pool:
        db_pool = await asyncpg.create_pool(Config.DATABASE_URL)
    return db_pool

async def close_db_pool():
    global db_pool
    if db_pool:
        await db_pool.close()

async def init_db():
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        # Create table with new schema
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS vehicle_telemetry (
                time        TIMESTAMPTZ       NOT NULL,
                vehicle_id  TEXT              NOT NULL,
                latitude    DOUBLE PRECISION  NOT NULL,
                longitude   DOUBLE PRECISION  NOT NULL,
                speed       DOUBLE PRECISION  NOT NULL,
                fuel_level  DOUBLE PRECISION,
                engine_temp DOUBLE PRECISION,
                heading     DOUBLE PRECISION,
                status      TEXT
            );
        """)
        
        # Migration: Add columns if they don't exist (for existing DBs)
        for col, dtype in [
            ("fuel_level", "DOUBLE PRECISION"), 
            ("engine_temp", "DOUBLE PRECISION"), 
            ("heading", "DOUBLE PRECISION"),
            ("status", "TEXT")
        ]:
            try:
                await conn.execute(f"ALTER TABLE vehicle_telemetry ADD COLUMN IF NOT EXISTS {col} {dtype};")
            except Exception as e:
                logger.warning(f"Could not add column {col}: {e}")

        # Convert to hypertable
        try:
            await conn.execute("SELECT create_hypertable('vehicle_telemetry', 'time', if_not_exists => TRUE);")
            logger.info("Verified vehicle_telemetry is a hypertable")
        except Exception as e:
            logger.warning(f"Hypertable creation skipped: {e}")

async def save_telemetry(data: dict):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO vehicle_telemetry (time, vehicle_id, latitude, longitude, speed, fuel_level, engine_temp, heading, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        """, data['timestamp'], data['vehicle_id'], data['latitude'], data['longitude'], data['speed'],
           data.get('fuel_level'), data.get('engine_temp'), data.get('heading'), data.get('status'))
