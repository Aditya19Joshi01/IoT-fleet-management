from pydantic import BaseModel
from datetime import datetime
from typing import Optional

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
