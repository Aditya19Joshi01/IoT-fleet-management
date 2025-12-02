import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Filter, Download, Eye, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFleetStore } from '@/store/fleetStore';
import { Vehicle } from '@/types/fleet';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function Fleet() {
  const { vehicles, fetchVehicles, isLoading } = useFleetStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.vehicle_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.display_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExportCSV = () => {
    const headers = ['Vehicle ID', 'Display Name', 'Status', 'Speed (km/h)', 'Fuel (%)', 'Latitude', 'Longitude', 'Last Update'];
    const rows = filteredVehicles.map((v) => [
      v.vehicle_id,
      v.display_name,
      v.status,
      v.speed_kmh,
      v.fuel_level_pct.toFixed(1),
      v.latitude,
      v.longitude,
      v.last_update,
    ]);
    
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fleet-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Fleet data exported successfully');
  };

  const statusVariant = {
    moving: 'moving',
    idle: 'idle',
    alert: 'alert',
    offline: 'offline',
  } as const;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fleet Management</h1>
          <p className="text-muted-foreground">Manage and monitor all your vehicles</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient">
                <Plus className="w-4 h-4 mr-2" />
                Add Vehicle
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-glass-border">
              <DialogHeader>
                <DialogTitle>Add New Vehicle</DialogTitle>
              </DialogHeader>
              <AddVehicleForm onClose={() => setIsAddModalOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by vehicle ID or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field w-full pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Status</option>
              <option value="moving">Moving</option>
              <option value="idle">Idle</option>
              <option value="alert">Alert</option>
              <option value="offline">Offline</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr className="bg-glass">
                <th>Vehicle ID</th>
                <th>Display Name</th>
                <th>Status</th>
                <th>Speed</th>
                <th>Fuel</th>
                <th>Location</th>
                <th>Last Update</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((vehicle) => (
                <tr key={vehicle.vehicle_id} className="hover:bg-glass-hover/30">
                  <td className="font-mono text-sm">{vehicle.vehicle_id}</td>
                  <td className="font-medium">{vehicle.display_name}</td>
                  <td>
                    <Badge variant={statusVariant[vehicle.status]}>
                      {vehicle.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td>{vehicle.speed_kmh} km/h</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-glass rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            vehicle.fuel_level_pct > 50 ? 'bg-success' : vehicle.fuel_level_pct > 20 ? 'bg-warning' : 'bg-destructive'
                          }`}
                          style={{ width: `${vehicle.fuel_level_pct}%` }}
                        />
                      </div>
                      <span className="text-sm">{vehicle.fuel_level_pct.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="text-sm text-muted-foreground">
                    {vehicle.latitude.toFixed(4)}, {vehicle.longitude.toFixed(4)}
                  </td>
                  <td className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(vehicle.last_update), { addSuffix: true })}
                  </td>
                  <td>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass-card border-glass-border">
                        <DropdownMenuItem onClick={() => navigate(`/vehicles/${vehicle.vehicle_id}`)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredVehicles.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No vehicles found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AddVehicleForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    vehicle_id: '',
    display_name: '',
    latitude: '',
    longitude: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Vehicle added successfully (demo mode)');
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Vehicle ID *
        </label>
        <input
          type="text"
          value={formData.vehicle_id}
          onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
          className="input-field w-full"
          placeholder="e.g., VEH-009"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Display Name
        </label>
        <input
          type="text"
          value={formData.display_name}
          onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
          className="input-field w-full"
          placeholder="e.g., Alpha Hauler"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Latitude
          </label>
          <input
            type="number"
            step="any"
            value={formData.latitude}
            onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
            className="input-field w-full"
            placeholder="37.7749"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Longitude
          </label>
          <input
            type="number"
            step="any"
            value={formData.longitude}
            onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
            className="input-field w-full"
            placeholder="-122.4194"
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="gradient">
          Add Vehicle
        </Button>
      </div>
    </form>
  );
}
