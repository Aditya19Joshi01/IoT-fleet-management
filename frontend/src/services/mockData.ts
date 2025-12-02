import { Vehicle, Alert, TelemetryPoint, Geofence, DashboardSnapshot, VehicleStatus } from '@/types/fleet';

const vehicleNames = [
  'Alpha Hauler', 'Beta Transport', 'Gamma Freight', 'Delta Cargo', 
  'Echo Delivery', 'Foxtrot Express', 'Golf Logistics', 'Hotel Carrier'
];

const generateRandomCoord = (base: number, variance: number) => 
  base + (Math.random() - 0.5) * variance;

const statuses: VehicleStatus[] = ['moving', 'idle', 'alert', 'offline'];

export const generateMockVehicles = (count: number = 8): Vehicle[] => {
  return Array.from({ length: count }, (_, i) => {
    const status = statuses[Math.floor(Math.random() * (i < 5 ? 2 : 4))];
    return {
      vehicle_id: `VEH-${String(i + 1).padStart(3, '0')}`,
      display_name: vehicleNames[i % vehicleNames.length],
      latitude: generateRandomCoord(37.7749, 0.1),
      longitude: generateRandomCoord(-122.4194, 0.1),
      speed_kmh: status === 'moving' ? Math.floor(Math.random() * 80) + 20 : 0,
      fuel_level_pct: Math.floor(Math.random() * 60) + 20,
      last_update: new Date(Date.now() - Math.random() * 300000).toISOString(),
      total_idle_seconds: Math.floor(Math.random() * 3600),
      eta_minutes: status === 'moving' ? Math.floor(Math.random() * 60) + 5 : null,
      on_route: status === 'moving' && Math.random() > 0.3,
      status,
      engine_temp: Math.floor(Math.random() * 30) + 70,
      heading: Math.floor(Math.random() * 360),
      assigned_route: Math.random() > 0.5 ? `Route-${Math.floor(Math.random() * 5) + 1}` : undefined,
      assigned_geofence: Math.random() > 0.6 ? `Zone-${Math.floor(Math.random() * 3) + 1}` : undefined,
    };
  });
};

export const generateMockAlerts = (vehicles: Vehicle[]): Alert[] => {
  const alertTypes: Array<{ type: Alert['type']; message: string; severity: Alert['severity'] }> = [
    { type: 'low_fuel', message: 'Fuel level below 20%', severity: 'warning' },
    { type: 'speeding', message: 'Exceeding speed limit by 15 km/h', severity: 'warning' },
    { type: 'geofence_breach', message: 'Vehicle exited designated zone', severity: 'critical' },
    { type: 'hard_brake', message: 'Hard braking event detected', severity: 'info' },
    { type: 'maintenance', message: 'Scheduled maintenance due', severity: 'info' },
  ];

  return vehicles
    .filter(v => v.status === 'alert' || Math.random() > 0.7)
    .slice(0, 5)
    .map((v, i) => {
      const alert = alertTypes[i % alertTypes.length];
      return {
        id: `alert-${i + 1}`,
        vehicle_id: v.vehicle_id,
        ...alert,
        timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      };
    });
};

export const generateMockTelemetry = (hours: number = 24): TelemetryPoint[] => {
  const points: TelemetryPoint[] = [];
  const now = Date.now();
  const interval = (hours * 60 * 60 * 1000) / 100;

  for (let i = 0; i < 100; i++) {
    points.push({
      timestamp: new Date(now - (99 - i) * interval).toISOString(),
      speed_kmh: Math.floor(Math.sin(i * 0.1) * 30 + 50 + Math.random() * 10),
      fuel_level_pct: Math.max(20, 95 - i * 0.5 + Math.random() * 5),
      latitude: 37.7749 + Math.sin(i * 0.05) * 0.02,
      longitude: -122.4194 + Math.cos(i * 0.05) * 0.02,
      engine_temp: Math.floor(80 + Math.sin(i * 0.15) * 10 + Math.random() * 5),
    });
  }
  return points;
};

export const generateMockGeofences = (): Geofence[] => [
  {
    id: 'geo-1',
    name: 'Warehouse District',
    center_lat: 37.7849,
    center_lng: -122.4094,
    radius_meters: 500,
    color: '#3B82F6',
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: 'geo-2',
    name: 'Downtown Zone',
    center_lat: 37.7649,
    center_lng: -122.4294,
    radius_meters: 800,
    color: '#10B981',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'geo-3',
    name: 'Industrial Park',
    center_lat: 37.7549,
    center_lng: -122.3994,
    radius_meters: 600,
    color: '#F59E0B',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const generateDashboardSnapshot = (): DashboardSnapshot => {
  const vehicles = generateMockVehicles(8);
  const alerts = generateMockAlerts(vehicles);
  
  return {
    total_vehicles: vehicles.length,
    active_vehicles: vehicles.filter(v => v.status === 'moving').length,
    idle_vehicles: vehicles.filter(v => v.status === 'idle').length,
    offline_vehicles: vehicles.filter(v => v.status === 'offline').length,
    alert_count: alerts.filter(a => a.severity !== 'info').length,
    avg_speed: Math.floor(vehicles.filter(v => v.status === 'moving').reduce((acc, v) => acc + v.speed_kmh, 0) / Math.max(1, vehicles.filter(v => v.status === 'moving').length)),
    total_distance_today: Math.floor(Math.random() * 2000) + 500,
    vehicles,
    recent_alerts: alerts,
  };
};
