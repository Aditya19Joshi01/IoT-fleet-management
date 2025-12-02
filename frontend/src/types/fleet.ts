export type VehicleStatus = 'moving' | 'idle' | 'alert' | 'offline';

export interface Vehicle {
  vehicle_id: string;
  display_name: string;
  latitude: number;
  longitude: number;
  speed_kmh: number;
  fuel_level_pct: number;
  last_update: string;
  total_idle_seconds: number;
  eta_minutes: number | null;
  on_route: boolean;
  status: VehicleStatus;
  engine_temp?: number;
  heading?: number;
  assigned_route?: string;
  assigned_geofence?: string;
}

export interface Alert {
  id: string;
  vehicle_id: string;
  type: 'low_fuel' | 'speeding' | 'geofence_breach' | 'hard_brake' | 'hard_accel' | 'maintenance';
  message: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface TelemetryPoint {
  timestamp: string;
  speed_kmh: number;
  fuel_level_pct: number;
  latitude: number;
  longitude: number;
  engine_temp?: number;
}

export interface Geofence {
  id: string;
  name: string;
  center_lat: number;
  center_lng: number;
  radius_meters: number;
  color: string;
  created_at: string;
}

export interface DashboardSnapshot {
  total_vehicles: number;
  active_vehicles: number;
  idle_vehicles: number;
  offline_vehicles: number;
  alert_count: number;
  avg_speed: number;
  total_distance_today: number;
  vehicles: Vehicle[];
  recent_alerts: Alert[];
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'operator' | 'viewer';
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
