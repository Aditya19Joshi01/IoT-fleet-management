## IoT Fleet Management PoC

This proof-of-concept demonstrates an end-to-end IoT fleet analytics flow:

- Async simulator sends GPS + speed + fuel telemetry (acting as MQTT ➜ AWS IoT Core ➜ Kinesis).
- FastAPI backend ingests the stream, maintains an in-memory fleet graph, and computes KPIs such as ETA, idle time, and geofence breaches.
- REST APIs expose the fleet snapshot, recent alerts, and a UI-ready vehicle registry so operators can onboard trucks from the product UI later.

### Project layout

- `src/api/main.py` – FastAPI application factory, router wiring, app lifespan hook.
- `src/core/models.py` – Pydantic + dataclass domain models shared across services.
- `src/core/state.py` – Modular `FleetState`, `VehicleRegistry`, and `AlertLog` orchestration.
- `src/routers/*` – REST routers (`telemetry`, `vehicles`, `dashboard`).
- `src/simulator/simple_simulator.py` – Async telemetry generator for local testing.

### Running locally

```powershell
cd C:\Users\ajhas\Desktop\Projects\iot-fleet-management
.\.venv\Scripts\activate
uvicorn src.api.main:app --reload
```

Optional: run the simulator in a separate shell:

```powershell
.\.venv\Scripts\activate
python -m src.simulator.simple_simulator
```

### Registering vehicles (UI-ready API)

Use the new vehicles router to onboard trucks before telemetry arrives. Example:

```http
POST http://localhost:8000/api/vehicles
Content-Type: application/json

{
  "vehicle_id": "truck-003",
  "display_name": "Dallas Shuttle",
  "route": {
    "name": "Dallas ➜ Austin",
    "destination": { "latitude": 30.2672, "longitude": -97.7431 }
  },
  "geofence": {
    "name": "Dallas Depot",
    "center": { "latitude": 32.7767, "longitude": -96.7970 },
    "radius_m": 750
  }
}
```

Responses (from `POST`, `GET /api/vehicles`, `GET /api/vehicles/{id}`) return `VehicleInfo` objects with metadata, route, geofences, and last telemetry timestamps, making it straightforward for a UI to list and edit assets.

### Dashboard snapshot

```
GET http://localhost:8000/api/dashboard/snapshot
```

Returns live `vehicles` (location, speed, fuel, idle seconds, ETA) plus `alerts`.

### Extending

- Replace the in-memory `FleetState` with a persistent store (PostgreSQL + Redis) while keeping the registry/telemetry interfaces intact.
- Swap the HTTP simulator with a real MQTT/Kinesis consumer that calls `FleetState.ingest_telemetry`.
- Build a frontend to hit `/api/vehicles` for CRUD operations and `/api/dashboard/snapshot` for the live map.


