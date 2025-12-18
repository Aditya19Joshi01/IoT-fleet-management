import json
import logging
import redis.asyncio as redis
from typing import Optional, List, Dict
from .config import Config

logger = logging.getLogger(__name__)

class RedisManager:
    _instance = None
    
    def __init__(self):
        self.redis: Optional[redis.Redis] = None

    @classmethod
    def get_instance(cls):
        if not cls._instance:
            cls._instance = cls()
        return cls._instance

    async def connect(self):
        try:
            self.redis = redis.from_url(Config.REDIS_URL, encoding="utf-8", decode_responses=True)
            await self.redis.ping()
            logger.info("Connected to Redis")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self.redis = None

    async def close(self):
        if self.redis:
            await self.redis.close()
            logger.info("Closed Redis connection")

    async def update_vehicle_state(self, vehicle_id: str, data: dict):
        if not self.redis:
            return
        
        try:
            # Store latest state in a hash
            key = f"vehicle:{vehicle_id}"
            await self.redis.hset(key, mapping={k: str(v) for k, v in data.items()})
            # Set TTL (optional, e.g. 1 hour) to auto-clean stale vehicles
            await self.redis.expire(key, 3600)
            
            # Add to set of active vehicles
            await self.redis.sadd("vehicles:active", vehicle_id)
        except Exception as e:
            logger.error(f"Redis update failed: {e}")

    async def get_all_vehicles(self) -> List[Dict]:
        if not self.redis:
            return []
            
        try:
            vehicle_ids = await self.redis.smembers("vehicles:active")
            if not vehicle_ids:
                return []
            
            pipe = self.redis.pipeline()
            for vid in vehicle_ids:
                pipe.hgetall(f"vehicle:{vid}")
            
            results = await pipe.execute()
            
            vehicles = []
            for vid, data in zip(vehicle_ids, results):
                if data:
                    data['vehicle_id'] = vid
                    # Basic type conversion if needed, though frontend handles strings mostly
                    if 'speed' in data: data['speed'] = float(data['speed'])
                    if 'latitude' in data: data['latitude'] = float(data['latitude'])
                    if 'longitude' in data: data['longitude'] = float(data['longitude'])
                    vehicles.append(data)
            
            return vehicles
        except Exception as e:
            logger.error(f"Redis fetch failed: {e}")
            return []

    async def get_stats(self) -> Dict:
        if not self.redis:
            return {}

        try:
            vehicles = await self.get_all_vehicles()
            total = len(vehicles)
            active = sum(1 for v in vehicles if v.get('status') == 'moving')
            idle = sum(1 for v in vehicles if v.get('status') == 'idle')
            offline = sum(1 for v in vehicles if v.get('status') == 'offline')
            
            avg_speed = 0
            if active > 0:
                avg_speed = sum(v.get('speed', 0) for v in vehicles if v.get('status') == 'moving') / active

            return {
                "total_vehicles": total,
                "active_vehicles": active,
                "idle_vehicles": idle,
                "offline_vehicles": offline,
                "avg_speed": round(avg_speed, 1),
                # Placeholders for now
                "alert_count": 0,
                "total_distance_today": 1250 
            }
        except Exception as e:
            logger.error(f"Redis stats failed: {e}")
            return {}

redis_manager = RedisManager.get_instance()
