"""
Very simple vehicle telemetry simulator.

This does NOT use MQTT/AWS directly; instead it emulates the
MQTT → IoT Core → Kinesis → backend consumer by sending HTTP
requests to the FastAPI ingestion endpoint.
"""

import asyncio
import math
from datetime import datetime, timezone
from typing import Tuple, Optional

import httpx
import os

BASE_URL = os.getenv("INGEST_URL", "http://localhost:8000/api/telemetry/ingest").rsplit("/api", 1)[0]
INGEST_URL = os.getenv("INGEST_URL", "http://localhost:8000/api/telemetry/ingest")

USERNAME = "simulator"
PASSWORD = "simulator_password"

async def get_access_token() -> Optional[str]:
    async with httpx.AsyncClient(timeout=10.0) as client:
        # 1. Try to register (ignore if exists)
        try:
            await client.post(
                f"{BASE_URL}/api/auth/register",
                json={"username": USERNAME, "password": PASSWORD}
            )
        except Exception:
            pass # Likely already registered

        # 2. Login
        try:
            resp = await client.post(
                f"{BASE_URL}/api/auth/token",
                data={"username": USERNAME, "password": PASSWORD}
            )
            resp.raise_for_status()
            return resp.json()["access_token"]
        except Exception as e:
            print(f"[Simulator] Auth failed: {e}")
            return None

async def simulate_vehicle(
    vehicle_id: str,
    center: Tuple[float, float],
    token: str,
    radius_km: float = 2.0,
    period_seconds: int = 5,
) -> None:
    lat0, lng0 = center
    angle = 0.0
    
    headers = {"Authorization": f"Bearer {token}"} if token else {}

    async with httpx.AsyncClient(timeout=5.0, headers=headers) as client:
        while True:
            # Move in a slow circle around the center
            angle += math.radians(10)
            lat = lat0 + (radius_km / 111.0) * math.cos(angle)
            lng = lng0 + (radius_km / 111.0) * math.sin(angle)

            # Speed pattern and events
            speed = 40 + 10 * math.sin(angle * 2)
            fuel = max(5.0, 100.0 - (angle * 2) % 100)

            # Simulate occasional hard braking
            violent_event = None
            if int(angle * 10) % 50 == 0:
                violent_event = "hard_brake"

            # Simulate off-route events when angle in certain range
            on_route = not (math.sin(angle) > 0.8)

            payload = {
                "vehicle_id": vehicle_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "latitude": lat,
                "longitude": lng,
                "speed_kmh": max(0.0, speed),
                "fuel_level_pct": fuel,
                "heading_deg": (math.degrees(angle) % 360),
                "on_route": on_route,
                "violent_event": violent_event,
            }

            try:
                resp = await client.post(INGEST_URL, json=payload)
                resp.raise_for_status()
                print(f"[{vehicle_id}] sent telemetry, status={resp.status_code}")
            except Exception as exc:  # noqa: BLE001
                print(f"[{vehicle_id}] error sending telemetry: {exc}")

            await asyncio.sleep(period_seconds)


async def main() -> None:
    # Wait for backend to be ready
    print("[Simulator] Waiting for backend...")
    await asyncio.sleep(5)
    
    token = await get_access_token()
    if token:
        print("[Simulator] Authenticated successfully")
    else:
        print("[Simulator] Warning: Running without auth token")

    # Two demo vehicles in slightly different areas
    tasks = [
        simulate_vehicle("truck-001", (37.7749, -122.4194), token),  # SF Market St
        simulate_vehicle("truck-002", (37.7849, -122.4094), token),  # SF Union Square
    ]
    await asyncio.gather(*tasks)


if __name__ == "__main__":
    asyncio.run(main())


