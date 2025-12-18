import os
import sys
# Ensure backend is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime

# --- Mock Data ---
SAMPLE_VEHICLE = {
    "vehicle_id": "vehicle-1",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "speed": 60.5,
    "fuel_level": 80.0,
    "engine_temp": 90.0,
    "heading": 180.0,
    "status": "moving",
    "last_update": datetime.now(),
    "time": datetime.now()
}

SAMPLE_GEOFENCE = {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "HQ",
    "center_lat": 40.7128,
    "center_lng": -74.0060,
    "radius_meters": 100.0,
    "color": "#FF0000",
    "created_at": datetime.now()
}

SAMPLE_ANALYTICS_SPEED = {"bucket": datetime.now(), "avg_speed": 55.0, "max_speed": 70.0}
SAMPLE_ANALYTICS_FUEL = {"vehicle_id": "truck-1", "consumption": 10.5}
SAMPLE_ANALYTICS_DISTANCE = {"bucket": datetime.now(), "estimated_km": 150.0}
SAMPLE_ANALYTICS_IDLE = {"status": "moving", "count": 5}

# --- Fixtures ---

@pytest.fixture(scope="module")
def mock_pool_conn():
    mock_conn = AsyncMock()
    
    # Mock Pool Object (Synchronous object, but methods might be async)
    mock_pool = MagicMock()
    
    # Mock Context Manager for acquire()
    mock_acquire_cm = MagicMock()
    mock_acquire_cm.__aenter__ = AsyncMock(return_value=mock_conn)
    mock_acquire_cm.__aexit__ = AsyncMock(return_value=None)
    
    mock_pool.acquire.return_value = mock_acquire_cm
    
    # Ensure close() is awaitable for shutdown event
    mock_pool.close = AsyncMock(return_value=None)
    
    return mock_pool, mock_conn

@pytest.fixture(scope="module")
def client(mock_pool_conn):
    mock_pool, _ = mock_pool_conn
    
    # Patch asyncpg.create_pool to serve our mock pool
    # create_pool is called with await, so proper mock needs to be AsyncMock 
    # OR a MagicMock that returns a Custom Awaitable.
    # Using AsyncMock as the patch object is safest for async functions.
    mock_create_pool = AsyncMock(return_value=mock_pool)

    with patch("asyncpg.create_pool", new=mock_create_pool):
        # Patch MQTT
        with patch("paho.mqtt.client.Client"):
            # Patch RedisManager
            with patch("app.redis_manager.redis_manager") as mock_redis:
                # Setup default Redis mock behavior
                mock_redis.get_all_vehicles = AsyncMock(return_value=[])
                mock_redis.get_stats = AsyncMock(return_value={})
                mock_redis.connect = AsyncMock()
                mock_redis.close = AsyncMock()
                
                try:
                    from main import app
                except ImportError:
                    from backend.main import app
                
                # Make Redis mock accessible via client.redis_mock
                from fastapi.testclient import TestClient
                with TestClient(app) as test_client:
                    test_client.redis_mock = mock_redis
                    yield test_client

@pytest.fixture(autouse=True)
def reset_mock(mock_pool_conn):
    _, mock_conn = mock_pool_conn
    mock_conn.reset_mock()
    # Default behavior
    mock_conn.fetch.return_value = []
    mock_conn.fetchrow.return_value = None
    mock_conn.execute.return_value = "INSERT 0 1"
    return mock_conn

# --- Tests ---

def test_read_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "online", "version": "2.0"}

# -- Vehicles Router --

def test_get_vehicles(client, reset_mock):
    # Mock Redis return instead of DB
    client.redis_mock.get_all_vehicles.return_value = [SAMPLE_VEHICLE]
    
    response = client.get("/vehicles")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["vehicle_id"] == "vehicle-1"

def test_get_vehicle_history(client, reset_mock):
    reset_mock.fetch.return_value = [SAMPLE_VEHICLE]
    response = client.get("/history/vehicle-1")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1

def test_get_dashboard_stats(client, reset_mock):
    # Mock Redis return
    client.redis_mock.get_stats.return_value = {
        "total_vehicles": 1,
        "active_vehicles": 1,
        "idle_vehicles": 0,
        "offline_vehicles": 0,
        "avg_speed": 60.5
    }
    
    response = client.get("/dashboard/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["total_vehicles"] == 1
    assert data["active_vehicles"] == 1

# -- Analytics Router --

def test_get_speed_trend(client, reset_mock):
    reset_mock.fetch.return_value = [SAMPLE_ANALYTICS_SPEED]
    response = client.get("/analytics/speed-trend?range=24h")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert "avgSpeed" in data[0]

def test_get_distance_stats(client, reset_mock):
    reset_mock.fetch.return_value = [SAMPLE_ANALYTICS_DISTANCE]
    response = client.get("/analytics/distance")
    assert response.status_code == 200
    data = response.json()
    assert "distance" in data[0]

def test_get_fuel_stats(client, reset_mock):
    reset_mock.fetch.return_value = [SAMPLE_ANALYTICS_FUEL]
    response = client.get("/analytics/fuel")
    assert response.status_code == 200
    data = response.json()
    assert data[0]["consumption"] == 10.5

def test_get_idle_stats(client, reset_mock):
    reset_mock.fetch.return_value = [SAMPLE_ANALYTICS_IDLE]
    response = client.get("/analytics/idle")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert data[0]["name"] == "Moving" # Capitalized in endpoint

# -- Geofences Router --

def test_get_geofences(client, reset_mock):
    reset_mock.fetch.return_value = [SAMPLE_GEOFENCE]
    response = client.get("/geofences")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == SAMPLE_GEOFENCE["id"]

def test_create_geofence(client, reset_mock):
    reset_mock.fetchrow.return_value = SAMPLE_GEOFENCE
    new_geofence = {
        "name": "New Zone",
        "center_lat": 10.0,
        "center_lng": 10.0,
        "radius_meters": 500,
        "color": "#00FF00"
    }
    response = client.post("/geofences", json=new_geofence)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "HQ"

def test_delete_geofence(client, reset_mock):
    reset_mock.execute.return_value = "DELETE 1"
    response = client.delete("/geofences/123e4567-e89b-12d3-a456-426614174000")
    assert response.status_code == 200
    assert response.json()["status"] == "success"

def test_delete_geofence_not_found(client, reset_mock):
    reset_mock.execute.return_value = "DELETE 0"
    response = client.delete("/geofences/123e4567-e89b-12d3-a456-426614174000")
    assert response.status_code == 404
