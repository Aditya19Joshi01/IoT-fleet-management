import { create } from 'zustand';
import { Vehicle, Alert, Geofence, DashboardSnapshot } from '@/types/fleet';
import { generateDashboardSnapshot, generateMockGeofences, generateMockTelemetry } from '@/services/mockData';

interface FleetStore {
  vehicles: Vehicle[];
  alerts: Alert[];
  geofences: Geofence[];
  selectedVehicle: Vehicle | null;
  dashboardData: DashboardSnapshot | null;
  isLoading: boolean;
  
  fetchDashboard: () => Promise<void>;
  fetchVehicles: () => Promise<void>;
  fetchGeofences: () => Promise<void>;
  selectVehicle: (vehicle: Vehicle | null) => void;
  updateVehicle: (vehicleId: string, updates: Partial<Vehicle>) => void;
  addGeofence: (geofence: Omit<Geofence, 'id' | 'created_at'>) => void;
  deleteGeofence: (geofenceId: string) => void;
}

export const useFleetStore = create<FleetStore>((set, get) => ({
  vehicles: [],
  alerts: [],
  geofences: [],
  selectedVehicle: null,
  dashboardData: null,
  isLoading: false,

  fetchDashboard: async () => {
    set({ isLoading: true });
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    const data = generateDashboardSnapshot();
    set({ 
      dashboardData: data,
      vehicles: data.vehicles,
      alerts: data.recent_alerts,
      isLoading: false,
    });
  },

  fetchVehicles: async () => {
    set({ isLoading: true });
    await new Promise(resolve => setTimeout(resolve, 300));
    const data = generateDashboardSnapshot();
    set({ vehicles: data.vehicles, isLoading: false });
  },

  fetchGeofences: async () => {
    await new Promise(resolve => setTimeout(resolve, 200));
    set({ geofences: generateMockGeofences() });
  },

  selectVehicle: (vehicle) => {
    set({ selectedVehicle: vehicle });
  },

  updateVehicle: (vehicleId, updates) => {
    set(state => ({
      vehicles: state.vehicles.map(v => 
        v.vehicle_id === vehicleId ? { ...v, ...updates } : v
      ),
    }));
  },

  addGeofence: (geofence) => {
    const newGeofence: Geofence = {
      ...geofence,
      id: `geo-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    set(state => ({
      geofences: [...state.geofences, newGeofence],
    }));
  },

  deleteGeofence: (geofenceId) => {
    set(state => ({
      geofences: state.geofences.filter(g => g.id !== geofenceId),
    }));
  },
}));
