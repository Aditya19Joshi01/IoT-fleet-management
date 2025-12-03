import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Circle, Trash2, Save, X, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FleetMap } from '@/components/map/FleetMap';
import { useFleetStore } from '@/store/fleetStore';
import { Vehicle } from '@/types/fleet';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export default function LiveMap() {
  const { vehicles, geofences, selectedVehicle, fetchVehicles, fetchGeofences, selectVehicle, addGeofence } = useFleetStore();
  const [showGeofences, setShowGeofences] = useState(true);
  const [showVehicles, setShowVehicles] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pendingGeofence, setPendingGeofence] = useState<{ lat: number; lng: number } | null>(null);
  const [geofenceName, setGeofenceName] = useState('');
  const [geofenceRadius, setGeofenceRadius] = useState(500);
  const navigate = useNavigate();

  const handleMapClick = (lat: number, lng: number) => {
    if (isDrawing) {
      setPendingGeofence({ lat, lng });
      setGeofenceName(`Geofence ${geofences.length + 1}`);
    }
  };

  const handleSaveGeofence = () => {
    if (pendingGeofence && geofenceName.trim()) {
      addGeofence({
        name: geofenceName.trim(),
        center_lat: pendingGeofence.lat,
        center_lng: pendingGeofence.lng,
        radius_meters: geofenceRadius,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      });
      toast.success(`Geofence "${geofenceName}" created successfully`);
      setPendingGeofence(null);
      setGeofenceName('');
      setGeofenceRadius(500);
      setIsDrawing(false);
    }
  };

  const handleCancelGeofence = () => {
    setPendingGeofence(null);
    setGeofenceName('');
    setGeofenceRadius(500);
  };

  useEffect(() => {
    fetchVehicles();
    fetchGeofences();
  }, [fetchVehicles, fetchGeofences]);

  const handleVehicleClick = (vehicle: Vehicle) => {
    selectVehicle(selectedVehicle?.vehicle_id === vehicle.vehicle_id ? null : vehicle);
  };

  const statusVariant = {
    moving: 'moving',
    idle: 'idle',
    alert: 'alert',
    offline: 'offline',
  } as const;

  return (
    <div className="h-[calc(100vh-7rem)] flex gap-4 animate-fade-in">
      {/* Map Area */}
      <div className="flex-1 relative">
        <FleetMap
          vehicles={showVehicles ? vehicles : []}
          geofences={showGeofences ? geofences : []}
          selectedVehicle={selectedVehicle}
          onVehicleClick={handleVehicleClick}
          onMapClick={handleMapClick}
          isDrawingMode={isDrawing}
          height="100%"
        />

        {/* Layer Controls */}
        <div className="absolute top-4 left-4 z-[1000] glass-card p-3">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Layers</span>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showVehicles}
                onChange={(e) => setShowVehicles(e.target.checked)}
                className="rounded border-glass-border"
              />
              <span className="text-sm">Vehicles</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showGeofences}
                onChange={(e) => setShowGeofences(e.target.checked)}
                className="rounded border-glass-border"
              />
              <span className="text-sm">Geofences</span>
            </label>
          </div>
        </div>

        {/* Drawing Tools - positioned below zoom controls */}
        <div className="absolute top-24 right-4 z-[1000] glass-card p-3">
          <p className="text-sm font-medium mb-3">Geofence Tools</p>
          <div className="flex flex-col gap-2">
            <Button
              variant={isDrawing ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setIsDrawing(!isDrawing);
                if (!isDrawing) toast.info('Click on the map to place a geofence center');
              }}
            >
              <Circle className="w-4 h-4 mr-2" />
              {isDrawing ? 'Drawing...' : 'Draw Circle'}
            </Button>
            {isDrawing && (
              <Button variant="outline" size="sm" onClick={() => setIsDrawing(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Toggle Sidebar */}
        <Button
          variant="glass"
          size="icon"
          className="absolute bottom-4 right-4 z-[1000]"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          'w-80 glass-card p-4 overflow-hidden transition-all duration-300',
          !sidebarOpen && 'w-0 p-0 opacity-0'
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">Vehicles</h2>
          <Badge variant="secondary">{vehicles.length}</Badge>
        </div>

        {/* Vehicle List */}
        <div className="space-y-2 max-h-[calc(100%-8rem)] overflow-y-auto">
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.vehicle_id}
              className={cn(
                'p-3 rounded-lg cursor-pointer transition-all duration-200',
                'hover:bg-glass-hover border border-transparent',
                selectedVehicle?.vehicle_id === vehicle.vehicle_id && 'bg-glass-hover border-primary/50'
              )}
              onClick={() => handleVehicleClick(vehicle)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{vehicle.display_name}</span>
                <Badge variant={statusVariant[vehicle.status]} className="text-xs">
                  {vehicle.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{vehicle.vehicle_id}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>{vehicle.speed_kmh} km/h</span>
                <span>{vehicle.fuel_level_pct.toFixed(0)}% fuel</span>
              </div>
            </div>
          ))}
        </div>

        {/* Geofences Section */}
        <div className="mt-4 pt-4 border-t border-glass-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-sm">Geofences</h3>
            <Badge variant="secondary">{geofences.length}</Badge>
          </div>
          <div className="space-y-2">
            {geofences.map((geo) => (
              <div
                key={geo.id}
                className="flex items-center justify-between p-2 rounded-lg bg-glass/50"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: geo.color }}
                  />
                  <span className="text-sm">{geo.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{geo.radius_meters}m</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Geofence Creation Dialog */}
      <Dialog open={!!pendingGeofence} onOpenChange={(open) => !open && handleCancelGeofence()}>
        <DialogContent className="glass-card border-glass-border">
          <DialogHeader>
            <DialogTitle>Create Geofence</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={geofenceName}
                onChange={(e) => setGeofenceName(e.target.value)}
                placeholder="Enter geofence name"
                className="bg-glass border-glass-border"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Radius (meters)</label>
              <Input
                type="number"
                value={geofenceRadius}
                onChange={(e) => setGeofenceRadius(Number(e.target.value))}
                min={50}
                max={10000}
                className="bg-glass border-glass-border"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Location: {pendingGeofence?.lat.toFixed(6)}, {pendingGeofence?.lng.toFixed(6)}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelGeofence}>
              Cancel
            </Button>
            <Button onClick={handleSaveGeofence} disabled={!geofenceName.trim()}>
              <Save className="w-4 h-4 mr-2" />
              Save Geofence
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
