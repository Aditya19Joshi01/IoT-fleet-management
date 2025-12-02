from fastapi import APIRouter, Depends, HTTPException, Request, status
from src.core.models import VehicleCreate, VehicleInfo
from src.core.state import FleetState
from src.routers.auth import get_current_user

router = APIRouter(dependencies=[Depends(get_current_user)])


def get_fleet_state(request: Request) -> FleetState:
    return request.app.state.fleet_state  # type: ignore[attr-defined]


@router.post(
    "/",
    response_model=VehicleInfo,
    status_code=status.HTTP_201_CREATED,
    summary="Register or update a vehicle configuration.",
)
async def register_vehicle(
    payload: VehicleCreate, fleet_state: FleetState = Depends(get_fleet_state)
) -> VehicleInfo:
    vehicle = fleet_state.register_vehicle(payload)
    return VehicleInfo.from_state(vehicle)


@router.get(
    "/",
    response_model=list[VehicleInfo],
    summary="List all registered vehicles.",
)
async def list_vehicles(
    fleet_state: FleetState = Depends(get_fleet_state),
) -> list[VehicleInfo]:
    vehicles = fleet_state.list_vehicles()
    return [VehicleInfo.from_state(v) for v in vehicles]


@router.get(
    "/{vehicle_id}",
    response_model=VehicleInfo,
    summary="Retrieve configuration and status for a single vehicle.",
)
async def get_vehicle(
    vehicle_id: str, fleet_state: FleetState = Depends(get_fleet_state)
) -> VehicleInfo:
    vehicle = fleet_state.get_vehicle(vehicle_id)
    if vehicle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found"
        )
    return VehicleInfo.from_state(vehicle)

@router.delete(
    "/{vehicle_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a vehicle from the registry.",
)
async def delete_vehicle(
    vehicle_id: str, fleet_state: FleetState = Depends(get_fleet_state)
) -> None:
    success = fleet_state.delete_vehicle(vehicle_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found"
        )
