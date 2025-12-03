from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID

class VehicleTelemetry(BaseModel):
    vehicle_id: str
    latitude: float
    longitude: float
    speed: float
    fuel_level: Optional[float] = None
    engine_temp: Optional[float] = None
    heading: Optional[float] = None
    status: Optional[str] = "unknown"
    timestamp: datetime

class VehicleSummary(BaseModel):
    vehicle_id: str
    latitude: float
    longitude: float
    speed: float
    fuel_level: Optional[float]
    engine_temp: Optional[float]
    heading: Optional[float]
    status: str
    last_update: datetime

class Geofence(BaseModel):
    id: Optional[UUID] = None
    name: str
    center_lat: float
    center_lng: float
    radius_meters: float
    color: str = "#3B82F6"
