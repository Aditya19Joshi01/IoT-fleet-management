from __future__ import annotations

from collections import deque
from datetime import datetime, timedelta
from typing import Deque, Dict, List

from .analytics import estimate_eta_minutes, update_idle_time, is_geofence_breached
from .models import Alert, TelemetryIn, TelemetryPoint, VehicleSnapshot, VehicleState


class FleetState:
    """
    In-memory fleet state for the PoC.
    In production this would live in a DB + cache.
    """

    def __init__(self) -> None:
        self.vehicles: Dict[str, VehicleState] = {}
        self.recent_alerts: Deque[Alert] = deque(maxlen=200)

    def ingest_telemetry(self, data: TelemetryIn) -> None:
        vehicle = self.vehicles.get(data.vehicle_id)
        if not vehicle:
            vehicle = VehicleState(vehicle_id=data.vehicle_id)
            self.vehicles[data.vehicle_id] = vehicle

        point = TelemetryPoint(
            timestamp=data.timestamp,
            latitude=data.latitude,
            longitude=data.longitude,
            speed_kmh=data.speed_kmh,
            fuel_level_pct=data.fuel_level_pct,
            heading_deg=data.heading_deg,
            on_route=data.on_route,
            violent_event=data.violent_event,
        )

        update_idle_time(vehicle, point)
        vehicle.telemetry_history.append(point)
        # Keep last N points for efficiency calculations
        if len(vehicle.telemetry_history) > 500:
            vehicle.telemetry_history = vehicle.telemetry_history[-500:]

        vehicle.last_telemetry = point

        self._evaluate_alerts(vehicle, point)

    def _push_alert(self, alert: Alert) -> None:
        self.recent_alerts.append(alert)

    def _evaluate_alerts(self, vehicle: VehicleState, point: TelemetryPoint) -> None:
        # Idle too long (e.g. > 5 minutes)
        if point.speed_kmh < 1.0 and vehicle.total_idle_seconds > 5 * 60:
            self._push_alert(
                Alert(
                    vehicle_id=vehicle.vehicle_id,
                    type="idle_too_long",
                    message="Vehicle has been idle for more than 5 minutes.",
                    timestamp=point.timestamp,
                )
            )

        # Off route (simple flag from device/simulator)
        if point.on_route is False:
            self._push_alert(
                Alert(
                    vehicle_id=vehicle.vehicle_id,
                    type="off_route",
                    message="Vehicle has left its assigned route.",
                    timestamp=point.timestamp,
                )
            )

        # Violent acceleration / braking
        if point.violent_event:
            vehicle.last_violent_event = point.timestamp
            self._push_alert(
                Alert(
                    vehicle_id=vehicle.vehicle_id,
                    type="violent_event",
                    message=f"Detected {point.violent_event.replace('_', ' ')}.",
                    timestamp=point.timestamp,
                )
            )

        # Geofence breaches
        for geofence in vehicle.geofences:
            if is_geofence_breached(
                point.latitude,
                point.longitude,
                (geofence.center_lat, geofence.center_lng),
                geofence.radius_m,
            ):
                vehicle.last_geofence_breach = point.timestamp
                self._push_alert(
                    Alert(
                        vehicle_id=vehicle.vehicle_id,
                        type="geofence_breach",
                        message=f"Vehicle left geofenced area '{geofence.name}'.",
                        timestamp=point.timestamp,
                    )
                )

    def get_dashboard_snapshot(self) -> List[VehicleSnapshot]:
        snapshots: List[VehicleSnapshot] = []
        for vehicle in self.vehicles.values():
            if not vehicle.last_telemetry:
                continue
            last = vehicle.last_telemetry
            eta = estimate_eta_minutes(vehicle)
            snapshots.append(
                VehicleSnapshot(
                    vehicle_id=vehicle.vehicle_id,
                    latitude=last.latitude,
                    longitude=last.longitude,
                    speed_kmh=last.speed_kmh,
                    fuel_level_pct=last.fuel_level_pct,
                    last_update=last.timestamp,
                    total_idle_seconds=vehicle.total_idle_seconds,
                    eta_minutes=eta,
                    on_route=last.on_route,
                )
            )
        return snapshots

    def get_recent_alerts(self, since_seconds: int = 3600) -> List[Alert]:
        cutoff = datetime.utcnow() - timedelta(seconds=since_seconds)
        return [a for a in self.recent_alerts if a.timestamp >= cutoff]


