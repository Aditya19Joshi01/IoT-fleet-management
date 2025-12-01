from __future__ import annotations

from collections import deque
from datetime import datetime, timedelta, timezone
from typing import Callable, Deque, Dict, List, Optional

from .analytics import estimate_eta_minutes, is_geofence_breached, update_idle_time
from .models import (
    Alert,
    Geofence,
    TelemetryIn,
    TelemetryPoint,
    VehicleCreate,
    VehicleRoute,
    VehicleSnapshot,
    VehicleState,
)


class VehicleRegistry:
    """Encapsulates all vehicle registration and lookup logic."""

    def __init__(self) -> None:
        self._vehicles: Dict[str, VehicleState] = {}

    def register(self, config: VehicleCreate) -> VehicleState:
        vehicle = self._vehicles.get(config.vehicle_id)
        if vehicle is None:
            vehicle = VehicleState(
                vehicle_id=config.vehicle_id,
                display_name=config.display_name or config.vehicle_id,
            )
            self._vehicles[vehicle.vehicle_id] = vehicle

        self._apply_config(vehicle, config)
        return vehicle

    def _apply_config(self, vehicle: VehicleState, config: VehicleCreate) -> None:
        if config.display_name:
            vehicle.display_name = config.display_name

        if config.metadata:
            vehicle.metadata.update(config.metadata)

        if config.route:
            vehicle.assigned_route = VehicleRoute(
                route_id=f"{vehicle.vehicle_id}-route",
                name=config.route.name or f"{vehicle.vehicle_id} Route",
                waypoints=[],
                destination=(
                    config.route.destination.latitude,
                    config.route.destination.longitude,
                ),
            )

        if config.geofence:
            vehicle.geofences = [
                Geofence(
                    name=config.geofence.name,
                    center_lat=config.geofence.center.latitude,
                    center_lng=config.geofence.center.longitude,
                    radius_m=config.geofence.radius_m,
                )
            ]

        if config.initial_position and vehicle.last_telemetry is None:
            vehicle.last_telemetry = TelemetryPoint(
                timestamp=datetime.now(timezone.utc),
                latitude=config.initial_position.latitude,
                longitude=config.initial_position.longitude,
                speed_kmh=0.0,
                fuel_level_pct=100.0,
            )

    def get(self, vehicle_id: str) -> Optional[VehicleState]:
        return self._vehicles.get(vehicle_id)

    def list(self) -> List[VehicleState]:
        return list(self._vehicles.values())

    def ensure(self, vehicle_id: str, initializer: Optional[Callable[[], VehicleState]] = None) -> VehicleState:
        vehicle = self._vehicles.get(vehicle_id)
        if vehicle is None:
            vehicle = initializer() if initializer else VehicleState(
                vehicle_id=vehicle_id, display_name=vehicle_id
            )
            self._vehicles[vehicle_id] = vehicle
        return vehicle


class AlertLog:
    """Keeps a rolling buffer of recent alerts."""

    def __init__(self, max_alerts: int = 200) -> None:
        self._alerts: Deque[Alert] = deque(maxlen=max_alerts)

    def add(self, alert: Alert) -> None:
        self._alerts.append(alert)

    def recent(self, since_seconds: int) -> List[Alert]:
        cutoff = datetime.now(timezone.utc) - timedelta(seconds=since_seconds)
        return [alert for alert in self._alerts if alert.timestamp >= cutoff]


class FleetState:
    """
    Fleet orchestrator that wires together vehicle registry, telemetry ingestion,
    alert tracking, and dashboard projections.
    """

    def __init__(self) -> None:
        self.vehicle_registry = VehicleRegistry()
        self.alert_log = AlertLog()

    # -- Vehicle management -------------------------------------------------
    def register_vehicle(self, config: VehicleCreate) -> VehicleState:
        return self.vehicle_registry.register(config)

    def list_vehicles(self) -> List[VehicleState]:
        return self.vehicle_registry.list()

    def get_vehicle(self, vehicle_id: str) -> Optional[VehicleState]:
        return self.vehicle_registry.get(vehicle_id)

    # -- Telemetry ingestion ------------------------------------------------
    def ingest_telemetry(self, data: TelemetryIn) -> None:
        vehicle = self.vehicle_registry.get(data.vehicle_id)
        if vehicle is None:
            vehicle = self.vehicle_registry.register(
                VehicleCreate(vehicle_id=data.vehicle_id, display_name=data.vehicle_id)
            )

        point = TelemetryPoint(
            timestamp=data.timestamp or datetime.now(timezone.utc),
            latitude=data.latitude,
            longitude=data.longitude,
            speed_kmh=data.speed_kmh,
            fuel_level_pct=data.fuel_level_pct,
            heading_deg=data.heading_deg,
            on_route=data.on_route,
            violent_event=data.violent_event,
        )

        self._ensure_defaults(vehicle, point)

        update_idle_time(vehicle, point)
        vehicle.telemetry_history.append(point)
        if len(vehicle.telemetry_history) > 500:
            vehicle.telemetry_history = vehicle.telemetry_history[-500:]

        vehicle.last_telemetry = point

        self._evaluate_alerts(vehicle, point)

    def _ensure_defaults(self, vehicle: VehicleState, point: TelemetryPoint) -> None:
        """
        Provide fallback route/geofence so analytics don't break if the vehicle
        was never configured through the UI.
        """
        if vehicle.assigned_route is None:
            vehicle.assigned_route = VehicleRoute(
                route_id=f"{vehicle.vehicle_id}-default",
                name="Default Demo Route",
                waypoints=[],
                destination=(point.latitude, point.longitude),
            )

        if not vehicle.geofences:
            vehicle.geofences.append(
                Geofence(
                    name="Default Geofence",
                    center_lat=point.latitude,
                    center_lng=point.longitude,
                    radius_m=500.0,
                )
            )

    # -- Alerting -----------------------------------------------------------
    def _push_alert(self, alert: Alert) -> None:
        self.alert_log.add(alert)

    def _evaluate_alerts(self, vehicle: VehicleState, point: TelemetryPoint) -> None:
        if point.speed_kmh < 1.0 and vehicle.total_idle_seconds > 5 * 60:
            self._push_alert(
                Alert(
                    vehicle_id=vehicle.vehicle_id,
                    type="idle_too_long",
                    message="Vehicle has been idle for more than 5 minutes.",
                    timestamp=point.timestamp,
                )
            )

        if point.on_route is False:
            self._push_alert(
                Alert(
                    vehicle_id=vehicle.vehicle_id,
                    type="off_route",
                    message="Vehicle has left its assigned route.",
                    timestamp=point.timestamp,
                )
            )

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

    # -- Dashboard projections ----------------------------------------------
    def get_dashboard_snapshot(self) -> List[VehicleSnapshot]:
        snapshots: List[VehicleSnapshot] = []
        for vehicle in self.vehicle_registry.list():
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
        return self.alert_log.recent(since_seconds)


