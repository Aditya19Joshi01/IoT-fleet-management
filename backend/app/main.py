import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from app.routers import vehicles, analytics, geofences

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Fleet Management API")

# CORS (Allow Frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(vehicles.router)
app.include_router(analytics.router)
app.include_router(geofences.router)

@app.get("/")
def root():
    return {"status": "online", "version": "2.0-serverless"}

# Lambda Handler
handler = Mangum(app)
