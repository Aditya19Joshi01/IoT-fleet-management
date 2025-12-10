import pytest

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test session."""
    import asyncio
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()
