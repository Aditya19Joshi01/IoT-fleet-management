import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Gauge, Fuel, Thermometer, Clock, Navigation, MapPin, AlertTriangle, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FleetMap } from '@/components/map/FleetMap';
import { useFleetStore } from '@/store/fleetStore';
import { generateMockTelemetry } from '@/services/mockData';
import { TelemetryPoint, Alert } from '@/types/fleet';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, formatDistanceToNow } from 'date-fns';

export default function VehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { vehicles, geofences, fetchVehicles, fetchGeofences } = useFleetStore();
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>([]);

  const vehicle = vehicles.find((v) => v.vehicle_id === id);

  useEffect(() => {
    if (vehicles.length === 0) fetchVehicles();
    if (geofences.length === 0) fetchGeofences();
    setTelemetry(generateMockTelemetry(24));
  }, [fetchVehicles, fetchGeofences, vehicles.length, geofences.length]);

  if (!vehicle) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Vehicle not found</p>
          <Button variant="outline" onClick={() => navigate('/fleet')}>
            Return to Fleet
          </Button>
        </div>
      </div>
    );
  }

  const statusVariant = {
    moving: 'moving',
    idle: 'idle',
    alert: 'alert',
    offline: 'offline',
  } as const;

  const chartData = telemetry.map((point) => ({
    time: format(new Date(point.timestamp), 'HH:mm'),
    speed: point.speed_kmh,
    fuel: point.fuel_level_pct,
  }));

  const mockEvents: Array<{ type: string; message: string; timestamp: string; icon: typeof AlertTriangle }> = [
    { type: 'info', message: 'Route started', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), icon: Navigation },
    { type: 'warning', message: 'Hard braking detected', timestamp: new Date(Date.now() - 3600000).toISOString(), icon: Activity },
    { type: 'info', message: 'Entered Warehouse District zone', timestamp: new Date(Date.now() - 1800000).toISOString(), icon: MapPin },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{vehicle.display_name}</h1>
            <Badge variant={statusVariant[vehicle.status]} className="text-sm px-3 py-1">
              {vehicle.status.toUpperCase()}
            </Badge>
          </div>
          <p className="text-muted-foreground">{vehicle.vehicle_id}</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Gauge className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Speed</p>
              <p className="text-2xl font-bold">{vehicle.speed_kmh} <span className="text-sm font-normal">km/h</span></p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/20">
              <Fuel className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fuel Level</p>
              <p className="text-2xl font-bold">{vehicle.fuel_level_pct.toFixed(0)}<span className="text-sm font-normal">%</span></p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/20">
              <Thermometer className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Engine Temp</p>
              <p className="text-2xl font-bold">{vehicle.engine_temp || 85}<span className="text-sm font-normal">°C</span></p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ETA</p>
              <p className="text-2xl font-bold">{vehicle.eta_minutes || '--'} <span className="text-sm font-normal">min</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Map & Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-4">
          <h2 className="font-semibold text-foreground mb-4">Live Location</h2>
          <FleetMap
            vehicles={[vehicle]}
            geofences={geofences}
            selectedVehicle={vehicle}
            height="300px"
          />
        </div>
        <div className="glass-card p-4">
          <h2 className="font-semibold text-foreground mb-4">Location Info</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Coordinates</p>
              <p className="font-mono text-sm">{vehicle.latitude.toFixed(6)}, {vehicle.longitude.toFixed(6)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Heading</p>
              <p className="font-medium">{vehicle.heading || 0}° ({getDirection(vehicle.heading || 0)})</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">On Route</p>
              <Badge variant={vehicle.on_route ? 'success' : 'muted'}>
                {vehicle.on_route ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="text-sm">{formatDistanceToNow(new Date(vehicle.last_update), { addSuffix: true })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-4">
          <h2 className="font-semibold text-foreground mb-4">Speed (Last 24h)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" />
              <XAxis dataKey="time" stroke="hsl(215 20% 65%)" fontSize={12} />
              <YAxis stroke="hsl(215 20% 65%)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(222 47% 9%)',
                  border: '1px solid hsl(217 33% 20%)',
                  borderRadius: '8px',
                }}
              />
              <Line type="monotone" dataKey="speed" stroke="hsl(217 91% 60%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card p-4">
          <h2 className="font-semibold text-foreground mb-4">Fuel Level (Last 24h)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" />
              <XAxis dataKey="time" stroke="hsl(215 20% 65%)" fontSize={12} />
              <YAxis stroke="hsl(215 20% 65%)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(222 47% 9%)',
                  border: '1px solid hsl(217 33% 20%)',
                  borderRadius: '8px',
                }}
              />
              <Area type="monotone" dataKey="fuel" stroke="hsl(160 84% 39%)" fill="hsl(160 84% 39% / 0.2)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Events Timeline */}
      <div className="glass-card p-4">
        <h2 className="font-semibold text-foreground mb-4">Recent Events</h2>
        <div className="space-y-4">
          {mockEvents.map((event, i) => (
            <div key={i} className="flex items-start gap-4 p-3 rounded-lg bg-glass/50">
              <div className={`p-2 rounded-lg ${event.type === 'warning' ? 'bg-warning/20' : 'bg-primary/20'}`}>
                <event.icon className={`w-4 h-4 ${event.type === 'warning' ? 'text-warning' : 'text-primary'}`} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{event.message}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getDirection(heading: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return directions[Math.round(heading / 45) % 8];
}
