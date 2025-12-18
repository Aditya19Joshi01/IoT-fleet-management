from fastapi import APIRouter, HTTPException, Query
from typing import List
from datetime import datetime
from ..database import get_db_pool
from ..models import VehicleSummary
from ..redis_manager import redis_manager

router = APIRouter()

@router.get("/vehicles", response_model=List[VehicleSummary], tags=["Vehicles"])
async def get_recent_vehicles():
    vehicles = await redis_manager.get_all_vehicles()
    # Map 'timestamp' to 'last_update' if needed, and handle type/field matching
    for v in vehicles:
        if 'timestamp' in v:
            v['last_update'] = v['timestamp']
        # status, speed, etc should be there. 
        # RedisManager already converts speed/lat/lon to float.
    return vehicles

@router.get("/history/{vehicle_id}", tags=["Vehicles"])
async def get_vehicle_history(vehicle_id: str):
    pool = await get_db_pool()
    if not pool:
        raise HTTPException(status_code=503, detail="Database not ready")

    query = """
        SELECT time, latitude, longitude, speed, fuel_level
        FROM vehicle_telemetry
        WHERE vehicle_id = $1
        ORDER BY time DESC
        LIMIT 100;
    """
    async with pool.acquire() as conn:
        rows = await conn.fetch(query, vehicle_id)
    return [dict(row) for row in rows]

@router.get("/dashboard/stats", tags=["Dashboard"])
async def get_dashboard_stats():
    return await redis_manager.get_stats()

@router.get("/vehicles/{vehicle_id}/route-history", tags=["Vehicles"])
async def get_vehicle_route_history(vehicle_id: str, start_time: datetime, end_time: datetime):
    query = """
        SELECT time, latitude, longitude, speed, fuel_level, status
        FROM vehicle_telemetry
        WHERE vehicle_id = $1
        AND time BETWEEN $2 AND $3
        ORDER BY time ASC;
    """
    pool = await get_db_pool()
    if not pool:
        raise HTTPException(status_code=503, detail="Database not ready")
    async with pool.acquire() as conn:
        rows = await conn.fetch(query, vehicle_id, start_time, end_time)
    
    # helper to convert row to dict and handle potential non-serializable types if any (datetime is usually fine in FastAPI)
    return [dict(row) for row in rows]