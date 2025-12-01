from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import List, Optional

from pydantic import BaseModel, Field


class LatLng(BaseModel):
    latitude: float
    longitude: float


class RouteConfig(BaseModel):
    name: str | None = None
    destination: LatLng


class GeofenceConfig(BaseModel):
    name: str
    center: LatLng
    radius_m: float


class VehicleCreate(BaseModel):
    vehicle_id: str
    display_name: str | None = None
    initial_position: LatLng | None = None
    route: RouteConfig | None = None
    geofence: GeofenceConfig | None = None
    metadata: dict[str, str] | None = None


class TelemetryIn(BaseModel):
    vehicle_id: str
    timestamp: datetime | None = None
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
    display_name: Optional[str] = None
    last_telemetry: Optional[TelemetryPoint] = None
    telemetry_history: List[TelemetryPoint] = field(default_factory=list)
    total_idle_seconds: float = 0.0
    last_movement_timestamp: Optional[datetime] = None
    assigned_route: Optional[VehicleRoute] = None
    geofences: List[Geofence] = field(default_factory=list)
    last_geofence_breach: Optional[datetime] = None
    last_violent_event: Optional[datetime] = None
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    metadata: dict[str, str] = field(default_factory=dict)


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


class VehicleInfo(BaseModel):
    vehicle_id: str
    display_name: str | None = None
    created_at: datetime
    last_update: datetime | None = None
    route_destination: LatLng | None = None
    geofences: list[GeofenceConfig] = Field(default_factory=list)
    metadata: dict[str, str] = Field(default_factory=dict)

    @classmethod
    def from_state(cls, vehicle: VehicleState) -> VehicleInfo:
        destination = None
        if vehicle.assigned_route:
            lat, lng = vehicle.assigned_route.destination
            destination = LatLng(latitude=lat, longitude=lng)

        geofences = [
            GeofenceConfig(
                name=gf.name,
                center=LatLng(latitude=gf.center_lat, longitude=gf.center_lng),
                radius_m=gf.radius_m,
            )
            for gf in vehicle.geofences
        ]

        last_update = vehicle.last_telemetry.timestamp if vehicle.last_telemetry else None

        return cls(
            vehicle_id=vehicle.vehicle_id,
            display_name=vehicle.display_name,
            created_at=vehicle.created_at,
            last_update=last_update,
            route_destination=destination,
            geofences=geofences,
            metadata=vehicle.metadata,
        )


