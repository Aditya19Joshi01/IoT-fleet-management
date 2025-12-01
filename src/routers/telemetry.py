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

    fleet_state.ingest_telemetry(payload)
    return {"status": "accepted"}


