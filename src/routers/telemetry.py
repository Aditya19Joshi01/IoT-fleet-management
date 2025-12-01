from datetime import datetime

from fastapi import APIRouter, Depends, Request, status

from src.core.models import TelemetryIn
from src.core.state import FleetState

router = APIRouter()


def get_fleet_state(request: Request) -> FleetState:
    return request.app.state.fleet_state  # type: ignore[attr-defined]


@router.post(
    "/ingest",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Ingest telemetry from a vehicle (simulating MQTT/Kinesis consumer).",
)
async def ingest_telemetry(
    payload: TelemetryIn, fleet_state: FleetState = Depends(get_fleet_state)
) -> dict:
    """
    Basic ingestion endpoint.
    In a real system, this would be fed by an MQTT → IoT Core → Kinesis pipeline.
    """
    # Ensure timestamp if not provided by simulator (fallback)
    if payload.timestamp is None:
        payload.timestamp = datetime.utcnow()

    await fleet_state.ingest_telemetry(payload)
    return {"status": "accepted"}


    await fleet_state.ingest_telemetry(payload)
    return {"status": "accepted"}


@router.get(
    "/history/{vehicle_id}",
    summary="Get historical telemetry for a vehicle.",
)
async def get_history(
    vehicle_id: str, fleet_state: FleetState = Depends(get_fleet_state)
) -> list[dict]:
    points = fleet_state.get_history(vehicle_id)
    # Convert dataclasses to dicts for JSON response
    return [
        {
            "timestamp": p.timestamp,
            "speed_kmh": p.speed_kmh,
            "fuel_level_pct": p.fuel_level_pct,
            "latitude": p.latitude,
            "longitude": p.longitude
        }
        for p in points
    ]
