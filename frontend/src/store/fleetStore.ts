import { create } from 'zustand';
import { Vehicle, Alert, Geofence, DashboardSnapshot } from '@/types/fleet';
import { api } from '@/services/api';

interface FleetStore {
  vehicles: Vehicle[];
  alerts: Alert[];
  geofences: Geofence[];
  selectedVehicle: Vehicle | null;
  dashboardData: DashboardSnapshot | null;
  isLoading: boolean;
  pollingInterval: NodeJS.Timeout | null;

  fetchDashboard: () => Promise<void>;
  fetchVehicles: () => Promise<void>;
  fetchGeofences: () => Promise<void>;
  selectVehicle: (vehicle: Vehicle | null) => void;
  updateVehicle: (vehicleId: string, updates: Partial<Vehicle>) => void;
  addGeofence: (geofence: Omit<Geofence, 'id' | 'created_at'>) => Promise<void>;
  deleteGeofence: (geofenceId: string) => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
}

export const useFleetStore = create<FleetStore>((set, get) => ({
  vehicles: [],
  alerts: [],
  geofences: [],
  selectedVehicle: null,
  dashboardData: null,
  isLoading: false,
  pollingInterval: null,

  fetchDashboard: async () => {
    try {
      const stats = await api.getDashboardStats();
      // We also need the full vehicle list for the map
      const vehicles = await api.getVehicles();

      set({
        dashboardData: { ...stats, vehicles, recent_alerts: [] }, // Alerts are still empty for now
        vehicles: vehicles,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      set({ isLoading: false });
    }
  },

  fetchVehicles: async () => {
    try {
      const vehicles = await api.getVehicles();
      set({ vehicles, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
      set({ isLoading: false });
    }
  },

  fetchGeofences: async () => {
    try {
      const geofences = await api.getGeofences();
      set({ geofences });
    } catch (error) {
      console.error('Failed to fetch geofences:', error);
    }
  },

  selectVehicle: (vehicle) => {
    set({ selectedVehicle: vehicle });
  },

  updateVehicle: (vehicleId, updates) => {
    // Optimistic update
    set(state => ({
      vehicles: state.vehicles.map(v =>
        v.vehicle_id === vehicleId ? { ...v, ...updates } : v
      ),
    }));
  },

  addGeofence: async (geofence) => {
    try {
      const newGeofence = await api.createGeofence(geofence);
      set(state => ({
        geofences: [...state.geofences, newGeofence],
      }));
    } catch (error) {
      console.error('Failed to create geofence:', error);
      throw error;
    }
  },

  deleteGeofence: async (geofenceId) => {
    try {
      await api.deleteGeofence(geofenceId);
      set(state => ({
        geofences: state.geofences.filter(g => g.id !== geofenceId),
      }));
    } catch (error) {
      console.error('Failed to delete geofence:', error);
      throw error;
    }
  },

  startPolling: () => {
    const { pollingInterval } = get();
    if (pollingInterval) return; // Already polling

    // Initial fetch
    get().fetchDashboard();
    get().fetchGeofences();

    // Poll every 2 seconds
    const interval = setInterval(() => {
      get().fetchDashboard();
    }, 2000);

    set({ pollingInterval: interval });
  },

  stopPolling: () => {
    const { pollingInterval } = get();
    if (pollingInterval) {
      clearInterval(pollingInterval);
      set({ pollingInterval: null });
    }
  },
}));
