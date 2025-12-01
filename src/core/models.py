from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class TelemetryIn(BaseModel):
    vehicle_id: str
    timestamp: datetime
    latitude: float
    longitude: float
    speed_kmh: float
    fuel_level_pct: float
    heading_deg: float | None = None
    on_route: bool | None = None
    violent_event: str | None = None  # e.g. 'hard_brake', 'hard_accel'


@dataclass
class TelemetryPoint:
    timestamp: datetime
    latitude: float
    longitude: float
    speed_kmh: float
    fuel_level_pct: float
    heading_deg: Optional[float] = None
    on_route: Optional[bool] = None
    violent_event: Optional[str] = None


@dataclass
class Geofence:
    name: str
    center_lat: float
    center_lng: float
    radius_m: float


@dataclass
class VehicleRoute:
    route_id: str
    name: str
    waypoints: List[tuple[float, float]]  # (lat, lng)
    destination: tuple[float, float]


@dataclass
class VehicleState:
    vehicle_id: str
    last_telemetry: Optional[TelemetryPoint] = None
    telemetry_history: List[TelemetryPoint] = field(default_factory=list)
    total_idle_seconds: float = 0.0
    last_movement_timestamp: Optional[datetime] = None
    assigned_route: Optional[VehicleRoute] = None
    geofences: List[Geofence] = field(default_factory=list)
    last_geofence_breach: Optional[datetime] = None
    last_violent_event: Optional[datetime] = None


class Alert(BaseModel):
    vehicle_id: str
    type: str
    message: str
    timestamp: datetime


class VehicleSnapshot(BaseModel):
    vehicle_id: str
    latitude: float
    longitude: float
    speed_kmh: float
    fuel_level_pct: float
    last_update: datetime
    total_idle_seconds: float
    eta_minutes: float | None = None
    on_route: bool | None = None


class DashboardState(BaseModel):
    vehicles: list[VehicleSnapshot]
    alerts: list[Alert]


