import os
from pydantic import PostgresDsn
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "IoT Fleet Management"
    
    # Database
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "postgres")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "fleet_db")
    DATABASE_URL: str = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_SERVER}:{POSTGRES_PORT}/{POSTGRES_DB}"

    # InfluxDB
    INFLUXDB_URL: str = os.getenv("INFLUXDB_URL", "http://influxdb:8086")
    INFLUXDB_TOKEN: str = os.getenv("INFLUXDB_TOKEN", "adminpassword")
    INFLUXDB_ORG: str = os.getenv("INFLUXDB_ORG", "fleet_org")
    INFLUXDB_BUCKET: str = os.getenv("INFLUXDB_BUCKET", "telemetry")

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretkeywhichshouldbechangedinproduction")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

settings = Settings()
