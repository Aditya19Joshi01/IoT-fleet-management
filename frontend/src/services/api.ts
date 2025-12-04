import { Vehicle, DashboardSnapshot, Geofence } from '@/types/fleet';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const api = {
    // Vehicles
    getVehicles: async (): Promise<Vehicle[]> => {
        const res = await fetch(`${API_BASE}/vehicles`);
        if (!res.ok) throw new Error('Failed to fetch vehicles');
        const data = await res.json();
        return data.map((v: any) => ({
            ...v,
            display_name: v.vehicle_id, // Default display name
            speed_kmh: v.speed,         // Map speed
            fuel_level_pct: v.fuel_level || 0, // Map fuel
            last_update: v.last_update,
            total_idle_seconds: 0,      // Default
            eta_minutes: null,          // Default
            on_route: true,             // Default
        }));
    },

    getVehicleHistory: async (vehicleId: string): Promise<any[]> => {
        const res = await fetch(`${API_BASE}/history/${vehicleId}`);
        if (!res.ok) throw new Error('Failed to fetch vehicle history');
        return res.json();
    },

    // Dashboard
    getDashboardStats: async (): Promise<DashboardSnapshot> => {
        const res = await fetch(`${API_BASE}/dashboard/stats`);
        if (!res.ok) throw new Error('Failed to fetch dashboard stats');
        // The backend returns a partial snapshot, we might need to enrich it or the backend should return full structure
        // For now, we assume the backend returns the structure matching DashboardSnapshot (mostly)
        return res.json();
    },

    // Analytics
    getSpeedTrend: async (range: string) => {
        const res = await fetch(`${API_BASE}/analytics/speed-trend?range=${range}`);
        if (!res.ok) throw new Error('Failed to fetch speed trend');
        return res.json();
    },

    getDistanceStats: async () => {
        const res = await fetch(`${API_BASE}/analytics/distance`);
        if (!res.ok) throw new Error('Failed to fetch distance stats');
        return res.json();
    },

    getFuelStats: async () => {
        const res = await fetch(`${API_BASE}/analytics/fuel`);
        if (!res.ok) throw new Error('Failed to fetch fuel stats');
        return res.json();
    },

    getIdleStats: async () => {
        const res = await fetch(`${API_BASE}/analytics/idle`);
        if (!res.ok) throw new Error('Failed to fetch idle stats');
        return res.json();
    },

    // Geofences
    getGeofences: async (): Promise<Geofence[]> => {
        const res = await fetch(`${API_BASE}/geofences`);
        if (!res.ok) throw new Error('Failed to fetch geofences');
        return res.json();
    },

    createGeofence: async (geofence: Omit<Geofence, 'id' | 'created_at'>): Promise<Geofence> => {
        const res = await fetch(`${API_BASE}/geofences`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geofence),
        });
        if (!res.ok) throw new Error('Failed to create geofence');
        return res.json();
    },

    deleteGeofence: async (id: string): Promise<void> => {
        const res = await fetch(`${API_BASE}/geofences/${id}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete geofence');
    },
};
