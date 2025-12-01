from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from influxdb_client import InfluxDBClient
from influxdb_client.client.write_api import SYNCHRONOUS

from src.core.config import settings

# PostgreSQL Setup
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def wait_for_db(retries: int = 5, delay: int = 2) -> None:
    import time
    from sqlalchemy.exc import OperationalError
    
    print("Checking database connection...")
    for i in range(retries):
        try:
            # Try to create a connection
            with engine.connect() as conn:
                print("Database connection established.")
                return
        except OperationalError:
            print(f"Database unavailable, retrying in {delay}s... ({i+1}/{retries})")
            time.sleep(delay)
    
    raise Exception("Could not connect to the database after multiple retries.")

# InfluxDB Setup
influx_client = InfluxDBClient(
    url=settings.INFLUXDB_URL,
    token=settings.INFLUXDB_TOKEN,
    org=settings.INFLUXDB_ORG
)
write_api = influx_client.write_api(write_options=SYNCHRONOUS)
query_api = influx_client.query_api()

def get_influx_write_api():
    return write_api

def get_influx_query_api():
    return query_api
