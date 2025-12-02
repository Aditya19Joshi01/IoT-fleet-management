from __future__ import annotations

from datetime import datetime, timezone, timedelta
from typing import List, Optional
import json

from sqlalchemy.orm import Session
from influxdb_client import Point

from src.core.database import SessionLocal, get_influx_write_api, get_influx_query_api
from src.core.config import settings
from src.core.models import (
    Alert,
    TelemetryIn,
    TelemetryPoint,
    VehicleCreate,
    VehicleSnapshot,
    VehicleState,
    VehicleRoute,
    Geofence as GeofenceModel
)
from src.core.models_db import Vehicle as VehicleDB, Geofence as GeofenceDB
from src.core.analytics import estimate_eta_minutes, is_geofence_breached, update_idle_time

class FleetState:
    """
    Refactored FleetState that uses PostgreSQL for metadata and InfluxDB for telemetry.
    """

    def __init__(self) -> None:
        self.write_api = get_influx_write_api()
        self.query_api = get_influx_query_api()

    # -- Vehicle management (PostgreSQL) ------------------------------------
    def register_vehicle(self, config: VehicleCreate) -> VehicleState:
        db: Session = SessionLocal()
        try:
            # Check if exists
            vehicle_db = db.query(VehicleDB).filter(VehicleDB.vehicle_id == config.vehicle_id).first()
            if not vehicle_db:
                vehicle_db = VehicleDB(
                    vehicle_id=config.vehicle_id,
                    display_name=config.display_name or config.vehicle_id,
                    metadata_json=config.metadata or {}
                )
                db.add(vehicle_db)
                db.commit()
                db.refresh(vehicle_db)
            
            # Update Geofences if provided
            if config.geofence:
                # Remove old geofences for simplicity in this PoC
                db.query(GeofenceDB).filter(GeofenceDB.vehicle_id == vehicle_db.id).delete()
                
                gf = GeofenceDB(
                    name=config.geofence.name,
                    center_lat=config.geofence.center.latitude,
                    center_lng=config.geofence.center.longitude,
                    radius_m=config.geofence.radius_m,
                    vehicle_id=vehicle_db.id
                )
                db.add(gf)
                db.commit()

            return self._map_db_to_state(vehicle_db)
        finally:
            db.close()

    def delete_vehicle(self, vehicle_id: str) -> bool:
        db: Session = SessionLocal()
        try:
            vehicle_db = db.query(VehicleDB).filter(VehicleDB.vehicle_id == vehicle_id).first()
            if vehicle_db:
                db.delete(vehicle_db)
                db.commit()
                return True
            return False
        finally:
            db.close()

    def list_vehicles(self) -> List[VehicleState]:
        db: Session = SessionLocal()
        try:
            vehicles_db = db.query(VehicleDB).all()
            return [self._map_db_to_state(v) for v in vehicles_db]
        finally:
            db.close()

    def get_vehicle(self, vehicle_id: str) -> Optional[VehicleState]:
        db: Session = SessionLocal()
        try:
            vehicle_db = db.query(VehicleDB).filter(VehicleDB.vehicle_id == vehicle_id).first()
            if vehicle_db:
                return self._map_db_to_state(vehicle_db)
            return None
        finally:
            db.close()

    def _map_db_to_state(self, v_db: VehicleDB) -> VehicleState:
        # Fetch latest telemetry from InfluxDB to populate state
        last_telemetry = self._get_latest_telemetry(v_db.vehicle_id)
        
        geofences = [
            GeofenceModel(name=g.name, center_lat=g.center_lat, center_lng=g.center_lng, radius_m=g.radius_m)
            for g in v_db.geofences
        ]

        return VehicleState(
            vehicle_id=v_db.vehicle_id,
            display_name=v_db.display_name,
            metadata=v_db.metadata_json or {},
            geofences=geofences,
            last_telemetry=last_telemetry,
            created_at=v_db.created_at
        )

        if data.violent_event:
            point.field("violent_event", data.violent_event)

        self.write_api.write(bucket=settings.INFLUXDB_BUCKET, org=settings.INFLUXDB_ORG, record=point)
        
        # Broadcast update via WebSocket
        from src.core.websocket_manager import manager
        import asyncio
        
        # We need to run this async, but we are in a synchronous method (or called from async).
        # Since ingest_telemetry is synchronous in this class (it shouldn't be, but let's check usage).
        # Actually, ingest_telemetry is called by routers/telemetry.py which is async.
        # But this method is defined as def ingest_telemetry(self, data: TelemetryIn) -> None: (Sync)
        # We should make it async or use a background task.
        # For simplicity in this PoC, let's just fire and forget or use run_until_complete if loop exists?
        # No, that's dangerous.
        # Better: Make ingest_telemetry async.
        
        # Checking usage in routers/telemetry.py...
        # It calls fleet_state.ingest_telemetry(payload).
        # If I change this to async, I need to await it in router.
        
        # Let's assume I'll change it to async.
        pass

    async def ingest_telemetry(self, data: TelemetryIn) -> None:
        # Ensure vehicle exists
        if not self.get_vehicle(data.vehicle_id):
             self.register_vehicle(VehicleCreate(vehicle_id=data.vehicle_id))

        # Write to InfluxDB
        point = Point("telemetry") \
            .tag("vehicle_id", data.vehicle_id) \
            .field("latitude", data.latitude) \
            .field("longitude", data.longitude) \
            .field("speed_kmh", float(data.speed_kmh)) \
            .field("fuel_level_pct", float(data.fuel_level_pct)) \
            .field("heading_deg", float(data.heading_deg or 0.0)) \
            .field("on_route", bool(data.on_route)) \
            .time(data.timestamp or datetime.now(timezone.utc))
        
        if data.violent_event:
            point.field("violent_event", data.violent_event)

        self.write_api.write(bucket=settings.INFLUXDB_BUCKET, org=settings.INFLUXDB_ORG, record=point)
        
        # Check for alerts
        self._check_alerts(data)
        
        # Broadcast via WebSocket
        from src.core.websocket_manager import manager
        await manager.broadcast({
            "type": "telemetry_update",
            "vehicle_id": data.vehicle_id,
            "data": data.model_dump(mode='json')
        })

    def _check_alerts(self, data: TelemetryIn):
        # Simple alert check logic
        # In a real system, we might query recent history or use a stream processing engine
        
        # Check for speeding
        if data.speed_kmh > 100:
             self._push_alert(Alert(
                 vehicle_id=data.vehicle_id,
                 type="speeding",
                 message=f"Vehicle speeding at {data.speed_kmh:.1f} km/h",
                 timestamp=data.timestamp or datetime.now(timezone.utc)
             ))

        # Check for violent events
        if data.violent_event:
            self._push_alert(Alert(
                vehicle_id=data.vehicle_id,
                type="violent_event",
                message=f"Detected {data.violent_event}",
                timestamp=data.timestamp or datetime.now(timezone.utc)
            ))

    def _push_alert(self, alert: Alert) -> None:
        from src.core.models_db import Alert as AlertDB
        db: Session = SessionLocal()
        try:
            alert_db = AlertDB(
                vehicle_id=alert.vehicle_id,
                type=alert.type,
                message=alert.message,
                timestamp=alert.timestamp
            )
            db.add(alert_db)
            db.commit()
        finally:
            db.close() 

    def _get_latest_telemetry(self, vehicle_id: str) -> Optional[TelemetryPoint]:
        query = f'''
        from(bucket: "{settings.INFLUXDB_BUCKET}")
          |> range(start: -1h)
          |> filter(fn: (r) => r["_measurement"] == "telemetry")
          |> filter(fn: (r) => r["vehicle_id"] == "{vehicle_id}")
          |> last()
        '''
        tables = self.query_api.query(query, org=settings.INFLUXDB_ORG)
        
        if not tables:
            return None
            
        # Parse result (simplified)
        # Influx returns separate rows for each field. We need to aggregate.
        data = {}
        timestamp = None
        for table in tables:
            for record in table.records:
                data[record.get_field()] = record.get_value()
                timestamp = record.get_time()
        
        if not data:
            return None

        return TelemetryPoint(
            timestamp=timestamp,
            latitude=data.get("latitude") or 0.0,
            longitude=data.get("longitude") or 0.0,
            speed_kmh=data.get("speed_kmh") or 0.0,
            fuel_level_pct=data.get("fuel_level_pct") or 0.0,
            heading_deg=data.get("heading_deg"),
            on_route=data.get("on_route"),
            violent_event=data.get("violent_event")
        )

    def get_history(self, vehicle_id: str, range_str: str = "-24h") -> List[TelemetryPoint]:
        query = f'''
        from(bucket: "{settings.INFLUXDB_BUCKET}")
          |> range(start: {range_str})
          |> filter(fn: (r) => r["_measurement"] == "telemetry")
          |> filter(fn: (r) => r["vehicle_id"] == "{vehicle_id}")
          |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
        '''
        tables = self.query_api.query(query, org=settings.INFLUXDB_ORG)
        
        points = []
        for table in tables:
            for record in table.records:
                try:
                    # When using pivot, fields are columns in the record
                    # Access via record.values or record[field]
                    vals = record.values
                    points.append(TelemetryPoint(
                        timestamp=record.get_time(),
                        latitude=vals.get("latitude") or 0.0,
                        longitude=vals.get("longitude") or 0.0,
                        speed_kmh=vals.get("speed_kmh") or 0.0,
                        fuel_level_pct=vals.get("fuel_level_pct") or 0.0,
                        heading_deg=vals.get("heading_deg"),
                        on_route=vals.get("on_route"),
                        violent_event=vals.get("violent_event")
                    ))
                except Exception as e:
                    print(f"Error parsing InfluxDB record: {e}")
                    continue
        return points

    # -- Dashboard projections ----------------------------------------------
    def get_dashboard_snapshot(self) -> List[VehicleSnapshot]:
        # Get all vehicles
        vehicles = self.list_vehicles()
        snapshots = []
        
        for v in vehicles:
            if v.last_telemetry:
                snapshots.append(VehicleSnapshot(
                    vehicle_id=v.vehicle_id,
                    latitude=v.last_telemetry.latitude,
                    longitude=v.last_telemetry.longitude,
                    speed_kmh=v.last_telemetry.speed_kmh,
                    fuel_level_pct=v.last_telemetry.fuel_level_pct,
                    last_update=v.last_telemetry.timestamp,
                    total_idle_seconds=0.0, # TODO: Calculate from Influx
                    eta_minutes=0.0, # TODO: Calculate
                    on_route=v.last_telemetry.on_route
                ))
        
        return snapshots

    def get_recent_alerts(self, since_seconds: int = 3600) -> List[Alert]:
        from src.core.models_db import Alert as AlertDB
        db: Session = SessionLocal()
        try:
            cutoff = datetime.now(timezone.utc) - timedelta(seconds=since_seconds)
            alerts_db = db.query(AlertDB).filter(AlertDB.timestamp >= cutoff).order_by(AlertDB.timestamp.desc()).all()
            
            return [
                Alert(
                    vehicle_id=a.vehicle_id,
                    type=a.type,
                    message=a.message,
                    timestamp=a.timestamp
                ) for a in alerts_db
            ]
        finally:
            db.close()
