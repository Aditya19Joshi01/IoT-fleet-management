from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any
from ..database import get_db_pool

router = APIRouter()

@router.get("/analytics/speed-trend", tags=["Analytics"])
async def get_speed_trend(range: str = Query("7d", enum=["24h", "7d", "30d"])):
    pool = await get_db_pool()
    if not pool:
        raise HTTPException(status_code=503, detail="Database not ready")
    
    # Determine bucket size and interval based on range
    if range == "24h":
        bucket_width = "1 hour"
        filter_interval = "24 hours"
    elif range == "7d":
        bucket_width = "1 day"
        filter_interval = "7 days"
    else:
        bucket_width = "1 day"
        filter_interval = "30 days"

    query = f"""
        SELECT 
            time_bucket('{bucket_width}', time) AS bucket,
            AVG(speed) as avg_speed,
            MAX(speed) as max_speed
        FROM vehicle_telemetry
        WHERE time > NOW() - INTERVAL '{filter_interval}'
        GROUP BY bucket
        ORDER BY bucket ASC;
    """
    
    async with pool.acquire() as conn:
        rows = await conn.fetch(query)
    
    return [
        {
            "date": row['bucket'].isoformat(),
            "avgSpeed": round(row['avg_speed'] or 0, 1),
            "maxSpeed": round(row['max_speed'] or 0, 1)
        }
        for row in rows
    ]

@router.get("/analytics/distance", tags=["Analytics"])
async def get_distance_stats():
    # Approximate distance calculation (Speed * Time) is hard without proper integral.
    # For this demo, we will return mock-ish data derived from DB or just simple counts.
    # Let's return a simple daily aggregation of "active points" as a proxy for distance.
    pool = await get_db_pool()
    if not pool:
        raise HTTPException(status_code=503, detail="Database not ready")

    query = """
        SELECT 
            time_bucket('1 day', time) AS bucket,
            COUNT(*) * 0.1 as estimated_km -- Rough approx: 1 point every 2s, moving at avg speed
        FROM vehicle_telemetry
        WHERE status = 'moving' AND time > NOW() - INTERVAL '7 days'
        GROUP BY bucket
        ORDER BY bucket ASC;
    """
    async with pool.acquire() as conn:
        rows = await conn.fetch(query)
        
    return [
        {
            "date": row['bucket'].strftime('%b %d'),
            "distance": round(row['estimated_km'])
        }
        for row in rows
    ]

@router.get("/analytics/fuel", tags=["Analytics"])
async def get_fuel_stats():
    pool = await get_db_pool()
    if not pool:
        raise HTTPException(status_code=503, detail="Database not ready")
    
    # Calculate fuel consumed (Max - Min) per vehicle in the last 24h
    # This is a simplification.
    query = """
        SELECT 
            vehicle_id,
            MAX(fuel_level) - MIN(fuel_level) as consumption
        FROM vehicle_telemetry
        WHERE time > NOW() - INTERVAL '24 hours'
        GROUP BY vehicle_id
        ORDER BY consumption DESC
        LIMIT 5;
    """
    async with pool.acquire() as conn:
        rows = await conn.fetch(query)
        
    return [
        {
            "name": row['vehicle_id'],
            "consumption": round(row['consumption'] or 0, 1)
        }
        for row in rows
    ]

@router.get("/analytics/idle", tags=["Analytics"])
async def get_idle_stats():
    pool = await get_db_pool()
    if not pool:
        raise HTTPException(status_code=503, detail="Database not ready")
        
    query = """
        SELECT status, COUNT(*) as count
        FROM vehicle_telemetry
        WHERE time > NOW() - INTERVAL '24 hours'
        GROUP BY status;
    """
    async with pool.acquire() as conn:
        rows = await conn.fetch(query)
        
    total = sum(r['count'] for r in rows)
    if total == 0:
        return []
        
    return [
        {
            "name": (row['status'] or "unknown").capitalize(),
            "value": round((row['count'] / total) * 100, 1),
            "color": "#10B981" if row['status'] == 'moving' else "#F59E0B" if row['status'] == 'idle' else "#6B7280"
        }
        for row in rows
    ]
