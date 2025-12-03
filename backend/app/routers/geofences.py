from fastapi import APIRouter, HTTPException
from typing import List
from ..database import get_db_pool
from ..models import Geofence

router = APIRouter()

@router.get("/geofences", response_model=List[Geofence], tags=["Geofences"])
async def get_geofences():
    pool = await get_db_pool()
    if not pool:
        raise HTTPException(status_code=503, detail="Database not ready")
        
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM geofences ORDER BY created_at DESC")
        
    return [dict(row) for row in rows]

@router.post("/geofences", response_model=Geofence, tags=["Geofences"])
async def create_geofence(geofence: Geofence):
    pool = await get_db_pool()
    if not pool:
        raise HTTPException(status_code=503, detail="Database not ready")
        
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            INSERT INTO geofences (name, center_lat, center_lng, radius_meters, color)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        """, geofence.name, geofence.center_lat, geofence.center_lng, geofence.radius_meters, geofence.color)
        
    return dict(row)

@router.delete("/geofences/{geofence_id}", tags=["Geofences"])
async def delete_geofence(geofence_id: str):
    pool = await get_db_pool()
    if not pool:
        raise HTTPException(status_code=503, detail="Database not ready")
        
    async with pool.acquire() as conn:
        result = await conn.execute("DELETE FROM geofences WHERE id = $1::uuid", geofence_id)
        
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Geofence not found")
        
    return {"status": "success", "id": geofence_id}
