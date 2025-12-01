from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from src.core.database import get_db
from src.core.models_db import Geofence
from src.routers.auth import get_current_user

router = APIRouter(dependencies=[Depends(get_current_user)])

class GeofenceCreate(BaseModel):
    vehicle_id: str
    name: str
    radius_meters: float
    latitude: float
    longitude: float

class GeofenceOut(GeofenceCreate):
    id: int
    class Config:
        from_attributes = True

@router.post("/", response_model=GeofenceOut)
def create_geofence(geofence: GeofenceCreate, db: Session = Depends(get_db)):
    db_geofence = Geofence(**geofence.model_dump())
    db.add(db_geofence)
    db.commit()
    db.refresh(db_geofence)
    return db_geofence

@router.get("/", response_model=List[GeofenceOut])
def get_geofences(db: Session = Depends(get_db)):
    return db.query(Geofence).all()

@router.delete("/{geofence_id}")
def delete_geofence(geofence_id: int, db: Session = Depends(get_db)):
    geofence = db.query(Geofence).filter(Geofence.id == geofence_id).first()
    if not geofence:
        raise HTTPException(status_code=404, detail="Geofence not found")
    db.delete(geofence)
    db.commit()
    return {"message": "Geofence deleted"}
