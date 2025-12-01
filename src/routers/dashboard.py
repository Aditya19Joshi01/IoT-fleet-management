from fastapi import APIRouter, Depends, Request

from src.core.models import DashboardState
from src.core.state import FleetState

router = APIRouter()


def get_fleet_state(request: Request) -> FleetState:
    return request.app.state.fleet_state  # type: ignore[attr-defined]


@router.get("/snapshot", response_model=DashboardState)
async def get_dashboard_snapshot(
    fleet_state: FleetState = Depends(get_fleet_state),
) -> DashboardState:
    """
    High-level snapshot for a dashboard:
    - Live vehicle locations and basic KPIs
    - Recent alerts
    """
    vehicles = fleet_state.get_dashboard_snapshot()
    alerts = fleet_state.get_recent_alerts()
    return DashboardState(vehicles=vehicles, alerts=alerts)


