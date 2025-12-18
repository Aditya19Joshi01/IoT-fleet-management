import asyncio
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db, close_db_pool
from app.mqtt_service import start_mqtt
from app.redis_manager import redis_manager
from app.routers import vehicles, analytics, geofences

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Fleet Management API")

# CORS (Allow Frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(vehicles.router)
app.include_router(analytics.router)
app.include_router(geofences.router)

@app.on_event("startup")
async def startup_event():
    await init_db()
    await redis_manager.connect()
    start_mqtt(asyncio.get_event_loop())

@app.on_event("shutdown")
async def shutdown_event():
    await close_db_pool()
    await redis_manager.close()

@app.get("/")
async def root():
    return {"status": "online", "version": "2.0"}
