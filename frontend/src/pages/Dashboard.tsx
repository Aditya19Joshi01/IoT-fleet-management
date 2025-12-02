import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Gauge, Route, AlertTriangle, ChevronRight, ChevronLeft } from 'lucide-react';
import { KPICard } from '@/components/dashboard/KPICard';
import { VehicleListItem } from '@/components/dashboard/VehicleListItem';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { FleetMap } from '@/components/map/FleetMap';
import { Button } from '@/components/ui/button';
import { useFleetStore } from '@/store/fleetStore';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { dashboardData, vehicles, alerts, selectedVehicle, isLoading, fetchDashboard, selectVehicle, fetchGeofences, geofences } = useFleetStore();
  const [vehicleListOpen, setVehicleListOpen] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
    fetchGeofences();
  }, [fetchDashboard, fetchGeofences]);

  const handleVehicleClick = (vehicle: typeof vehicles[0]) => {
    selectVehicle(selectedVehicle?.vehicle_id === vehicle.vehicle_id ? null : vehicle);
  };

  const handleViewDetails = () => {
    if (selectedVehicle) {
      navigate(`/vehicles/${selectedVehicle.vehicle_id}`);
    }
  };

  if (isLoading || !dashboardData) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="col-span-2 h-[500px] rounded-xl" />
          <Skeleton className="h-[500px] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Fleet Dashboard</h1>
        <p className="text-muted-foreground">Real-time overview of your fleet operations</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Vehicles"
          value={dashboardData.total_vehicles}
          subtitle={`${dashboardData.active_vehicles} active · ${dashboardData.idle_vehicles} idle · ${dashboardData.offline_vehicles} offline`}
          icon={Truck}
          variant="default"
        />
        <KPICard
          title="Average Speed"
          value={`${dashboardData.avg_speed} km/h`}
          icon={Gauge}
          variant="success"
          trend={{ value: 5.2, isPositive: true }}
        />
        <KPICard
          title="Distance Today"
          value={`${dashboardData.total_distance_today.toLocaleString()} km`}
          icon={Route}
          variant="default"
          trend={{ value: 12.3, isPositive: true }}
        />
        <KPICard
          title="Active Alerts"
          value={dashboardData.alert_count}
          subtitle="Click to view details"
          icon={AlertTriangle}
          variant={dashboardData.alert_count > 0 ? 'danger' : 'success'}
          onClick={() => {}}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Section */}
        <div className={cn('glass-card p-4 transition-all duration-300', vehicleListOpen ? 'lg:col-span-2' : 'lg:col-span-3')}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Live Fleet Map</h2>
            <div className="flex items-center gap-2">
              {selectedVehicle && (
                <Button variant="outline" size="sm" onClick={handleViewDetails}>
                  View Details
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setVehicleListOpen(!vehicleListOpen)}
                className="lg:hidden"
              >
                {vehicleListOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <FleetMap
            vehicles={vehicles}
            geofences={geofences}
            selectedVehicle={selectedVehicle}
            onVehicleClick={handleVehicleClick}
            height="450px"
          />
          
          {/* Map Legend */}
          <div className="flex items-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span className="text-muted-foreground">Moving</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-warning" />
              <span className="text-muted-foreground">Idle</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              <span className="text-muted-foreground">Alert</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-muted-foreground" />
              <span className="text-muted-foreground">Offline</span>
            </div>
          </div>
        </div>

        {/* Vehicle List & Alerts */}
        <div className={cn('space-y-6 transition-all duration-300', !vehicleListOpen && 'hidden lg:block lg:col-span-1')}>
          {/* Vehicle List */}
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Vehicles</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/fleet')}>
                View All
              </Button>
            </div>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {vehicles.slice(0, 5).map((vehicle) => (
                <VehicleListItem
                  key={vehicle.vehicle_id}
                  vehicle={vehicle}
                  isSelected={selectedVehicle?.vehicle_id === vehicle.vehicle_id}
                  onClick={() => handleVehicleClick(vehicle)}
                />
              ))}
            </div>
          </div>

          {/* Alerts Panel */}
          <AlertsPanel alerts={alerts} />
        </div>
      </div>
    </div>
  );
}
