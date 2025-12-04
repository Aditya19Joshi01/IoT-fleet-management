from fastapi import APIRouter, HTTPException
from typing import List
from ..database import run_query, DATABASE_NAME, TABLE_NAME
from ..models import VehicleSummary

router = APIRouter()

@router.get("/vehicles", response_model=List[VehicleSummary], tags=["Vehicles"])
def get_recent_vehicles():
    # Timestream query to get the latest record for each vehicle
    # We use MAX_BY to find the row with the latest time
    query = f"""
        SELECT 
            vehicle_id, 
            MAX_BY(latitude, time) as latitude,
            MAX_BY(longitude, time) as longitude,
            MAX_BY(speed, time) as speed,
            MAX_BY(fuel_level, time) as fuel_level,
            MAX_BY(engine_temp, time) as engine_temp,
            MAX_BY(heading, time) as heading,
            MAX_BY(status, time) as status,
            MAX(time) as last_update
        FROM "{DATABASE_NAME}"."{TABLE_NAME}"
        WHERE time > ago(24h)
        GROUP BY vehicle_id
        ORDER BY last_update DESC
    """
    
    rows = run_query(query)
    return rows

@router.get("/history/{vehicle_id}", tags=["Vehicles"])
def get_vehicle_history(vehicle_id: str):
    query = f"""
        SELECT time, latitude, longitude, speed, fuel_level
        FROM "{DATABASE_NAME}"."{TABLE_NAME}"
        WHERE vehicle_id = '{vehicle_id}' AND time > ago(24h)
        ORDER BY time DESC
        LIMIT 100
    """
    rows = run_query(query)
    return rows

@router.get("/dashboard/stats", tags=["Dashboard"])
def get_dashboard_stats():
    # Get latest status for all vehicles
    query = f"""
        SELECT 
            vehicle_id, 
            MAX_BY(status, time) as status,
            MAX_BY(speed, time) as speed
        FROM "{DATABASE_NAME}"."{TABLE_NAME}"
        WHERE time > ago(24h)
        GROUP BY vehicle_id
    """
    
    rows = run_query(query)
    
    total_vehicles = len(rows)
    active_vehicles = sum(1 for r in rows if r.get('status') == 'moving')
    idle_vehicles = sum(1 for r in rows if r.get('status') == 'idle')
    offline_vehicles = sum(1 for r in rows if r.get('status') == 'offline')
    
    avg_speed = 0
    if active_vehicles > 0:
        avg_speed = sum(r.get('speed', 0) for r in rows if r.get('status') == 'moving') / active_vehicles

    return {
        "total_vehicles": total_vehicles,
        "active_vehicles": active_vehicles,
        "idle_vehicles": idle_vehicles,
        "offline_vehicles": offline_vehicles,
        "alert_count": 0, 
        "avg_speed": round(avg_speed, 1),
        "total_distance_today": 1250 
    }
