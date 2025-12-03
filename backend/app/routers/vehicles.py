from fastapi import APIRouter, HTTPException
from typing import List
from ..database import get_db_pool
from ..models import VehicleSummary

router = APIRouter()

@router.get("/vehicles", response_model=List[VehicleSummary], tags=["Vehicles"])
async def get_recent_vehicles():
    pool = await get_db_pool()
    if not pool:
        raise HTTPException(status_code=503, detail="Database not ready")
    
    query = """
        SELECT DISTINCT ON (vehicle_id) 
            vehicle_id, latitude, longitude, speed, fuel_level, engine_temp, heading, status, time as last_update
        FROM vehicle_telemetry
        ORDER BY vehicle_id, time DESC;
    """
    async with pool.acquire() as conn:
        rows = await conn.fetch(query)
    
    return [dict(row) for row in rows]

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
    pool = await get_db_pool()
    if not pool:
        raise HTTPException(status_code=503, detail="Database not ready")
        
    async with pool.acquire() as conn:
        # Get latest status for all vehicles
        rows = await conn.fetch("""
            SELECT DISTINCT ON (vehicle_id) status, speed
            FROM vehicle_telemetry
            ORDER BY vehicle_id, time DESC
        """)
        
        total_vehicles = len(rows)
        active_vehicles = sum(1 for r in rows if r['status'] == 'moving')
        idle_vehicles = sum(1 for r in rows if r['status'] == 'idle')
        offline_vehicles = sum(1 for r in rows if r['status'] == 'offline') # Simulator doesn't send offline yet
        
        avg_speed = 0
        if active_vehicles > 0:
            avg_speed = sum(r['speed'] for r in rows if r['status'] == 'moving') / active_vehicles

        return {
            "total_vehicles": total_vehicles,
            "active_vehicles": active_vehicles,
            "idle_vehicles": idle_vehicles,
            "offline_vehicles": offline_vehicles,
            "alert_count": 0, # Placeholder
            "avg_speed": round(avg_speed, 1),
            "total_distance_today": 1250 # Placeholder
        }
