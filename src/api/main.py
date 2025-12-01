from contextlib import asynccontextmanager
from fastapi import FastAPI

from src.core.state import FleetState
from src.routers import dashboard, telemetry, vehicles


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    from src.core.database import engine, Base, wait_for_db
    wait_for_db(retries=10, delay=3)
    Base.metadata.create_all(bind=engine)
    
    # Initialize global in-memory fleet state (Refactored to use DB internally)
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

    from fastapi.middleware.cors import CORSMiddleware

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    from src.routers import auth, websocket, geofences
    app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
    app.include_router(websocket.router, prefix="/api/ws", tags=["websocket"])
    app.include_router(telemetry.router, prefix="/api/telemetry", tags=["telemetry"])
    app.include_router(vehicles.router, prefix="/api/vehicles", tags=["vehicles"])
    app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
    app.include_router(geofences.router, prefix="/api/geofences", tags=["geofences"])

    return app


app = create_app()


