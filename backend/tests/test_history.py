import pytest
from datetime import datetime, timedelta
from app.main import app
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_route_history_endpoint():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # 1. Setup - assume we might need to mock DB or rely on existing data.
        # Ideally we'd insert a point first, but for now we test the query structure/response code.
        
        # Test 422 for missing params
        response = await ac.get("/vehicles/test-vehicle/route-history")
        assert response.status_code == 422 # Validation error
        
        # Test valid request (even if empty result)
        end = datetime.now()
        start = end - timedelta(hours=1)
        
        response = await ac.get(
            f"/vehicles/test-vehicle/route-history",
            params={
                "start_time": start.isoformat(),
                "end_time": end.isoformat()
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
