from contextlib import asynccontextmanager
from fastapi import FastAPI

from src.core.state import FleetState
from src.routers import dashboard, telemetry, vehicles


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize global in-memory fleet state
    app.state.fleet_state = FleetState()
    yield
    # Here we could persist state or gracefully close resources


def create_app() -> FastAPI:
    app = FastAPI(
        title="IoT Fleet Management PoC",
        description=(
            "Proof-of-concept backend for an IoT fleet management platform. "
            "Simulates ingestion of telemetry and real-time analytics."
        ),
        version="0.1.0",
        lifespan=lifespan,
    )

    app.include_router(telemetry.router, prefix="/api/telemetry", tags=["telemetry"])
    app.include_router(vehicles.router, prefix="/api/vehicles", tags=["vehicles"])
    app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])

    return app


app = create_app()


