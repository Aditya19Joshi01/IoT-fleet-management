from __future__ import annotations

from datetime import datetime
from typing import Optional

from geopy.distance import distance as geo_distance

from .models import TelemetryPoint, VehicleRoute, VehicleState


def _haversine_km(p1: TelemetryPoint, p2: TelemetryPoint) -> float:
    return geo_distance((p1.latitude, p1.longitude), (p2.latitude, p2.longitude)).km


def estimate_eta_minutes(vehicle: VehicleState) -> Optional[float]:
    """
    Very rough ETA:
    - Use last telemetry and destination from assigned_route
    - ETA = distance / max(speed, 5 km/h) in minutes
    """
    if not vehicle.last_telemetry or not vehicle.assigned_route:
        return None

    dest_lat, dest_lng = vehicle.assigned_route.destination
    current = vehicle.last_telemetry
    km_remaining = geo_distance(
        (current.latitude, current.longitude), (dest_lat, dest_lng)
    ).km

    speed = max(current.speed_kmh, 5.0)
    hours = km_remaining / speed
    return hours * 60.0


def update_idle_time(vehicle: VehicleState, new_point: TelemetryPoint) -> None:
    """
    Increase idle time when speed is ~0 between two telemetry points.
    """
    if vehicle.last_telemetry is None:
        vehicle.last_movement_timestamp = new_point.timestamp
        return

    prev = vehicle.last_telemetry
    dt = (new_point.timestamp - prev.timestamp).total_seconds()
    if dt <= 0:
        return

    if new_point.speed_kmh < 1.0:
        vehicle.total_idle_seconds += dt


def is_geofence_breached(
    lat: float, lng: float, geofence_center: tuple[float, float], radius_m: float
) -> bool:
    dist_m = geo_distance((lat, lng), geofence_center).m
    return dist_m > radius_m


def compute_simple_route_efficiency(vehicle: VehicleState) -> Optional[float]:
    """
    Simplified route efficiency:
    - ratio of straight-line distance from start to current vs.
      sum of segment distances in history.
    """
    if len(vehicle.telemetry_history) < 2:
        return None

    history = vehicle.telemetry_history
    start = history[0]
    end = history[-1]

    beeline_km = _haversine_km(start, end)
    if beeline_km == 0:
        return None

    path_km = 0.0
    for p1, p2 in zip(history[:-1], history[1:]):
        path_km += _haversine_km(p1, p2)

    return max(0.0, min(1.0, beeline_km / path_km)) if path_km > 0 else None


